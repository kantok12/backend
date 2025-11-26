const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');

const router = express.Router();

// Helper to escape a string for RegExp
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Remove numeric-suffixed variants of a filename in a directory (e.g. name_12345.ext)
function removeNumericVariants(dir, nameOnly, ext) {
  try {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    const pattern = new RegExp(`^${escapeRegExp(nameOnly)}(_\\d+)?${escapeRegExp(ext)}$`, 'i');
    for (const f of files) {
      if (pattern.test(f)) {
        const full = path.join(dir, f);
        try {
          fs.unlinkSync(full);
          console.log(`🗑️ Eliminado archivo variante: ${full}`);
        } catch (e) {
          console.warn(`⚠️ No se pudo eliminar variante ${full}:`, e.message);
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Error buscando/eliminando variantes numéricas:', err.message);
  }
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

// Helper: sanitize a user-provided filename and ensure extension is preserved.
function sanitizeAndResolveFilename(desiredName, originalName, uploadDir, options = {}) {
  // desiredName: may or may not include extension. originalName provides ext fallback.
  const origExt = path.extname(originalName) || '';
  let base = String(desiredName || '').trim();
  // Remove path characters and keep safe chars (letters, numbers, dash, underscore, space and dot)
  base = base.replace(/\\/g, '').replace(/\//g, '');
  base = base.replace(/[^a-zA-Z0-9 ._\-()]/g, '');
  // If user provided no extension, append original ext
  let ext = path.extname(base);
  if (!ext && origExt) ext = origExt;
  // Remove ext from base name for collision handling
  let nameOnly = base;
  if (ext && base.toLowerCase().endsWith(ext.toLowerCase())) {
    nameOnly = base.slice(0, base.length - ext.length);
  }
  nameOnly = nameOnly.trim().replace(/\s+/g, '_');
  if (!nameOnly) nameOnly = 'file';

  let finalName = `${nameOnly}${ext}`;
  let finalPath = path.join(uploadDir, finalName);
  // If collision and allowSuffix option is true, append timestamp; otherwise return the same name
  const allowSuffix = options.allowSuffix !== undefined ? Boolean(options.allowSuffix) : true;
  if (fs.existsSync(finalPath) && allowSuffix) {
    const ts = Date.now();
    finalName = `${nameOnly}_${ts}${ext}`;
    finalPath = path.join(uploadDir, finalName);
  }

  return { finalName, finalPath };
}

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
            (CURRENT_DATE - d.fecha_vencimiento)
          WHEN d.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 
            (d.fecha_vencimiento - CURRENT_DATE)
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
        d.ruta_archivo,
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

// GET /api/documentos/:id/descargar - Descargar archivo del documento (ruta directa o uploads)
router.get('/:id/descargar', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 GET /api/documentos/${id}/descargar - Descargando archivo`);

    const getDocumentQuery = `
      SELECT id, nombre_archivo, nombre_original, ruta_archivo, tipo_mime
      FROM mantenimiento.documentos
      WHERE id = $1 AND activo = true
    `;

    const result = await query(getDocumentQuery, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `No se encontró documento con ID: ${id}` });
    }

    const doc = result.rows[0];

    // Priorizar ruta_archivo si está disponible
    const candidates = [];
    if (doc.ruta_archivo) candidates.push(doc.ruta_archivo);
    if (doc.nombre_archivo) candidates.push(path.join(__dirname, '../uploads/documentos', doc.nombre_archivo));

    let foundPath = null;
    for (const p of candidates) {
      if (p && fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      console.warn(`⚠️ Archivo no encontrado en disco para documento ID ${id}`, candidates);
      return res.status(404).json({ success: false, message: 'Archivo no encontrado en el servidor' });
    }

    const downloadName = doc.nombre_original || path.basename(foundPath);
    console.log(`✅ Enviando archivo ${foundPath} as ${downloadName}`);
    return res.download(foundPath, downloadName);
  } catch (error) {
    console.error(`❌ Error descargando documento ${req.params.id}:`, error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// GET /api/documentos/download/:id - Compatibilidad con rutas alternativas usadas en frontend
router.get('/download/:id', async (req, res) => {
  // Delegate to the /:id/descargar handler logic by calling the same code path
  // We simply call the descargar route handler logic to avoid duplication.
  req.url = `/${req.params.id}/descargar`;
  return router.handle(req, res);
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
        d.ruta_archivo,
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
      -- Normalizamos eliminando puntos para permitir búsquedas con/sin formato (ej. 20.011.078-1 vs 20011078-1)
      WHERE translate(rut, '.', '') = translate($1, '.', '')
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
    
    // Buscar carpeta de Google Drive para el usuario
    const baseDir = 'G:/Unidades compartidas/Unidad de Apoyo/Personal';
    let userGoogleDriveDir = null;
    let cursosCertificacionesDir = null;
    try {
      const dirs = fs.readdirSync(baseDir, { withFileTypes: true }).filter(d => d.isDirectory());
      for (const dir of dirs) {
        if (dir.name.includes(rutPersona)) {
          userGoogleDriveDir = path.join(baseDir, dir.name, 'documentos');
          if (!fs.existsSync(userGoogleDriveDir)) {
            fs.mkdirSync(userGoogleDriveDir, { recursive: true });
          }
          cursosCertificacionesDir = path.join(baseDir, dir.name, 'cursos_certificaciones');
          if (!fs.existsSync(cursosCertificacionesDir)) {
            fs.mkdirSync(cursosCertificacionesDir, { recursive: true });
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error buscando carpeta de Google Drive:', err.message);
    }
    
    // Procesar cada archivo
    const uploadDir = path.join(__dirname, '../uploads/documentos');
    // nombre_archivo_destino puede ser string o array (por cada archivo)
    const destNames = req.body.nombre_archivo_destino;
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      try {
        // Si el cliente pidió un nombre de archivo destino, renombrar el archivo guardado por multer
        if (destNames) {
          const desired = Array.isArray(destNames) ? destNames[i] : destNames;
          if (desired) {
            try {
              // Do not append a numeric suffix if the destination name already exists: overwrite instead
              const { finalName, finalPath } = sanitizeAndResolveFilename(desired, archivo.originalname, uploadDir, { allowSuffix: false });
              // Mover/renombrar archivo desde la ruta temporal creada por multer
              // If target exists, remove it so rename doesn't create duplicate with numbers
              try {
                if (fs.existsSync(finalPath)) {
                  fs.unlinkSync(finalPath);
                }
              } catch (e) {
                console.warn('⚠️ No se pudo eliminar archivo destino antes de renombrar:', e.message);
              }
              // Also remove numeric-suffixed variants in uploads and Drive folder to avoid duplicates
              try {
                const ext = path.extname(finalName);
                const nameOnly = path.basename(finalName, ext);
                removeNumericVariants(uploadDir, nameOnly, ext);
                if (cursosCertificacionesDir) removeNumericVariants(cursosCertificacionesDir, nameOnly, ext);
                if (userGoogleDriveDir) removeNumericVariants(userGoogleDriveDir, nameOnly, ext);
              } catch (e) {
                console.warn('⚠️ Error al eliminar variantes numéricas antes de renombrar:', e.message);
              }
              fs.renameSync(archivo.path, finalPath);
              archivo.filename = finalName;
              archivo.path = finalPath;
            } catch (renameErr) {
              console.warn('⚠️ No se pudo renombrar archivo según nombre_archivo_destino:', renameErr.message);
              // continuar con el nombre original
            }
          }
        }

        // Copiar archivo a Google Drive si se encontró la carpeta
        let googleDrivePath = null;
        if (userGoogleDriveDir) {
          // Si es certificado_curso o diploma, guardar en cursos_certificaciones
          if (tipo_documento && ['certificado_curso', 'diploma', 'curso', 'certificacion', 'certificación'].includes(tipo_documento.toLowerCase())) {
            googleDrivePath = path.join(cursosCertificacionesDir, archivo.filename);
          } else {
            googleDrivePath = path.join(userGoogleDriveDir, archivo.filename);
          }
          fs.copyFileSync(archivo.path, googleDrivePath);
          console.log(`📂 Archivo copiado a Google Drive: ${googleDrivePath}`);
        }

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

        // Usar el RUT tal como está guardado en la tabla `personal_disponible` (persona.rut)
        // para evitar violaciones de llave foránea si el input viene en distinto formato.
        const documentData = [
          persona.rut,
          nombre_documento,
          tipo_documento,
          archivo.filename,
          archivo.filename, // nombre_original ajustado para coincidir con el nombre final en disco
          archivo.mimetype,
          archivo.size,
          (googleDrivePath || archivo.path),
          descripcion || null,
          req.user?.username || 'sistema',
          fecha_emision || null,
          fecha_vencimiento || null,
          dias_validez || null,
          institucion_emisora || null
        ];
        
        // DEBUG: registrar exactamente qué RUT se usará en la inserción (ayuda a detectar espacios/formatos)
        try {
          console.log('DEBUG: insertar documento - persona.rut=', JSON.stringify(persona.rut), 'length=', String(persona.rut).length, 'charCodes=', String(persona.rut).split('').map(c=>c.charCodeAt(0)));
        } catch (dbgErr) {
          console.warn('DEBUG: no se pudo imprimir persona.rut', dbgErr.message);
        }

        const documentResult = await query(insertDocumentQuery, documentData);
        const documento = documentResult.rows[0];
        
        documentosSubidos.push({
          id: documento.id,
          nombre_archivo: archivo.filename,
          nombre_original: archivo.filename, // ajustar para que coincida con el nombre final en disco
          nombre_archivo_guardado: archivo.filename,
          tipo_mime: archivo.mimetype,
          tamaño_bytes: archivo.size,
          ruta_archivo: (googleDrivePath || archivo.path),
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
    
    // Intentar recuperar la persona registrada, pero no exigirla.
    // Antes el endpoint devolvía 404 si la persona no existía en `personal_disponible`.
    // Para que la UI pueda listar documentos incluso si la persona no está registrada,
    // ahora continuamos aunque no encontremos la fila en `personal_disponible`.
    const checkPersonQuery = `
      SELECT rut, nombres, cargo, zona_geografica 
      FROM mantenimiento.personal_disponible 
      -- Normalizamos eliminando puntos para permitir búsquedas con/sin formato
      WHERE translate(rut, '.', '') = translate($1, '.', '')
    `;

    const personResult = await query(checkPersonQuery, [rut]);
    let persona = null;
    if (personResult.rows.length === 0) {
      console.log(`ℹ️ GET /api/documentos/persona/${rut} - persona no encontrada en personal_disponible, continuando a buscar documentos en BD`);
    } else {
      persona = personResult.rows[0];
    }

    // Buscar documentos en carpeta Google Drive enlazada
    const baseDir = 'G:/Unidades compartidas/Unidad de Apoyo/Personal';
    let userDocumentosDir = null;
    let userCursosDir = null;
    try {
      // Buscar carpeta que contenga el rut
      const dirs = fs.readdirSync(baseDir, { withFileTypes: true }).filter(d => d.isDirectory());
      for (const dir of dirs) {
        if (dir.name.includes(rut)) {
          userDocumentosDir = path.join(baseDir, dir.name, 'documentos');
          userCursosDir = path.join(baseDir, dir.name, 'cursos_certificaciones');
          break;
        }
      }
    } catch (err) {
      console.error('Error leyendo carpetas de Google Drive:', err.message);
    }

    let documentosLocales = [];
    
    // Leer documentos generales
    if (userDocumentosDir && fs.existsSync(userDocumentosDir)) {
      const archivosDocumentos = fs.readdirSync(userDocumentosDir).map(filename => ({
        nombre_archivo: filename,
        ruta_local: path.join(userDocumentosDir, filename),
        carpeta: 'documentos'
      }));
      documentosLocales = documentosLocales.concat(archivosDocumentos);
    }
    
    // Leer cursos/certificaciones
    if (userCursosDir && fs.existsSync(userCursosDir)) {
      const archivosCursos = fs.readdirSync(userCursosDir).map(filename => ({
        nombre_archivo: filename,
        ruta_local: path.join(userCursosDir, filename),
        carpeta: 'cursos_certificaciones'
      }));
      documentosLocales = documentosLocales.concat(archivosCursos);
    }

    // Lógica original de BD
    let whereConditions = ['d.rut_persona = $1', 'd.activo = true'];
    let queryParams = [rut];
    let paramIndex = 2;
    if (tipo_documento) {
      whereConditions.push(`d.tipo_documento = $${paramIndex++}`);
      queryParams.push(tipo_documento);
    }
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
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
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantenimiento.documentos d
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);
    console.log(`✅ Encontrados ${result.rows.length} documentos para RUT ${rut}` + (persona ? ` (persona: ${persona.nombres})` : ' (persona no registrada)'));

    // Evitar duplicados en frontend: si un archivo está registrado en la BD
    // (campo nombre_archivo) no lo incluimos también desde los archivos locales.
    try {
      const dbFileNames = new Set(result.rows.map(r => r.nombre_archivo).filter(Boolean));
      if (dbFileNames.size > 0 && documentosLocales.length > 0) {
        const before = documentosLocales.length;
        documentosLocales = documentosLocales.filter(d => !dbFileNames.has(d.nombre_archivo));
        const removed = before - documentosLocales.length;
        if (removed > 0) {
          console.log(`ℹ️ documentos_locales deduplicados: removidos ${removed} archivos que ya existen en BD para ${persona.rut}`);
        }
      }
    } catch (dedupeErr) {
      console.warn('⚠️ Error durante deduplicación de documentos locales:', dedupeErr.message);
    }

    // Split local documentos by folder for frontend convenience while keeping
    // the original 'documentos_locales' array for backward compatibility.
    const documentosLocalesSplit = {
      documentos: documentosLocales.filter(d => d.carpeta === 'documentos'),
      cursos_certificaciones: documentosLocales.filter(d => d.carpeta === 'cursos_certificaciones')
    };

    res.json({
      success: true,
      data: {
        persona: persona ? {
          rut: persona.rut,
          nombre: persona.nombres,
          cargo: persona.cargo,
          zona_geografica: persona.zona_geografica
        } : null,
        documentos: result.rows,
        documentos_locales: documentosLocales, // legacy shape: flat array
        documentos_locales_split: documentosLocalesSplit, // new split-by-folder shape
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

// POST /api/documentos/registrar-existente - Registrar documento que ya existe en Google Drive
router.post('/registrar-existente', async (req, res) => {
  try {
    const {
      rut_persona,
      nombre_archivo,
      ruta_local,
      nombre_documento,
      tipo_documento,
      descripcion,
      fecha_emision,
      fecha_vencimiento,
      dias_validez,
      institucion_emisora,
      nombre_archivo_destino
    } = req.body;

    console.log('📄 POST /api/documentos/registrar-existente - Registrando documento existente');

    // Validaciones
    if (!rut_persona || !nombre_archivo || !ruta_local) {
      return res.status(400).json({
        success: false,
        message: 'RUT, nombre de archivo y ruta local son requeridos'
      });
    }

    if (!nombre_documento || !tipo_documento) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y tipo de documento son requeridos'
      });
    }

    // Normalizar y validar tipo_documento contra la restricción CHECK de la BD
    const validTipos = [
      'certificado_curso',
      'diploma',
      'certificado_laboral',
      'certificado_medico',
      'licencia_conducir',
      'certificado_seguridad',
      'certificado_vencimiento',
      'otro'
    ];

    // Mapeo de sinónimos/abreviaturas frecuentes -> valores válidos de la BD
    const tipoRaw = String(tipo_documento || '').trim().toLowerCase();
    const tipoMap = {
      // Cursos/certificaciones
      'curso': 'certificado_curso',
      'certificacion': 'certificado_curso',
      'certificación': 'certificado_curso',
      // Variantes comunes
      'licencia': 'licencia_conducir',
      'licencia_conductor': 'licencia_conducir',
      'seguridad': 'certificado_seguridad',
      'medico': 'certificado_medico',
      'laboral': 'certificado_laboral',
      'vencimiento': 'certificado_vencimiento',
      // Abreviaturas frecuentes
      'cv': 'cv',
      'c.v.': 'cv',
      // Cédula/DNI/etc. no tiene categoría propia en la CHECK -> usar 'otro'
      'cedula': 'otro',
      'cédula': 'otro',
      'cedula_identidad': 'otro',
      'dni': 'otro',
      'identidad': 'otro'
    };

    const tipoNormalizado = tipoMap[tipoRaw] || tipoRaw;

    if (!validTipos.includes(tipoNormalizado)) {
      return res.status(400).json({
        success: false,
        message: `tipo_documento inválido: "${tipo_documento}". Valores permitidos: ${validTipos.join(', ')}`
      });
    }

    // Verificar que la persona existe
    const checkPersonQuery = `
      SELECT rut, nombres, cargo 
      FROM mantenimiento.personal_disponible 
      -- Normalizamos eliminando puntos para permitir búsquedas con/sin formato
      WHERE translate(rut, '.', '') = translate($1, '.', '')
    `;
    const personResult = await query(checkPersonQuery, [rut_persona]);

    if (personResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró personal con RUT: ${rut_persona}`
      });
    }

    const persona = personResult.rows[0];

    // Verificar que el archivo existe en Google Drive
    if (!fs.existsSync(ruta_local)) {
      return res.status(404).json({
        success: false,
        message: 'El archivo no existe en la ruta especificada'
      });
    }

    // Obtener información del archivo
    const stats = fs.statSync(ruta_local);
    const uploadDir = path.join(__dirname, '../uploads/documentos');
    // Determine destination filename: if nombre_archivo_destino provided, sanitize and use it,
    // otherwise fallback to original behavior (basename_timestamp.ext)
    let nuevoNombreArchivo;
    let destinoLocal;
    if (nombre_archivo_destino) {
      // If frontend provides a destination name, try to use it and overwrite any existing file
      const { finalName, finalPath } = sanitizeAndResolveFilename(nombre_archivo_destino, nombre_archivo, uploadDir, { allowSuffix: false });
      nuevoNombreArchivo = finalName;
      destinoLocal = finalPath;
      try {
        if (fs.existsSync(destinoLocal)) {
          fs.unlinkSync(destinoLocal);
        }
      } catch (e) {
        console.warn('⚠️ No se pudo eliminar destino existente antes de copiar registrar-existente:', e.message);
      }
    } else {
      const ext = path.extname(nombre_archivo);
      const timestamp = Date.now();
      nuevoNombreArchivo = `${path.basename(nombre_archivo, ext)}_${timestamp}${ext}`;
      destinoLocal = path.join(__dirname, '../uploads/documentos', nuevoNombreArchivo);
    }

    // Copiar archivo a uploads/documentos (backup local) solo si no está ya allí
    try {
      if (!destinoLocal.toLowerCase().includes(ruta_local.toLowerCase()) && ruta_local !== destinoLocal) {
        // Asegurar que existe el directorio de destino
        const uploadsDir = path.dirname(destinoLocal);
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.copyFileSync(ruta_local, destinoLocal);
        console.log(`📁 Archivo copiado a uploads local: ${destinoLocal}`);
      }
    } catch (copyErr) {
      console.error('⚠️ Error copiando a uploads local:', copyErr.message);
      // Continuar aunque falle el backup local
    }

     // Buscar carpeta de Google Drive para el usuario y cursos_certificaciones
     const baseDir = 'G:/Unidades compartidas/Unidad de Apoyo/Personal';
     let userGoogleDriveDir = null;
     let cursosCertificacionesDir = null;
     try {
       const dirs = fs.readdirSync(baseDir, { withFileTypes: true }).filter(d => d.isDirectory());
       for (const dir of dirs) {
         if (dir.name.includes(rut_persona)) {
           userGoogleDriveDir = path.join(baseDir, dir.name, 'documentos');
           if (!fs.existsSync(userGoogleDriveDir)) {
             fs.mkdirSync(userGoogleDriveDir, { recursive: true });
           }
           cursosCertificacionesDir = path.join(baseDir, dir.name, 'cursos_certificaciones');
           if (!fs.existsSync(cursosCertificacionesDir)) {
             fs.mkdirSync(cursosCertificacionesDir, { recursive: true });
           }
           break;
         }
       }
     } catch (err) {
       console.error('Error buscando carpeta de Google Drive:', err.message);
     }

     // Determinar la carpeta de destino en Google Drive
     let googleDrivePath = null;
  const esCurso = ['certificado_curso', 'diploma'].includes(tipoNormalizado);
     
     if (esCurso) {
       googleDrivePath = cursosCertificacionesDir ? path.join(cursosCertificacionesDir, nuevoNombreArchivo) : null;
     } else {
       googleDrivePath = userGoogleDriveDir ? path.join(userGoogleDriveDir, nuevoNombreArchivo) : null;
     }

     // Solo copiar si el archivo NO está ya en Google Drive (evitar copiar a sí mismo)
     const archivoYaEnGoogleDrive = ruta_local.toLowerCase().startsWith('g:') || ruta_local.toLowerCase().startsWith('g:/');
     
      if (googleDrivePath && !archivoYaEnGoogleDrive) {
       // Archivo viene de otra ubicación, copiarlo a Google Drive
       try {
          // Remove numeric variants in Google Drive dir to avoid duplicates
          try {
            const ext2 = path.extname(nuevoNombreArchivo);
            const nameOnly2 = path.basename(nuevoNombreArchivo, ext2);
            if (esCurso && cursosCertificacionesDir) removeNumericVariants(cursosCertificacionesDir, nameOnly2, ext2);
            if (!esCurso && userGoogleDriveDir) removeNumericVariants(userGoogleDriveDir, nameOnly2, ext2);
          } catch (e) {
            console.warn('⚠️ Error eliminando variantes en Google Drive antes de copiar:', e.message);
          }
          fs.copyFileSync(ruta_local, googleDrivePath);
          console.log(`📂 Archivo copiado a Google Drive: ${googleDrivePath}`);
       } catch (copyErr) {
         console.error('⚠️ Error copiando a Google Drive:', copyErr.message);
         return res.status(500).json({
           success: false,
           message: 'Error al copiar archivo a Google Drive',
           error: copyErr.message
         });
       }
     } else if (archivoYaEnGoogleDrive) {
       // Archivo ya está en Google Drive, solo registrarlo
       console.log(`📂 Archivo ya existe en Google Drive: ${ruta_local}`);
       googleDrivePath = ruta_local; // Usar la ruta existente
     }

    // Determinar tipo MIME
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };
    const ext = (path.extname(nuevoNombreArchivo) || path.extname(nombre_archivo) || '').toLowerCase();
    const tipoMime = mimeTypes[ext] || 'application/octet-stream';

    // Insertar en BD
    const insertQuery = `
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

    // Insertar usando el RUT canonical encontrado en la tabla de personas
    const values = [
      persona.rut,
      nombre_documento,
      tipoNormalizado,
      nuevoNombreArchivo,
      nuevoNombreArchivo, // nombre_original ajustado para coincidir con el nombre final que se guardó
      tipoMime,
      stats.size,
      (googleDrivePath || destinoLocal),
      descripcion || null,
      req.user?.username || 'sistema',
      fecha_emision || null,
      fecha_vencimiento || null,
      dias_validez || null,
      institucion_emisora || null
    ];

    // DEBUG: registrar exactamente qué RUT se usará en la inserción (ayuda a detectar espacios/formatos)
    try {
      console.log('DEBUG: registrar-existente - persona.rut=', JSON.stringify(persona.rut), 'length=', String(persona.rut).length, 'charCodes=', String(persona.rut).split('').map(c=>c.charCodeAt(0)));
    } catch (dbgErr) {
      console.warn('DEBUG: no se pudo imprimir persona.rut (registrar-existente)', dbgErr.message);
    }

    const result = await query(insertQuery, values);
    const documento = result.rows[0];

    console.log(`✅ Documento registrado: ${nombre_documento} (ID: ${documento.id})`);

    res.status(201).json({
      success: true,
      message: 'Documento registrado exitosamente',
      data: {
        id: documento.id,
        persona: {
          rut: persona.rut,
          nombre: persona.nombres,
          cargo: persona.cargo
        },
        documento: {
          nombre_documento,
          tipo_documento: tipoNormalizado,
          nombre_archivo: nuevoNombreArchivo,
          nombre_archivo_guardado: nuevoNombreArchivo,
          ruta_archivo: (googleDrivePath || destinoLocal),
          fecha_subida: documento.fecha_subida
        }
      }
    });

  } catch (error) {
    console.error('❌ Error registrando documento existente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/documentos/:id - Eliminar documento (hard delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ DELETE /api/documentos/${id} - Eliminando documento (Hard Delete)`);
    
    // 1. Obtener la información del documento ANTES de eliminarlo de la BD
    const getDocumentQuery = `
      SELECT id, nombre_documento, ruta_archivo, rut_persona
      FROM mantenimiento.documentos 
      WHERE id = $1
    `;
    
    const documentResult = await query(getDocumentQuery, [id]);
    
    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró documento con ID: ${id}`
      });
    }
    
    const documento = documentResult.rows[0];
    
    // 2. Eliminar el registro de la base de datos
    const deleteQuery = `
      DELETE FROM mantenimiento.documentos 
      WHERE id = $1
      RETURNING id, nombre_documento
    `;
    
    const deleteResult = await query(deleteQuery, [id]);
    
    // 3. Si la eliminación de la BD fue exitosa, eliminar el archivo físico
    if (deleteResult.rows.length > 0) {
      console.log(`✅ Registro de BD eliminado: ${deleteResult.rows[0].nombre_documento}`);
      
      // Eliminar el archivo del sistema de archivos local
      if (documento.ruta_archivo) {
        deleteFile(documento.ruta_archivo);
      }

      // Adicionalmente, intentar eliminar de la carpeta de Google Drive si existe.
      // Hacemos la búsqueda robusta usando una forma normalizada del RUT (sin puntos)
      // porque los nombres de carpeta en G: pueden contener el RUT sin puntos.
      const baseDir = 'G:/Unidades compartidas/Unidad de Apoyo/Personal';
      try {
        const dirs = fs.readdirSync(baseDir, { withFileTypes: true }).filter(d => d.isDirectory());
        // Normalizar rut quitando puntos para comparar con nombres de carpeta
        const normalizedRut = String(documento.rut_persona || '').replace(/\./g, '');
        const candidates = [];
        for (const dir of dirs) {
          const dirName = String(dir.name || '');
          // Match si el nombre de la carpeta contiene el RUT en cualquiera de sus formas
          if (dirName.includes(normalizedRut) || (documento.rut_persona && dirName.includes(documento.rut_persona))) {
            candidates.push(path.join(baseDir, dir.name));
          }
        }

        // Si no encontramos candidatas basadas en el RUT, intentamos una búsqueda más amplia
        // buscando cualquier carpeta que contenga los dígitos del RUT (por si hay formato distinto)
        if (candidates.length === 0 && normalizedRut) {
          for (const dir of dirs) {
            const dirName = String(dir.name || '');
            // buscar la secuencia de dígitos parcial (primeros 6 por ejemplo)
            if (normalizedRut.length >= 6 && dirName.includes(normalizedRut.slice(0, 6))) {
              candidates.push(path.join(baseDir, dir.name));
            }
          }
        }

        for (const userFolder of candidates) {
          const googleDriveFilePath = path.join(userFolder, 'documentos', documento.nombre_archivo);
          const googleDriveCursosPath = path.join(userFolder, 'cursos_certificaciones', documento.nombre_archivo);
          deleteFile(googleDriveFilePath);
          deleteFile(googleDriveCursosPath);
        }
      } catch (err) {
        console.warn('⚠️  Advertencia: No se pudo verificar/eliminar el archivo de Google Drive.', err.message);
      }

    } else {
        // Esto no debería ocurrir si la primera consulta encontró el documento, pero es un buen seguro.
        throw new Error('No se pudo eliminar el registro de la base de datos.');
    }
    
    res.json({
      success: true,
      message: 'Documento y archivo asociado eliminados exitosamente',
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
