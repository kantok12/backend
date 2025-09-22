const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// =====================================================
// ENDPOINTS PARA CARTEAS
// =====================================================

// GET /servicio/carteras - listar todas las carteras
router.get('/carteras', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const estado = req.query.estado;

    let queryText = `
      SELECT 
        c.id,
        c.name,
        c.created_at,
        COUNT(cl.id) as total_clientes,
        COUNT(n.id) as total_nodos
      FROM "Servicios".carteras c
      LEFT JOIN "Servicios".clientes cl ON c.id = cl.cartera_id
      LEFT JOIN "Servicios".nodos n ON cl.id = n.cliente_id
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
    let countQuery = `SELECT COUNT(*) FROM "Servicios".carteras WHERE 1=1`;
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
      message: result.rows.length > 0 ? 'Carteras obtenidas exitosamente' : 'No se encontraron carteras',
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (offset + limit) < totalCount
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

// GET /servicio/carteras/:id - obtener cartera por ID
router.get('/carteras/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        c.id,
        c.name,
        c.created_at,
        COUNT(cl.id) as total_clientes,
        COUNT(n.id) as total_nodos
      FROM "Servicios".carteras c
      LEFT JOIN "Servicios".clientes cl ON c.id = cl.cartera_id
      LEFT JOIN "Servicios".nodos n ON cl.id = n.cliente_id
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
        ug.nombre as region_nombre,
        COUNT(n.id) as total_nodos
      FROM "Servicios".clientes cl
      LEFT JOIN "Servicios".ubicacion_geografica ug ON cl.region_id = ug.id
      LEFT JOIN "Servicios".nodos n ON cl.id = n.cliente_id
      WHERE cl.cartera_id = $1
      GROUP BY cl.id, cl.nombre, cl.created_at, ug.nombre
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

// POST /servicio/carteras - crear nueva cartera
router.post('/carteras', async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      codigo,
      responsable,
      telefono,
      email,
      direccion,
      estado = 'activo'
    } = req.body;

    // Validaciones
    if (!nombre || !codigo) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'Los campos nombre y codigo son requeridos'
      });
    }

    // Verificar que el código no exista
    const existingCheck = await query('SELECT id FROM "Servicios".carteras WHERE codigo = $1', [codigo]);
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Código ya existe',
        message: `Ya existe una cartera con código ${codigo}`
      });
    }

    const result = await query(`
      INSERT INTO "Servicios".carteras (nombre, descripcion, codigo, responsable, telefono, email, direccion, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [nombre, descripcion, codigo, responsable, telefono, email, direccion, estado]);

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
// ENDPOINTS PARA INGENIERÍA DE SERVICIOS
// =====================================================

// GET /servicio/ingenieros - listar ingenieros de servicios
router.get('/ingenieros', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const carteraId = req.query.cartera_id;
    const especialidad = req.query.especialidad;

    let queryText = `
      SELECT 
        i.*,
        c.nombre as cartera_nombre,
        c.codigo as cartera_codigo,
        COUNT(n.id) as total_nodos,
        COUNT(sp.id) as total_servicios_programados
      FROM "Servicios".ingenieria_servicios i
      LEFT JOIN "Servicios".carteras c ON i.cartera_id = c.id
      LEFT JOIN "Servicios".nodos n ON i.id = n.ingeniero_id AND n.activo = true
      LEFT JOIN "Servicios".servicios_programados sp ON n.id = sp.nodo_id AND sp.activo = true
      WHERE i.activo = true
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND (i.nombre ILIKE $${paramIndex} OR i.apellido ILIKE $${paramIndex} OR i.rut ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (carteraId) {
      queryText += ` AND i.cartera_id = $${paramIndex}`;
      queryParams.push(carteraId);
      paramIndex++;
    }

    if (especialidad) {
      queryText += ` AND i.especialidad ILIKE $${paramIndex}`;
      queryParams.push(`%${especialidad}%`);
      paramIndex++;
    }

    queryText += ` GROUP BY i.id, c.nombre, c.codigo ORDER BY i.nombre, i.apellido LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Contar total
    let countQuery = `SELECT COUNT(*) FROM "Servicios".ingenieria_servicios WHERE activo = true`;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (nombre ILIKE $${countParamIndex} OR apellido ILIKE $${countParamIndex} OR rut ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (carteraId) {
      countQuery += ` AND cartera_id = $${countParamIndex}`;
      countParams.push(carteraId);
      countParamIndex++;
    }

    if (especialidad) {
      countQuery += ` AND especialidad ILIKE $${countParamIndex}`;
      countParams.push(`%${especialidad}%`);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: result.rows.length > 0 ? 'Ingenieros obtenidos exitosamente' : 'No se encontraron ingenieros',
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (offset + limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error al obtener ingenieros:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ingenieros',
      message: error.message
    });
  }
});

// GET /servicio/ingenieros/:id - obtener ingeniero por ID
router.get('/ingenieros/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        i.*,
        c.nombre as cartera_nombre,
        c.codigo as cartera_codigo,
        COUNT(n.id) as total_nodos,
        COUNT(sp.id) as total_servicios_programados
      FROM "Servicios".ingenieria_servicios i
      LEFT JOIN "Servicios".carteras c ON i.cartera_id = c.id
      LEFT JOIN "Servicios".nodos n ON i.id = n.ingeniero_id AND n.activo = true
      LEFT JOIN "Servicios".servicios_programados sp ON n.id = sp.nodo_id AND sp.activo = true
      WHERE i.id = $1 AND i.activo = true
      GROUP BY i.id, c.nombre, c.codigo
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ingeniero no encontrado',
        message: `No existe ingeniero con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Ingeniero obtenido exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener ingeniero:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ingeniero',
      message: error.message
    });
  }
});

// POST /servicio/ingenieros - crear nuevo ingeniero
router.post('/ingenieros', async (req, res) => {
  try {
    const {
      cartera_id,
      nombre,
      apellido,
      rut,
      telefono,
      email,
      especialidad,
      nivel_experiencia = 'intermedio',
      fecha_ingreso,
      estado = 'activo',
      observaciones
    } = req.body;

    // Validaciones
    if (!cartera_id || !nombre || !apellido || !rut) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'Los campos cartera_id, nombre, apellido y rut son requeridos'
      });
    }

    // Verificar que la cartera existe
    const carteraCheck = await query('SELECT id FROM "Servicios".carteras WHERE id = $1 AND activo = true', [cartera_id]);
    if (carteraCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cartera no encontrada',
        message: `No existe cartera con ID ${cartera_id}`
      });
    }

    // Verificar que el RUT no exista
    const rutCheck = await query('SELECT id FROM "Servicios".ingenieria_servicios WHERE rut = $1', [rut]);
    if (rutCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'RUT ya existe',
        message: `Ya existe un ingeniero con RUT ${rut}`
      });
    }

    const result = await query(`
      INSERT INTO "Servicios".ingenieria_servicios (cartera_id, nombre, apellido, rut, telefono, email, especialidad, nivel_experiencia, fecha_ingreso, estado, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [cartera_id, nombre, apellido, rut, telefono, email, especialidad, nivel_experiencia, fecha_ingreso, estado, observaciones]);

    res.status(201).json({
      success: true,
      message: 'Ingeniero creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear ingeniero:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear ingeniero',
      message: error.message
    });
  }
});

// =====================================================
// ENDPOINTS PARA NODOS
// =====================================================

// GET /servicio/nodos - listar nodos
router.get('/nodos', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const ingenieroId = req.query.ingeniero_id;
    const tipoNodo = req.query.tipo_nodo;
    const prioridad = req.query.prioridad;

    let queryText = `
      SELECT 
        n.*,
        i.nombre as ingeniero_nombre,
        i.apellido as ingeniero_apellido,
        i.rut as ingeniero_rut,
        c.nombre as cartera_nombre,
        c.codigo as cartera_codigo,
        COUNT(sp.id) as total_servicios_programados,
        COUNT(CASE WHEN sp.estado = 'pendiente' THEN 1 END) as servicios_pendientes
      FROM "Servicios".nodos n
      LEFT JOIN "Servicios".ingenieria_servicios i ON n.ingeniero_id = i.id
      LEFT JOIN "Servicios".carteras c ON i.cartera_id = c.id
      LEFT JOIN "Servicios".servicios_programados sp ON n.id = sp.nodo_id AND sp.activo = true
      WHERE n.activo = true
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND (n.nombre ILIKE $${paramIndex} OR n.codigo ILIKE $${paramIndex} OR n.ubicacion ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (ingenieroId) {
      queryText += ` AND n.ingeniero_id = $${paramIndex}`;
      queryParams.push(ingenieroId);
      paramIndex++;
    }

    if (tipoNodo) {
      queryText += ` AND n.tipo_nodo = $${paramIndex}`;
      queryParams.push(tipoNodo);
      paramIndex++;
    }

    if (prioridad) {
      queryText += ` AND n.prioridad = $${paramIndex}`;
      queryParams.push(prioridad);
      paramIndex++;
    }

    queryText += ` GROUP BY n.id, i.nombre, i.apellido, i.rut, c.nombre, c.codigo ORDER BY n.nombre LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Contar total
    let countQuery = `SELECT COUNT(*) FROM "Servicios".nodos WHERE activo = true`;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (nombre ILIKE $${countParamIndex} OR codigo ILIKE $${countParamIndex} OR ubicacion ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (ingenieroId) {
      countQuery += ` AND ingeniero_id = $${countParamIndex}`;
      countParams.push(ingenieroId);
      countParamIndex++;
    }

    if (tipoNodo) {
      countQuery += ` AND tipo_nodo = $${countParamIndex}`;
      countParams.push(tipoNodo);
      countParamIndex++;
    }

    if (prioridad) {
      countQuery += ` AND prioridad = $${countParamIndex}`;
      countParams.push(prioridad);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: result.rows.length > 0 ? 'Nodos obtenidos exitosamente' : 'No se encontraron nodos',
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (offset + limit) < totalCount
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

// =====================================================
// ENDPOINTS PARA ESTRUCTURA COMPLETA
// =====================================================

// GET /servicio/estructura - obtener estructura jerárquica completa
router.get('/estructura', async (req, res) => {
  try {
    const carteraId = req.query.cartera_id;
    const ingenieroId = req.query.ingeniero_id;

    let queryText = `
      SELECT 
        c.id as cartera_id,
        c.nombre as cartera_nombre,
        c.codigo as cartera_codigo,
        c.responsable as cartera_responsable,
        i.id as ingeniero_id,
        i.nombre as ingeniero_nombre,
        i.apellido as ingeniero_apellido,
        i.rut as ingeniero_rut,
        i.especialidad,
        n.id as nodo_id,
        n.nombre as nodo_nombre,
        n.codigo as nodo_codigo,
        n.tipo_nodo,
        n.ubicacion,
        n.prioridad as nodo_prioridad,
        COUNT(sp.id) as total_servicios_programados,
        COUNT(CASE WHEN sp.estado = 'pendiente' THEN 1 END) as servicios_pendientes,
        COUNT(CASE WHEN sp.fecha_proximo_servicio <= CURRENT_DATE THEN 1 END) as servicios_vencidos
      FROM "Servicios".carteras c
      LEFT JOIN "Servicios".ingenieria_servicios i ON c.id = i.cartera_id AND i.activo = true
      LEFT JOIN "Servicios".nodos n ON i.id = n.ingeniero_id AND n.activo = true
      LEFT JOIN "Servicios".servicios_programados sp ON n.id = sp.nodo_id AND sp.activo = true
      WHERE c.activo = true
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (carteraId) {
      queryText += ` AND c.id = $${paramIndex}`;
      queryParams.push(carteraId);
      paramIndex++;
    }

    if (ingenieroId) {
      queryText += ` AND i.id = $${paramIndex}`;
      queryParams.push(ingenieroId);
      paramIndex++;
    }

    queryText += ` GROUP BY c.id, c.nombre, c.codigo, c.responsable, i.id, i.nombre, i.apellido, i.rut, i.especialidad, n.id, n.nombre, n.codigo, n.tipo_nodo, n.ubicacion, n.prioridad ORDER BY c.nombre, i.nombre, n.nombre`;

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      message: 'Estructura jerárquica obtenida exitosamente',
      data: result.rows
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

// GET /servicio/servicios-vencer - obtener servicios próximos a vencer
router.get('/servicios-vencer', async (req, res) => {
  try {
    const dias = Number(req.query.dias) || 7;
    const prioridad = req.query.prioridad;

    let queryText = `
      SELECT 
        c.nombre as cartera,
        i.nombre || ' ' || i.apellido as ingeniero,
        n.nombre as nodo,
        n.codigo as nodo_codigo,
        sp.tipo_servicio,
        sp.descripcion,
        sp.fecha_proximo_servicio,
        sp.prioridad,
        CASE 
          WHEN sp.fecha_proximo_servicio < CURRENT_DATE THEN 'VENCIDO'
          WHEN sp.fecha_proximo_servicio = CURRENT_DATE THEN 'HOY'
          WHEN sp.fecha_proximo_servicio <= CURRENT_DATE + INTERVAL '3 days' THEN 'PRÓXIMO'
          ELSE 'PROGRAMADO'
        END as estado_urgencia
      FROM "Servicios".servicios_programados sp
      JOIN "Servicios".nodos n ON sp.nodo_id = n.id
      JOIN "Servicios".ingenieria_servicios i ON n.ingeniero_id = i.id
      JOIN "Servicios".carteras c ON i.cartera_id = c.id
      WHERE sp.activo = true 
        AND sp.estado = 'pendiente'
        AND sp.fecha_proximo_servicio <= CURRENT_DATE + INTERVAL '${dias} days'
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (prioridad) {
      queryText += ` AND sp.prioridad = $${paramIndex}`;
      queryParams.push(prioridad);
      paramIndex++;
    }

    queryText += ` ORDER BY sp.fecha_proximo_servicio ASC, sp.prioridad DESC`;

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      message: 'Servicios próximos a vencer obtenidos exitosamente',
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener servicios próximos a vencer:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener servicios próximos a vencer',
      message: error.message
    });
  }
});

// GET /servicio/estadisticas - obtener estadísticas generales
router.get('/estadisticas', async (req, res) => {
  try {
    // Estadísticas generales
    const generalStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM "Servicios".carteras WHERE activo = true) as total_carteras,
        (SELECT COUNT(*) FROM "Servicios".ingenieria_servicios WHERE activo = true) as total_ingenieros,
        (SELECT COUNT(*) FROM "Servicios".nodos WHERE activo = true) as total_nodos,
        (SELECT COUNT(*) FROM "Servicios".servicios_programados WHERE activo = true) as total_servicios_programados,
        (SELECT COUNT(*) FROM "Servicios".servicios_programados WHERE activo = true AND estado = 'pendiente') as servicios_pendientes,
        (SELECT COUNT(*) FROM "Servicios".servicios_programados WHERE activo = true AND fecha_proximo_servicio <= CURRENT_DATE) as servicios_vencidos
    `);

    // Estadísticas por cartera
    const carteraStats = await query(`
      SELECT 
        c.nombre as cartera,
        COUNT(DISTINCT i.id) as total_ingenieros,
        COUNT(DISTINCT n.id) as total_nodos,
        COUNT(sp.id) as total_servicios,
        COUNT(CASE WHEN sp.estado = 'pendiente' THEN 1 END) as servicios_pendientes
      FROM "Servicios".carteras c
      LEFT JOIN "Servicios".ingenieria_servicios i ON c.id = i.cartera_id AND i.activo = true
      LEFT JOIN "Servicios".nodos n ON i.id = n.ingeniero_id AND n.activo = true
      LEFT JOIN "Servicios".servicios_programados sp ON n.id = sp.nodo_id AND sp.activo = true
      WHERE c.activo = true
      GROUP BY c.id, c.nombre
      ORDER BY c.nombre
    `);

    // Estadísticas por tipo de nodo
    const nodoTipoStats = await query(`
      SELECT 
        tipo_nodo,
        COUNT(*) as total_nodos,
        COUNT(sp.id) as total_servicios,
        COUNT(CASE WHEN sp.estado = 'pendiente' THEN 1 END) as servicios_pendientes
      FROM "Servicios".nodos n
      LEFT JOIN "Servicios".servicios_programados sp ON n.id = sp.nodo_id AND sp.activo = true
      WHERE n.activo = true
      GROUP BY tipo_nodo
      ORDER BY total_nodos DESC
    `);

    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: {
        general: generalStats.rows[0],
        por_cartera: carteraStats.rows,
        por_tipo_nodo: nodoTipoStats.rows
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





