const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');

const router = express.Router();

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
    fileSize: 100 * 1024 * 1024, // 100MB por archivo (para documentos grandes)
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
        message: 'El archivo es demasiado grande. Máximo 100MB por archivo.'
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

// GET /api/documentos/vencidos - Obtener documentos vencidos o por vencer
router.get('/vencidos', async (req, res) => {
  try {
    const { tipo = 'todos', limit = 50, offset = 0 } = req.query;
    
    console.log(`📅 GET /api/documentos/vencidos - Documentos vencidos/por vencer (tipo: ${tipo})`);
    
    let whereCondition = '';
    if (tipo === 'vencidos') {
      whereCondition = 'AND d.fecha_vencimiento < CURRENT_DATE';
    } else if (tipo === 'por_vencer') {
      whereCondition = 'AND d.fecha_vencimiento <= CURRENT_DATE + INTERVAL \'30 days\' AND d.fecha_vencimiento >= CURRENT_DATE';
    } else if (tipo === 'vigentes') {
      whereCondition = 'AND d.fecha_vencimiento > CURRENT_DATE + INTERVAL \'30 days\'';
    } else {
      whereCondition = 'AND d.fecha_vencimiento IS NOT NULL';
    }
    
    const queryText = `
      SELECT 
        d.id,
        d.rut_persona,
        d.nombre_documento,
        d.tipo_documento,
        d.fecha_emision,
        d.fecha_vencimiento,
        d.dias_validez,
        d.estado_documento,
        d.institucion_emisora,
        d.descripcion,
        d.fecha_subida,
        d.activo,
        pd.nombres as nombre_persona,
        pd.cargo,
        pd.zona_geografica,
        CASE 
          WHEN d.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
          WHEN d.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'por_vencer'
          ELSE 'vigente'
        END as estado_vencimiento,
        CASE 
          WHEN d.fecha_vencimiento < CURRENT_DATE THEN 
            EXTRACT(DAYS FROM CURRENT_DATE - d.fecha_vencimiento)::INTEGER
          WHEN d.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 
            EXTRACT(DAYS FROM d.fecha_vencimiento - CURRENT_DATE)::INTEGER
          ELSE NULL
        END as dias_restantes
      FROM mantenimiento.documentos d
      LEFT JOIN mantenimiento.personal_disponible pd ON d.rut_persona = pd.rut
      WHERE d.activo = true ${whereCondition}
      ORDER BY d.fecha_vencimiento ASC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await query(queryText, [parseInt(limit), parseInt(offset)]);
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantenimiento.documentos d
      WHERE d.activo = true ${whereCondition}
    `;
    
    const countResult = await query(countQuery);
    
    console.log(`✅ ${result.rows.length} documentos obtenidos (tipo: ${tipo})`);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo documentos vencidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/documentos/vencer - Documentos próximos a vencer
router.get('/vencer', async (req, res) => {
  try {
    const { dias = 30, limit = 50, offset = 0 } = req.query;
    
    console.log(`📅 GET /api/documentos/vencer - Documentos próximos a vencer en ${dias} días`);
    
    const result = await query(`
      SELECT 
        d.id,
        d.rut_persona,
        d.nombre_documento,
        d.tipo_documento,
        d.fecha_emision,
        d.fecha_vencimiento,
        d.dias_validez,
        d.estado_documento,
        d.institucion_emisora,
        d.descripcion,
        d.fecha_subida,
        d.activo,
        pd.nombres as nombre_persona,
        pd.cargo,
        pd.zona_geografica,
        CASE 
          WHEN d.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
          WHEN d.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 'vencer_7_dias'
          WHEN d.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'vencer_30_dias'
          ELSE 'vigente'
        END as estado_vencimiento,
        (d.fecha_vencimiento - CURRENT_DATE) as dias_restantes
      FROM mantenimiento.documentos d
      LEFT JOIN mantenimiento.personal_disponible pd ON d.rut_persona = pd.rut
      WHERE d.activo = true 
        AND d.fecha_vencimiento IS NOT NULL
        AND d.fecha_vencimiento <= CURRENT_DATE + INTERVAL '${parseInt(dias)} days'
      ORDER BY d.fecha_vencimiento ASC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    // Contar total
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM mantenimiento.documentos d
      WHERE d.activo = true 
        AND d.fecha_vencimiento IS NOT NULL
        AND d.fecha_vencimiento <= CURRENT_DATE + INTERVAL '${parseInt(dias)} days'
    `);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      message: `Documentos próximos a vencer en ${dias} días obtenidos exitosamente`,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo documentos por vencer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

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
        d.fecha_emision,
        d.fecha_vencimiento,
        d.dias_validez,
        d.estado_documento,
        d.institucion_emisora,
        pd.nombres as nombre_persona,
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

// GET /api/documentos/tipos - Obtener tipos de documento disponibles
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
      data: tipos
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
        tamañoMaximo: '100MB por archivo',
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

// GET /api/documentos/:id - Obtener documento por ID
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
        d.fecha_emision,
        d.fecha_vencimiento,
        d.dias_validez,
        d.estado_documento,
        d.institucion_emisora,
        pd.nombres as nombre_persona,
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
      personal_id,
      nombre_documento, 
      tipo_documento, 
      descripcion,
      fecha_emision,
      fecha_vencimiento,
      dias_validez,
      institucion_emisora
    } = req.body;
    
    // Aceptar tanto rut_persona como personal_id
    const rutPersona = rut_persona || personal_id;
    const archivos = req.files;
    
    console.log('📄 POST /api/documentos - Subiendo documentos');
    console.log('🔍 Datos recibidos:', { 
      rut_persona: rutPersona, 
      nombre_documento, 
      tipo_documento, 
      descripcion, 
      archivos: archivos?.length || 0 
    });
    
    // Validaciones
    if (!rutPersona) {
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
    
    if (!archivos || archivos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron archivos para subir'
      });
    }
    
    // Verificar que la persona existe
    const checkPersonQuery = `
      SELECT rut, nombres, cargo, zona_geografica 
      FROM mantenimiento.personal_disponible 
      WHERE rut = $1
    `;
    
    const personResult = await query(checkPersonQuery, [rutPersona]);
    
    if (personResult.rows.length === 0) {
      // Eliminar archivos subidos si la persona no existe
      if (archivos && archivos.length > 0) {
        archivos.forEach(archivo => {
          deleteFile(archivo.path);
        });
      }
      
      return res.status(404).json({
        success: false,
        message: `No se encontró personal con RUT: ${rutPersona}`
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
            subido_por,
            fecha_emision,
            fecha_vencimiento,
            dias_validez,
            institucion_emisora
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id, fecha_subida
      `;
      
        const documentData = [
          rutPersona,
        nombre_documento,
        tipo_documento,
          archivo.filename,
          archivo.originalname,
          archivo.mimetype,
          archivo.size,
          archivo.path,
        descripcion || null,
          req.user?.username || 'sistema',
          fecha_emision || null,
          fecha_vencimiento || null,
          dias_validez || null,
          institucion_emisora || null
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
          nombre: persona.nombres,
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
router.get('/persona/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const { limit = 50, offset = 0, tipo_documento } = req.query;
    
    console.log(`📄 GET /api/documentos/persona/${rut} - Obteniendo documentos por RUT`);
    
    // Verificar que la persona existe
    const checkPersonQuery = `
      SELECT rut, nombres, cargo, zona_geografica 
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
        d.subido_por,
        d.fecha_emision,
        d.fecha_vencimiento,
        d.dias_validez,
        d.estado_documento,
        d.institucion_emisora
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
    
    console.log(`✅ Encontrados ${result.rows.length} documentos para ${persona.nombres}`);
    
    res.json({
      success: true,
      data: {
        persona: {
          rut: persona.rut,
          nombre: persona.nombres,
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

// GET /api/documentos/:id/descargar - Descargar documento
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
        pd.nombres as nombre_persona
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

// PUT /api/documentos/:id - Actualizar documento (incluyendo fechas de validez)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre_documento,
      tipo_documento,
      descripcion,
      fecha_emision,
      fecha_vencimiento,
      dias_validez,
      institucion_emisora,
      estado_documento
    } = req.body;

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nombre_documento !== undefined) {
      updates.push(`nombre_documento = $${paramCount++}`);
      values.push(nombre_documento);
    }
    if (tipo_documento !== undefined) {
      updates.push(`tipo_documento = $${paramCount++}`);
      values.push(tipo_documento);
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramCount++}`);
      values.push(descripcion);
    }
    if (fecha_emision !== undefined) {
      updates.push(`fecha_emision = $${paramCount++}`);
      values.push(fecha_emision);
    }
    if (fecha_vencimiento !== undefined) {
      updates.push(`fecha_vencimiento = $${paramCount++}`);
      values.push(fecha_vencimiento);
    }
    if (dias_validez !== undefined) {
      updates.push(`dias_validez = $${paramCount++}`);
      values.push(dias_validez);
    }
    if (institucion_emisora !== undefined) {
      updates.push(`institucion_emisora = $${paramCount++}`);
      values.push(institucion_emisora);
    }
    if (estado_documento !== undefined) {
      updates.push(`estado_documento = $${paramCount++}`);
      values.push(estado_documento);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updates.push(`fecha_subida = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(`
      UPDATE mantenimiento.documentos 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
