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

// GET /api/ubicacion-geografica - Listar todas las ubicaciones geográficas
router.get('/', async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de ubicaciones geográficas...');
    
    const result = await query(`
      SELECT 
        ug.id,
        ug.nombre,
        ug.created_at,
        COUNT(cl.id) as total_clientes,
        COUNT(n.id) as total_nodos
      FROM ubicacion_geografica ug
      LEFT JOIN clientes cl ON ug.id = cl.region_id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      GROUP BY ug.id, ug.nombre, ug.created_at
      ORDER BY ug.created_at DESC
    `);
    
    res.json({
      success: true,
      message: 'Ubicaciones geográficas obtenidas exitosamente',
      data: result.rows,
      total: result.rows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo ubicaciones geográficas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/ubicacion-geografica/:id - Obtener ubicación geográfica específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Obteniendo ubicación geográfica con ID: ${id}`);
    
    const result = await query(`
      SELECT 
        ug.id,
        ug.nombre,
        ug.created_at,
        COUNT(DISTINCT cl.id) as total_clientes,
        COUNT(DISTINCT n.id) as total_nodos
      FROM ubicacion_geografica ug
      LEFT JOIN clientes cl ON ug.id = cl.region_id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      WHERE ug.id = $1
      GROUP BY ug.id, ug.nombre, ug.created_at
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación geográfica no encontrada'
      });
    }
    
    // Obtener clientes de esta región
    const clientesResult = await query(`
      SELECT 
        cl.id,
        cl.nombre,
        cl.created_at,
        c.name as cartera_nombre,
        COUNT(n.id) as total_nodos
      FROM clientes cl
      LEFT JOIN carteras c ON cl.cartera_id = c.id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      WHERE cl.region_id = $1
      GROUP BY cl.id, cl.nombre, cl.created_at, c.name
      ORDER BY cl.created_at DESC
    `, [id]);
    
    const ubicacion = result.rows[0];
    ubicacion.clientes = clientesResult.rows;
    
    res.json({
      success: true,
      message: 'Ubicación geográfica obtenida exitosamente',
      data: ubicacion,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo ubicación geográfica:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/ubicacion-geografica - Crear nueva ubicación geográfica
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
    console.log(`➕ Creando nueva ubicación geográfica: ${nombre}`);
    
    const result = await query(`
      INSERT INTO ubicacion_geografica (nombre, created_at)
      VALUES ($1, NOW())
      RETURNING id, nombre, created_at
    `, [nombre]);
    
    res.status(201).json({
      success: true,
      message: 'Ubicación geográfica creada exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error creando ubicación geográfica:', error);
    
    // Verificar si es error de duplicado
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una ubicación geográfica con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/ubicacion-geografica/:id - Actualizar ubicación geográfica
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
    console.log(`✏️ Actualizando ubicación geográfica ID: ${id} con nombre: ${nombre}`);
    
    const result = await query(`
      UPDATE ubicacion_geografica 
      SET nombre = $1
      WHERE id = $2
      RETURNING id, nombre, created_at
    `, [nombre, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación geográfica no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Ubicación geográfica actualizada exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error actualizando ubicación geográfica:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una ubicación geográfica con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/ubicacion-geografica/:id - Eliminar ubicación geográfica
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando ubicación geográfica ID: ${id}`);
    
    // Verificar si la ubicación tiene clientes asociados
    const clientesResult = await query(`
      SELECT COUNT(*) as total_clientes
      FROM clientes
      WHERE region_id = $1
    `, [id]);
    
    if (parseInt(clientesResult.rows[0].total_clientes) > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar la ubicación geográfica porque tiene clientes asociados'
      });
    }
    
    const result = await query(`
      DELETE FROM ubicacion_geografica 
      WHERE id = $1
      RETURNING id, nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación geográfica no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Ubicación geográfica eliminada exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error eliminando ubicación geográfica:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/ubicacion-geografica/:id/estadisticas - Obtener estadísticas de una ubicación geográfica
router.get('/:id/estadisticas', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Obteniendo estadísticas de ubicación geográfica ID: ${id}`);
    
    const result = await query(`
      SELECT 
        ug.nombre as region_nombre,
        COUNT(DISTINCT cl.id) as total_clientes,
        COUNT(DISTINCT n.id) as total_nodos,
        COUNT(DISTINCT cl.cartera_id) as carteras_unicas,
        MIN(cl.created_at) as primer_cliente,
        MAX(cl.created_at) as ultimo_cliente
      FROM ubicacion_geografica ug
      LEFT JOIN clientes cl ON ug.id = cl.region_id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      WHERE ug.id = $1
      GROUP BY ug.id, ug.nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación geográfica no encontrada'
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

// GET /api/ubicacion-geografica/:id/clientes - Obtener clientes de una ubicación geográfica
router.get('/:id/clientes', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    console.log(`👥 Obteniendo clientes de ubicación geográfica ID: ${id}`);
    
    const result = await query(`
      SELECT 
        cl.id,
        cl.nombre,
        cl.cartera_id,
        cl.created_at,
        c.name as cartera_nombre,
        COUNT(n.id) as total_nodos
      FROM clientes cl
      LEFT JOIN carteras c ON cl.cartera_id = c.id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      WHERE cl.region_id = $1
      GROUP BY cl.id, cl.nombre, cl.cartera_id, cl.created_at, c.name
      ORDER BY cl.created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, parseInt(limit), parseInt(offset)]);
    
    // Obtener total de clientes para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM clientes
      WHERE region_id = $1
    `, [id]);
    
    res.json({
      success: true,
      message: 'Clientes obtenidos exitosamente',
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < parseInt(countResult.rows[0].total)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
