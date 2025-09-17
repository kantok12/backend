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
    
    const { cartera_id, region_id, limit = 50, offset = 0 } = req.query;
    
    let whereClause = '';
    let params = [];
    let paramCount = 0;
    
    if (cartera_id) {
      paramCount++;
      whereClause += ` WHERE cl.cartera_id = $${paramCount}`;
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
        cl.id,
        cl.nombre,
        cl.cartera_id,
        cl.region_id,
        cl.created_at,
        c.name as cartera_nombre,
        ug.nombre as region_nombre,
        COUNT(n.id) as total_nodos
      FROM clientes cl
      LEFT JOIN carteras c ON cl.cartera_id = c.id
      LEFT JOIN ubicacion_geografica ug ON cl.region_id = ug.id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      ${whereClause}
      GROUP BY cl.id, cl.nombre, cl.cartera_id, cl.region_id, cl.created_at, c.name, ug.nombre
      ORDER BY cl.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, params);
    
    // Obtener total de registros para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM clientes cl
      ${whereClause}
    `, params.slice(0, -2));
    
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
        cl.region_id,
        cl.created_at,
        c.name as cartera_nombre,
        ug.nombre as region_nombre,
        COUNT(n.id) as total_nodos
      FROM clientes cl
      LEFT JOIN carteras c ON cl.cartera_id = c.id
      LEFT JOIN ubicacion_geografica ug ON cl.region_id = ug.id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      WHERE cl.id = $1
      GROUP BY cl.id, cl.nombre, cl.cartera_id, cl.region_id, cl.created_at, c.name, ug.nombre
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
        n.created_at
      FROM nodos n
      WHERE n.cliente_id = $1
      ORDER BY n.created_at DESC
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
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('cartera_id')
    .isInt({ min: 1 })
    .withMessage('El ID de cartera debe ser un número entero positivo'),
  body('region_id')
    .isInt({ min: 1 })
    .withMessage('El ID de región debe ser un número entero positivo'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { nombre, cartera_id, region_id } = req.body;
    console.log(`➕ Creando nuevo cliente: ${nombre}`);
    
    // Verificar que la cartera existe
    const carteraResult = await query(`
      SELECT id FROM carteras WHERE id = $1
    `, [cartera_id]);
    
    if (carteraResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La cartera especificada no existe'
      });
    }
    
    // Verificar que la región existe
    const regionResult = await query(`
      SELECT id FROM ubicacion_geografica WHERE id = $1
    `, [region_id]);
    
    if (regionResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La región especificada no existe'
      });
    }
    
    const result = await query(`
      INSERT INTO clientes (nombre, cartera_id, region_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, nombre, cartera_id, region_id, created_at
    `, [nombre, cartera_id, region_id]);
    
    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error creando cliente:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un cliente con ese nombre en esa cartera'
      });
    }
    
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'La cartera o región especificada no existe'
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
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('cartera_id')
    .isInt({ min: 1 })
    .withMessage('El ID de cartera debe ser un número entero positivo'),
  body('region_id')
    .isInt({ min: 1 })
    .withMessage('El ID de región debe ser un número entero positivo'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cartera_id, region_id } = req.body;
    console.log(`✏️ Actualizando cliente ID: ${id} con nombre: ${nombre}`);
    
    // Verificar que la cartera existe
    const carteraResult = await query(`
      SELECT id FROM carteras WHERE id = $1
    `, [cartera_id]);
    
    if (carteraResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La cartera especificada no existe'
      });
    }
    
    // Verificar que la región existe
    const regionResult = await query(`
      SELECT id FROM ubicacion_geografica WHERE id = $1
    `, [region_id]);
    
    if (regionResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La región especificada no existe'
      });
    }
    
    const result = await query(`
      UPDATE clientes 
      SET nombre = $1, cartera_id = $2, region_id = $3
      WHERE id = $4
      RETURNING id, nombre, cartera_id, region_id, created_at
    `, [nombre, cartera_id, region_id, id]);
    
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
        message: 'Ya existe un cliente con ese nombre en esa cartera'
      });
    }
    
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'La cartera o región especificada no existe'
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
      FROM nodos
      WHERE cliente_id = $1
    `, [id]);
    
    if (parseInt(nodosResult.rows[0].total_nodos) > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el cliente porque tiene nodos asociados'
      });
    }
    
    const result = await query(`
      DELETE FROM clientes 
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
        c.name as cartera_nombre,
        ug.nombre as region_nombre,
        COUNT(n.id) as total_nodos,
        MIN(n.created_at) as primer_nodo,
        MAX(n.created_at) as ultimo_nodo
      FROM clientes cl
      LEFT JOIN carteras c ON cl.cartera_id = c.id
      LEFT JOIN ubicacion_geografica ug ON cl.region_id = ug.id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      WHERE cl.id = $1
      GROUP BY cl.id, cl.nombre, c.name, ug.nombre
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
