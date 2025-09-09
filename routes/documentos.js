const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');
const { uploadMultiple, uploadSingle, handleUploadError, deleteFile, getFileInfo, fileExists } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

/**
 * RUTAS PARA DOCUMENTOS
 * Maneja la tabla mantenimiento.documentos
 * 
 * Estructura de la tabla:
 * - id: integer (PK, auto-increment)
 * - rut_persona: text (RUT del personal)
 * - nombre_documento: varchar (Nombre descriptivo del documento)
 * - tipo_documento: varchar (certificado_curso, diploma, certificado_laboral, etc.)
 * - nombre_archivo: varchar (Nombre del archivo en el sistema)
 * - nombre_original: varchar (Nombre original del archivo)
 * - tipo_mime: varchar (Tipo MIME del archivo)
 * - tamaño_bytes: bigint (Tamaño en bytes)
 * - ruta_archivo: text (Ruta completa del archivo)
 * - descripcion: text (Descripción opcional)
 * - fecha_subida: timestamp
 * - subido_por: varchar (Usuario que subió)
 * - activo: boolean
 */

// GET /api/documentos - Obtener todos los documentos
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, rut, tipo_documento } = req.query;
    
    console.log('📋 GET /api/documentos - Obteniendo documentos');
    
    // Construir query con filtros opcionales
    let whereConditions = ['d.activo = true'];
    let queryParams = [];
    let paramIndex = 1;
    
    if (rut) {
      whereConditions.push(`d.rut_persona = $${paramIndex++}`);
      queryParams.push(rut);
    }
    
    if (tipo_documento) {
      whereConditions.push(`d.tipo_documento = $${paramIndex++}`);
      queryParams.push(tipo_documento);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Query principal con JOIN al personal_disponible
    const mainQuery = `
      SELECT 
        d.id,
        d.rut_persona,
        d.nombre_documento,
        d.tipo_documento,
        d.nombre_archivo,
        d.nombre_original,
        d.tipo_mime,
        d.tamaño_bytes,
        d.descripcion,
        d.fecha_subida,
        d.subido_por,
        p.nombre as nombre_persona,
        p.cargo,
        p.zona_geografica
      FROM mantenimiento.documentos d
      LEFT JOIN mantenimiento.personal_disponible p ON d.rut_persona = p.rut
      ${whereClause}
      ORDER BY d.fecha_subida DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await query(mainQuery, queryParams);
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantenimiento.documentos d
      LEFT JOIN mantenimiento.personal_disponible p ON d.rut_persona = p.rut
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    
    console.log(`✅ ${result.rows.length} documentos obtenidos`);
    
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
    console.error('❌ Error obteniendo documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/documentos/persona/:rut - Obtener documentos de una persona específica
router.get('/persona/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    
    console.log(`📋 GET /api/documentos/persona/${rut} - Obteniendo documentos de persona`);
    
    const query = `
      SELECT 
        d.id,
        d.nombre_documento,
        d.tipo_documento,
        d.nombre_original,
        d.tipo_mime,
        d.tamaño_bytes,
        d.descripcion,
        d.fecha_subida,
        p.nombre as nombre_persona,
        p.cargo,
        p.zona_geografica
      FROM mantenimiento.documentos d
      LEFT JOIN mantenimiento.personal_disponible p ON d.rut_persona = p.rut
      WHERE d.rut_persona = $1 AND d.activo = true
      ORDER BY d.fecha_subida DESC
    `;
    
    const result = await query(query, [rut]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontraron documentos para el RUT: ${rut}`
      });
    }
    
    console.log(`✅ ${result.rows.length} documentos encontrados para RUT: ${rut}`);
    
    res.json({
      success: true,
      data: {
        persona: {
          rut: rut,
          nombre: result.rows[0].nombre_persona,
          cargo: result.rows[0].cargo,
          zona_geografica: result.rows[0].zona_geografica
        },
        documentos: result.rows.map(row => ({
          id: row.id,
          nombre_documento: row.nombre_documento,
          tipo_documento: row.tipo_documento,
          nombre_original: row.nombre_original,
          tipo_mime: row.tipo_mime,
          tamaño_bytes: row.tamaño_bytes,
          descripcion: row.descripcion,
          fecha_subida: row.fecha_subida
        }))
      }
    });
    
  } catch (error) {
    console.error(`❌ Error obteniendo documentos para RUT ${req.params.rut}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/documentos/persona/:rut - Subir documentos para una persona
router.post('/persona/:rut', uploadMultiple, handleUploadError, async (req, res) => {
  try {
    const { rut } = req.params;
    const { nombre_documento, tipo_documento, descripcion } = req.body;
    
    console.log(`📤 POST /api/documentos/persona/${rut} - Subiendo documentos`);
    
    // Verificar que la persona existe
    const checkPersonQuery = `
      SELECT rut, nombre FROM mantenimiento.personal_disponible WHERE rut = $1
    `;
    
    const personExists = await query(checkPersonQuery, [rut]);
    
    if (personExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró personal con RUT: ${rut}`
      });
    }
    
    // Validar que se subieron archivos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se subieron archivos'
      });
    }
    
    // Validar campos requeridos
    if (!nombre_documento || !tipo_documento) {
      return res.status(400).json({
        success: false,
        message: 'nombre_documento y tipo_documento son requeridos'
      });
    }
    
    const documentosSubidos = [];
    
    // Procesar cada archivo
    for (const file of req.files) {
      const fileInfo = getFileInfo(file);
      
      const insertQuery = `
        INSERT INTO mantenimiento.documentos (
          rut_persona, nombre_documento, tipo_documento,
          nombre_archivo, nombre_original, tipo_mime, tamaño_bytes,
          ruta_archivo, descripcion, subido_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        rut,
        nombre_documento,
        tipo_documento,
        fileInfo.nombre_archivo,
        fileInfo.nombre_original,
        fileInfo.tipo_mime,
        fileInfo.tamaño_bytes,
        fileInfo.ruta_archivo,
        descripcion || null,
        'sistema'
      ];
      
      const result = await query(insertQuery, values);
      documentosSubidos.push(result.rows[0]);
    }
    
    console.log(`✅ ${documentosSubidos.length} documento(s) subido(s) para RUT: ${rut}`);
    
    res.status(201).json({
      success: true,
      message: `${documentosSubidos.length} documento(s) subido(s) exitosamente`,
      data: {
        persona: {
          rut: rut,
          nombre: personExists.rows[0].nombre
        },
        documentos: documentosSubidos
      }
    });
    
  } catch (error) {
    console.error(`❌ Error subiendo documentos para RUT ${req.params.rut}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/documentos/:id/descargar - Descargar documento específico
router.get('/:id/descargar', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 GET /api/documentos/${id}/descargar - Descargando documento`);
    
    const query = `
      SELECT nombre_archivo, nombre_original, ruta_archivo, tipo_mime
      FROM mantenimiento.documentos 
      WHERE id = $1 AND activo = true
    `;
    
    const result = await query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    const documento = result.rows[0];
    
    // Verificar que el archivo existe
    if (!fileExists(documento.ruta_archivo)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el servidor'
      });
    }
    
    // Configurar headers para descarga
    res.setHeader('Content-Disposition', `attachment; filename="${documento.nombre_original}"`);
    res.setHeader('Content-Type', documento.tipo_mime);
    
    // Enviar archivo
    res.sendFile(path.resolve(documento.ruta_archivo));
    
    console.log(`✅ Documento descargado: ${documento.nombre_original}`);
    
  } catch (error) {
    console.error(`❌ Error descargando documento ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/documentos/:id/vista - Ver documento en el navegador
router.get('/:id/vista', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`👁️ GET /api/documentos/${id}/vista - Visualizando documento`);
    
    const query = `
      SELECT nombre_archivo, nombre_original, ruta_archivo, tipo_mime
      FROM mantenimiento.documentos 
      WHERE id = $1 AND activo = true
    `;
    
    const result = await query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    const documento = result.rows[0];
    
    // Verificar que el archivo existe
    if (!fileExists(documento.ruta_archivo)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el servidor'
      });
    }
    
    // Configurar headers para visualización
    res.setHeader('Content-Type', documento.tipo_mime);
    res.setHeader('Content-Disposition', `inline; filename="${documento.nombre_original}"`);
    
    // Enviar archivo
    res.sendFile(path.resolve(documento.ruta_archivo));
    
    console.log(`✅ Documento visualizado: ${documento.nombre_original}`);
    
  } catch (error) {
    console.error(`❌ Error visualizando documento ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/documentos/:id - Actualizar información del documento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_documento, tipo_documento, descripcion, activo } = req.body;
    
    console.log(`📝 PUT /api/documentos/${id} - Actualizando documento`);
    
    // Verificar que el registro existe
    const checkExistsQuery = `
      SELECT id FROM mantenimiento.documentos WHERE id = $1
    `;
    
    const existsResult = await query(checkExistsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró documento con ID: ${id}`
      });
    }
    
    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (nombre_documento) {
      updateFields.push(`nombre_documento = $${paramIndex++}`);
      updateValues.push(nombre_documento.trim());
    }
    
    if (tipo_documento) {
      updateFields.push(`tipo_documento = $${paramIndex++}`);
      updateValues.push(tipo_documento);
    }
    
    if (descripcion !== undefined) {
      updateFields.push(`descripcion = $${paramIndex++}`);
      updateValues.push(descripcion);
    }
    
    if (activo !== undefined) {
      updateFields.push(`activo = $${paramIndex++}`);
      updateValues.push(activo);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar'
      });
    }
    
    updateValues.push(id); // Para el WHERE
    
    const updateQuery = `
      UPDATE mantenimiento.documentos 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await query(updateQuery, updateValues);
    
    console.log(`✅ Documento actualizado para ID: ${id}`);
    
    res.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error(`❌ Error actualizando documento para ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/documentos/:id - Eliminar documento (eliminación lógica)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ DELETE /api/documentos/${id} - Eliminando documento`);
    
    // Verificar que el registro existe
    const checkExistsQuery = `
      SELECT id, ruta_archivo FROM mantenimiento.documentos WHERE id = $1 AND activo = true
    `;
    
    const existsResult = await query(checkExistsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró documento con ID: ${id}`
      });
    }
    
    // Eliminación lógica
    const deleteQuery = `
      UPDATE mantenimiento.documentos 
      SET activo = false
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(deleteQuery, [id]);
    
    console.log(`✅ Documento eliminado (lógico) para ID: ${id}`);
    
    res.json({
      success: true,
      message: 'Documento eliminado exitosamente',
      data: {
        id: result.rows[0].id,
        activo: false,
        fecha_eliminacion: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error(`❌ Error eliminando documento para ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
