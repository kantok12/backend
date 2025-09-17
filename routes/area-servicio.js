const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET /area-servicio - listar personal por área de servicio
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const estadoId = req.query.estado_id;
    const cargo = req.query.cargo;
    const zonaGeografica = req.query.zona_geografica;

    // Construir consulta SQL con JOIN a estados
    let queryText = `
      SELECT 
        pd.*,
        e.nombre as estado_nombre,
        e.descripcion as estado_descripcion
      FROM mantenimiento.personal_disponible pd
      LEFT JOIN mantenimiento.estados e ON pd.estado_id = e.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    // Filtro por RUT (búsqueda)
    if (search) {
      queryText += ` AND (pd.rut ILIKE $${paramIndex} OR pd.nombre ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por estado
    if (estadoId) {
      queryText += ` AND pd.estado_id = $${paramIndex}`;
      queryParams.push(estadoId);
      paramIndex++;
    }

    // Filtro por cargo
    if (cargo) {
      queryText += ` AND pd.cargo ILIKE $${paramIndex}`;
      queryParams.push(`%${cargo}%`);
      paramIndex++;
    }

    // Filtro por zona geográfica
    if (zonaGeografica) {
      queryText += ` AND pd.zona_geografica ILIKE $${paramIndex}`;
      queryParams.push(`%${zonaGeografica}%`);
      paramIndex++;
    }

    // Agregar paginación
    queryText += ` ORDER BY pd.cargo, pd.nombre LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Consulta para contar total
    let countQuery = `SELECT COUNT(*) FROM mantenimiento.personal_disponible pd WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (pd.rut ILIKE $${countParamIndex} OR pd.nombre ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (estadoId) {
      countQuery += ` AND pd.estado_id = $${countParamIndex}`;
      countParams.push(estadoId);
      countParamIndex++;
    }

    if (cargo) {
      countQuery += ` AND pd.cargo ILIKE $${countParamIndex}`;
      countParams.push(`%${cargo}%`);
      countParamIndex++;
    }

    if (zonaGeografica) {
      countQuery += ` AND pd.zona_geografica ILIKE $${countParamIndex}`;
      countParams.push(`%${zonaGeografica}%`);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: result.rows.length > 0 ? 'Personal del área de servicio obtenido exitosamente' : 'No se encontró personal en el área de servicio',
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (offset + limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error al obtener personal del área de servicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener personal del área de servicio',
      message: error.message
    });
  }
});

// GET /area-servicio/stats - estadísticas del área de servicio
router.get('/stats', async (req, res) => {
  try {
    // Estadísticas por cargo
    const cargoStats = await query(`
      SELECT 
        cargo,
        COUNT(*) as total,
        COUNT(CASE WHEN estado_id = 1 THEN 1 END) as proceso_activo,
        COUNT(CASE WHEN estado_id = 2 THEN 1 END) as acreditacion,
        COUNT(CASE WHEN estado_id = 3 THEN 1 END) as inactivo,
        COUNT(CASE WHEN estado_id = 4 THEN 1 END) as vacaciones
      FROM mantenimiento.personal_disponible 
      GROUP BY cargo 
      ORDER BY total DESC
    `);

    // Estadísticas por zona geográfica
    const zonaStats = await query(`
      SELECT 
        COALESCE(zona_geografica, 'Sin zona asignada') as zona,
        COUNT(*) as total,
        COUNT(CASE WHEN estado_id = 1 THEN 1 END) as proceso_activo,
        COUNT(CASE WHEN estado_id = 2 THEN 1 END) as acreditacion,
        COUNT(CASE WHEN estado_id = 3 THEN 1 END) as inactivo,
        COUNT(CASE WHEN estado_id = 4 THEN 1 END) as vacaciones
      FROM mantenimiento.personal_disponible 
      GROUP BY zona_geografica 
      ORDER BY total DESC
    `);

    // Estadísticas por estado
    const estadoStats = await query(`
      SELECT 
        e.nombre as estado,
        e.descripcion,
        COUNT(pd.rut) as total
      FROM mantenimiento.estados e
      LEFT JOIN mantenimiento.personal_disponible pd ON e.id = pd.estado_id
      GROUP BY e.id, e.nombre, e.descripcion
      ORDER BY total DESC
    `);

    // Estadísticas generales
    const generalStats = await query(`
      SELECT 
        COUNT(*) as total_personal,
        COUNT(CASE WHEN estado_id = 1 THEN 1 END) as proceso_activo,
        COUNT(CASE WHEN estado_id = 2 THEN 1 END) as acreditacion,
        COUNT(CASE WHEN estado_id = 3 THEN 1 END) as inactivo,
        COUNT(CASE WHEN estado_id = 4 THEN 1 END) as vacaciones,
        COUNT(DISTINCT cargo) as total_cargos,
        COUNT(DISTINCT zona_geografica) as total_zonas
      FROM mantenimiento.personal_disponible
    `);

    res.json({
      success: true,
      message: 'Estadísticas del área de servicio obtenidas exitosamente',
      data: {
        general: generalStats.rows[0],
        por_cargo: cargoStats.rows,
        por_zona: zonaStats.rows,
        por_estado: estadoStats.rows
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del área de servicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas del área de servicio',
      message: error.message
    });
  }
});

// GET /area-servicio/cargos - listar cargos disponibles
router.get('/cargos', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        cargo,
        COUNT(*) as total_personal,
        COUNT(CASE WHEN estado_id = 1 THEN 1 END) as proceso_activo,
        COUNT(CASE WHEN estado_id = 2 THEN 1 END) as acreditacion,
        COUNT(CASE WHEN estado_id = 3 THEN 1 END) as inactivo,
        COUNT(CASE WHEN estado_id = 4 THEN 1 END) as vacaciones
      FROM mantenimiento.personal_disponible 
      GROUP BY cargo 
      ORDER BY cargo
    `);

    res.json({
      success: true,
      message: 'Cargos del área de servicio obtenidos exitosamente',
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener cargos del área de servicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cargos del área de servicio',
      message: error.message
    });
  }
});

// GET /area-servicio/zonas - listar zonas geográficas disponibles
router.get('/zonas', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COALESCE(zona_geografica, 'Sin zona asignada') as zona,
        COUNT(*) as total_personal,
        COUNT(CASE WHEN estado_id = 1 THEN 1 END) as proceso_activo,
        COUNT(CASE WHEN estado_id = 2 THEN 1 END) as acreditacion,
        COUNT(CASE WHEN estado_id = 3 THEN 1 END) as inactivo,
        COUNT(CASE WHEN estado_id = 4 THEN 1 END) as vacaciones
      FROM mantenimiento.personal_disponible 
      GROUP BY zona_geografica 
      ORDER BY zona_geografica
    `);

    res.json({
      success: true,
      message: 'Zonas geográficas del área de servicio obtenidas exitosamente',
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener zonas del área de servicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener zonas del área de servicio',
      message: error.message
    });
  }
});

// GET /area-servicio/cargo/:cargo - obtener personal por cargo específico
router.get('/cargo/:cargo', async (req, res) => {
  try {
    const { cargo } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const estadoId = req.query.estado_id;

    let queryText = `
      SELECT 
        pd.*,
        e.nombre as estado_nombre,
        e.descripcion as estado_descripcion
      FROM mantenimiento.personal_disponible pd
      LEFT JOIN mantenimiento.estados e ON pd.estado_id = e.id
      WHERE pd.cargo ILIKE $1
    `;
    const queryParams = [`%${cargo}%`];
    let paramIndex = 2;

    if (estadoId) {
      queryText += ` AND pd.estado_id = $${paramIndex}`;
      queryParams.push(estadoId);
      paramIndex++;
    }

    queryText += ` ORDER BY pd.nombre LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Contar total
    let countQuery = `SELECT COUNT(*) FROM mantenimiento.personal_disponible WHERE cargo ILIKE $1`;
    const countParams = [`%${cargo}%`];
    
    if (estadoId) {
      countQuery += ` AND estado_id = $2`;
      countParams.push(estadoId);
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: result.rows.length > 0 ? `Personal del cargo "${cargo}" obtenido exitosamente` : `No se encontró personal con el cargo "${cargo}"`,
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (offset + limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error al obtener personal por cargo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener personal por cargo',
      message: error.message
    });
  }
});

// GET /area-servicio/zona/:zona - obtener personal por zona geográfica
router.get('/zona/:zona', async (req, res) => {
  try {
    const { zona } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const estadoId = req.query.estado_id;

    let queryText = `
      SELECT 
        pd.*,
        e.nombre as estado_nombre,
        e.descripcion as estado_descripcion
      FROM mantenimiento.personal_disponible pd
      LEFT JOIN mantenimiento.estados e ON pd.estado_id = e.id
      WHERE pd.zona_geografica ILIKE $1
    `;
    const queryParams = [`%${zona}%`];
    let paramIndex = 2;

    if (estadoId) {
      queryText += ` AND pd.estado_id = $${paramIndex}`;
      queryParams.push(estadoId);
      paramIndex++;
    }

    queryText += ` ORDER BY pd.nombre LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Contar total
    let countQuery = `SELECT COUNT(*) FROM mantenimiento.personal_disponible WHERE zona_geografica ILIKE $1`;
    const countParams = [`%${zona}%`];
    
    if (estadoId) {
      countQuery += ` AND estado_id = $2`;
      countParams.push(estadoId);
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: result.rows.length > 0 ? `Personal de la zona "${zona}" obtenido exitosamente` : `No se encontró personal en la zona "${zona}"`,
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (offset + limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error al obtener personal por zona:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener personal por zona',
      message: error.message
    });
  }
});

// GET /area-servicio/disponibles - obtener personal disponible para servicio
router.get('/disponibles', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const cargo = req.query.cargo;
    const zonaGeografica = req.query.zona_geografica;

    // Personal disponible: estado "Proceso de Activo" o "De Acreditación"
    let queryText = `
      SELECT 
        pd.*,
        e.nombre as estado_nombre,
        e.descripcion as estado_descripcion
      FROM mantenimiento.personal_disponible pd
      LEFT JOIN mantenimiento.estados e ON pd.estado_id = e.id
      WHERE pd.estado_id IN (1, 2)
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (cargo) {
      queryText += ` AND pd.cargo ILIKE $${paramIndex}`;
      queryParams.push(`%${cargo}%`);
      paramIndex++;
    }

    if (zonaGeografica) {
      queryText += ` AND pd.zona_geografica ILIKE $${paramIndex}`;
      queryParams.push(`%${zonaGeografica}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY pd.cargo, pd.nombre LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Contar total
    let countQuery = `SELECT COUNT(*) FROM mantenimiento.personal_disponible WHERE estado_id IN (1, 2)`;
    const countParams = [];
    let countParamIndex = 1;

    if (cargo) {
      countQuery += ` AND cargo ILIKE $${countParamIndex}`;
      countParams.push(`%${cargo}%`);
      countParamIndex++;
    }

    if (zonaGeografica) {
      countQuery += ` AND zona_geografica ILIKE $${countParamIndex}`;
      countParams.push(`%${zonaGeografica}%`);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: result.rows.length > 0 ? 'Personal disponible para servicio obtenido exitosamente' : 'No se encontró personal disponible para servicio',
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (offset + limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error al obtener personal disponible para servicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener personal disponible para servicio',
      message: error.message
    });
  }
});

module.exports = router;





