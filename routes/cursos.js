const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');
const { uploadMultiple, uploadSingle, handleUploadError, deleteFile, getFileInfo, fileExists } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

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
    
    // Query principal con JOIN al personal_disponible y conteo de documentos
    const getAllQuery = `
      SELECT 
        cc.id,
        cc.rut_persona,
        cc.nombre_curso,
        cc.fecha_obtencion,
        pd.nombre as nombre_persona,
        pd.cargo,
        pd.zona_geografica,
        COALESCE(doc_count.total_documentos, 0) as total_documentos
      FROM mantenimiento.cursos_certificaciones cc
      LEFT JOIN mantenimiento.personal_disponible pd ON cc.rut_persona = pd.rut
      LEFT JOIN (
        SELECT curso_id, COUNT(*) as total_documentos
        FROM mantenimiento.cursos_documentos
        WHERE activo = true
        GROUP BY curso_id
      ) doc_count ON cc.id = doc_count.curso_id
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

// ========================================
// ENDPOINTS PARA GESTIÓN DE DOCUMENTOS
// ========================================

// POST /api/cursos/:id/documentos - Subir documentos a un curso
router.post('/:id/documentos', uploadMultiple, handleUploadError, async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;
    const archivos = req.files;
    
    console.log(`📄 POST /api/cursos/${id}/documentos - Subiendo documentos`);
    
    // Verificar que el curso existe
    const checkCursoQuery = `
      SELECT id, rut_persona, nombre_curso FROM mantenimiento.cursos_certificaciones WHERE id = $1
    `;
    
    const cursoResult = await query(checkCursoQuery, [id]);
    
    if (cursoResult.rows.length === 0) {
      // Eliminar archivos subidos si el curso no existe
      if (archivos && archivos.length > 0) {
        archivos.forEach(archivo => {
          deleteFile(archivo.path);
        });
      }
      
      return res.status(404).json({
        success: false,
        message: `No se encontró curso con ID: ${id}`
      });
    }
    
    if (!archivos || archivos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron archivos para subir'
      });
    }
    
    const curso = cursoResult.rows[0];
    const documentosSubidos = [];
    
    // Procesar cada archivo
    for (const archivo of archivos) {
      const fileInfo = getFileInfo(archivo);
      
      const insertDocumentoQuery = `
        INSERT INTO mantenimiento.cursos_documentos (
          curso_id, nombre_archivo, nombre_original, tipo_mime, 
          tamaño_bytes, ruta_archivo, descripcion, subido_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const documentoResult = await query(insertDocumentoQuery, [
        id,
        fileInfo.nombre_archivo,
        fileInfo.nombre_original,
        fileInfo.tipo_mime,
        fileInfo.tamaño_bytes,
        fileInfo.ruta_archivo,
        descripcion || null,
        'sistema' // TODO: Obtener del usuario autenticado
      ]);
      
      documentosSubidos.push(documentoResult.rows[0]);
    }
    
    console.log(`✅ ${documentosSubidos.length} documentos subidos para curso ID: ${id}`);
    
    res.status(201).json({
      success: true,
      message: `${documentosSubidos.length} documento(s) subido(s) exitosamente`,
      data: {
        curso: curso,
        documentos: documentosSubidos
      }
    });
    
  } catch (error) {
    console.error(`❌ Error subiendo documentos para curso ${req.params.id}:`, error);
    
    // Limpiar archivos subidos en caso de error
    if (req.files && req.files.length > 0) {
      req.files.forEach(archivo => {
        deleteFile(archivo.path);
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/cursos/:id/documentos - Obtener documentos de un curso
router.get('/:id/documentos', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📄 GET /api/cursos/${id}/documentos - Obteniendo documentos`);
    
    // Verificar que el curso existe
    const checkCursoQuery = `
      SELECT id, rut_persona, nombre_curso FROM mantenimiento.cursos_certificaciones WHERE id = $1
    `;
    
    const cursoResult = await query(checkCursoQuery, [id]);
    
    if (cursoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró curso con ID: ${id}`
      });
    }
    
    // Obtener documentos del curso
    const getDocumentosQuery = `
      SELECT 
        cd.id,
        cd.nombre_archivo,
        cd.nombre_original,
        cd.tipo_mime,
        cd.tamaño_bytes,
        cd.descripcion,
        cd.fecha_subida,
        cd.subido_por,
        cd.activo
      FROM mantenimiento.cursos_documentos cd
      WHERE cd.curso_id = $1 AND cd.activo = true
      ORDER BY cd.fecha_subida DESC
    `;
    
    const documentosResult = await query(getDocumentosQuery, [id]);
    
    console.log(`✅ Encontrados ${documentosResult.rows.length} documentos para curso ID: ${id}`);
    
    res.json({
      success: true,
      data: {
        curso: cursoResult.rows[0],
        documentos: documentosResult.rows
      }
    });
    
  } catch (error) {
    console.error(`❌ Error obteniendo documentos para curso ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/cursos/documentos/:documentoId/descargar - Descargar un documento específico
router.get('/documentos/:documentoId/descargar', async (req, res) => {
  try {
    const { documentoId } = req.params;
    
    console.log(`📥 GET /api/cursos/documentos/${documentoId}/descargar - Descargando documento`);
    
    // Obtener información del documento
    const getDocumentoQuery = `
      SELECT 
        cd.id,
        cd.nombre_archivo,
        cd.nombre_original,
        cd.tipo_mime,
        cd.ruta_archivo,
        cd.curso_id,
        cc.nombre_curso,
        cc.rut_persona
      FROM mantenimiento.cursos_documentos cd
      JOIN mantenimiento.cursos_certificaciones cc ON cd.curso_id = cc.id
      WHERE cd.id = $1 AND cd.activo = true
    `;
    
    const documentoResult = await query(getDocumentoQuery, [documentoId]);
    
    if (documentoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró documento con ID: ${documentoId}`
      });
    }
    
    const documento = documentoResult.rows[0];
    
    // Verificar que el archivo existe en el sistema
    if (!fileExists(documento.ruta_archivo)) {
      return res.status(404).json({
        success: false,
        message: 'El archivo no existe en el sistema de archivos'
      });
    }
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', documento.tipo_mime);
    res.setHeader('Content-Disposition', `attachment; filename="${documento.nombre_original}"`);
    
    // Enviar archivo
    const fileStream = fs.createReadStream(documento.ruta_archivo);
    fileStream.pipe(res);
    
    console.log(`✅ Documento descargado: ${documento.nombre_original}`);
    
  } catch (error) {
    console.error(`❌ Error descargando documento ${req.params.documentoId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/cursos/documentos/:documentoId/vista - Ver documento en el navegador
router.get('/documentos/:documentoId/vista', async (req, res) => {
  try {
    const { documentoId } = req.params;
    
    console.log(`👁️ GET /api/cursos/documentos/${documentoId}/vista - Visualizando documento`);
    
    // Obtener información del documento
    const getDocumentoQuery = `
      SELECT 
        cd.id,
        cd.nombre_archivo,
        cd.nombre_original,
        cd.tipo_mime,
        cd.ruta_archivo
      FROM mantenimiento.cursos_documentos cd
      WHERE cd.id = $1 AND cd.activo = true
    `;
    
    const documentoResult = await query(getDocumentoQuery, [documentoId]);
    
    if (documentoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró documento con ID: ${documentoId}`
      });
    }
    
    const documento = documentoResult.rows[0];
    
    // Verificar que el archivo existe
    if (!fileExists(documento.ruta_archivo)) {
      return res.status(404).json({
        success: false,
        message: 'El archivo no existe en el sistema de archivos'
      });
    }
    
    // Solo permitir visualización de imágenes y PDFs
    const allowedViewMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (!allowedViewMimes.includes(documento.tipo_mime)) {
      return res.status(400).json({
        success: false,
        message: 'Este tipo de archivo no se puede visualizar en el navegador'
      });
    }
    
    // Configurar headers para visualización
    res.setHeader('Content-Type', documento.tipo_mime);
    res.setHeader('Content-Disposition', `inline; filename="${documento.nombre_original}"`);
    
    // Enviar archivo
    const fileStream = fs.createReadStream(documento.ruta_archivo);
    fileStream.pipe(res);
    
    console.log(`✅ Documento visualizado: ${documento.nombre_original}`);
    
  } catch (error) {
    console.error(`❌ Error visualizando documento ${req.params.documentoId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/cursos/documentos/:documentoId - Eliminar documento (eliminación lógica)
router.delete('/documentos/:documentoId', async (req, res) => {
  try {
    const { documentoId } = req.params;
    
    console.log(`🗑️ DELETE /api/cursos/documentos/${documentoId} - Eliminando documento`);
    
    // Verificar que el documento existe
    const checkDocumentoQuery = `
      SELECT id, nombre_archivo, ruta_archivo FROM mantenimiento.cursos_documentos 
      WHERE id = $1 AND activo = true
    `;
    
    const documentoResult = await query(checkDocumentoQuery, [documentoId]);
    
    if (documentoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró documento con ID: ${documentoId}`
      });
    }
    
    const documento = documentoResult.rows[0];
    
    // Eliminación lógica (marcar como inactivo)
    const deleteDocumentoQuery = `
      UPDATE mantenimiento.cursos_documentos 
      SET activo = false, fecha_subida = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const deleteResult = await query(deleteDocumentoQuery, [documentoId]);
    
    // Opcional: Eliminar archivo físico del sistema
    // deleteFile(documento.ruta_archivo);
    
    console.log(`✅ Documento eliminado (lógicamente): ${documento.nombre_archivo}`);
    
    res.json({
      success: true,
      message: 'Documento eliminado exitosamente',
      data: deleteResult.rows[0]
    });
    
  } catch (error) {
    console.error(`❌ Error eliminando documento ${req.params.documentoId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/cursos/documentos/:documentoId - Actualizar información del documento
router.put('/documentos/:documentoId', async (req, res) => {
  try {
    const { documentoId } = req.params;
    const { descripcion } = req.body;
    
    console.log(`📝 PUT /api/cursos/documentos/${documentoId} - Actualizando documento`);
    
    // Verificar que el documento existe
    const checkDocumentoQuery = `
      SELECT id FROM mantenimiento.cursos_documentos WHERE id = $1 AND activo = true
    `;
    
    const documentoResult = await query(checkDocumentoQuery, [documentoId]);
    
    if (documentoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró documento con ID: ${documentoId}`
      });
    }
    
    // Actualizar descripción
    const updateDocumentoQuery = `
      UPDATE mantenimiento.cursos_documentos 
      SET descripcion = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const updateResult = await query(updateDocumentoQuery, [descripcion, documentoId]);
    
    console.log(`✅ Documento actualizado: ID ${documentoId}`);
    
    res.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: updateResult.rows[0]
    });
    
  } catch (error) {
    console.error(`❌ Error actualizando documento ${req.params.documentoId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/cursos/persona/:rut/documentos - Obtener todos los documentos de una persona
router.get('/persona/:rut/documentos', async (req, res) => {
  try {
    const { rut } = req.params;
    const { limit = 50, offset = 0, tipo_documento, curso_id } = req.query;
    
    console.log(`📄 GET /api/cursos/persona/${rut}/documentos - Obteniendo documentos por RUT`);
    
    // Verificar que la persona existe
    const checkPersonQuery = `
      SELECT rut, nombre, cargo, zona_geografica 
      FROM mantenimiento.personal_disponible 
      WHERE rut = $1
    `;
    
    const personResult = await query(checkPersonQuery, [rut]);
    
    if (personResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró personal con RUT: ${rut}`
      });
    }
    
    const persona = personResult.rows[0];
    
    // Construir filtros para documentos
    let whereConditions = ['cc.rut_persona = $1', 'cd.activo = true'];
    let queryParams = [rut];
    let paramIndex = 2;
    
    if (curso_id) {
      whereConditions.push(`cc.id = $${paramIndex++}`);
      queryParams.push(curso_id);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // Query principal para obtener cursos con documentos
    const getDocumentosQuery = `
      SELECT 
        cc.id as curso_id,
        cc.nombre_curso,
        cc.fecha_obtencion,
        cd.id as documento_id,
        cd.nombre_archivo,
        cd.nombre_original,
        cd.tipo_mime,
        cd.tamaño_bytes,
        cd.descripcion,
        cd.fecha_subida,
        cd.subido_por
      FROM mantenimiento.cursos_certificaciones cc
      LEFT JOIN mantenimiento.cursos_documentos cd ON cc.id = cd.curso_id
      ${whereClause}
      ORDER BY cc.fecha_obtencion DESC, cd.fecha_subida DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await query(getDocumentosQuery, queryParams);
    
    // Agrupar documentos por curso
    const cursosMap = new Map();
    
    result.rows.forEach(row => {
      if (!cursosMap.has(row.curso_id)) {
        cursosMap.set(row.curso_id, {
          curso_id: row.curso_id,
          nombre_curso: row.nombre_curso,
          fecha_obtencion: row.fecha_obtencion,
          documentos: []
        });
      }
      
      if (row.documento_id) {
        cursosMap.get(row.curso_id).documentos.push({
          id: row.documento_id,
          nombre_archivo: row.nombre_archivo,
          nombre_original: row.nombre_original,
          tipo_mime: row.tipo_mime,
          tamaño_bytes: row.tamaño_bytes,
          descripcion: row.descripcion,
          fecha_subida: row.fecha_subida,
          subido_por: row.subido_por
        });
      }
    });
    
    const cursos = Array.from(cursosMap.values());
    
    // Calcular resumen
    const totalDocumentos = cursos.reduce((sum, curso) => sum + curso.documentos.length, 0);
    const tiposDocumentos = [...new Set(
      cursos.flatMap(curso => 
        curso.documentos.map(doc => doc.tipo_mime)
      )
    )];
    
    console.log(`✅ Encontrados ${cursos.length} cursos con ${totalDocumentos} documentos para RUT: ${rut}`);
    
    res.json({
      success: true,
      data: {
        persona: persona,
        cursos: cursos,
        resumen: {
          total_cursos: cursos.length,
          total_documentos: totalDocumentos,
          tipos_documentos: tiposDocumentos
        }
      },
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalDocumentos
      }
    });
    
  } catch (error) {
    console.error(`❌ Error obteniendo documentos por RUT ${req.params.rut}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/cursos/persona/:rut/documentos - Subir documentos usando RUT y nombre del curso
router.post('/persona/:rut/documentos', uploadMultiple, handleUploadError, async (req, res) => {
  try {
    const { rut } = req.params;
    const { nombre_curso, descripcion } = req.body;
    const archivos = req.files;
    
    console.log(`📄 POST /api/cursos/persona/${rut}/documentos - Subiendo documentos por RUT`);
    console.log('🔍 Datos recibidos:', { rut, nombre_curso, descripcion, archivos: archivos?.length || 0 });
    
    // Validaciones
    if (!nombre_curso) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del curso es requerido'
      });
    }
    
    if (!archivos || archivos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron archivos para subir'
      });
    }
    
    // Verificar que la persona existe
    const checkPersonQuery = `
      SELECT rut, nombre, cargo, zona_geografica 
      FROM mantenimiento.personal_disponible 
      WHERE rut = $1
    `;
    
    const personResult = await query(checkPersonQuery, [rut]);
    
    if (personResult.rows.length === 0) {
      // Eliminar archivos subidos si la persona no existe
      if (archivos && archivos.length > 0) {
        archivos.forEach(archivo => {
          deleteFile(archivo.path);
        });
      }
      
      return res.status(404).json({
        success: false,
        message: `No se encontró personal con RUT: ${rut}`
      });
    }
    
    const persona = personResult.rows[0];
    
    // Buscar el curso específico de la persona
    const checkCursoQuery = `
      SELECT id, rut_persona, nombre_curso, fecha_obtencion
      FROM mantenimiento.cursos_certificaciones 
      WHERE rut_persona = $1 AND nombre_curso = $2
    `;
    
    const cursoResult = await query(checkCursoQuery, [rut, nombre_curso]);
    
    if (cursoResult.rows.length === 0) {
      // Eliminar archivos subidos si el curso no existe
      if (archivos && archivos.length > 0) {
        archivos.forEach(archivo => {
          deleteFile(archivo.path);
        });
      }
      
      return res.status(404).json({
        success: false,
        message: `No se encontró el curso "${nombre_curso}" para el RUT: ${rut}`,
        sugerencia: "Primero debe crear el curso usando POST /api/cursos"
      });
    }
    
    const curso = cursoResult.rows[0];
    const documentosSubidos = [];
    
    // Procesar cada archivo
    for (const archivo of archivos) {
      const fileInfo = getFileInfo(archivo);
      
      const insertDocumentoQuery = `
        INSERT INTO mantenimiento.cursos_documentos (
          curso_id, nombre_archivo, nombre_original, tipo_mime, 
          tamaño_bytes, ruta_archivo, descripcion, subido_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const documentoResult = await query(insertDocumentoQuery, [
        curso.id,
        fileInfo.nombre_archivo,
        fileInfo.nombre_original,
        fileInfo.tipo_mime,
        fileInfo.tamaño_bytes,
        fileInfo.ruta_archivo,
        descripcion || null,
        'sistema' // TODO: Obtener del usuario autenticado
      ]);
      
      documentosSubidos.push(documentoResult.rows[0]);
    }
    
    console.log(`✅ ${documentosSubidos.length} documentos subidos para ${persona.nombre} - Curso: ${nombre_curso}`);
    
    res.status(201).json({
      success: true,
      message: `${documentosSubidos.length} documento(s) subido(s) exitosamente`,
      data: {
        persona: persona,
        curso: curso,
        documentos: documentosSubidos
      }
    });
    
  } catch (error) {
    console.error(`❌ Error subiendo documentos por RUT ${req.params.rut}:`, error);
    
    // Limpiar archivos subidos en caso de error
    if (req.files && req.files.length > 0) {
      req.files.forEach(archivo => {
        deleteFile(archivo.path);
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;












