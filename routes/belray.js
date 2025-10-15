const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { query } = require('../config/database');

const router = express.Router();

// Ruta base para documentos de Belray
const BELRAY_DOCS_PATH = 'G:\\Unidades compartidas\\Unidad de Apoyo\\Belray\\Documentacion_Empresa';

// GET /api/belray - Listar todos los registros de Belray
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, activo, search } = req.query;
    const offset = (page - 1) * limit;

    console.log('📋 Obteniendo lista de registros Belray...');
    console.log(`   Página: ${page}, Límite: ${limit}`);
    console.log(`   Activo: ${activo}, Búsqueda: ${search}`);

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Filtro por estado activo
    if (activo !== undefined) {
      paramCount++;
      whereClause += ` AND activo = $${paramCount}`;
      params.push(activo === 'true');
    }

    // Filtro por búsqueda (incluyendo nuevas columnas)
    if (search) {
      paramCount++;
      whereClause += ` AND (nombre ILIKE $${paramCount} OR descripcion ILIKE $${paramCount} OR giro ILIKE $${paramCount} OR numero_telefono ILIKE $${paramCount} OR direccion ILIKE $${paramCount} OR razon_social ILIKE $${paramCount} OR rut_empresa ILIKE $${paramCount} OR comuna ILIKE $${paramCount} OR correo_electronico ILIKE $${paramCount} OR representante_legal ILIKE $${paramCount} OR gerente_general ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Consulta principal con todas las columnas
    const result = await query(`
      SELECT 
        id,
        nombre,
        descripcion,
        observaciones,
        giro,
        numero_telefono,
        direccion,
        razon_social,
        rut_empresa,
        comuna,
        correo_electronico,
        representante_legal,
        gerente_general,
        numero_trabajadores_obra,
        organismo_admin_ley_16744,
        numero_adherentes,
        tasa_siniestralidad_generica,
        tasa_siniestralidad_adicional,
        experto_prevencion_riesgos,
        supervisor_coordinador_obra
      FROM mantenimiento.belray 
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, limit, offset]);

    // Contar total de registros
    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM mantenimiento.belray 
      ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: 'Lista de registros Belray obtenida exitosamente',
      data: {
        registros: result.rows,
        paginacion: {
          pagina_actual: parseInt(page),
          total_paginas: totalPages,
          total_registros: total,
          registros_por_pagina: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo lista de Belray:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo lista de registros Belray',
      error: error.message
    });
  }
});

// GET /api/belray/:id - Obtener registro específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📋 Obteniendo registro Belray ID: ${id}`);

    const result = await query(`
      SELECT 
        id,
        nombre,
        descripcion,
        observaciones,
        giro,
        numero_telefono,
        direccion,
        razon_social,
        rut_empresa,
        comuna,
        correo_electronico,
        representante_legal,
        gerente_general,
        numero_trabajadores_obra,
        organismo_admin_ley_16744,
        numero_adherentes,
        tasa_siniestralidad_generica,
        tasa_siniestralidad_adicional,
        experto_prevencion_riesgos,
        supervisor_coordinador_obra
      FROM mantenimiento.belray 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro Belray no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Registro Belray obtenido exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error obteniendo registro Belray:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo registro Belray',
      error: error.message
    });
  }
});

// POST /api/belray - Crear nuevo registro
router.post('/', async (req, res) => {
  try {
    const { 
      nombre, 
      descripcion, 
      observaciones,
      giro,
      numero_telefono,
      direccion,
      razon_social,
      rut_empresa,
      comuna,
      correo_electronico,
      representante_legal,
      gerente_general,
      numero_trabajadores_obra,
      organismo_admin_ley_16744,
      numero_adherentes,
      tasa_siniestralidad_generica,
      tasa_siniestralidad_adicional,
      experto_prevencion_riesgos,
      supervisor_coordinador_obra
    } = req.body;

    console.log('📝 Creando nuevo registro Belray...');
    console.log(`   Nombre: ${nombre}`);

    // Validaciones
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    const result = await query(`
      INSERT INTO mantenimiento.belray (
        nombre, 
        descripcion, 
        observaciones,
        giro,
        numero_telefono,
        direccion,
        razon_social,
        rut_empresa,
        comuna,
        correo_electronico,
        representante_legal,
        gerente_general,
        numero_trabajadores_obra,
        organismo_admin_ley_16744,
        numero_adherentes,
        tasa_siniestralidad_generica,
        tasa_siniestralidad_adicional,
        experto_prevencion_riesgos,
        supervisor_coordinador_obra
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      nombre, descripcion, observaciones, giro, numero_telefono, direccion,
      razon_social, rut_empresa, comuna, correo_electronico, representante_legal,
      gerente_general, numero_trabajadores_obra, organismo_admin_ley_16744,
      numero_adherentes, tasa_siniestralidad_generica, tasa_siniestralidad_adicional,
      experto_prevencion_riesgos, supervisor_coordinador_obra
    ]);

    console.log(`✅ Registro Belray creado con ID: ${result.rows[0].id}`);

    res.status(201).json({
      success: true,
      message: 'Registro Belray creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando registro Belray:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando registro Belray',
      error: error.message
    });
  }
});

// PUT /api/belray/:id - Actualizar registro
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      observaciones,
      giro,
      numero_telefono,
      direccion,
      razon_social,
      rut_empresa,
      comuna,
      correo_electronico,
      representante_legal,
      gerente_general,
      numero_trabajadores_obra,
      organismo_admin_ley_16744,
      numero_adherentes,
      tasa_siniestralidad_generica,
      tasa_siniestralidad_adicional,
      experto_prevencion_riesgos,
      supervisor_coordinador_obra
    } = req.body;

    console.log(`📝 Actualizando registro Belray ID: ${id}`);

    // Verificar si el registro existe
    const existingRecord = await query(`
      SELECT id FROM mantenimiento.belray WHERE id = $1
    `, [id]);

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro Belray no encontrado'
      });
    }


    // Construir query dinámico
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (nombre !== undefined) {
      paramCount++;
      updates.push(`nombre = $${paramCount}`);
      params.push(nombre);
    }

    if (descripcion !== undefined) {
      paramCount++;
      updates.push(`descripcion = $${paramCount}`);
      params.push(descripcion);
    }



    if (observaciones !== undefined) {
      paramCount++;
      updates.push(`observaciones = $${paramCount}`);
      params.push(observaciones);
    }

    if (giro !== undefined) {
      paramCount++;
      updates.push(`giro = $${paramCount}`);
      params.push(giro);
    }

    if (numero_telefono !== undefined) {
      paramCount++;
      updates.push(`numero_telefono = $${paramCount}`);
      params.push(numero_telefono);
    }

    if (direccion !== undefined) {
      paramCount++;
      updates.push(`direccion = $${paramCount}`);
      params.push(direccion);
    }

    if (razon_social !== undefined) {
      paramCount++;
      updates.push(`razon_social = $${paramCount}`);
      params.push(razon_social);
    }

    if (rut_empresa !== undefined) {
      paramCount++;
      updates.push(`rut_empresa = $${paramCount}`);
      params.push(rut_empresa);
    }

    if (comuna !== undefined) {
      paramCount++;
      updates.push(`comuna = $${paramCount}`);
      params.push(comuna);
    }

    if (correo_electronico !== undefined) {
      paramCount++;
      updates.push(`correo_electronico = $${paramCount}`);
      params.push(correo_electronico);
    }

    if (representante_legal !== undefined) {
      paramCount++;
      updates.push(`representante_legal = $${paramCount}`);
      params.push(representante_legal);
    }

    if (gerente_general !== undefined) {
      paramCount++;
      updates.push(`gerente_general = $${paramCount}`);
      params.push(gerente_general);
    }

    if (numero_trabajadores_obra !== undefined) {
      paramCount++;
      updates.push(`numero_trabajadores_obra = $${paramCount}`);
      params.push(numero_trabajadores_obra);
    }

    if (organismo_admin_ley_16744 !== undefined) {
      paramCount++;
      updates.push(`organismo_admin_ley_16744 = $${paramCount}`);
      params.push(organismo_admin_ley_16744);
    }

    if (numero_adherentes !== undefined) {
      paramCount++;
      updates.push(`numero_adherentes = $${paramCount}`);
      params.push(numero_adherentes);
    }

    if (tasa_siniestralidad_generica !== undefined) {
      paramCount++;
      updates.push(`tasa_siniestralidad_generica = $${paramCount}`);
      params.push(tasa_siniestralidad_generica);
    }

    if (tasa_siniestralidad_adicional !== undefined) {
      paramCount++;
      updates.push(`tasa_siniestralidad_adicional = $${paramCount}`);
      params.push(tasa_siniestralidad_adicional);
    }

    if (experto_prevencion_riesgos !== undefined) {
      paramCount++;
      updates.push(`experto_prevencion_riesgos = $${paramCount}`);
      params.push(experto_prevencion_riesgos);
    }

    if (supervisor_coordinador_obra !== undefined) {
      paramCount++;
      updates.push(`supervisor_coordinador_obra = $${paramCount}`);
      params.push(supervisor_coordinador_obra);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }

    paramCount++;
    params.push(id);

    const result = await query(`
      UPDATE mantenimiento.belray 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, params);

    console.log(`✅ Registro Belray actualizado: ${id}`);

    res.json({
      success: true,
      message: 'Registro Belray actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando registro Belray:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando registro Belray',
      error: error.message
    });
  }
});

// DELETE /api/belray/:id - Eliminar registro
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Eliminando registro Belray ID: ${id}`);

    // Verificar si el registro existe
    const existingRecord = await query(`
      SELECT id FROM mantenimiento.belray WHERE id = $1
    `, [id]);

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro Belray no encontrado'
      });
    }

    const result = await query(`
      DELETE FROM mantenimiento.belray WHERE id = $1 RETURNING *
    `, [id]);

    console.log(`✅ Registro Belray eliminado: ${id}`);

    res.json({
      success: true,
      message: 'Registro Belray eliminado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error eliminando registro Belray:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando registro Belray',
      error: error.message
    });
  }
});

// GET /api/belray/estadisticas - Obtener estadísticas
router.get('/estadisticas/resumen', async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de Belray...');

    const stats = await query(`
      SELECT 
        COUNT(*) as total_registros,
        COUNT(*) FILTER (WHERE giro IS NOT NULL) as con_giro,
        COUNT(*) FILTER (WHERE numero_telefono IS NOT NULL) as con_telefono,
        COUNT(*) FILTER (WHERE direccion IS NOT NULL) as con_direccion
      FROM mantenimiento.belray
    `);

    res.json({
      success: true,
      message: 'Estadísticas de Belray obtenidas exitosamente',
      data: stats.rows[0]
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de Belray:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas de Belray',
      error: error.message
    });
  }
});

// Configuración de multer para subida de documentos de Belray
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const belrayId = req.params.id;
    const carpetaDestino = path.join(BELRAY_DOCS_PATH, `Belray_${belrayId}`);
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

// GET /api/belray/:id/documentos - Listar documentos de una empresa Belray
router.get('/:id/documentos', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📁 Obteniendo documentos para Belray ID: ${id}`);

    // Verificar que la empresa existe
    const empresa = await query(`
      SELECT id, nombre FROM mantenimiento.belray WHERE id = $1
    `, [id]);

    if (empresa.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa Belray no encontrada'
      });
    }

    const carpetaDocumentos = path.join(BELRAY_DOCS_PATH, `Belray_${id}`);

    try {
      await fs.access(carpetaDocumentos);
      const archivos = await fs.readdir(carpetaDocumentos);
      
      const documentosDetallados = [];
      for (const archivo of archivos) {
        const archivoPath = path.join(carpetaDocumentos, archivo);
        const archivoStats = await fs.stat(archivoPath);
        
        documentosDetallados.push({
          nombre: archivo,
          ruta: archivoPath,
          tamaño: archivoStats.size,
          creado: archivoStats.birthtime,
          modificado: archivoStats.mtime,
          es_directorio: archivoStats.isDirectory()
        });
      }

      res.json({
        success: true,
        message: 'Documentos obtenidos exitosamente',
        data: {
          empresa: empresa.rows[0],
          carpeta: carpetaDocumentos,
          total_documentos: documentosDetallados.length,
          documentos: documentosDetallados
        }
      });

    } catch (error) {
      // La carpeta no existe
      res.json({
        success: true,
        message: 'Carpeta de documentos no existe',
        data: {
          empresa: empresa.rows[0],
          carpeta: carpetaDocumentos,
          total_documentos: 0,
          documentos: []
        }
      });
    }

  } catch (error) {
    console.error('Error obteniendo documentos de Belray:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo documentos',
      error: error.message
    });
  }
});

// POST /api/belray/:id/documentos/subir - Subir documento a empresa Belray
router.post('/:id/documentos/subir', upload.single('archivo'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo'
      });
    }

    console.log(`📤 Documento subido para Belray ID: ${id}`);
    console.log(`   Archivo: ${req.file.originalname}`);
    console.log(`   Ruta: ${req.file.path}`);

    res.json({
      success: true,
      message: 'Documento subido exitosamente',
      data: {
        archivo_original: req.file.originalname,
        archivo_guardado: req.file.filename,
        ruta: req.file.path,
        tamaño: req.file.size
      }
    });

  } catch (error) {
    console.error('Error subiendo documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error subiendo documento',
      error: error.message
    });
  }
});

// GET /api/belray/:id/documentos/descargar/:archivo - Descargar documento
router.get('/:id/documentos/descargar/:archivo', async (req, res) => {
  try {
    const { id, archivo } = req.params;

    // Verificar que la empresa existe
    const empresa = await query(`
      SELECT id FROM mantenimiento.belray WHERE id = $1
    `, [id]);

    if (empresa.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa Belray no encontrada'
      });
    }

    const carpetaDocumentos = path.join(BELRAY_DOCS_PATH, `Belray_${id}`);
    const archivoPath = path.join(carpetaDocumentos, archivo);

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
    console.error('Error descargando documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error descargando documento',
      error: error.message
    });
  }
});

// DELETE /api/belray/:id/documentos/:archivo - Eliminar documento
router.delete('/:id/documentos/:archivo', async (req, res) => {
  try {
    const { id, archivo } = req.params;

    // Verificar que la empresa existe
    const empresa = await query(`
      SELECT id FROM mantenimiento.belray WHERE id = $1
    `, [id]);

    if (empresa.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa Belray no encontrada'
      });
    }

    const carpetaDocumentos = path.join(BELRAY_DOCS_PATH, `Belray_${id}`);
    const archivoPath = path.join(carpetaDocumentos, archivo);

    try {
      await fs.unlink(archivoPath);
      res.json({
        success: true,
        message: 'Documento eliminado exitosamente'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

  } catch (error) {
    console.error('Error eliminando documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando documento',
      error: error.message
    });
  }
});

// POST /api/belray/:id/documentos/crear-carpeta - Crear carpeta de documentos
router.post('/:id/documentos/crear-carpeta', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📁 Creando carpeta de documentos para Belray ID: ${id}`);

    // Verificar que la empresa existe
    const empresa = await query(`
      SELECT id, nombre FROM mantenimiento.belray WHERE id = $1
    `, [id]);

    if (empresa.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa Belray no encontrada'
      });
    }

    const carpetaDocumentos = path.join(BELRAY_DOCS_PATH, `Belray_${id}`);

    try {
      await fs.access(carpetaDocumentos);
      res.json({
        success: true,
        message: 'Carpeta de documentos ya existe',
        data: {
          empresa: empresa.rows[0],
          carpeta: carpetaDocumentos
        }
      });
    } catch (error) {
      // La carpeta no existe, crearla
      await fs.mkdir(carpetaDocumentos, { recursive: true });
      
      res.json({
        success: true,
        message: 'Carpeta de documentos creada exitosamente',
        data: {
          empresa: empresa.rows[0],
          carpeta: carpetaDocumentos
        }
      });
    }

  } catch (error) {
    console.error('Error creando carpeta de documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando carpeta de documentos',
      error: error.message
    });
  }
});

// POST /api/belray/documentos/crear-carpetas-todas - Crear carpetas de documentos para todas las empresas
router.post('/documentos/crear-carpetas-todas', async (req, res) => {
  try {
    console.log('📁 Creando carpetas de documentos para todas las empresas Belray...');
    
    // Obtener todas las empresas Belray
    const empresasResult = await query(`
      SELECT id, nombre, giro, numero_telefono, direccion
      FROM mantenimiento.belray
      ORDER BY id
    `);
    
    const resultados = [];
    
    // Crear carpeta base si no existe
    try {
      await fs.mkdir(BELRAY_DOCS_PATH, { recursive: true });
      console.log(`✅ Carpeta base creada: ${BELRAY_DOCS_PATH}`);
    } catch (error) {
      console.log(`📁 Carpeta base ya existe: ${BELRAY_DOCS_PATH}`);
    }
    
    for (const empresa of empresasResult.rows) {
      const carpetaEmpresa = path.join(BELRAY_DOCS_PATH, `Belray_${empresa.id}`);
      
      try {
        // Verificar si la carpeta ya existe
        await fs.access(carpetaEmpresa);
        console.log(`📁 Carpeta ya existe para ${empresa.nombre} (ID: ${empresa.id})`);
        
        resultados.push({
          empresa: empresa,
          resultado: { 
            success: true, 
            message: 'Carpeta ya existe', 
            path: carpetaEmpresa 
          }
        });
      } catch (error) {
        // La carpeta no existe, crearla
        try {
          await fs.mkdir(carpetaEmpresa, { recursive: true });
          console.log(`✅ Carpeta creada para ${empresa.nombre} (ID: ${empresa.id})`);
          
          resultados.push({
            empresa: empresa,
            resultado: { 
              success: true, 
              message: 'Carpeta creada exitosamente', 
              path: carpetaEmpresa 
            }
          });
        } catch (createError) {
          console.error(`❌ Error creando carpeta para ${empresa.nombre} (ID: ${empresa.id}):`, createError);
          
          resultados.push({
            empresa: empresa,
            resultado: { 
              success: false, 
              message: 'Error creando carpeta', 
              error: createError.message 
            }
          });
        }
      }
    }
    
    const exitosos = resultados.filter(r => r.resultado.success).length;
    const fallidos = resultados.filter(r => !r.resultado.success).length;
    
    res.json({
      success: true,
      message: `Proceso de creación de carpetas completado: ${exitosos} exitosos, ${fallidos} fallidos`,
      data: {
        total_empresas: empresasResult.rows.length,
        carpetas_creadas: exitosos,
        carpetas_fallidas: fallidos,
        carpeta_base: BELRAY_DOCS_PATH,
        resultados: resultados
      }
    });
    
  } catch (error) {
    console.error('Error creando carpetas de documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando carpetas de documentos',
      error: error.message
    });
  }
});

module.exports = router;
