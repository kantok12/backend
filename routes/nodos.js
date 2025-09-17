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
    
    const { cliente_id, cartera_id, region_id, limit = 50, offset = 0 } = req.query;
    
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
    
    if (region_id) {
      paramCount++;
      whereClause += paramCount === 1 ? ' WHERE' : ' AND';
      whereClause += ` cl.region_id = $${paramCount}`;
      params.push(region_id);
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
        n.created_at,
        cl.nombre as cliente_nombre,
        cl.cartera_id,
        c.name as cartera_nombre,
        cl.region_id,
        ug.nombre as region_nombre
      FROM nodos n
      LEFT JOIN clientes cl ON n.cliente_id = cl.id
      LEFT JOIN carteras c ON cl.cartera_id = c.id
      LEFT JOIN ubicacion_geografica ug ON cl.region_id = ug.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, params);
    
    // Obtener total de registros para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM nodos n
      LEFT JOIN clientes cl ON n.cliente_id = cl.id
      ${whereClause}
    `, params.slice(0, -2));
    
    res.json({
      success: true,
      message: 'Nodos obtenidos exitosamente',
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
        n.created_at,
        cl.nombre as cliente_nombre,
        cl.cartera_id,
        c.name as cartera_nombre,
        cl.region_id,
        ug.nombre as region_nombre
      FROM nodos n
      LEFT JOIN clientes cl ON n.cliente_id = cl.id
      LEFT JOIN carteras c ON cl.cartera_id = c.id
      LEFT JOIN ubicacion_geografica ug ON cl.region_id = ug.id
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
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('cliente_id')
    .isInt({ min: 1 })
    .withMessage('El ID de cliente debe ser un número entero positivo'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { nombre, cliente_id } = req.body;
    console.log(`➕ Creando nuevo nodo: ${nombre} para cliente ID: ${cliente_id}`);
    
    // Verificar que el cliente existe
    const clienteResult = await query(`
      SELECT id FROM clientes WHERE id = $1
    `, [cliente_id]);
    
    if (clienteResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El cliente especificado no existe'
      });
    }
    
    const result = await query(`
      INSERT INTO nodos (nombre, cliente_id, created_at)
      VALUES ($1, $2, NOW())
      RETURNING id, nombre, cliente_id, created_at
    `, [nombre, cliente_id]);
    
    res.status(201).json({
      success: true,
      message: 'Nodo creado exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error creando nodo:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un nodo con ese nombre para ese cliente'
      });
    }
    
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El cliente especificado no existe'
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
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('cliente_id')
    .isInt({ min: 1 })
    .withMessage('El ID de cliente debe ser un número entero positivo'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cliente_id } = req.body;
    console.log(`✏️ Actualizando nodo ID: ${id} con nombre: ${nombre}`);
    
    // Verificar que el cliente existe
    const clienteResult = await query(`
      SELECT id FROM clientes WHERE id = $1
    `, [cliente_id]);
    
    if (clienteResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El cliente especificado no existe'
      });
    }
    
    const result = await query(`
      UPDATE nodos 
      SET nombre = $1, cliente_id = $2
      WHERE id = $3
      RETURNING id, nombre, cliente_id, created_at
    `, [nombre, cliente_id, id]);
    
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
        message: 'Ya existe un nodo con ese nombre para ese cliente'
      });
    }
    
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El cliente especificado no existe'
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
      DELETE FROM nodos 
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

// GET /api/nodos/cliente/:cliente_id - Obtener nodos de un cliente específico
router.get('/cliente/:cliente_id', async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    console.log(`🔍 Obteniendo nodos del cliente ID: ${cliente_id}`);
    
    const result = await query(`
      SELECT 
        n.id,
        n.nombre,
        n.created_at
      FROM nodos n
      WHERE n.cliente_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `, [cliente_id, parseInt(limit), parseInt(offset)]);
    
    // Obtener total de nodos para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM nodos
      WHERE cliente_id = $1
    `, [cliente_id]);
    
    res.json({
      success: true,
      message: 'Nodos del cliente obtenidos exitosamente',
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
    console.error('❌ Error obteniendo nodos del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/nodos/estadisticas - Obtener estadísticas generales de nodos
router.get('/estadisticas', async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas generales de nodos...');
    
    const result = await query(`
      SELECT 
        COUNT(n.id) as total_nodos,
        COUNT(DISTINCT n.cliente_id) as clientes_con_nodos,
        COUNT(DISTINCT cl.cartera_id) as carteras_con_nodos,
        COUNT(DISTINCT cl.region_id) as regiones_con_nodos,
        MIN(n.created_at) as primer_nodo,
        MAX(n.created_at) as ultimo_nodo
      FROM nodos n
      LEFT JOIN clientes cl ON n.cliente_id = cl.id
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
