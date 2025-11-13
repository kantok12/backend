const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');

const router = express.Router();

// Crear directorio de perfiles si no existe
const googleDriveDir = 'G:\\Unidades compartidas\\Unidad de Apoyo\\Personal';
// Directorio local para uploads de imágenes de perfil (coincide con `profile-photos`)
const profilesDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

// Configuración de almacenamiento para imágenes de perfil
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { rut } = req.params;
    // Obtener nombre completo desde la base de datos
    let nombreCompleto = rut;
    try {
      const result = await query(
        'SELECT nombres FROM mantenimiento.personal_disponible WHERE rut = $1',
        [rut]
      );
      if (result.rows.length > 0) {
        nombreCompleto = result.rows[0].nombres.trim();
      }
    } catch (err) {
      // Si falla, usar solo rut
    }
    const folderName = `${nombreCompleto} - ${rut}`;
    const userDir = path.join('G:/Unidades compartidas/Unidad de Apoyo/Personal', folderName);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'foto.jpg'); // Siempre guardar como foto.jpg
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

// POST /api/personal/{rut}/upload - Subir imagen de perfil
router.post('/:rut/upload', uploadProfileImage, handleUploadError, async (req, res) => {
  try {
    const { rut } = req.params;
    // Obtener nombre completo desde la base de datos
    let nombreCompleto = rut;
    try {
      const result = await query(
        'SELECT nombres FROM mantenimiento.personal_disponible WHERE rut = $1',
        [rut]
      );
      if (result.rows.length > 0) {
        nombreCompleto = result.rows[0].nombres.trim();
      }
    } catch (err) {
      // Si falla, usar solo rut
    }
    const folderName = `${nombreCompleto} - ${rut}`;
    const userDir = path.join('G:/Unidades compartidas/Unidad de Apoyo/Personal', folderName);
    const imagePath = path.join(userDir, 'foto.jpg');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo de imagen'
      });
    }

    // Si ya existe una foto, se reemplaza automáticamente por multer
    // Confirmar que la imagen se guardó correctamente
    if (!fs.existsSync(imagePath)) {
      return res.status(500).json({
        success: false,
        message: 'Error al guardar la imagen de perfil'
      });
    }

    // Eliminar otras imágenes antiguas en la carpeta del usuario (otras extensiones)
    try {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const files = fs.readdirSync(userDir);
      files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        const filePath = path.join(userDir, file);
        // eliminar cualquier imagen que no sea la foto actual (foto.jpg)
        if (allowedExtensions.includes(ext) && file !== 'foto.jpg') {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Error eliminando archivo antiguo de perfil:', filePath, err);
          }
        }
      });
    } catch (err) {
      // No bloquear la subida si falla la limpieza
      console.error('Error limpiando imágenes antiguas en userDir:', userDir, err);
    }

    // Construir URL pública de la imagen para el frontend
    const profileImageUrl = `http://localhost:3000/api/personal/${rut}/image/download`;

    res.status(200).json({
      success: true,
      message: 'Imagen de perfil actualizada exitosamente',
      data: {
        profile_image_url: profileImageUrl,
        rut: rut,
        filename: 'foto.jpg',
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/personal/{rut}/profile-image - Subir imagen de perfil (compatibilidad)
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

    // Construir URL pública de la imagen para el frontend
    const profileImageUrl = `http://localhost:3000/api/personal/${rut}/image/download`;

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

// GET /api/personal/{rut}/image - Obtener imagen de perfil (compatible con documentación)
router.get('/:rut/image', async (req, res) => {
  try {
    const { rut } = req.params;
    const imagePath = path.join('G:/Unidades compartidas/Unidad de Apoyo/Personal', rut, 'foto.jpg');
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró imagen de perfil para este usuario'
      });
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="foto.jpg"`);
    fs.createReadStream(imagePath).pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// HEAD /api/personal/{rut}/image - Verificar si existe imagen (compatible con documentación)
router.head('/:rut/image', async (req, res) => {
  try {
    const { rut } = req.params;

    // Verificar que el RUT existe en el sistema (usuarios o personal)
    const userCheck = await query(
      'SELECT id FROM sistema.usuarios WHERE rut = $1',
      [rut]
    );
    const personalCheck = await query(
      'SELECT rut FROM mantenimiento.personal_disponible WHERE rut = $1',
      [rut]
    );

    if (userCheck.rows.length === 0 && personalCheck.rows.length === 0) {
      return res.status(404).end();
    }

    // Buscar imagen de perfil existente
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    let exists = false;

    for (const ext of allowedExtensions) {
      const imagePath = path.join(profilesDir, `${rut}${ext}`);
      if (fs.existsSync(imagePath)) {
        exists = true;
        break;
      }
    }

    if (exists) {
      res.status(200).end();
    } else {
      res.status(404).end();
    }

  } catch (error) {
    console.error('Error al verificar imagen de perfil:', error);
    res.status(500).end();
  }
});

// GET /api/personal/{rut}/image/download - Descargar imagen de perfil (compatible con documentación)
router.get('/:rut/image/download', async (req, res) => {
  try {
    const { rut } = req.params;
    // Obtener nombre completo desde la base de datos
    let nombreCompleto = rut;
    try {
      const result = await query(
        'SELECT nombres FROM mantenimiento.personal_disponible WHERE rut = $1',
        [rut]
      );
      if (result.rows.length > 0) {
        nombreCompleto = result.rows[0].nombres.trim();
      }
    } catch (err) {
      // Si falla, usar solo rut
    }
    const folderName = `${nombreCompleto} - ${rut}`;
    const imagePath = path.join('G:/Unidades compartidas/Unidad de Apoyo/Personal', folderName, 'foto.jpg');
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró imagen de perfil para este usuario'
      });
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="foto.jpg"`);
    fs.createReadStream(imagePath).pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/personal/{rut}/profile-image - Obtener imagen de perfil (compatibilidad)
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

// DELETE /api/personal/{rut}/image - Eliminar imagen de perfil (compatible con documentación)
router.delete('/:rut/image', async (req, res) => {
  try {
    const { rut } = req.params;

    // Verificar que el RUT existe en el sistema (usuarios o personal)
    const userCheck = await query(
      'SELECT id, nombre, apellido FROM sistema.usuarios WHERE rut = $1',
      [rut]
    );
    const personalCheck = await query(
      'SELECT rut, nombres FROM mantenimiento.personal_disponible WHERE rut = $1',
      [rut]
    );

    if (userCheck.rows.length === 0 && personalCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'RUT no encontrado en el sistema'
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

    // Limpiar profile_image_url en usuarios del sistema si existe
    if (userCheck.rows.length > 0) {
      await query(
        'UPDATE sistema.usuarios SET profile_image_url = NULL WHERE rut = $1',
        [rut]
      );
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

// DELETE /api/personal/{rut}/profile-image - Eliminar imagen de perfil (compatibilidad)
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
