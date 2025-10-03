const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// =====================================================
// ENDPOINTS PARA CARTEAS (ESQUEMA SERVICIOS)
// =====================================================

// GET /api/servicios/carteras - listar todas las carteras
router.get('/carteras', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;

    let queryText = `
      SELECT 
        c.id,
        c.name as nombre,
        c.created_at as fecha_creacion,
        COUNT(cl.id) as total_clientes,
        COUNT(n.id) as total_nodos
      FROM servicios.carteras c
      LEFT JOIN servicios.clientes cl ON c.id = cl.cartera_id
      LEFT JOIN servicios.nodos n ON cl.id = n.cliente_id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND c.name ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ` GROUP BY c.id, c.name, c.created_at ORDER BY c.name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Contar total
    let countQuery = `SELECT COUNT(*) FROM servicios.carteras WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND name ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: 'Carteras obtenidas exitosamente',
      data: result.rows,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error al obtener carteras:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener carteras',
      message: error.message
    });
  }
});

// GET /api/servicios/carteras/:id - obtener cartera por ID
router.get('/carteras/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        c.id,
        c.name as nombre,
        c.created_at as fecha_creacion,
        COUNT(cl.id) as total_clientes,
        COUNT(n.id) as total_nodos
      FROM servicios.carteras c
      LEFT JOIN servicios.clientes cl ON c.id = cl.cartera_id
      LEFT JOIN servicios.nodos n ON cl.id = n.cliente_id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.created_at
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cartera no encontrada',
        message: `No existe cartera con ID ${id}`
      });
    }

    // Obtener clientes de esta cartera
    const clientesResult = await query(`
      SELECT 
        cl.id,
        cl.nombre,
        cl.created_at,
        cl.region_id,
        COUNT(n.id) as total_nodos
      FROM servicios.clientes cl
      LEFT JOIN servicios.nodos n ON cl.id = n.cliente_id
      WHERE cl.cartera_id = $1
      GROUP BY cl.id, cl.nombre, cl.created_at, cl.region_id
      ORDER BY cl.created_at DESC
    `, [id]);

    const cartera = result.rows[0];
    cartera.clientes = clientesResult.rows;

    res.json({
      success: true,
      message: 'Cartera obtenida exitosamente',
      data: cartera
    });

  } catch (error) {
    console.error('Error al obtener cartera:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cartera',
      message: error.message
    });
  }
});

// POST /api/servicios/carteras - crear nueva cartera
router.post('/carteras', async (req, res) => {
  try {
    const { name } = req.body;

    // Validaciones
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'El campo name es requerido'
      });
    }

    // Verificar que el nombre no exista
    const existingCheck = await query('SELECT id FROM servicios.carteras WHERE name = $1', [name]);
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Nombre ya existe',
        message: `Ya existe una cartera con nombre ${name}`
      });
    }

    const result = await query(`
      INSERT INTO servicios.carteras (name, created_at)
      VALUES ($1, NOW())
      RETURNING *
    `, [name]);

    res.status(201).json({
      success: true,
      message: 'Cartera creada exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear cartera:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear cartera',
      message: error.message
    });
  }
});

// =====================================================
// ENDPOINTS PARA CLIENTES (ESQUEMA SERVICIOS)
// =====================================================

// GET /api/servicios/clientes - listar todos los clientes
router.get('/clientes', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const carteraId = req.query.cartera_id;

    let queryText = `
      SELECT 
        cl.id,
        cl.nombre,
        cl.cartera_id,
        cl.created_at,
        cl.region_id,
        c.name as cartera_nombre,
        COUNT(n.id) as total_nodos
      FROM servicios.clientes cl
      LEFT JOIN servicios.carteras c ON cl.cartera_id = c.id
      LEFT JOIN servicios.nodos n ON cl.id = n.cliente_id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND cl.nombre ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (carteraId) {
      queryText += ` AND cl.cartera_id = $${paramIndex}`;
      queryParams.push(carteraId);
      paramIndex++;
    }

    queryText += ` GROUP BY cl.id, cl.nombre, cl.cartera_id, cl.created_at, cl.region_id, c.name ORDER BY cl.nombre LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Contar total
    let countQuery = `SELECT COUNT(*) FROM servicios.clientes WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND nombre ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (carteraId) {
      countQuery += ` AND cartera_id = $${countParamIndex}`;
      countParams.push(carteraId);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: 'Clientes obtenidos exitosamente',
      data: result.rows,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener clientes',
      message: error.message
    });
  }
});

// GET /api/servicios/clientes/:id - obtener cliente por ID
router.get('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        cl.id,
        cl.nombre,
        cl.cartera_id,
        cl.created_at,
        cl.region_id,
        c.name as cartera_nombre,
        COUNT(n.id) as total_nodos
      FROM servicios.clientes cl
      LEFT JOIN servicios.carteras c ON cl.cartera_id = c.id
      LEFT JOIN servicios.nodos n ON cl.id = n.cliente_id
      WHERE cl.id = $1
      GROUP BY cl.id, cl.nombre, cl.cartera_id, cl.created_at, cl.region_id, c.name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado',
        message: `No existe cliente con ID ${id}`
      });
    }

    // Obtener nodos de este cliente
    const nodosResult = await query(`
      SELECT 
        n.id,
        n.nombre,
        n.created_at
      FROM servicios.nodos n
      WHERE n.cliente_id = $1
      ORDER BY n.created_at DESC
    `, [id]);

    const cliente = result.rows[0];
    cliente.nodos = nodosResult.rows;

    res.json({
      success: true,
      message: 'Cliente obtenido exitosamente',
      data: cliente
    });

  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cliente',
      message: error.message
    });
  }
});

// POST /api/servicios/clientes - crear nuevo cliente
router.post('/clientes', async (req, res) => {
  try {
    const { nombre, cartera_id, region_id } = req.body;

    // Validaciones
    if (!nombre || !cartera_id) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'Los campos nombre y cartera_id son requeridos'
      });
    }

    // Verificar que la cartera existe
    const carteraCheck = await query('SELECT id FROM servicios.carteras WHERE id = $1', [cartera_id]);
    if (carteraCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cartera no encontrada',
        message: `No existe cartera con ID ${cartera_id}`
      });
    }

    // Verificar que el nombre no exista
    const existingCheck = await query('SELECT id FROM servicios.clientes WHERE nombre = $1', [nombre]);
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Nombre ya existe',
        message: `Ya existe un cliente con nombre ${nombre}`
      });
    }

    const result = await query(`
      INSERT INTO servicios.clientes (nombre, cartera_id, region_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [nombre, cartera_id, region_id || null]);

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear cliente',
      message: error.message
    });
  }
});

// =====================================================
// ENDPOINTS PARA NODOS (ESQUEMA SERVICIOS)
// =====================================================

// GET /api/servicios/nodos - listar todos los nodos
router.get('/nodos', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const clienteId = req.query.cliente_id;
    const carteraId = req.query.cartera_id;

    let queryText = `
      SELECT 
        n.id,
        n.nombre,
        n.cliente_id,
        n.created_at,
        cl.nombre as cliente_nombre,
        cl.cartera_id,
        c.name as cartera_nombre
      FROM servicios.nodos n
      LEFT JOIN servicios.clientes cl ON n.cliente_id = cl.id
      LEFT JOIN servicios.carteras c ON cl.cartera_id = c.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND n.nombre ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (clienteId) {
      queryText += ` AND n.cliente_id = $${paramIndex}`;
      queryParams.push(clienteId);
      paramIndex++;
    }

    if (carteraId) {
      queryText += ` AND cl.cartera_id = $${paramIndex}`;
      queryParams.push(carteraId);
      paramIndex++;
    }

    queryText += ` ORDER BY n.nombre LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Contar total
    let countQuery = `
      SELECT COUNT(*) 
      FROM servicios.nodos n
      LEFT JOIN servicios.clientes cl ON n.cliente_id = cl.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND n.nombre ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (clienteId) {
      countQuery += ` AND n.cliente_id = $${countParamIndex}`;
      countParams.push(clienteId);
      countParamIndex++;
    }

    if (carteraId) {
      countQuery += ` AND cl.cartera_id = $${countParamIndex}`;
      countParams.push(carteraId);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: 'Nodos obtenidos exitosamente',
      data: result.rows,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error al obtener nodos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener nodos',
      message: error.message
    });
  }
});

// GET /api/servicios/nodos/:id - obtener nodo por ID
router.get('/nodos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        n.id,
        n.nombre,
        n.cliente_id,
        n.created_at,
        cl.nombre as cliente_nombre,
        cl.cartera_id,
        c.name as cartera_nombre
      FROM servicios.nodos n
      LEFT JOIN servicios.clientes cl ON n.cliente_id = cl.id
      LEFT JOIN servicios.carteras c ON cl.cartera_id = c.id
      WHERE n.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Nodo no encontrado',
        message: `No existe nodo con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Nodo obtenido exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener nodo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener nodo',
      message: error.message
    });
  }
});

// POST /api/servicios/nodos - crear nuevo nodo
router.post('/nodos', async (req, res) => {
  try {
    const { nombre, cliente_id } = req.body;

    // Validaciones
    if (!nombre || !cliente_id) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'Los campos nombre y cliente_id son requeridos'
      });
    }

    // Verificar que el cliente existe
    const clienteCheck = await query('SELECT id FROM servicios.clientes WHERE id = $1', [cliente_id]);
    if (clienteCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cliente no encontrado',
        message: `No existe cliente con ID ${cliente_id}`
      });
    }

    // Verificar que el nombre no exista
    const existingCheck = await query('SELECT id FROM servicios.nodos WHERE nombre = $1', [nombre]);
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Nombre ya existe',
        message: `Ya existe un nodo con nombre ${nombre}`
      });
    }

    const result = await query(`
      INSERT INTO servicios.nodos (nombre, cliente_id, created_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `, [nombre, cliente_id]);

    res.status(201).json({
      success: true,
      message: 'Nodo creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear nodo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear nodo',
      message: error.message
    });
  }
});

// =====================================================
// ENDPOINTS PARA ESTRUCTURA COMPLETA (ESQUEMA SERVICIOS)
// =====================================================

// GET /api/servicios/estructura - obtener estructura jerárquica completa
router.get('/estructura', async (req, res) => {
  try {
    const carteraId = req.query.cartera_id;
    const clienteId = req.query.cliente_id;

    let queryText = `
      SELECT 
        c.id as cartera_id,
        c.name as cartera_nombre,
        c.created_at as cartera_created_at,
        cl.id as cliente_id,
        cl.nombre as cliente_nombre,
        cl.created_at as cliente_created_at,
        cl.region_id,
        n.id as nodo_id,
        n.nombre as nodo_nombre,
        n.created_at as nodo_created_at
      FROM servicios.carteras c
      LEFT JOIN servicios.clientes cl ON c.id = cl.cartera_id
      LEFT JOIN servicios.nodos n ON cl.id = n.cliente_id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (carteraId) {
      queryText += ` AND c.id = $${paramIndex}`;
      queryParams.push(carteraId);
      paramIndex++;
    }

    if (clienteId) {
      queryText += ` AND cl.id = $${paramIndex}`;
      queryParams.push(clienteId);
      paramIndex++;
    }

    queryText += ` ORDER BY c.name, cl.nombre, n.nombre`;

    const result = await query(queryText, queryParams);

    // Organizar datos en estructura jerárquica
    const estructura = {};
    
    result.rows.forEach(row => {
      const carteraId = row.cartera_id;
      const clienteId = row.cliente_id;
      const nodoId = row.nodo_id;

      // Inicializar cartera si no existe
      if (!estructura[carteraId]) {
        estructura[carteraId] = {
          id: carteraId,
          nombre: row.cartera_nombre,
          created_at: row.cartera_created_at,
          clientes: {}
        };
      }

      // Inicializar cliente si no existe
      if (clienteId && !estructura[carteraId].clientes[clienteId]) {
        estructura[carteraId].clientes[clienteId] = {
          id: clienteId,
          nombre: row.cliente_nombre,
          created_at: row.cliente_created_at,
          region_id: row.region_id,
          nodos: []
        };
      }

      // Agregar nodo si existe
      if (nodoId) {
        estructura[carteraId].clientes[clienteId].nodos.push({
          id: nodoId,
          nombre: row.nodo_nombre,
          created_at: row.nodo_created_at
        });
      }
    });

    // Convertir a array
    const estructuraArray = Object.values(estructura).map(cartera => ({
      ...cartera,
      clientes: Object.values(cartera.clientes)
    }));

    res.json({
      success: true,
      message: 'Estructura obtenida exitosamente',
      data: estructuraArray
    });

  } catch (error) {
    console.error('Error al obtener estructura:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estructura',
      message: error.message
    });
  }
});

// GET /api/servicios/estadisticas - obtener estadísticas generales
router.get('/estadisticas', async (req, res) => {
  try {
    const carterasCount = await query('SELECT COUNT(*) as count FROM servicios.carteras');
    const clientesCount = await query('SELECT COUNT(*) as count FROM servicios.clientes');
    const nodosCount = await query('SELECT COUNT(*) as count FROM servicios.nodos');

    // Estadísticas por cartera
    const estadisticasPorCartera = await query(`
      SELECT 
        c.id,
        c.name as cartera_nombre,
        COUNT(DISTINCT cl.id) as total_clientes,
        COUNT(DISTINCT n.id) as total_nodos
      FROM servicios.carteras c
      LEFT JOIN servicios.clientes cl ON c.id = cl.cartera_id
      LEFT JOIN servicios.nodos n ON cl.id = n.cliente_id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);

    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: {
        totales: {
          carteras: parseInt(carterasCount.rows[0].count),
          clientes: parseInt(clientesCount.rows[0].count),
          nodos: parseInt(nodosCount.rows[0].count)
        },
        por_cartera: estadisticasPorCartera.rows
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
});

module.exports = router;
