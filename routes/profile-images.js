const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');

const router = express.Router();

// Crear directorio de perfiles si no existe
const profilesDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

// Configuración de almacenamiento para imágenes de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const { rut } = req.params;
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${rut}${ext}`;
    cb(null, filename);
  }
});

// Configuración de Multer para imágenes de perfil
const uploadProfileImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB para imágenes de perfil
    files: 1 // Solo una imagen por vez
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir imágenes
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype} (${fileExtension}). Solo se permiten imágenes: JPG, PNG, GIF, WEBP`), false);
    }
  }
}).single('file');

// Middleware para manejar errores de multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'La imagen es demasiado grande. Máximo 5MB para imágenes de perfil.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Solo se permite una imagen de perfil por vez.'
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

// POST /api/personal/{rut}/profile-image - Subir imagen de perfil
router.post('/:rut/profile-image', uploadProfileImage, handleUploadError, async (req, res) => {
  try {
    const { rut } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo de imagen'
      });
    }

    // Verificar que el RUT existe en la base de datos
    const personCheck = await query(
      'SELECT rut, nombres FROM mantenimiento.personal_disponible WHERE rut = $1',
      [rut]
    );

    if (personCheck.rows.length === 0) {
      // Eliminar archivo subido si el RUT no existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Persona no encontrada'
      });
    }

    // Verificar si ya existe una imagen de perfil y eliminarla
    const existingImagePath = path.join(profilesDir, `${rut}.*`);
    const existingFiles = fs.readdirSync(profilesDir).filter(file => 
      file.startsWith(rut) && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );
    
    existingFiles.forEach(file => {
      const oldFilePath = path.join(profilesDir, file);
      if (fs.existsSync(oldFilePath) && file !== req.file.filename) {
        fs.unlinkSync(oldFilePath);
      }
    });

    // Construir URL de la imagen
    const profileImageUrl = `http://192.168.10.194:3000/uploads/profiles/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Imagen de perfil actualizada exitosamente',
      data: {
        profile_image_url: profileImageUrl,
        rut: rut,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Error al subir imagen de perfil:', error);
    
    // Eliminar archivo si hubo error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/personal/{rut}/profile-image - Obtener imagen de perfil
router.get('/:rut/profile-image', async (req, res) => {
  try {
    const { rut } = req.params;

    // Verificar que el RUT existe en la base de datos
    const personCheck = await query(
      'SELECT rut, nombres FROM mantenimiento.personal_disponible WHERE rut = $1',
      [rut]
    );

    if (personCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Persona no encontrada'
      });
    }

    // Buscar imagen de perfil existente
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    let profileImagePath = null;
    let profileImageUrl = null;

    for (const ext of allowedExtensions) {
      const imagePath = path.join(profilesDir, `${rut}${ext}`);
      if (fs.existsSync(imagePath)) {
        profileImagePath = imagePath;
        profileImageUrl = `http://192.168.10.194:3000/uploads/profiles/${rut}${ext}`;
        break;
      }
    }

    if (!profileImagePath) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró imagen de perfil para este usuario'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        profile_image_url: profileImageUrl,
        rut: rut
      }
    });

  } catch (error) {
    console.error('Error al obtener imagen de perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/personal/{rut}/profile-image/download - Descargar imagen de perfil
router.get('/:rut/profile-image/download', async (req, res) => {
  try {
    const { rut } = req.params;

    // Verificar que el RUT existe en la base de datos
    const personCheck = await query(
      'SELECT rut, nombres FROM mantenimiento.personal_disponible WHERE rut = $1',
      [rut]
    );

    if (personCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Persona no encontrada'
      });
    }

    // Buscar imagen de perfil existente
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    let profileImagePath = null;

    for (const ext of allowedExtensions) {
      const imagePath = path.join(profilesDir, `${rut}${ext}`);
      if (fs.existsSync(imagePath)) {
        profileImagePath = imagePath;
        break;
      }
    }

    if (!profileImagePath) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró imagen de perfil para este usuario'
      });
    }

    // Enviar archivo
    const ext = path.extname(profileImagePath);
    const mimeType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    }[ext.toLowerCase()];

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${rut}${ext}"`);
    
    const fileStream = fs.createReadStream(profileImagePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error al descargar imagen de perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/personal/{rut}/profile-image - Eliminar imagen de perfil
router.delete('/:rut/profile-image', async (req, res) => {
  try {
    const { rut } = req.params;

    // Verificar que el RUT existe en la base de datos
    const personCheck = await query(
      'SELECT rut, nombres FROM mantenimiento.personal_disponible WHERE rut = $1',
      [rut]
    );

    if (personCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Persona no encontrada'
      });
    }

    // Buscar y eliminar imagen de perfil existente
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    let deleted = false;

    for (const ext of allowedExtensions) {
      const imagePath = path.join(profilesDir, `${rut}${ext}`);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró imagen de perfil para eliminar'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Imagen de perfil eliminada exitosamente',
      data: {
        rut: rut
      }
    });

  } catch (error) {
    console.error('Error al eliminar imagen de perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
