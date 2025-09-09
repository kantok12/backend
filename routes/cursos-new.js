const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

/**
 * RUTAS PARA CURSOS
 * Maneja la tabla mantenimiento.cursos
 * 
 * Estructura de la tabla:
 * - id: integer (PK, auto-increment)
 * - rut_persona: text (RUT del personal)
 * - nombre_curso: varchar (Nombre del curso)
 * - fecha_inicio: date (Fecha de inicio)
 * - fecha_fin: date (Fecha de finalización)
 * - estado: varchar (pendiente, en_progreso, completado, cancelado)
 * - institucion: varchar (Institución que impartió el curso)
 * - descripcion: text (Descripción adicional)
 * - fecha_creacion: timestamp
 * - fecha_actualizacion: timestamp
 * - activo: boolean
 */

// GET /api/cursos - Obtener todos los cursos
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, rut, curso, estado } = req.query;
    
    console.log('📋 GET /api/cursos - Obteniendo cursos');
    
    // Construir query con filtros opcionales
    let whereConditions = ['c.activo = true'];
    let queryParams = [];
    let paramIndex = 1;
    
    if (rut) {
      whereConditions.push(`c.rut_persona = $${paramIndex++}`);
      queryParams.push(rut);
    }
    
    if (curso) {
      whereConditions.push(`c.nombre_curso ILIKE $${paramIndex++}`);
      queryParams.push(`%${curso}%`);
    }
    
    if (estado) {
      whereConditions.push(`c.estado = $${paramIndex++}`);
      queryParams.push(estado);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Query principal con JOIN al personal_disponible
    const mainQuery = `
      SELECT 
        c.id,
        c.rut_persona,
        c.nombre_curso,
        c.fecha_inicio,
        c.fecha_fin,
        c.estado,
        c.institucion,
        c.descripcion,
        c.fecha_creacion,
        c.fecha_actualizacion,
        p.nombre as nombre_persona,
        p.cargo,
        p.zona_geografica
      FROM mantenimiento.cursos c
      LEFT JOIN mantenimiento.personal_disponible p ON c.rut_persona = p.rut
      ${whereClause}
      ORDER BY c.fecha_creacion DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await query(mainQuery, queryParams);
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantenimiento.cursos c
      LEFT JOIN mantenimiento.personal_disponible p ON c.rut_persona = p.rut
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    
    console.log(`✅ ${result.rows.length} cursos obtenidos`);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < parseInt(countResult.rows[0].total)
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo cursos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/cursos/persona/:rut - Obtener cursos de una persona específica
router.get('/persona/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    
    console.log(`📋 GET /api/cursos/persona/${rut} - Obteniendo cursos de persona`);
    
    const queryText = `
      SELECT 
        c.id,
        c.nombre_curso,
        c.fecha_inicio,
        c.fecha_fin,
        c.fecha_vencimiento,
        c.estado,
        c.institucion,
        c.descripcion,
        c.fecha_creacion,
        p.nombre as nombre_persona,
        p.cargo,
        p.zona_geografica,
        CASE 
          WHEN c.fecha_vencimiento IS NULL THEN 'sin_vencimiento'
          WHEN c.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
          WHEN c.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'por_vencer'
          ELSE 'vigente'
        END as estado_vencimiento
      FROM mantenimiento.cursos c
      LEFT JOIN mantenimiento.personal_disponible p ON c.rut_persona = p.rut
      WHERE c.rut_persona = $1 AND c.activo = true
      ORDER BY c.fecha_creacion DESC
    `;
    
    const result = await query(queryText, [rut]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontraron cursos para el RUT: ${rut}`
      });
    }
    
    console.log(`✅ ${result.rows.length} cursos encontrados para RUT: ${rut}`);
    
    res.json({
      success: true,
      data: {
        persona: {
          rut: rut,
          nombre: result.rows[0].nombre_persona,
          cargo: result.rows[0].cargo,
          zona_geografica: result.rows[0].zona_geografica
        },
        cursos: result.rows.map(row => ({
          id: row.id,
          nombre_curso: row.nombre_curso,
          fecha_inicio: row.fecha_inicio,
          fecha_fin: row.fecha_fin,
          fecha_vencimiento: row.fecha_vencimiento,
          estado: row.estado,
          estado_vencimiento: row.estado_vencimiento,
          institucion: row.institucion,
          descripcion: row.descripcion,
          fecha_creacion: row.fecha_creacion
        }))
      }
    });
    
  } catch (error) {
    console.error(`❌ Error obteniendo cursos para RUT ${req.params.rut}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/cursos - Crear nuevo curso
router.post('/', async (req, res) => {
  try {
    const { 
      rut_persona, 
      nombre_curso, 
      fecha_inicio, 
      fecha_fin, 
      fecha_vencimiento,
      estado = 'completado',
      institucion,
      descripcion 
    } = req.body;
    
    console.log('📝 POST /api/cursos - Creando nuevo curso');
    
    // Validaciones
    if (!rut_persona || !nombre_curso) {
      return res.status(400).json({
        success: false,
        message: 'RUT y nombre del curso son requeridos'
      });
    }
    
    // Verificar que la persona existe
    const checkPersonQuery = `
      SELECT rut, nombre FROM mantenimiento.personal_disponible WHERE rut = $1
    `;
    
    const personExists = await query(checkPersonQuery, [rut_persona]);
    
    if (personExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró personal con RUT: ${rut_persona}`
      });
    }
    
    // Verificar que no existe el mismo curso para la misma persona
    const checkDuplicateQuery = `
      SELECT id FROM mantenimiento.cursos 
      WHERE rut_persona = $1 AND nombre_curso = $2 AND activo = true
    `;
    
    const duplicateResult = await query(checkDuplicateQuery, [rut_persona, nombre_curso]);
    
    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `La persona ya tiene un curso registrado: ${nombre_curso}`
      });
    }
    
    const insertQuery = `
      INSERT INTO mantenimiento.cursos (
        rut_persona, nombre_curso, fecha_inicio, fecha_fin, fecha_vencimiento,
        estado, institucion, descripcion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await query(insertQuery, [
      rut_persona,
      nombre_curso.trim(),
      fecha_inicio,
      fecha_fin,
      fecha_vencimiento,
      estado,
      institucion,
      descripcion
    ]);
    
    console.log(`✅ Nuevo curso creado para RUT: ${rut_persona}`);
    
    res.status(201).json({
      success: true,
      message: 'Curso creado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error creando curso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/cursos/:id - Actualizar curso
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre_curso, 
      fecha_inicio, 
      fecha_fin, 
      fecha_vencimiento,
      estado, 
      institucion, 
      descripcion 
    } = req.body;
    
    console.log(`📝 PUT /api/cursos/${id} - Actualizando curso`);
    
    // Verificar que el registro existe
    const checkExistsQuery = `
      SELECT id FROM mantenimiento.cursos WHERE id = $1 AND activo = true
    `;
    
    const existsResult = await query(checkExistsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró curso con ID: ${id}`
      });
    }
    
    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (nombre_curso) {
      updateFields.push(`nombre_curso = $${paramIndex++}`);
      updateValues.push(nombre_curso.trim());
    }
    
    if (fecha_inicio) {
      updateFields.push(`fecha_inicio = $${paramIndex++}`);
      updateValues.push(fecha_inicio);
    }
    
    if (fecha_fin) {
      updateFields.push(`fecha_fin = $${paramIndex++}`);
      updateValues.push(fecha_fin);
    }
    
    if (fecha_vencimiento !== undefined) {
      updateFields.push(`fecha_vencimiento = $${paramIndex++}`);
      updateValues.push(fecha_vencimiento);
    }
    
    if (estado) {
      updateFields.push(`estado = $${paramIndex++}`);
      updateValues.push(estado);
    }
    
    if (institucion !== undefined) {
      updateFields.push(`institucion = $${paramIndex++}`);
      updateValues.push(institucion);
    }
    
    if (descripcion !== undefined) {
      updateFields.push(`descripcion = $${paramIndex++}`);
      updateValues.push(descripcion);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar'
      });
    }
    
    // Agregar fecha_actualizacion
    updateFields.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
    updateValues.push(id); // Para el WHERE
    
    const updateQuery = `
      UPDATE mantenimiento.cursos 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await query(updateQuery, updateValues);
    
    console.log(`✅ Curso actualizado para ID: ${id}`);
    
    res.json({
      success: true,
      message: 'Curso actualizado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error(`❌ Error actualizando curso para ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/cursos/:id - Eliminar curso (eliminación lógica)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ DELETE /api/cursos/${id} - Eliminando curso`);
    
    // Verificar que el registro existe
    const checkExistsQuery = `
      SELECT id FROM mantenimiento.cursos WHERE id = $1 AND activo = true
    `;
    
    const existsResult = await query(checkExistsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró curso con ID: ${id}`
      });
    }
    
    // Eliminación lógica
    const deleteQuery = `
      UPDATE mantenimiento.cursos 
      SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(deleteQuery, [id]);
    
    console.log(`✅ Curso eliminado (lógico) para ID: ${id}`);
    
    res.json({
      success: true,
      message: 'Curso eliminado exitosamente',
      data: {
        id: result.rows[0].id,
        activo: false,
        fecha_eliminacion: result.rows[0].fecha_actualizacion
      }
    });
    
  } catch (error) {
    console.error(`❌ Error eliminando curso para ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/cursos/vencidos - Obtener cursos vencidos o por vencer
router.get('/vencidos', async (req, res) => {
  try {
    const { limit = 50, offset = 0, tipo = 'todos' } = req.query;
    
    console.log('📋 GET /api/cursos/vencidos - Obteniendo cursos vencidos/por vencer');
    
    // Construir condición según el tipo
    let whereCondition = '';
    switch (tipo) {
      case 'vencidos':
        whereCondition = 'AND c.fecha_vencimiento < CURRENT_DATE';
        break;
      case 'por_vencer':
        whereCondition = 'AND c.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL \'30 days\'';
        break;
      case 'vigentes':
        whereCondition = 'AND c.fecha_vencimiento > CURRENT_DATE + INTERVAL \'30 days\'';
        break;
      default: // 'todos'
        whereCondition = 'AND c.fecha_vencimiento IS NOT NULL';
    }
    
    const queryText = `
      SELECT 
        c.id,
        c.rut_persona,
        c.nombre_curso,
        c.fecha_inicio,
        c.fecha_fin,
        c.fecha_vencimiento,
        c.estado,
        c.institucion,
        c.descripcion,
        c.fecha_creacion,
        p.nombre as nombre_persona,
        p.cargo,
        p.zona_geografica,
        CASE 
          WHEN c.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
          WHEN c.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'por_vencer'
          ELSE 'vigente'
        END as estado_vencimiento,
        CASE 
          WHEN c.fecha_vencimiento < CURRENT_DATE THEN 
            EXTRACT(DAYS FROM CURRENT_DATE - c.fecha_vencimiento)::INTEGER
          WHEN c.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 
            EXTRACT(DAYS FROM c.fecha_vencimiento - CURRENT_DATE)::INTEGER
          ELSE NULL
        END as dias_restantes
      FROM mantenimiento.cursos c
      LEFT JOIN mantenimiento.personal_disponible p ON c.rut_persona = p.rut
      WHERE c.activo = true ${whereCondition}
      ORDER BY c.fecha_vencimiento ASC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await query(queryText, [parseInt(limit), parseInt(offset)]);
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantenimiento.cursos c
      LEFT JOIN mantenimiento.personal_disponible p ON c.rut_persona = p.rut
      WHERE c.activo = true ${whereCondition}
    `;
    
    const countResult = await query(countQuery);
    
    console.log(`✅ ${result.rows.length} cursos obtenidos (tipo: ${tipo})`);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < parseInt(countResult.rows[0].total)
      },
      filtro: {
        tipo: tipo,
        descripcion: {
          vencidos: 'Cursos que ya vencieron',
          por_vencer: 'Cursos que vencen en los próximos 30 días',
          vigentes: 'Cursos con más de 30 días de vigencia',
          todos: 'Todos los cursos con fecha de vencimiento'
        }[tipo]
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo cursos vencidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/cursos/alertas - Obtener alertas de vencimiento
router.get('/alertas', async (req, res) => {
  try {
    console.log('📋 GET /api/cursos/alertas - Obteniendo alertas de vencimiento');
    
    const queryText = `
      SELECT 
        COUNT(*) FILTER (WHERE c.fecha_vencimiento < CURRENT_DATE) as cursos_vencidos,
        COUNT(*) FILTER (WHERE c.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as cursos_por_vencer_7_dias,
        COUNT(*) FILTER (WHERE c.fecha_vencimiento BETWEEN CURRENT_DATE + INTERVAL '8 days' AND CURRENT_DATE + INTERVAL '30 days') as cursos_por_vencer_30_dias,
        COUNT(*) FILTER (WHERE c.fecha_vencimiento > CURRENT_DATE + INTERVAL '30 days') as cursos_vigentes
      FROM mantenimiento.cursos c
      WHERE c.activo = true AND c.fecha_vencimiento IS NOT NULL
    `;
    
    const result = await query(queryText);
    const stats = result.rows[0];
    
    const alertas = [];
    
    if (stats.cursos_vencidos > 0) {
      alertas.push({
        tipo: 'error',
        mensaje: `${stats.cursos_vencidos} curso(s) vencido(s)`,
        prioridad: 'alta',
        accion: 'Renovar inmediatamente'
      });
    }
    
    if (stats.cursos_por_vencer_7_dias > 0) {
      alertas.push({
        tipo: 'warning',
        mensaje: `${stats.cursos_por_vencer_7_dias} curso(s) vence(n) en los próximos 7 días`,
        prioridad: 'media',
        accion: 'Programar renovación'
      });
    }
    
    if (stats.cursos_por_vencer_30_dias > 0) {
      alertas.push({
        tipo: 'info',
        mensaje: `${stats.cursos_por_vencer_30_dias} curso(s) vence(n) en los próximos 30 días`,
        prioridad: 'baja',
        accion: 'Planificar renovación'
      });
    }
    
    console.log(`✅ Alertas generadas: ${alertas.length} alertas`);
    
    res.json({
      success: true,
      data: {
        estadisticas: {
          cursos_vencidos: parseInt(stats.cursos_vencidos),
          cursos_por_vencer_7_dias: parseInt(stats.cursos_por_vencer_7_dias),
          cursos_por_vencer_30_dias: parseInt(stats.cursos_por_vencer_30_dias),
          cursos_vigentes: parseInt(stats.cursos_vigentes)
        },
        alertas: alertas,
        fecha_consulta: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
