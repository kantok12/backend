const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET / - Listar historial de estados del personal
router.get('/', async (req, res) => {
  try {
    const { 
      rut, 
      estado_id, 
      activo, 
      desde, 
      hasta, 
      limit = 50, 
      offset = 0,
      search 
    } = req.query;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramIndex = 1;

    // Filtros
    if (rut) {
      whereConditions.push(`pe.rut = $${paramIndex}`);
      queryParams.push(rut);
      paramIndex++;
    }

    if (estado_id) {
      whereConditions.push(`pe.estado_id = $${paramIndex}`);
      queryParams.push(estado_id);
      paramIndex++;
    }

    if (activo !== undefined) {
      whereConditions.push(`pe.activo = $${paramIndex}`);
      queryParams.push(activo === 'true');
      paramIndex++;
    }

    if (desde) {
      whereConditions.push(`pe.desde >= $${paramIndex}`);
      queryParams.push(desde);
      paramIndex++;
    }

    if (hasta) {
      whereConditions.push(`pe.hasta <= $${paramIndex}`);
      queryParams.push(hasta);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(pe.comentario ILIKE $${paramIndex} OR pe.cargo ILIKE $${paramIndex} OR pd.nombre ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Query principal
    const mainQuery = `
      SELECT 
        pe.id,
        pe.rut,
        pd.nombre as nombre_persona,
        pe.estado_id,
        e.nombre as estado_nombre,
        e.descripcion as estado_descripcion,
        pe.cargo,
        pe.activo,
        pe.comentario,
        pe.desde,
        pe.hasta,
        pe.created_at
      FROM mantenimiento.personal_estados pe
      LEFT JOIN mantenimiento.personal_disponible pd ON pe.rut = pd.rut
      LEFT JOIN mantenimiento.estados e ON pe.estado_id = e.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY pe.desde DESC, pe.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(mainQuery, queryParams);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantenimiento.personal_estados pe
      LEFT JOIN mantenimiento.personal_disponible pd ON pe.rut = pd.rut
      WHERE ${whereConditions.join(' AND ')}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      message: 'Historial de estados obtenido exitosamente',
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener historial de estados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial de estados',
      message: error.message
    });
  }
});

// GET /:id - Obtener estado específico por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        pe.id,
        pe.rut,
        pd.nombre as nombre_persona,
        pe.estado_id,
        e.nombre as estado_nombre,
        e.descripcion as estado_descripcion,
        pe.cargo,
        pe.activo,
        pe.comentario,
        pe.desde,
        pe.hasta,
        pe.created_at
      FROM mantenimiento.personal_estados pe
      LEFT JOIN mantenimiento.personal_disponible pd ON pe.rut = pd.rut
      LEFT JOIN mantenimiento.estados e ON pe.estado_id = e.id
      WHERE pe.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estado no encontrado',
        message: `No existe un estado con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Estado obtenido exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado',
      message: error.message
    });
  }
});

// GET /persona/:rut - Obtener historial de estados de una persona específica
router.get('/persona/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const { activo, limit = 50, offset = 0 } = req.query;

    let whereConditions = ['pe.rut = $1'];
    let queryParams = [rut];
    let paramIndex = 2;

    if (activo !== undefined) {
      whereConditions.push(`pe.activo = $${paramIndex}`);
      queryParams.push(activo === 'true');
      paramIndex++;
    }

    const result = await query(`
      SELECT 
        pe.id,
        pe.rut,
        pd.nombre as nombre_persona,
        pe.estado_id,
        e.nombre as estado_nombre,
        e.descripcion as estado_descripcion,
        pe.cargo,
        pe.activo,
        pe.comentario,
        pe.desde,
        pe.hasta,
        pe.created_at
      FROM mantenimiento.personal_estados pe
      LEFT JOIN mantenimiento.personal_disponible pd ON pe.rut = pd.rut
      LEFT JOIN mantenimiento.estados e ON pe.estado_id = e.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY pe.desde DESC, pe.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Contar total para esta persona
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM mantenimiento.personal_estados pe
      WHERE ${whereConditions.join(' AND ')}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      message: `Historial de estados para ${rut} obtenido exitosamente`,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener historial de persona:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial de persona',
      message: error.message
    });
  }
});

// POST / - Crear nuevo estado en el historial
router.post('/', async (req, res) => {
  try {
    const { 
      rut, 
      estado_id, 
      cargo, 
      activo = true, 
      comentario, 
      desde = new Date().toISOString(),
      hasta 
    } = req.body;

    // Validaciones
    if (!rut || !estado_id) {
      return res.status(400).json({
        success: false,
        error: 'Datos requeridos faltantes',
        message: 'RUT y estado_id son obligatorios'
      });
    }

    // Verificar que la persona existe
    const personaCheck = await query(
      'SELECT rut FROM mantenimiento.personal_disponible WHERE rut = $1',
      [rut]
    );

    if (personaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Persona no encontrada',
        message: `No existe una persona con RUT ${rut}`
      });
    }

    // Verificar que el estado existe
    const estadoCheck = await query(
      'SELECT id FROM mantenimiento.estados WHERE id = $1',
      [estado_id]
    );

    if (estadoCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estado no encontrado',
        message: `No existe un estado con ID ${estado_id}`
      });
    }

    // Crear el nuevo estado
    const result = await query(`
      INSERT INTO mantenimiento.personal_estados 
      (rut, estado_id, cargo, activo, comentario, desde, hasta)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [rut, estado_id, cargo, activo, comentario, desde, hasta]);

    res.status(201).json({
      success: true,
      message: 'Estado creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear estado',
      message: error.message
    });
  }
});

// PUT /:id - Actualizar estado del historial
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      estado_id, 
      cargo, 
      activo, 
      comentario, 
      desde, 
      hasta 
    } = req.body;

    // Verificar que el estado existe
    const estadoCheck = await query(
      'SELECT id FROM mantenimiento.personal_estados WHERE id = $1',
      [id]
    );

    if (estadoCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estado no encontrado',
        message: `No existe un estado con ID ${id}`
      });
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (estado_id !== undefined) {
      updates.push(`estado_id = $${paramIndex}`);
      values.push(estado_id);
      paramIndex++;
    }

    if (cargo !== undefined) {
      updates.push(`cargo = $${paramIndex}`);
      values.push(cargo);
      paramIndex++;
    }

    if (activo !== undefined) {
      updates.push(`activo = $${paramIndex}`);
      values.push(activo);
      paramIndex++;
    }

    if (comentario !== undefined) {
      updates.push(`comentario = $${paramIndex}`);
      values.push(comentario);
      paramIndex++;
    }

    if (desde !== undefined) {
      updates.push(`desde = $${paramIndex}`);
      values.push(desde);
      paramIndex++;
    }

    if (hasta !== undefined) {
      updates.push(`hasta = $${paramIndex}`);
      values.push(hasta);
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
      UPDATE mantenimiento.personal_estados 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado',
      message: error.message
    });
  }
});

// DELETE /:id - Eliminar estado del historial
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM mantenimiento.personal_estados WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estado no encontrado',
        message: `No existe un estado con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Estado eliminado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar estado',
      message: error.message
    });
  }
});

// GET /stats - Estadísticas del historial de estados
router.get('/stats', async (req, res) => {
  try {
    const { rut, estado_id, desde, hasta } = req.query;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramIndex = 1;

    if (rut) {
      whereConditions.push(`pe.rut = $${paramIndex}`);
      queryParams.push(rut);
      paramIndex++;
    }

    if (estado_id) {
      whereConditions.push(`pe.estado_id = $${paramIndex}`);
      queryParams.push(estado_id);
      paramIndex++;
    }

    if (desde) {
      whereConditions.push(`pe.desde >= $${paramIndex}`);
      queryParams.push(desde);
      paramIndex++;
    }

    if (hasta) {
      whereConditions.push(`pe.hasta <= $${paramIndex}`);
      queryParams.push(hasta);
      paramIndex++;
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_estados,
        COUNT(DISTINCT pe.rut) as personas_unicas,
        COUNT(CASE WHEN pe.activo THEN 1 END) as estados_activos,
        COUNT(CASE WHEN pe.hasta IS NULL THEN 1 END) as estados_actuales,
        COUNT(CASE WHEN pe.hasta IS NOT NULL THEN 1 END) as estados_historicos,
        e.nombre as estado_mas_comun,
        COUNT(*) as cantidad_estado_mas_comun
      FROM mantenimiento.personal_estados pe
      LEFT JOIN mantenimiento.estados e ON pe.estado_id = e.id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY e.nombre
      ORDER BY cantidad_estado_mas_comun DESC
      LIMIT 1
    `;

    const result = await query(statsQuery, queryParams);

    // Estadísticas generales
    const generalStats = await query(`
      SELECT 
        COUNT(*) as total_estados,
        COUNT(DISTINCT pe.rut) as personas_unicas,
        COUNT(CASE WHEN pe.activo THEN 1 END) as estados_activos,
        COUNT(CASE WHEN pe.hasta IS NULL THEN 1 END) as estados_actuales,
        COUNT(CASE WHEN pe.hasta IS NOT NULL THEN 1 END) as estados_historicos
      FROM mantenimiento.personal_estados pe
      WHERE ${whereConditions.join(' AND ')}
    `, queryParams);

    // Estadísticas por estado
    const estadosStats = await query(`
      SELECT 
        e.id,
        e.nombre as estado_nombre,
        e.descripcion,
        COUNT(pe.id) as cantidad,
        COUNT(CASE WHEN pe.activo THEN 1 END) as activos,
        COUNT(CASE WHEN pe.hasta IS NULL THEN 1 END) as actuales
      FROM mantenimiento.estados e
      LEFT JOIN mantenimiento.personal_estados pe ON e.id = pe.estado_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY e.id, e.nombre, e.descripcion
      ORDER BY cantidad DESC
    `, queryParams);

    res.json({
      success: true,
      message: 'Estadísticas del historial de estados obtenidas exitosamente',
      data: {
        general: generalStats.rows[0],
        estado_mas_comun: result.rows[0] || null,
        por_estado: estadosStats.rows
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


