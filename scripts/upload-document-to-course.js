const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const multer = require('multer');

// Configuración de multer para subida desde servidor
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documentos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
  }
});

async function uploadDocumentToCourse() {
  console.log('📁 HERRAMIENTA DE SUBIDA DE DOCUMENTOS DESDE SERVIDOR');
  console.log('=====================================================');
  
  try {
    // 1. Obtener cursos disponibles
    console.log('\n🔍 Obteniendo cursos disponibles...');
    const cursosResult = await pool.query(`
      SELECT DISTINCT curso, COUNT(*) as cantidad_personas
      FROM mantenimiento.personal_disponible 
      WHERE curso IS NOT NULL AND curso != ''
      ORDER BY curso
    `);
    
    if (cursosResult.rows.length === 0) {
      console.log('❌ No se encontraron cursos en la base de datos');
      return;
    }
    
    console.log('\n📚 CURSOS DISPONIBLES:');
    console.log('======================');
    cursosResult.rows.forEach((curso, index) => {
      console.log(`${index + 1}. ${curso.curso} (${curso.cantidad_personas} personas)`);
    });
    
    // 2. Obtener RUTs de un curso específico
    const cursoSeleccionado = 'personal de servicio'; // Puedes cambiar esto
    console.log(`\n🎯 Buscando personas del curso: "${cursoSeleccionado}"`);
    
    const personasResult = await pool.query(`
      SELECT rut, nombre, cargo, zona_geografica
      FROM mantenimiento.personal_disponible 
      WHERE LOWER(curso) = LOWER($1)
      ORDER BY nombre
    `, [cursoSeleccionado]);
    
    if (personasResult.rows.length === 0) {
      console.log(`❌ No se encontraron personas para el curso "${cursoSeleccionado}"`);
      console.log('\n💡 Cursos disponibles:');
      cursosResult.rows.forEach(curso => console.log(`   - ${curso.curso}`));
      return;
    }
    
    console.log(`\n👥 PERSONAS ENCONTRADAS (${personasResult.rows.length}):`);
    console.log('==========================================');
    personasResult.rows.forEach((persona, index) => {
      console.log(`${index + 1}. ${persona.rut} - ${persona.nombre || 'Sin nombre'} (${persona.cargo || 'Sin cargo'})`);
    });
    
    // 3. Crear documento de ejemplo para el curso
    const documentContent = `CERTIFICADO DE CURSO - ${cursoSeleccionado.toUpperCase()}
===============================================

Fecha: ${new Date().toLocaleDateString('es-CL')}
Curso: ${cursoSeleccionado}
Institución: Centro de Capacitación
Duración: 40 horas
Modalidad: Presencial

CONTENIDOS DEL CURSO:
- Módulo 1: Fundamentos del servicio
- Módulo 2: Atención al cliente
- Módulo 3: Protocolos de seguridad
- Módulo 4: Herramientas de trabajo

EVALUACIÓN:
- Examen teórico: Aprobado
- Evaluación práctica: Aprobado
- Nota final: 6.5

Este certificado acredita que el participante ha completado 
satisfactoriamente el curso de "${cursoSeleccionado}".

Firma digital: [SISTEMA DE MANTENIMIENTO]
Fecha de emisión: ${new Date().toISOString()}
`;
    
    // 4. Crear archivo temporal
    const tempFileName = `certificado_${cursoSeleccionado.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    const tempFilePath = path.join(__dirname, tempFileName);
    fs.writeFileSync(tempFilePath, documentContent);
    
    console.log(`\n📄 Documento creado: ${tempFileName}`);
    
    // 5. Subir documento para cada persona del curso
    console.log('\n📤 Subiendo documentos para cada persona...');
    
    let documentosSubidos = 0;
    let errores = 0;
    
    for (const persona of personasResult.rows) {
      try {
        // Leer el archivo
        const fileBuffer = fs.readFileSync(tempFilePath);
        const fileName = `certificado_${persona.rut.replace(/-/g, '_')}_${Date.now()}.txt`;
        const uploadPath = path.join(__dirname, '../uploads/documentos', fileName);
        
        // Crear directorio si no existe
        const uploadDir = path.dirname(uploadPath);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Guardar archivo
        fs.writeFileSync(uploadPath, fileBuffer);
        
        // Insertar en base de datos
        const insertResult = await pool.query(`
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
            fecha_subida, 
            subido_por, 
            activo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `, [
          persona.rut,
          `Certificado - ${cursoSeleccionado}`,
          'certificado_curso',
          fileName,
          tempFileName,
          'text/plain',
          fileBuffer.length,
          uploadPath,
          `Certificado del curso "${cursoSeleccionado}" para ${persona.nombre || persona.rut}`,
          new Date(),
          'SISTEMA_SERVIDOR',
          true
        ]);
        
        console.log(`   ✅ ${persona.rut}: Documento subido (ID: ${insertResult.rows[0].id})`);
        documentosSubidos++;
        
      } catch (error) {
        console.log(`   ❌ ${persona.rut}: Error - ${error.message}`);
        errores++;
      }
    }
    
    // 6. Limpiar archivo temporal
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    // 7. Resumen final
    console.log('\n📊 RESUMEN DE SUBIDA:');
    console.log('=====================');
    console.log(`✅ Documentos subidos exitosamente: ${documentosSubidos}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📚 Curso: ${cursoSeleccionado}`);
    console.log(`👥 Total personas: ${personasResult.rows.length}`);
    
    if (documentosSubidos > 0) {
      console.log('\n🎉 ¡DOCUMENTOS DISPONIBLES PARA DESCARGA!');
      console.log('=========================================');
      console.log('Ahora puedes descargar documentos para el curso "personal de servicio"');
      console.log('\n🔗 Endpoints disponibles:');
      console.log('   - GET /api/documentos (listar todos)');
      console.log('   - GET /api/documentos/persona/{RUT} (por persona)');
      console.log('   - GET /api/documentos/{ID}/descargar (descargar archivo)');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la función
uploadDocumentToCourse();
