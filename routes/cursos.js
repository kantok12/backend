const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

/**
 * RUTAS PARA CURSOS Y CERTIFICACIONES
 * Maneja la tabla mantenimiento.cursos_certificaciones
 * 
 * Estructura de la tabla:
 * - id: integer (PK, auto-increment)
 * - rut_persona: text (RUT del personal)
 * - nombre_curso: varchar (Nombre del curso/certificación)
 * - fecha_obtencion: date (Fecha de obtención)
 */

// GET /api/cursos - Obtener todos los cursos/certificaciones
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, rut, curso } = req.query;
    
    console.log('📋 GET /api/cursos - Obteniendo cursos/certificaciones');
    
    // Construir query con filtros opcionales
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (rut) {
      whereConditions.push(`cc.rut_persona = $${paramIndex++}`);
      queryParams.push(rut);
    }
    
    if (curso) {
      whereConditions.push(`cc.nombre_curso ILIKE $${paramIndex++}`);
      queryParams.push(`%${curso}%`);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Query principal con JOIN al personal_disponible para obtener datos adicionales
    const getAllQuery = `
      SELECT 
        cc.id,
        cc.rut_persona,
        cc.nombre_curso,
        cc.fecha_obtencion,
        pd.nombre as nombre_persona,
        pd.cargo,
        pd.zona_geografica
      FROM mantenimiento.cursos_certificaciones cc
      LEFT JOIN mantenimiento.personal_disponible pd ON cc.rut_persona = pd.rut
      ${whereClause}
      ORDER BY cc.fecha_obtencion DESC, cc.nombre_curso
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await query(getAllQuery, queryParams);
    
    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantenimiento.cursos_certificaciones cc
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams.slice(0, -2)); // Remover limit y offset
    const total = parseInt(countResult.rows[0].total);
    
    console.log(`✅ Cursos obtenidos: ${result.rows.length} de ${total} total`);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: total,
        count: result.rows.length
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

// GET /api/cursos/stats - Estadísticas de cursos/certificaciones
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/cursos/stats - Obteniendo estadísticas');
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_certificaciones,
        COUNT(DISTINCT cc.rut_persona) as personas_certificadas,
        COUNT(DISTINCT cc.nombre_curso) as tipos_cursos,
        MIN(cc.fecha_obtencion) as fecha_primera_certificacion,
        MAX(cc.fecha_obtencion) as fecha_ultima_certificacion,
        
        -- Top 5 cursos más frecuentes
        (SELECT json_agg(curso_stats ORDER BY cantidad DESC)
         FROM (
           SELECT 
             nombre_curso,
             COUNT(*) as cantidad
           FROM mantenimiento.cursos_certificaciones
           GROUP BY nombre_curso
           ORDER BY COUNT(*) DESC
           LIMIT 5
         ) curso_stats) as cursos_populares,
         
        -- Certificaciones por año
        (SELECT json_agg(year_stats ORDER BY año DESC)
         FROM (
           SELECT 
             EXTRACT(YEAR FROM fecha_obtencion) as año,
             COUNT(*) as certificaciones
           FROM mantenimiento.cursos_certificaciones
           GROUP BY EXTRACT(YEAR FROM fecha_obtencion)
           ORDER BY año DESC
           LIMIT 5
         ) year_stats) as certificaciones_por_año
      
      FROM mantenimiento.cursos_certificaciones cc
    `;
    
    const result = await query(statsQuery);
    const stats = result.rows[0];
    
    const response = {
      success: true,
      data: {
        total_certificaciones: parseInt(stats.total_certificaciones),
        personas_certificadas: parseInt(stats.personas_certificadas),
        tipos_cursos: parseInt(stats.tipos_cursos),
        rango_fechas: {
          primera_certificacion: stats.fecha_primera_certificacion,
          ultima_certificacion: stats.fecha_ultima_certificacion
        },
        cursos_populares: stats.cursos_populares || [],
        certificaciones_por_año: stats.certificaciones_por_año || []
      }
    };
    
    console.log('✅ Estadísticas calculadas');
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
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
    
    console.log(`📋 GET /api/cursos/persona/${rut} - Obteniendo cursos por RUT`);
    
    const getByRutQuery = `
      SELECT 
        cc.id,
        cc.rut_persona,
        cc.nombre_curso,
        cc.fecha_obtencion,
        pd.nombre as nombre_persona,
        pd.cargo,
        pd.zona_geografica
      FROM mantenimiento.cursos_certificaciones cc
      LEFT JOIN mantenimiento.personal_disponible pd ON cc.rut_persona = pd.rut
      WHERE cc.rut_persona = $1
      ORDER BY cc.fecha_obtencion DESC, cc.nombre_curso
    `;
    
    const result = await query(getByRutQuery, [rut]);
    
    if (result.rows.length === 0) {
      console.log(`❌ No se encontraron cursos para RUT: ${rut}`);
      return res.status(404).json({
        success: false,
        message: `No se encontraron certificaciones para el RUT: ${rut}`
      });
    }
    
    console.log(`✅ Encontrados ${result.rows.length} cursos para RUT: ${rut}`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      persona: {
        rut: rut,
        nombre: result.rows[0].nombre_persona,
        cargo: result.rows[0].cargo
      }
    });
    
  } catch (error) {
    console.error(`❌ Error obteniendo cursos por RUT ${req.params.rut}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/cursos/:id - Obtener curso específico por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📋 GET /api/cursos/${id} - Obteniendo curso por ID`);
    
    const getByIdQuery = `
      SELECT 
        cc.id,
        cc.rut_persona,
        cc.nombre_curso,
        cc.fecha_obtencion,
        pd.nombre as nombre_persona,
        pd.cargo,
        pd.zona_geografica,
        pd.sexo,
        pd.fecha_nacimiento
      FROM mantenimiento.cursos_certificaciones cc
      LEFT JOIN mantenimiento.personal_disponible pd ON cc.rut_persona = pd.rut
      WHERE cc.id = $1
    `;
    
    const result = await query(getByIdQuery, [id]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Curso no encontrado para ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: `No se encontró curso con ID: ${id}`
      });
    }
    
    console.log(`✅ Curso encontrado para ID: ${id}`);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error(`❌ Error obteniendo curso por ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/cursos - Crear nueva certificación
router.post('/', async (req, res) => {
  try {
    const { rut_persona, nombre_curso, fecha_obtencion } = req.body;
    
    console.log('📝 POST /api/cursos - Creando nueva certificación');
    
    // Validaciones
    if (!rut_persona || !nombre_curso || !fecha_obtencion) {
      return res.status(400).json({
        success: false,
        message: 'RUT, nombre del curso y fecha de obtención son requeridos'
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
    
    // Verificar que no existe la misma certificación
    const checkDuplicateQuery = `
      SELECT id FROM mantenimiento.cursos_certificaciones 
      WHERE rut_persona = $1 AND nombre_curso = $2
    `;
    
    const duplicateResult = await query(checkDuplicateQuery, [rut_persona, nombre_curso]);
    
    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `La persona ya tiene una certificación en: ${nombre_curso}`
      });
    }
    
    const insertQuery = `
      INSERT INTO mantenimiento.cursos_certificaciones (
        rut_persona, nombre_curso, fecha_obtencion
      ) VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await query(insertQuery, [
      rut_persona,
      nombre_curso.trim(),
      fecha_obtencion
    ]);
    
    console.log(`✅ Nueva certificación creada para RUT: ${rut_persona}`);
    
    res.status(201).json({
      success: true,
      message: 'Certificación creada exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error creando certificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/cursos/:id - Actualizar certificación
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_curso, fecha_obtencion } = req.body;
    
    console.log(`📝 PUT /api/cursos/${id} - Actualizando certificación`);
    
    // Verificar que el registro existe
    const checkExistsQuery = `
      SELECT id FROM mantenimiento.cursos_certificaciones WHERE id = $1
    `;
    
    const existsResult = await query(checkExistsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró certificación con ID: ${id}`
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
    
    if (fecha_obtencion) {
      updateFields.push(`fecha_obtencion = $${paramIndex++}`);
      updateValues.push(fecha_obtencion);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar'
      });
    }
    
    updateValues.push(id); // Para el WHERE
    
    const updateQuery = `
      UPDATE mantenimiento.cursos_certificaciones 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await query(updateQuery, updateValues);
    
    console.log(`✅ Certificación actualizada para ID: ${id}`);
    
    res.json({
      success: true,
      message: 'Certificación actualizada exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error(`❌ Error actualizando certificación para ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/cursos/:id - Eliminar certificación
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ DELETE /api/cursos/${id} - Eliminando certificación`);
    
    // Verificar que existe
    const checkExistsQuery = `
      SELECT id, rut_persona, nombre_curso FROM mantenimiento.cursos_certificaciones WHERE id = $1
    `;
    
    const existsResult = await query(checkExistsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró certificación con ID: ${id}`
      });
    }
    
    const deleteQuery = `
      DELETE FROM mantenimiento.cursos_certificaciones 
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(deleteQuery, [id]);
    
    console.log(`✅ Certificación eliminada para ID: ${id}`);
    
    res.json({
      success: true,
      message: 'Certificación eliminada exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error(`❌ Error eliminando certificación para ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;



