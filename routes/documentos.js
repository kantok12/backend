const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');

const router = express.Router();

// Función para convertir label de tipo de documento a value
function convertirTipoDocumento(tipo) {
  const tiposMap = {
    'Certificado de Curso': 'certificado_curso',
    'Diploma': 'diploma',
    'Certificado Laboral': 'certificado_laboral',
    'Certificado Médico': 'certificado_medico',
    'Licencia de Conducir': 'licencia_conducir',
    'Certificado de Seguridad': 'certificado_seguridad',
    'Certificado de Vencimiento': 'certificado_vencimiento',
    'Otro': 'otro'
  };
  
  // Si ya es un value válido, devolverlo tal como está
  const values = Object.values(tiposMap);
  if (values.includes(tipo)) {
    return tipo;
  }
  
  // Si es un label, convertirlo a value
  return tiposMap[tipo] || tipo;
}

// =====================================================
// CONFIGURACIÓN DE MULTER PARA SUBIDA DE ARCHIVOS
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documentos');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único con timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${safeName}_${timestamp}${ext}`);
  }
});

const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB por archivo (para PDFs grandes)
    files: 5 // Máximo 5 archivos por request
  },
  fileFilter: (req, file, cb) => {
    // Tipos de archivo permitidos - Enfocado en documentos
    const allowedTypes = [
      // PDF - Principal formato de documentos
      'application/pdf',
      // Imágenes para documentos escaneados
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp',
      // Documentos de Office
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Otros formatos de documentos
      'text/plain',
      'application/rtf'
    ];
    
    // Validar extensión también
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype} (${fileExtension}). Tipos permitidos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF, JPG, PNG, TIFF, BMP`), false);
    }
  }
}).array('archivo', 5);

// Middleware para manejar errores de multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 50MB por archivo.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Demasiados archivos. Máximo 5 archivos por request.'
      });
    }
  }
  
  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Función para eliminar archivo
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Archivo eliminado: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error eliminando archivo ${filePath}:`, error);
  }
};

// =====================================================
// ENDPOINTS PARA GESTIÓN DE DOCUMENTOS
// =====================================================

// GET /api/documentos - Obtener todos los documentos
router.get('/', async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      rut, 
      tipo_documento, 
      nombre_documento 
    } = req.query;
    
    console.log('📄 GET /api/documentos - Obteniendo documentos');
    
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
    
    if (nombre_documento) {
      whereConditions.push(`d.nombre_documento ILIKE $${paramIndex++}`);
      queryParams.push(`%${nombre_documento}%`);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // Query principal con JOIN al personal_disponible
    const getAllQuery = `
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
        pd.nombre as nombre_persona,
        pd.cargo,
        pd.zona_geografica
      FROM mantenimiento.documentos d
      LEFT JOIN mantenimiento.personal_disponible pd ON d.rut_persona = pd.rut
      ${whereClause}
      ORDER BY d.fecha_subida DESC, d.nombre_documento
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await query(getAllQuery, queryParams);
    
    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantenimiento.documentos d
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams.slice(0, -2)); // Remover limit y offset
    const total = parseInt(countResult.rows[0].total);
    
    console.log(`✅ Encontrados ${result.rows.length} documentos de ${total} total`);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
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

// GET /api/documentos/:id - Obtener documento por ID
router.get('/tipos', async (req, res) => {
  try {
    console.log('📋 GET /api/documentos/tipos - Obteniendo tipos de documento');
    
    const tipos = [
      { value: 'certificado_curso', label: 'Certificado de Curso' },
      { value: 'diploma', label: 'Diploma' },
      { value: 'certificado_laboral', label: 'Certificado Laboral' },
      { value: 'certificado_medico', label: 'Certificado Médico' },
      { value: 'licencia_conducir', label: 'Licencia de Conducir' },
      { value: 'certificado_seguridad', label: 'Certificado de Seguridad' },
      { value: 'certificado_vencimiento', label: 'Certificado de Vencimiento' },
      { value: 'otro', label: 'Otro' }
    ];
    
    res.json({
      success: true,
      data: tipos.map(t => t.value)
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo tipos de documento:', error);
    res.status(500).json({
        success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/documentos/formatos - Obtener formatos de archivo soportados

router.get('/formatos', async (req, res) => {
  try {
    console.log('📋 GET /api/documentos/formatos - Obteniendo formatos soportados');
    
    const formatos = {
      documentos: [
        { extension: '.pdf', mime: 'application/pdf', descripcion: 'Documento PDF' },
        { extension: '.doc', mime: 'application/msword', descripcion: 'Documento Word 97-2003' },
        { extension: '.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', descripcion: 'Documento Word' },
        { extension: '.xls', mime: 'application/vnd.ms-excel', descripcion: 'Hoja de cálculo Excel 97-2003' },
        { extension: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', descripcion: 'Hoja de cálculo Excel' },
        { extension: '.ppt', mime: 'application/vnd.ms-powerpoint', descripcion: 'Presentación PowerPoint 97-2003' },
        { extension: '.pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', descripcion: 'Presentación PowerPoint' },
        { extension: '.txt', mime: 'text/plain', descripcion: 'Archivo de texto' },
        { extension: '.rtf', mime: 'application/rtf', descripcion: 'Documento RTF' }
      ],
      imagenes: [
        { extension: '.jpg', mime: 'image/jpeg', descripcion: 'Imagen JPEG' },
        { extension: '.jpeg', mime: 'image/jpeg', descripcion: 'Imagen JPEG' },
        { extension: '.png', mime: 'image/png', descripcion: 'Imagen PNG' },
        { extension: '.tiff', mime: 'image/tiff', descripcion: 'Imagen TIFF' },
        { extension: '.bmp', mime: 'image/bmp', descripcion: 'Imagen BMP' }
      ],
      limites: {
        tamañoMaximo: '50MB por archivo',
        archivosMaximos: '5 archivos por request',
        recomendado: 'PDF para documentos oficiales'
      }
    };
    
    res.json({
      success: true,
      data: formatos
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo formatos soportados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;


router.get('/persona/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const { limit = 50, offset = 0, tipo_documento } = req.query;
    
    console.log(`📄 GET /api/documentos/persona/${rut} - Obteniendo documentos por RUT`);
    
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
    
    // Construir filtros
    let whereConditions = ['d.rut_persona = $1', 'd.activo = true'];
    let queryParams = [rut];
    let paramIndex = 2;
    
    if (tipo_documento) {
      whereConditions.push(`d.tipo_documento = $${paramIndex++}`);
      queryParams.push(tipo_documento);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // Query principal
    const getDocumentosQuery = `
      SELECT 
        d.id,
        d.nombre_documento,
        d.tipo_documento,
        d.nombre_archivo,
        d.nombre_original,
        d.tipo_mime,
        d.tamaño_bytes,
        d.descripcion,
        d.fecha_subida,
        d.subido_por
      FROM mantenimiento.documentos d
      ${whereClause}
      ORDER BY d.fecha_subida DESC, d.nombre_documento
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await query(getDocumentosQuery, queryParams);
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantenimiento.documentos d
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);
    
    console.log(`✅ Encontrados ${result.rows.length} documentos para ${persona.nombre}`);
    
    res.json({
      success: true,
      data: {
        persona: {
          rut: persona.rut,
          nombre: persona.nombre,
          cargo: persona.cargo,
          zona_geografica: persona.zona_geografica
        },
        documentos: result.rows,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
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

// GET /api/documentos/curso/:nombre - Obtener documentos por nombre de curso
router.get('/curso/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    
    console.log(`📄 GET /api/documentos/curso/${nombre} - Obteniendo documentos por curso`);
    
    // Buscar documentos que contengan el nombre del curso en su nombre_documento o descripción
    const getDocumentsQuery = `
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
        pd.nombre as nombre_persona,
        pd.cargo,
        pd.zona_geografica
      FROM mantenimiento.documentos d
      LEFT JOIN mantenimiento.personal_disponible pd ON d.rut_persona = pd.rut
      WHERE d.activo = true 
        AND (
          LOWER(d.nombre_documento) LIKE LOWER($1) 
          OR LOWER(d.descripcion) LIKE LOWER($1)
        )
      ORDER BY d.fecha_subida DESC, d.nombre_documento
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantenimiento.documentos d
      WHERE d.activo = true 
        AND (
          LOWER(d.nombre_documento) LIKE LOWER($1) 
          OR LOWER(d.descripcion) LIKE LOWER($1)
        )
    `;
    
    const searchTerm = `%${nombre}%`;
    
    const result = await query(getDocumentsQuery, [searchTerm, limit, offset]);
    const countResult = await query(countQuery, [searchTerm]);
    const total = parseInt(countResult.rows[0].total);
    
    console.log(`✅ Encontrados ${result.rows.length} documentos para curso "${nombre}"`);
    
    res.json({
      success: true,
      message: `Documentos encontrados para curso: ${nombre}`,
      data: {
        curso: nombre,
        documentos: result.rows,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Error obteniendo documentos para curso ${req.params.nombre}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/documentos/:id/descargar - Descargar documento

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📄 GET /api/documentos/${id} - Obteniendo documento`);
    
    const getDocumentQuery = `
      SELECT 
        d.id,
        d.rut_persona,
        d.nombre_documento,
        d.tipo_documento,
        d.nombre_archivo,
        d.nombre_original,
        d.tipo_mime,
        d.tamaño_bytes,
        d.ruta_archivo,
        d.descripcion,
        d.fecha_subida,
        d.subido_por,
        pd.nombre as nombre_persona,
        pd.cargo,
        pd.zona_geografica
      FROM mantenimiento.documentos d
      LEFT JOIN mantenimiento.personal_disponible pd ON d.rut_persona = pd.rut
      WHERE d.id = $1 AND d.activo = true
    `;
    
    const result = await query(getDocumentQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró documento con ID: ${id}`
      });
    }
    
    console.log(`✅ Documento encontrado: ${result.rows[0].nombre_documento}`);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error(`❌ Error obteniendo documento ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/documentos - Subir documentos
router.post('/', uploadMultiple, handleUploadError, async (req, res) => {
  try {
    const { 
      rut_persona, 
      nombre_documento, 
      tipo_documento, 
      descripcion 
    } = req.body;
    const archivos = req.files;
    
    console.log('📄 POST /api/documentos - Subiendo documentos');
    console.log('🔍 Datos recibidos:', { 
      rut_persona, 
      nombre_documento, 
      tipo_documento, 
      descripcion, 
      archivos: archivos?.length || 0 
    });
    
    // Validaciones
    if (!rut_persona) {
      return res.status(400).json({
        success: false,
        message: 'El RUT de la persona es requerido'
      });
    }
    
    if (!nombre_documento) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del documento es requerido'
      });
    }
    
    if (!tipo_documento) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de documento es requerido'
      });
    }
    
    // Convertir label a value si es necesario
    const tipoDocumentoConvertido = convertirTipoDocumento(tipo_documento);
    console.log(`🔄 Tipo convertido: "${tipo_documento}" -> "${tipoDocumentoConvertido}"`);
    
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
    
    const personResult = await query(checkPersonQuery, [rut_persona]);
    
    if (personResult.rows.length === 0) {
      // Eliminar archivos subidos si la persona no existe
      if (archivos && archivos.length > 0) {
        archivos.forEach(archivo => {
          deleteFile(archivo.path);
        });
      }
      
      return res.status(404).json({
        success: false,
        message: `No se encontró personal con RUT: ${rut_persona}`
      });
    }
    
    const persona = personResult.rows[0];
    const documentosSubidos = [];
    
    // Procesar cada archivo
    for (const archivo of archivos) {
      try {
        const insertDocumentQuery = `
        INSERT INTO mantenimiento.documentos (
            rut_persona,
            nombre_documento,
            tipo_documento,
            nombre_archivo,
            nombre_original,
            tipo_mime,
            tamaño_bytes,
            ruta_archivo,
            descripcion,
            subido_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, fecha_subida
      `;
      
        const documentData = [
          rut_persona,
        nombre_documento,
        tipoDocumentoConvertido,
          archivo.filename,
          archivo.originalname,
          archivo.mimetype,
          archivo.size,
          archivo.path,
        descripcion || null,
          req.user?.username || 'sistema'
        ];
        
        const documentResult = await query(insertDocumentQuery, documentData);
        const documento = documentResult.rows[0];
        
        documentosSubidos.push({
          id: documento.id,
          nombre_archivo: archivo.filename,
          nombre_original: archivo.originalname,
          tipo_mime: archivo.mimetype,
          tamaño_bytes: archivo.size,
          fecha_subida: documento.fecha_subida
        });
        
        console.log(`✅ Documento subido: ${archivo.originalname} (ID: ${documento.id})`);
        
      } catch (error) {
        console.error(`❌ Error subiendo archivo ${archivo.originalname}:`, error);
        // Eliminar archivo si falló la inserción en BD
        deleteFile(archivo.path);
        throw error;
      }
    }
    
    console.log(`✅ ${documentosSubidos.length} documentos subidos exitosamente`);
    
    res.status(201).json({
      success: true,
      message: `${documentosSubidos.length} documento(s) subido(s) exitosamente`,
      data: {
        persona: {
          rut: persona.rut,
          nombre: persona.nombre,
          cargo: persona.cargo
        },
        documentos: documentosSubidos
      }
    });
    
  } catch (error) {
    console.error('❌ Error subiendo documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/documentos/persona/:rut - Obtener documentos por RUT

router.get('/:id/descargar', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 GET /api/documentos/${id}/descargar - Descargando documento`);
    
    // Obtener información del documento
    const getDocumentQuery = `
      SELECT 
        d.nombre_archivo,
        d.nombre_original,
        d.tipo_mime,
        d.ruta_archivo,
        d.tamaño_bytes,
        pd.nombre as nombre_persona
      FROM mantenimiento.documentos d
      LEFT JOIN mantenimiento.personal_disponible pd ON d.rut_persona = pd.rut
      WHERE d.id = $1 AND d.activo = true
    `;
    
    const result = await query(getDocumentQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró documento con ID: ${id}`
      });
    }
    
    const documento = result.rows[0];
    
    // Verificar que el archivo existe
    if (!fs.existsSync(documento.ruta_archivo)) {
      return res.status(404).json({
        success: false,
        message: 'El archivo no existe en el servidor'
      });
    }
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', documento.tipo_mime);
    res.setHeader('Content-Disposition', `attachment; filename="${documento.nombre_original}"`);
    res.setHeader('Content-Length', documento.tamaño_bytes);
    
    console.log(`✅ Descargando: ${documento.nombre_original} (${documento.tamaño_bytes} bytes)`);
    
    // Enviar archivo
    res.sendFile(path.resolve(documento.ruta_archivo));
    
  } catch (error) {
    console.error(`❌ Error descargando documento ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/documentos/:id - Eliminar documento (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ DELETE /api/documentos/${id} - Eliminando documento`);
    
    // Verificar que el documento existe
    const checkDocumentQuery = `
      SELECT id, nombre_documento, ruta_archivo, rut_persona
      FROM mantenimiento.documentos 
      WHERE id = $1 AND activo = true
    `;
    
    const documentResult = await query(checkDocumentQuery, [id]);
    
    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró documento con ID: ${id}`
      });
    }
    
    const documento = documentResult.rows[0];
    
    // Soft delete - marcar como inactivo
    const deleteQuery = `
      UPDATE mantenimiento.documentos 
      SET activo = false
      WHERE id = $1
      RETURNING id, nombre_documento
    `;
    
    const deleteResult = await query(deleteQuery, [id]);
    
    console.log(`✅ Documento eliminado: ${deleteResult.rows[0].nombre_documento}`);
    
    res.json({
      success: true,
      message: 'Documento eliminado exitosamente',
      data: {
        id: deleteResult.rows[0].id,
        nombre_documento: deleteResult.rows[0].nombre_documento
      }
    });
    
  } catch (error) {
    console.error(`❌ Error eliminando documento ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/documentos/tipos - Obtener tipos de documento disponibles

