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

// GET /api/nodos - Listar todos los nodos
router.get('/', async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de nodos...');
    
    const { cliente_id, cartera_id, limit = 50, offset = 0 } = req.query;
    
    let whereClause = '';
    let params = [];
    let paramCount = 0;
    
    if (cliente_id) {
      paramCount++;
      whereClause += ` WHERE n.cliente_id = $${paramCount}`;
      params.push(cliente_id);
    }
    
    if (cartera_id) {
      paramCount++;
      whereClause += paramCount === 1 ? ' WHERE' : ' AND';
      whereClause += ` cl.cartera_id = $${paramCount}`;
      params.push(cartera_id);
    }
    
    paramCount++;
    params.push(parseInt(limit));
    paramCount++;
    params.push(parseInt(offset));
    
    const result = await query(`
      SELECT 
        n.id,
        n.nombre,
        n.cliente_id,
        n.ubicacion,
        n.descripcion,
        n.activo,
        n.fecha_creacion,
        cl.nombre as cliente_nombre,
        c.nombre as cartera_nombre
      FROM mantenimiento.nodos n
      LEFT JOIN mantenimiento.clientes cl ON n.cliente_id = cl.id
      LEFT JOIN mantenimiento.carteras c ON cl.cartera_id = c.id
      ${whereClause}
      ORDER BY n.fecha_creacion DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, params);
    
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM mantenimiento.nodos n
      LEFT JOIN mantenimiento.clientes cl ON n.cliente_id = cl.id
      ${whereClause}
    `, params.slice(0, -2));
    
    res.json({
      success: true,
      message: 'Nodos obtenidos exitosamente',
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo nodos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/nodos/:id - Obtener nodo específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Obteniendo nodo con ID: ${id}`);
    
    const result = await query(`
      SELECT 
        n.id,
        n.nombre,
        n.cliente_id,
        n.ubicacion,
        n.descripcion,
        n.activo,
        n.fecha_creacion,
        cl.nombre as cliente_nombre,
        c.nombre as cartera_nombre
      FROM mantenimiento.nodos n
      LEFT JOIN mantenimiento.clientes cl ON n.cliente_id = cl.id
      LEFT JOIN mantenimiento.carteras c ON cl.cartera_id = c.id
      WHERE n.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nodo no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Nodo obtenido exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/nodos - Crear nuevo nodo
router.post('/', [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre debe tener entre 2 y 255 caracteres')
    .trim(),
  body('cliente_id')
    .notEmpty()
    .withMessage('El cliente es requerido')
    .isInt()
    .withMessage('El cliente debe ser un número entero'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { nombre, cliente_id, ubicacion, descripcion } = req.body;
    console.log(`➕ Creando nuevo nodo: ${nombre}`);
    
    // Verificar que el cliente existe
    const clienteExists = await query(`
      SELECT id FROM mantenimiento.clientes WHERE id = $1
    `, [cliente_id]);
    
    if (clienteExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El cliente especificado no existe'
      });
    }
    
    const result = await query(`
      INSERT INTO mantenimiento.nodos (nombre, cliente_id, ubicacion, descripcion, activo, fecha_creacion)
      VALUES ($1, $2, $3, $4, true, NOW())
      RETURNING id, nombre, cliente_id, ubicacion, descripcion, activo, fecha_creacion
    `, [nombre, cliente_id, ubicacion || null, descripcion || null]);
    
    res.status(201).json({
      success: true,
      message: 'Nodo creado exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error creando nodo:', error);
    
    // Verificar si es error de duplicado
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un nodo con ese nombre para este cliente'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/nodos/:id - Actualizar nodo
router.put('/:id', [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre debe tener entre 2 y 255 caracteres')
    .trim(),
  body('cliente_id')
    .notEmpty()
    .withMessage('El cliente es requerido')
    .isInt()
    .withMessage('El cliente debe ser un número entero'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cliente_id, ubicacion, descripcion } = req.body;
    console.log(`✏️ Actualizando nodo ID: ${id} con nombre: ${nombre}`);
    
    // Verificar que el cliente existe
    const clienteExists = await query(`
      SELECT id FROM mantenimiento.clientes WHERE id = $1
    `, [cliente_id]);
    
    if (clienteExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El cliente especificado no existe'
      });
    }
    
    const result = await query(`
      UPDATE mantenimiento.nodos 
      SET nombre = $1, cliente_id = $2, ubicacion = $3, descripcion = $4, fecha_actualizacion = NOW()
      WHERE id = $5
      RETURNING id, nombre, cliente_id, ubicacion, descripcion, activo, fecha_creacion
    `, [nombre, cliente_id, ubicacion || null, descripcion || null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nodo no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Nodo actualizado exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error actualizando nodo:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un nodo con ese nombre para este cliente'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/nodos/:id - Eliminar nodo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando nodo ID: ${id}`);
    
    const result = await query(`
      DELETE FROM mantenimiento.nodos 
      WHERE id = $1
      RETURNING id, nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nodo no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Nodo eliminado exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error eliminando nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/nodos/cliente/:cliente_id - Nodos por cliente
router.get('/cliente/:cliente_id', async (req, res) => {
  try {
    const { cliente_id } = req.params;
    console.log(`🔍 Obteniendo nodos del cliente ID: ${cliente_id}`);
    
    const result = await query(`
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
    `, [cliente_id]);
    
    res.json({
      success: true,
      message: 'Nodos del cliente obtenidos exitosamente',
      data: result.rows,
      total: result.rows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo nodos del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/nodos/estadisticas - Estadísticas generales
router.get('/estadisticas', async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de nodos...');
    
    const result = await query(`
      SELECT 
        COUNT(*) as total_nodos,
        COUNT(DISTINCT cliente_id) as clientes_con_nodos,
        COUNT(DISTINCT cl.cartera_id) as carteras_con_nodos,
        COUNT(CASE WHEN n.activo = true THEN 1 END) as nodos_activos,
        COUNT(CASE WHEN n.activo = false THEN 1 END) as nodos_inactivos,
        MIN(n.fecha_creacion) as primer_nodo,
        MAX(n.fecha_creacion) as ultimo_nodo
      FROM mantenimiento.nodos n
      LEFT JOIN mantenimiento.clientes cl ON n.cliente_id = cl.id
    `);
    
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
