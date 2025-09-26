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

// GET /api/clientes - Listar todos los clientes
router.get('/', async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de clientes...');
    
    const { cartera_id, limit = 50, offset = 0 } = req.query;
    
    let whereClause = '';
    let params = [];
    let paramCount = 0;
    
    if (cartera_id) {
      paramCount++;
      whereClause += ` WHERE cl.cartera_id = $${paramCount}`;
      params.push(cartera_id);
    }
    
    paramCount++;
    params.push(parseInt(limit));
    paramCount++;
    params.push(parseInt(offset));
    
    const result = await query(`
      SELECT 
        cl.id,
        cl.nombre,
        cl.cartera_id,
        cl.descripcion,
        cl.activo,
        cl.fecha_creacion,
        c.nombre as cartera_nombre,
        COUNT(n.id) as total_nodos
      FROM mantenimiento.clientes cl
      LEFT JOIN mantenimiento.carteras c ON cl.cartera_id = c.id
      LEFT JOIN mantenimiento.nodos n ON cl.id = n.cliente_id
      ${whereClause}
      GROUP BY cl.id, cl.nombre, cl.cartera_id, cl.descripcion, cl.activo, cl.fecha_creacion, c.nombre
      ORDER BY cl.fecha_creacion DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, params);
    
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM mantenimiento.clientes cl
      ${whereClause}
    `, params.slice(0, -2));
    
    res.json({
      success: true,
      message: 'Clientes obtenidos exitosamente',
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
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

// GET /api/clientes/:id - Obtener cliente específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Obteniendo cliente con ID: ${id}`);
    
    const result = await query(`
      SELECT 
        cl.id,
        cl.nombre,
        cl.cartera_id,
        cl.descripcion,
        cl.activo,
        cl.fecha_creacion,
        c.nombre as cartera_nombre,
        COUNT(n.id) as total_nodos
      FROM mantenimiento.clientes cl
      LEFT JOIN mantenimiento.carteras c ON cl.cartera_id = c.id
      LEFT JOIN mantenimiento.nodos n ON cl.id = n.cliente_id
      WHERE cl.id = $1
      GROUP BY cl.id, cl.nombre, cl.cartera_id, cl.descripcion, cl.activo, cl.fecha_creacion, c.nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    // Obtener nodos de este cliente
    const nodosResult = await query(`
      SELECT 
        n.id,
        n.nombre,
        n.ubicacion,
        n.descripcion,
        n.activo,
        n.fecha_creacion
      FROM mantenimiento.nodos n
      WHERE n.cliente_id = $1
      ORDER BY n.fecha_creacion DESC
    `, [id]);
    
    const cliente = result.rows[0];
    cliente.nodos = nodosResult.rows;
    
    res.json({
      success: true,
      message: 'Cliente obtenido exitosamente',
      data: cliente,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/clientes - Crear nuevo cliente
router.post('/', [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre debe tener entre 2 y 255 caracteres')
    .trim(),
  body('cartera_id')
    .notEmpty()
    .withMessage('La cartera es requerida')
    .isInt()
    .withMessage('La cartera debe ser un número entero'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { nombre, cartera_id, descripcion } = req.body;
    console.log(`➕ Creando nuevo cliente: ${nombre}`);
    
    // Verificar que la cartera existe
    const carteraExists = await query(`
      SELECT id FROM mantenimiento.carteras WHERE id = $1
    `, [cartera_id]);
    
    if (carteraExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La cartera especificada no existe'
      });
    }
    
    const result = await query(`
      INSERT INTO mantenimiento.clientes (nombre, cartera_id, descripcion, activo, fecha_creacion)
      VALUES ($1, $2, $3, true, NOW())
      RETURNING id, nombre, cartera_id, descripcion, activo, fecha_creacion
    `, [nombre, cartera_id, descripcion || null]);
    
    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error creando cliente:', error);
    
    // Verificar si es error de duplicado
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un cliente con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/clientes/:id - Actualizar cliente
router.put('/:id', [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre debe tener entre 2 y 255 caracteres')
    .trim(),
  body('cartera_id')
    .notEmpty()
    .withMessage('La cartera es requerida')
    .isInt()
    .withMessage('La cartera debe ser un número entero'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cartera_id, descripcion } = req.body;
    console.log(`✏️ Actualizando cliente ID: ${id} con nombre: ${nombre}`);
    
    // Verificar que la cartera existe
    const carteraExists = await query(`
      SELECT id FROM mantenimiento.carteras WHERE id = $1
    `, [cartera_id]);
    
    if (carteraExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La cartera especificada no existe'
      });
    }
    
    const result = await query(`
      UPDATE mantenimiento.clientes 
      SET nombre = $1, cartera_id = $2, descripcion = $3, fecha_actualizacion = NOW()
      WHERE id = $4
      RETURNING id, nombre, cartera_id, descripcion, activo, fecha_creacion
    `, [nombre, cartera_id, descripcion || null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error actualizando cliente:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un cliente con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/clientes/:id - Eliminar cliente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando cliente ID: ${id}`);
    
    // Verificar si el cliente tiene nodos asociados
    const nodosResult = await query(`
      SELECT COUNT(*) as total_nodos
      FROM mantenimiento.nodos
      WHERE cliente_id = $1
    `, [id]);
    
    if (parseInt(nodosResult.rows[0].total_nodos) > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el cliente porque tiene nodos asociados'
      });
    }
    
    const result = await query(`
      DELETE FROM mantenimiento.clientes 
      WHERE id = $1
      RETURNING id, nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error eliminando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/clientes/:id/estadisticas - Obtener estadísticas de un cliente
router.get('/:id/estadisticas', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Obteniendo estadísticas de cliente ID: ${id}`);
    
    const result = await query(`
      SELECT 
        cl.nombre as cliente_nombre,
        c.nombre as cartera_nombre,
        COUNT(DISTINCT n.id) as total_nodos,
        COUNT(DISTINCT CASE WHEN n.activo = true THEN n.id END) as nodos_activos,
        MIN(n.fecha_creacion) as primer_nodo,
        MAX(n.fecha_creacion) as ultimo_nodo
      FROM mantenimiento.clientes cl
      LEFT JOIN mantenimiento.carteras c ON cl.cartera_id = c.id
      LEFT JOIN mantenimiento.nodos n ON cl.id = n.cliente_id
      WHERE cl.id = $1
      GROUP BY cl.id, cl.nombre, c.nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
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
