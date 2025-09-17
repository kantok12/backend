const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET / - Listar estados unificados
router.get('/', async (req, res) => {
  try {
    const { 
      origen, 
      origen_id, 
      activo, 
      limit = 50, 
      offset = 0,
      search 
    } = req.query;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramIndex = 1;

    // Filtros
    if (origen) {
      whereConditions.push(`eu.origen = $${paramIndex}`);
      queryParams.push(origen);
      paramIndex++;
    }

    if (origen_id) {
      whereConditions.push(`eu.origen_id = $${paramIndex}`);
      queryParams.push(origen_id);
      paramIndex++;
    }

    if (activo !== undefined) {
      whereConditions.push(`eu.activo = $${paramIndex}`);
      queryParams.push(activo === 'true');
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(eu.nombre ILIKE $${paramIndex} OR eu.descripcion ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Query principal
    const mainQuery = `
      SELECT 
        eu.id,
        eu.origen,
        eu.origen_id,
        eu.nombre,
        eu.descripcion,
        eu.activo,
        eu.created_at
      FROM mantenimiento.estado_unificado eu
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY eu.created_at DESC, eu.origen, eu.origen_id
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(mainQuery, queryParams);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantenimiento.estado_unificado eu
      WHERE ${whereConditions.join(' AND ')}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      message: 'Estados unificados obtenidos exitosamente',
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener estados unificados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estados unificados',
      message: error.message
    });
  }
});

// GET /:id - Obtener estado unificado específico por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        eu.id,
        eu.origen,
        eu.origen_id,
        eu.nombre,
        eu.descripcion,
        eu.activo,
        eu.created_at
      FROM mantenimiento.estado_unificado eu
      WHERE eu.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estado unificado no encontrado',
        message: `No existe un estado unificado con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Estado unificado obtenido exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener estado unificado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado unificado',
      message: error.message
    });
  }
});

// GET /origen/:origen - Obtener estados unificados por origen
router.get('/origen/:origen', async (req, res) => {
  try {
    const { origen } = req.params;
    const { activo, limit = 50, offset = 0 } = req.query;

    let whereConditions = ['eu.origen = $1'];
    let queryParams = [origen];
    let paramIndex = 2;

    if (activo !== undefined) {
      whereConditions.push(`eu.activo = $${paramIndex}`);
      queryParams.push(activo === 'true');
      paramIndex++;
    }

    const result = await query(`
      SELECT 
        eu.id,
        eu.origen,
        eu.origen_id,
        eu.nombre,
        eu.descripcion,
        eu.activo,
        eu.created_at
      FROM mantenimiento.estado_unificado eu
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY eu.origen_id, eu.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Contar total para este origen
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM mantenimiento.estado_unificado eu
      WHERE ${whereConditions.join(' AND ')}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      message: `Estados unificados para origen ${origen} obtenidos exitosamente`,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener estados por origen:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estados por origen',
      message: error.message
    });
  }
});

// GET /origen/:origen/:origen_id - Obtener estado unificado específico por origen e ID
router.get('/origen/:origen/:origen_id', async (req, res) => {
  try {
    const { origen, origen_id } = req.params;

    const result = await query(`
      SELECT 
        eu.id,
        eu.origen,
        eu.origen_id,
        eu.nombre,
        eu.descripcion,
        eu.activo,
        eu.created_at
      FROM mantenimiento.estado_unificado eu
      WHERE eu.origen = $1 AND eu.origen_id = $2
    `, [origen, origen_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estado unificado no encontrado',
        message: `No existe un estado unificado para origen ${origen} con ID ${origen_id}`
      });
    }

    res.json({
      success: true,
      message: 'Estado unificado obtenido exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener estado unificado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado unificado',
      message: error.message
    });
  }
});

// POST / - Crear nuevo estado unificado
router.post('/', async (req, res) => {
  try {
    const { 
      origen, 
      origen_id, 
      nombre, 
      descripcion, 
      activo = true 
    } = req.body;

    // Validaciones
    if (!origen || !origen_id || !nombre) {
      return res.status(400).json({
        success: false,
        error: 'Datos requeridos faltantes',
        message: 'origen, origen_id y nombre son obligatorios'
      });
    }

    // Validar origen válido
    const origenesValidos = [
      'personal', 'cursos', 'documentos', 'servicio', 'carteras', 
      'ingenieria_servicios', 'nodos', 'servicios_programados'
    ];

    if (!origenesValidos.includes(origen)) {
      return res.status(400).json({
        success: false,
        error: 'Origen inválido',
        message: `Origen debe ser uno de: ${origenesValidos.join(', ')}`
      });
    }

    // Crear el nuevo estado unificado
    const result = await query(`
      INSERT INTO mantenimiento.estado_unificado 
      (origen, origen_id, nombre, descripcion, activo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [origen, origen_id, nombre, descripcion, activo]);

    res.status(201).json({
      success: true,
      message: 'Estado unificado creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear estado unificado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear estado unificado',
      message: error.message
    });
  }
});

// PUT /:id - Actualizar estado unificado
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      activo 
    } = req.body;

    // Verificar que el estado unificado existe
    const estadoCheck = await query(
      'SELECT id FROM mantenimiento.estado_unificado WHERE id = $1',
      [id]
    );

    if (estadoCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estado unificado no encontrado',
        message: `No existe un estado unificado con ID ${id}`
      });
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex}`);
      values.push(nombre);
      paramIndex++;
    }

    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramIndex}`);
      values.push(descripcion);
      paramIndex++;
    }

    if (activo !== undefined) {
      updates.push(`activo = $${paramIndex}`);
      values.push(activo);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay datos para actualizar',
        message: 'Debe proporcionar al menos un campo para actualizar'
      });
    }

    values.push(id);

    const result = await query(`
      UPDATE mantenimiento.estado_unificado 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    res.json({
      success: true,
      message: 'Estado unificado actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado unificado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado unificado',
      message: error.message
    });
  }
});

// DELETE /:id - Eliminar estado unificado
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM mantenimiento.estado_unificado WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estado unificado no encontrado',
        message: `No existe un estado unificado con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Estado unificado eliminado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar estado unificado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar estado unificado',
      message: error.message
    });
  }
});

// GET /stats - Estadísticas de estados unificados
router.get('/stats', async (req, res) => {
  try {
    const { origen, activo } = req.query;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramIndex = 1;

    if (origen) {
      whereConditions.push(`eu.origen = $${paramIndex}`);
      queryParams.push(origen);
      paramIndex++;
    }

    if (activo !== undefined) {
      whereConditions.push(`eu.activo = $${paramIndex}`);
      queryParams.push(activo === 'true');
      paramIndex++;
    }

    // Estadísticas generales
    const generalStats = await query(`
      SELECT 
        COUNT(*) as total_estados,
        COUNT(DISTINCT eu.origen) as origenes_unicos,
        COUNT(DISTINCT eu.origen_id) as entidades_unicas,
        COUNT(CASE WHEN eu.activo THEN 1 END) as estados_activos
      FROM mantenimiento.estado_unificado eu
      WHERE ${whereConditions.join(' AND ')}
    `, queryParams);

    // Estadísticas por origen
    const origenesStats = await query(`
      SELECT 
        eu.origen,
        COUNT(*) as total_estados,
        COUNT(CASE WHEN eu.activo THEN 1 END) as estados_activos,
        COUNT(DISTINCT eu.origen_id) as entidades_unicas
      FROM mantenimiento.estado_unificado eu
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY eu.origen
      ORDER BY total_estados DESC
    `, queryParams);

    // Estados más comunes
    const estadosComunes = await query(`
      SELECT 
        eu.nombre,
        COUNT(*) as cantidad,
        COUNT(DISTINCT eu.origen) as origenes_diferentes
      FROM mantenimiento.estado_unificado eu
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY eu.nombre
      ORDER BY cantidad DESC
      LIMIT 10
    `, queryParams);

    res.json({
      success: true,
      message: 'Estadísticas de estados unificados obtenidas exitosamente',
      data: {
        general: generalStats.rows[0],
        por_origen: origenesStats.rows,
        estados_comunes: estadosComunes.rows
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

// GET /origenes - Listar orígenes disponibles
router.get('/origenes', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        eu.origen,
        COUNT(*) as total_estados,
        COUNT(CASE WHEN eu.activo THEN 1 END) as estados_activos,
        COUNT(DISTINCT eu.origen_id) as entidades_unicas,
        MIN(eu.created_at) as primer_estado,
        MAX(eu.created_at) as ultimo_estado
      FROM mantenimiento.estado_unificado eu
      GROUP BY eu.origen
      ORDER BY eu.origen
    `);

    res.json({
      success: true,
      message: 'Orígenes obtenidos exitosamente',
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener orígenes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener orígenes',
      message: error.message
    });
  }
});

module.exports = router;


