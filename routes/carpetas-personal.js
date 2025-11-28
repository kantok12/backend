const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const multer = require('multer');
const { query } = require('../config/database');

const router = express.Router();

// Ruta base para las carpetas del personal (Google Drive)
const BASE_PATH = 'G:\\Unidades compartidas\\Unidad de Apoyo\\Personal';

function sanitizeFolderName(name) {
  if (!name) return '';
  // Remove characters invalid for Windows filenames and trim
  return name.replace(/[<>:\\"/\\|?*\x00-\x1F]/g, '').trim();
}

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
    const rut = req.params.rut || 'unknown';
    const subcarpeta = req.body.subcarpeta || 'documentos';
    const nombresRaw = req.body.nombres || '';
    const nombreCarpeta = `${sanitizeFolderName(nombresRaw)} - ${rut}`.trim();
    const carpetaDestino = path.join(BASE_PATH, nombreCarpeta, subcarpeta);

    try {
      if (!fsSync.existsSync(carpetaDestino)) {
        fsSync.mkdirSync(carpetaDestino, { recursive: true });
      }
      cb(null, carpetaDestino);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const nombreOriginal = file.originalname || 'file';
    const extension = path.extname(nombreOriginal);
    const nombreSinExtension = path.basename(nombreOriginal, extension).replace(/[^a-zA-Z0-9-_. ]/g, '');
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
router.post('/:rut/subir', (req, res) => {
  // Primero, obtener información del personal y crear/verificar carpeta
  (async () => {
    try {
      const { rut } = req.params;
      const personalInfo = await obtenerPersonalPorRut(rut);
      if (!personalInfo.success) {
        return res.status(404).json({ success: false, message: personalInfo.message });
      }

      const { nombres } = personalInfo.data;
      // Crear/verificar carpeta principal y subcarpetas
      const crearRes = await crearCarpetaPersonal(rut, nombres);
      if (!crearRes.success) {
        console.warn('No se pudo crear/verificar carpeta antes de la subida:', crearRes.error || crearRes.message);
      }

      // Llamar al handler de multer y continuar con la subida
      upload.single('archivo')(req, res, function (err) {
        if (err) {
          console.error('Error en multer al subir archivo:', err);
          if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: err.message, code: err.code });
          }
          return res.status(400).json({ success: false, message: err.message });
        }

        (async () => {
          try {
            if (!req.file) {
              return res.status(400).json({ success: false, message: 'No se proporcionó archivo' });
            }

            const { subcarpeta } = req.body;
            console.log(`📤 Archivo subido para RUT: ${rut}`);
            console.log(`   Archivo: ${req.file.originalname}`);
            console.log(`   Subcarpeta: ${subcarpeta || 'documentos'}`);
            console.log(`   Ruta: ${req.file.path}`);

            // Guardar metadata en la tabla mantenimiento.documentos
            try {
              const nombreDocumento = req.body.nombre_documento || (req.file.originalname || 'Archivo subido');
              const tipoDocumento = req.body.tipo_documento || 'upload';
              const fechaEmision = req.body.fecha_emision || null;
              const fechaVencimiento = req.body.fecha_vencimiento || null;
              const diasValidez = req.body.dias_validez || null;
              const institucion = req.body.institucion_emisora || null;
              const subidoPor = req.body.subido_por || req.body.usuario || 'sistema';

              const insertResult = await query(`
                INSERT INTO mantenimiento.documentos (
                  rut_persona, nombre_documento, tipo_documento, nombre_archivo, nombre_original,
                  tipo_mime, tamaño_bytes, ruta_archivo, descripcion, subido_por,
                  fecha_emision, fecha_vencimiento, dias_validez, institucion_emisora
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
                RETURNING *
              `, [
                rut,
                nombreDocumento,
                tipoDocumento,
                req.file.filename,
                req.file.originalname,
                req.file.mimetype,
                req.file.size,
                req.file.path,
                req.body.descripcion || null,
                subidoPor,
                fechaEmision,
                fechaVencimiento,
                diasValidez,
                institucion
              ]);

              console.log('✅ Metadata guardada en mantenimiento.documentos ID:', insertResult.rows[0].id);
            } catch (dbErr) {
              console.error('❌ Error guardando metadata en mantenimiento.documentos:', dbErr);
              // No hacemos rollback del archivo físico; solo registramos el error
            }

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

          } catch (innerErr) {
            console.error('Error procesando archivo subido:', innerErr);
            res.status(500).json({ success: false, message: 'Error procesando archivo', error: innerErr.message });
          }
        })();
      });

    } catch (error) {
      console.error('Error preparando subida de archivo:', error);
      res.status(500).json({ success: false, message: 'Error preparando subida', error: error.message });
    }
  })();
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

// Exponer función para que otros módulos puedan crear/verificar carpetas
router.crearCarpetaPersonal = crearCarpetaPersonal;

module.exports = router;
