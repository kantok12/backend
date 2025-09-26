const express = require('express');
const { query, getClient } = require('../config/database');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Middleware para validar errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/carteras - Listar todas las carteras
router.get('/', async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de carteras...');
    
    const result = await query(`
      SELECT 
        c.id,
        c.nombre,
        c.fecha_creacion,
        COUNT(cl.id) as total_clientes
      FROM mantenimiento.carteras c
      LEFT JOIN mantenimiento.clientes cl ON c.id = cl.cartera_id
      GROUP BY c.id, c.nombre, c.fecha_creacion
      ORDER BY c.fecha_creacion DESC
    `);
    
    res.json({
      success: true,
      message: 'Carteras obtenidas exitosamente',
      data: result.rows,
      total: result.rows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo carteras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/carteras/:id - Obtener cartera específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Obteniendo cartera con ID: ${id}`);
    
    const result = await query(`
      SELECT 
        c.id,
        c.nombre,
        c.fecha_creacion,
        COUNT(cl.id) as total_clientes,
        COUNT(n.id) as total_nodos
      FROM mantenimiento.carteras c
      LEFT JOIN mantenimiento.clientes cl ON c.id = cl.cartera_id
      LEFT JOIN mantenimiento.nodos n ON cl.id = n.cliente_id
      WHERE c.id = $1
      GROUP BY c.id, c.nombre, c.fecha_creacion
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cartera no encontrada'
      });
    }
    
    // Obtener clientes de esta cartera
    const clientesResult = await query(`
      SELECT 
        cl.id,
        cl.nombre,
        cl.fecha_creacion,
        ug.nombre as region_nombre,
        COUNT(n.id) as total_nodos
      FROM mantenimiento.clientes cl
      LEFT JOIN ubicacion_geografica ug ON cl.region_id = ug.id
      LEFT JOIN mantenimiento.nodos n ON cl.id = n.cliente_id
      WHERE cl.cartera_id = $1
      GROUP BY cl.id, cl.nombre, cl.fecha_creacion, ug.nombre
      ORDER BY cl.fecha_creacion DESC
    `, [id]);
    
    const cartera = result.rows[0];
    cartera.clientes = clientesResult.rows;
    
    res.json({
      success: true,
      message: 'Cartera obtenida exitosamente',
      data: cartera,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo cartera:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/carteras - Crear nueva cartera
router.post('/', [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { nombre } = req.body;
    console.log(`➕ Creando nueva cartera: ${nombre}`);
    
    const result = await query(`
      INSERT INTO mantenimiento.carteras (nombre, fecha_creacion)
      VALUES ($1, NOW())
      RETURNING id, nombre, fecha_creacion
    `, [nombre]);
    
    res.status(201).json({
      success: true,
      message: 'Cartera creada exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error creando cartera:', error);
    
    // Verificar si es error de duplicado
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cartera con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/carteras/:id - Actualizar cartera
router.put('/:id', [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    console.log(`✏️ Actualizando cartera ID: ${id} con nombre: ${nombre}`);
    
    const result = await query(`
      UPDATE mantenimiento.carteras 
      SET nombre = $1
      WHERE id = $2
      RETURNING id, nombre, fecha_creacion
    `, [nombre, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cartera no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Cartera actualizada exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error actualizando cartera:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cartera con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/carteras/:id - Eliminar cartera
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando cartera ID: ${id}`);
    
    // Verificar si la cartera tiene clientes asociados
    const clientesResult = await query(`
      SELECT COUNT(*) as total_clientes
      FROM clientes
      WHERE cartera_id = $1
    `, [id]);
    
    if (parseInt(clientesResult.rows[0].total_clientes) > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar la cartera porque tiene clientes asociados'
      });
    }
    
    const result = await query(`
      DELETE FROM mantenimiento.carteras 
      WHERE id = $1
      RETURNING id, nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cartera no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Cartera eliminada exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error eliminando cartera:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/carteras/:id/estadisticas - Obtener estadísticas de una cartera
router.get('/:id/estadisticas', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Obteniendo estadísticas de cartera ID: ${id}`);
    
    const result = await query(`
      SELECT 
        c.nombre as cartera_nombre,
        COUNT(DISTINCT cl.id) as total_clientes,
        COUNT(DISTINCT n.id) as total_nodos,
        COUNT(DISTINCT cl.region_id) as regiones_unicas,
        MIN(cl.fecha_creacion) as primer_cliente,
        MAX(cl.fecha_creacion) as ultimo_cliente
      FROM mantenimiento.carteras c
      LEFT JOIN mantenimiento.clientes cl ON c.id = cl.cartera_id
      LEFT JOIN mantenimiento.nodos n ON cl.id = n.cliente_id
      WHERE c.id = $1
      GROUP BY c.id, c.nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cartera no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
