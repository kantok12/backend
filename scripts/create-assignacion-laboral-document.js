const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function createAssignacionLaboralDocument() {
  console.log('📁 CREANDO DOCUMENTO PARA CURSO "ASIGNACIÓN LABORAL"');
  console.log('====================================================');
  
  try {
    // 1. Verificar documentos existentes
    console.log('\n🔍 Verificando documentos existentes...');
    const existingDocs = await pool.query(`
      SELECT id, nombre_documento, tipo_documento, rut_persona, nombre_archivo
      FROM mantenimiento.documentos 
      WHERE activo = true
      ORDER BY fecha_subida DESC
    `);
    
    console.log(`📋 Documentos existentes: ${existingDocs.rows.length}`);
    existingDocs.rows.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.nombre_documento} (${doc.tipo_documento}) - ${doc.rut_persona}`);
    });
    
    // 2. Buscar si ya existe un documento para "asignación laboral"
    const assignacionDoc = existingDocs.rows.find(doc => 
      doc.nombre_documento.toLowerCase().includes('asignacion') ||
      doc.nombre_documento.toLowerCase().includes('laboral')
    );
    
    if (assignacionDoc) {
      console.log(`\n✅ Ya existe documento para asignación laboral: ${assignacionDoc.nombre_documento}`);
      console.log(`   ID: ${assignacionDoc.id}`);
      console.log(`   Archivo: ${assignacionDoc.nombre_archivo}`);
      console.log(`   RUT: ${assignacionDoc.rut_persona}`);
      return;
    }
    
    // 3. Obtener personas disponibles para asociar el documento
    console.log('\n👥 Obteniendo personas disponibles...');
    const personasResult = await pool.query(`
      SELECT rut, nombres, cargo, centro_costo
      FROM mantenimiento.personal_disponible 
      WHERE nombres IS NOT NULL
      ORDER BY nombres
      LIMIT 5
    `);
    
    if (personasResult.rows.length === 0) {
      console.log('❌ No se encontraron personas en la base de datos');
      return;
    }
    
    console.log('👥 Personas disponibles:');
    personasResult.rows.forEach((persona, index) => {
      console.log(`   ${index + 1}. ${persona.rut} - ${persona.nombres} (${persona.cargo})`);
    });
    
    // 4. Crear documento de "Asignación Laboral"
    const documentContent = `CERTIFICADO DE CURSO - ASIGNACIÓN LABORAL
===============================================

Fecha: ${new Date().toLocaleDateString('es-CL')}
Curso: Asignación Laboral
Institución: Centro de Capacitación y Desarrollo Profesional
Duración: 24 horas
Modalidad: Presencial

CONTENIDOS DEL CURSO:
=====================

Módulo 1: Fundamentos de Asignación Laboral
- Conceptos básicos de asignación
- Marco legal y normativo
- Responsabilidades del trabajador
- Derechos laborales

Módulo 2: Procesos de Asignación
- Procedimientos de asignación
- Documentación requerida
- Evaluación de competencias
- Seguimiento y control

Módulo 3: Herramientas y Sistemas
- Sistemas de información laboral
- Plataformas digitales
- Reportes y estadísticas
- Mantenimiento de registros

Módulo 4: Casos Prácticos
- Resolución de casos reales
- Buenas prácticas
- Prevención de errores
- Mejora continua

EVALUACIÓN:
===========
- Examen teórico: Aprobado
- Evaluación práctica: Aprobado
- Proyecto final: Aprobado
- Nota final: 7.2

COMPETENCIAS DESARROLLADAS:
===========================
✓ Conocimiento de procesos de asignación laboral
✓ Manejo de sistemas de información
✓ Capacidad de análisis y resolución de problemas
✓ Comunicación efectiva
✓ Trabajo en equipo
✓ Cumplimiento de normativas

Este certificado acredita que el participante ha completado 
satisfactoriamente el curso de "Asignación Laboral" y está 
capacitado para desempeñar funciones relacionadas con la 
gestión de asignaciones laborales.

Firma digital: [SISTEMA DE MANTENIMIENTO]
Fecha de emisión: ${new Date().toISOString()}
Código de verificación: ASIGN-${Date.now()}
Versión: 1.0
`;
    
    // 5. Crear archivo temporal
    const tempFileName = `certificado_asignacion_laboral_${Date.now()}.txt`;
    const tempFilePath = path.join(__dirname, tempFileName);
    fs.writeFileSync(tempFilePath, documentContent);
    
    console.log(`\n📄 Documento creado: ${tempFileName}`);
    
    // 6. Subir documento para cada persona (máximo 3 para no saturar)
    console.log('\n📤 Subiendo documentos para personas seleccionadas...');
    
    let documentosSubidos = 0;
    let errores = 0;
    
    const personasSeleccionadas = personasResult.rows.slice(0, 3); // Máximo 3 personas
    
    for (const persona of personasSeleccionadas) {
      try {
        // Leer el archivo
        const fileBuffer = fs.readFileSync(tempFilePath);
        const fileName = `certificado_asignacion_laboral_${persona.rut.replace(/-/g, '_')}_${Date.now()}.txt`;
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
          'Certificado del curso asignacion laboral',
          'certificado_curso',
          fileName,
          tempFileName,
          'text/plain',
          fileBuffer.length,
          uploadPath,
          `Certificado del curso "Asignación Laboral" para ${persona.nombres || persona.rut}`,
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
    
    // 7. Limpiar archivo temporal
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    // 8. Resumen final
    console.log('\n📊 RESUMEN DE CREACIÓN:');
    console.log('========================');
    console.log(`✅ Documentos subidos exitosamente: ${documentosSubidos}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📚 Curso: Asignación Laboral`);
    console.log(`👥 Personas: ${personasSeleccionadas.length}`);
    
    if (documentosSubidos > 0) {
      console.log('\n🎉 ¡DOCUMENTOS DE ASIGNACIÓN LABORAL DISPONIBLES!');
      console.log('================================================');
      console.log('Ahora puedes descargar documentos para el curso "asignación laboral"');
      console.log('\n🔗 Para probar la descarga:');
      console.log('   - GET /api/documentos (listar todos)');
      console.log('   - GET /api/documentos/persona/{RUT} (por persona)');
      console.log('   - GET /api/documentos/{ID}/descargar (descargar archivo)');
      
      // Mostrar algunos RUTs para probar
      console.log('\n🧪 RUTs con documentos de asignación laboral:');
      personasSeleccionadas.forEach(persona => {
        console.log(`   - ${persona.rut} (${persona.nombres || 'Sin nombre'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la función
createAssignacionLaboralDocument();
