const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Crear directorio si no existe
    const uploadPath = path.join(__dirname, '../uploads/cursos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generar nombre único: timestamp + random + extensión
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}_${random}${ext}`;
    cb(null, filename);
  }
});

// Función para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos - Enfocado en documentos de cursos
  const allowedMimes = [
    // PDF - Principal formato para certificados y documentos
    'application/pdf',
    // Imágenes para documentos escaneados
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/tiff',
    'image/bmp',
    'image/gif',
    'image/webp',
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

  // Validar extensión también para mayor seguridad
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Verificar tipo MIME y extensión
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype} (${fileExtension}). Tipos permitidos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF, JPG, PNG, TIFF, BMP, GIF, WebP`), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
    files: 5 // Máximo 5 archivos por request
  }
});

// Middleware para subir múltiples archivos
const uploadMultiple = upload.array('documentos', 5);

// Middleware para subir un solo archivo
const uploadSingle = upload.single('documento');

// Middleware personalizado para manejo de errores
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Tamaño máximo: 50MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Demasiados archivos. Máximo: 5 archivos por solicitud'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de archivo inesperado'
      });
    }
  }
  
  if (err.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// Función para eliminar archivo del sistema
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Archivo eliminado: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error eliminando archivo ${filePath}:`, error);
    return false;
  }
};

// Función para obtener información del archivo
const getFileInfo = (file) => {
  return {
    nombre_original: file.originalname,
    nombre_archivo: file.filename,
    tipo_mime: file.mimetype,
    tamaño_bytes: file.size,
    ruta_archivo: file.path,
    extension: path.extname(file.originalname).toLowerCase()
  };
};

// Función para validar que el archivo existe
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Función para obtener el tamaño del archivo
const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

module.exports = {
  uploadMultiple,
  uploadSingle,
  handleUploadError,
  deleteFile,
  getFileInfo,
  fileExists,
  getFileSize
};
