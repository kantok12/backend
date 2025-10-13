const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { query } = require('../config/database');

const router = express.Router();

// Ruta base para las carpetas del personal (Google Drive)
const BASE_PATH = 'G:\\Unidades compartidas\\Unidad de Apoyo\\Personal';

/**
 * Función para obtener información del personal por RUT
 */
async function obtenerPersonalPorRut(rut) {
  try {
    const result = await query(`
      SELECT rut, nombres, cargo, correo_electronico, telefono
      FROM mantenimiento.personal_disponible 
      WHERE rut = $1
    `, [rut]);
    
    if (result.rows.length === 0) {
      return { success: false, message: 'Personal no encontrado' };
    }
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error obteniendo personal:', error);
    return { success: false, message: 'Error consultando base de datos', error: error.message };
  }
}

/**
 * Función para crear la carpeta del personal con subcarpetas
 */
async function crearCarpetaPersonal(rut, nombres) {
  try {
    // Crear nombre de carpeta con formato "Nombre - RUT"
    const nombreCarpeta = `${nombres} - ${rut}`;
    const carpetaPersonal = path.join(BASE_PATH, nombreCarpeta);
    
    // Verificar si la carpeta ya existe
    try {
      await fs.access(carpetaPersonal);
      console.log(`✅ Carpeta ya existe para: ${nombres} (${rut})`);
      
      // Verificar y crear subcarpetas si no existen
      await crearSubcarpetas(carpetaPersonal);
      
      return { success: true, message: 'Carpeta ya existe', path: carpetaPersonal };
    } catch (error) {
      // La carpeta no existe, crearla
      await fs.mkdir(carpetaPersonal, { recursive: true });
      console.log(`✅ Carpeta creada para: ${nombres} (${rut}) en: ${carpetaPersonal}`);
      
      // Crear subcarpetas automáticamente
      await crearSubcarpetas(carpetaPersonal);
      
      return { success: true, message: 'Carpeta creada exitosamente', path: carpetaPersonal };
    }
  } catch (error) {
    console.error(`❌ Error creando carpeta para ${nombres} (${rut}):`, error);
    return { success: false, message: 'Error creando carpeta', error: error.message };
  }
}

/**
 * Función para crear subcarpetas (documentos y cursos_certificados)
 */
async function crearSubcarpetas(carpetaPersonal) {
  try {
    const subcarpetas = ['documentos', 'cursos_certificados'];
    
    for (const subcarpeta of subcarpetas) {
      const rutaSubcarpeta = path.join(carpetaPersonal, subcarpeta);
      
      try {
        await fs.access(rutaSubcarpeta);
        console.log(`   📁 Subcarpeta "${subcarpeta}" ya existe`);
      } catch (error) {
        await fs.mkdir(rutaSubcarpeta, { recursive: true });
        console.log(`   📁 Subcarpeta "${subcarpeta}" creada`);
      }
    }
  } catch (error) {
    console.error(`❌ Error creando subcarpetas:`, error);
  }
}

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const rut = req.params.rut;
    const subcarpeta = req.body.subcarpeta || 'documentos';
    const carpetaDestino = path.join(BASE_PATH, `${req.body.nombres} - ${rut}`, subcarpeta);
    cb(null, carpetaDestino);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const nombreOriginal = file.originalname;
    const extension = path.extname(nombreOriginal);
    const nombreSinExtension = path.basename(nombreOriginal, extension);
    const nombreArchivo = `${nombreSinExtension}_${timestamp}${extension}`;
    cb(null, nombreArchivo);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB límite
  }
});

// GET /api/carpetas-personal - Listar todo el personal
router.get('/', async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de personal...');
    
    const result = await query(`
      SELECT rut, nombres, cargo, correo_electronico, telefono
      FROM mantenimiento.personal_disponible 
      ORDER BY nombres
    `);
    
    const personalConCarpetas = [];
    
    for (const persona of result.rows) {
      const nombreCarpeta = `${persona.nombres} - ${persona.rut}`;
      const carpetaPersonal = path.join(BASE_PATH, nombreCarpeta);
      
      try {
        await fs.access(carpetaPersonal);
        const stats = await fs.stat(carpetaPersonal);
        
        personalConCarpetas.push({
          ...persona,
          carpeta: {
            existe: true,
            ruta: carpetaPersonal,
            creada: stats.birthtime,
            modificada: stats.mtime
          }
        });
      } catch (error) {
        personalConCarpetas.push({
          ...persona,
          carpeta: {
            existe: false,
            ruta: carpetaPersonal
          }
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Lista de personal obtenida exitosamente',
      data: {
        total_personal: result.rows.length,
        carpetas_existentes: personalConCarpetas.filter(p => p.carpeta.existe).length,
        carpetas_faltantes: personalConCarpetas.filter(p => !p.carpeta.existe).length,
        personal: personalConCarpetas
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo lista de personal:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo lista de personal',
      error: error.message
    });
  }
});

// GET /api/carpetas-personal/:rut - Obtener información de carpeta específica
router.get('/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    
    console.log(`📁 Obteniendo información de carpeta para RUT: ${rut}`);
    
    // Obtener información del personal
    const personalInfo = await obtenerPersonalPorRut(rut);
    if (!personalInfo.success) {
      return res.status(404).json({
        success: false,
        message: personalInfo.message
      });
    }
    
    const { nombres } = personalInfo.data;
    const nombreCarpeta = `${nombres} - ${rut}`;
    const carpetaPersonal = path.join(BASE_PATH, nombreCarpeta);
    
    try {
      // Verificar si la carpeta existe
      await fs.access(carpetaPersonal);
      
      // Obtener información detallada de la carpeta
      const stats = await fs.stat(carpetaPersonal);
      const archivos = await fs.readdir(carpetaPersonal);
      
      // Obtener información detallada de cada archivo
      const archivosDetallados = [];
      for (const archivo of archivos) {
        const archivoPath = path.join(carpetaPersonal, archivo);
        const archivoStats = await fs.stat(archivoPath);
        
        let contenidoSubcarpeta = [];
        if (archivoStats.isDirectory()) {
          try {
            const archivosSubcarpeta = await fs.readdir(archivoPath);
            contenidoSubcarpeta = archivosSubcarpeta;
          } catch (error) {
            contenidoSubcarpeta = [];
          }
        }
        
        archivosDetallados.push({
          nombre: archivo,
          ruta: archivoPath,
          tamaño: archivoStats.size,
          creado: archivoStats.birthtime,
          modificado: archivoStats.mtime,
          es_directorio: archivoStats.isDirectory(),
          contenido: contenidoSubcarpeta
        });
      }
      
      res.json({
        success: true,
        message: 'Información de carpeta obtenida exitosamente',
        data: {
          personal: personalInfo.data,
          carpeta: {
            existe: true,
            ruta: carpetaPersonal,
            creada: stats.birthtime,
            modificada: stats.mtime,
            total_archivos: archivos.length,
            archivos: archivosDetallados
          }
        }
      });
      
    } catch (error) {
      // La carpeta no existe
      res.json({
        success: true,
        message: 'Carpeta no existe',
        data: {
          personal: personalInfo.data,
          carpeta: {
            existe: false,
            ruta: carpetaPersonal
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Error obteniendo información de carpeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información de carpeta',
      error: error.message
    });
  }
});

// POST /api/carpetas-personal/:rut/crear - Crear carpeta para personal específico
router.post('/:rut/crear', async (req, res) => {
  try {
    const { rut } = req.params;
    
    console.log(`📁 Creando carpeta para RUT: ${rut}`);
    
    // Obtener información del personal
    const personalInfo = await obtenerPersonalPorRut(rut);
    if (!personalInfo.success) {
      return res.status(404).json({
        success: false,
        message: personalInfo.message
      });
    }
    
    const { nombres } = personalInfo.data;
    
    // Crear la carpeta
    const resultado = await crearCarpetaPersonal(rut, nombres);
    
    if (resultado.success) {
      res.json({
        success: true,
        message: resultado.message,
        data: {
          personal: personalInfo.data,
          carpeta: {
            ruta: resultado.path,
            creada: new Date()
          }
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: resultado.message,
        error: resultado.error
      });
    }
    
  } catch (error) {
    console.error('Error creando carpeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando carpeta',
      error: error.message
    });
  }
});

// POST /api/carpetas-personal/crear-todas - Crear carpetas para todo el personal
router.post('/crear-todas', async (req, res) => {
  try {
    console.log('📁 Creando carpetas para todo el personal...');
    
    // Obtener todo el personal
    const personalResult = await query(`
      SELECT rut, nombres
      FROM mantenimiento.personal_disponible 
      ORDER BY nombres
    `);
    
    const resultados = [];
    
    for (const persona of personalResult.rows) {
      const resultado = await crearCarpetaPersonal(persona.rut, persona.nombres);
      resultados.push({
        personal: persona,
        resultado: resultado
      });
    }
    
    const exitosos = resultados.filter(r => r.resultado.success).length;
    const fallidos = resultados.filter(r => !r.resultado.success).length;
    
    res.json({
      success: true,
      message: `Proceso completado: ${exitosos} exitosos, ${fallidos} fallidos`,
      data: {
        total_personal: personalResult.rows.length,
        carpetas_creadas: exitosos,
        carpetas_fallidas: fallidos,
        resultados: resultados
      }
    });
    
  } catch (error) {
    console.error('Error creando carpetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando carpetas',
      error: error.message
    });
  }
});

// POST /api/carpetas-personal/crear-subcarpetas-todas - Crear subcarpetas en todas las carpetas
router.post('/crear-subcarpetas-todas', async (req, res) => {
  try {
    console.log('📁 Creando subcarpetas en todas las carpetas del personal...');
    
    // Obtener todo el personal
    const personalResult = await query(`
      SELECT rut, nombres
      FROM mantenimiento.personal_disponible 
      ORDER BY nombres
    `);
    
    const resultados = [];
    
    for (const persona of personalResult.rows) {
      const nombreCarpeta = `${persona.nombres} - ${persona.rut}`;
      const carpetaPersonal = path.join(BASE_PATH, nombreCarpeta);
      
      try {
        // Verificar si la carpeta principal existe
        await fs.access(carpetaPersonal);
        
        // Crear subcarpetas
        await crearSubcarpetas(carpetaPersonal);
        
        resultados.push({
          personal: persona,
          resultado: { success: true, message: 'Subcarpetas creadas/verificadas', path: carpetaPersonal }
        });
        
      } catch (error) {
        resultados.push({
          personal: persona,
          resultado: { success: false, message: 'Carpeta principal no existe', error: error.message }
        });
      }
    }
    
    const exitosos = resultados.filter(r => r.resultado.success).length;
    const fallidos = resultados.filter(r => !r.resultado.success).length;
    
    res.json({
      success: true,
      message: `Proceso de subcarpetas completado: ${exitosos} exitosos, ${fallidos} fallidos`,
      data: {
        total_personal: personalResult.rows.length,
        subcarpetas_creadas: exitosos,
        subcarpetas_fallidas: fallidos,
        resultados: resultados
      }
    });
    
  } catch (error) {
    console.error('Error creando subcarpetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando subcarpetas',
      error: error.message
    });
  }
});

// POST /api/carpetas-personal/:rut/subir - Subir archivo a carpeta específica
router.post('/:rut/subir', upload.single('archivo'), async (req, res) => {
  try {
    const { rut } = req.params;
    const { subcarpeta } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo'
      });
    }
    
    console.log(`📤 Archivo subido para RUT: ${rut}`);
    console.log(`   Archivo: ${req.file.originalname}`);
    console.log(`   Subcarpeta: ${subcarpeta || 'documentos'}`);
    console.log(`   Ruta: ${req.file.path}`);
    
    res.json({
      success: true,
      message: 'Archivo subido exitosamente',
      data: {
        archivo_original: req.file.originalname,
        archivo_guardado: req.file.filename,
        ruta: req.file.path,
        tamaño: req.file.size,
        subcarpeta: subcarpeta || 'documentos'
      }
    });
    
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error subiendo archivo',
      error: error.message
    });
  }
});

// GET /api/carpetas-personal/:rut/descargar/:archivo - Descargar archivo
router.get('/:rut/descargar/:archivo', async (req, res) => {
  try {
    const { rut, archivo } = req.params;
    const { subcarpeta } = req.query;
    
    // Obtener información del personal
    const personalInfo = await obtenerPersonalPorRut(rut);
    if (!personalInfo.success) {
      return res.status(404).json({
        success: false,
        message: personalInfo.message
      });
    }
    
    const { nombres } = personalInfo.data;
    const nombreCarpeta = `${nombres} - ${rut}`;
    const carpetaDestino = subcarpeta ? 
      path.join(BASE_PATH, nombreCarpeta, subcarpeta) : 
      path.join(BASE_PATH, nombreCarpeta);
    
    const archivoPath = path.join(carpetaDestino, archivo);
    
    try {
      await fs.access(archivoPath);
      res.download(archivoPath);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }
    
  } catch (error) {
    console.error('Error descargando archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error descargando archivo',
      error: error.message
    });
  }
});

// DELETE /api/carpetas-personal/:rut/archivo/:archivo - Eliminar archivo
router.delete('/:rut/archivo/:archivo', async (req, res) => {
  try {
    const { rut, archivo } = req.params;
    const { subcarpeta } = req.query;
    
    // Obtener información del personal
    const personalInfo = await obtenerPersonalPorRut(rut);
    if (!personalInfo.success) {
      return res.status(404).json({
        success: false,
        message: personalInfo.message
      });
    }
    
    const { nombres } = personalInfo.data;
    const nombreCarpeta = `${nombres} - ${rut}`;
    const carpetaDestino = subcarpeta ? 
      path.join(BASE_PATH, nombreCarpeta, subcarpeta) : 
      path.join(BASE_PATH, nombreCarpeta);
    
    const archivoPath = path.join(carpetaDestino, archivo);
    
    try {
      await fs.unlink(archivoPath);
      res.json({
        success: true,
        message: 'Archivo eliminado exitosamente'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }
    
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando archivo',
      error: error.message
    });
  }
});

module.exports = router;
