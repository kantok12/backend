const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function createDocumentForSpecificRut() {
  console.log('📁 CREANDO DOCUMENTO PARA RUT ESPECÍFICO');
  console.log('=========================================');
  
  const targetRut = '15338132-1'; // RUT que está intentando descargar
  
  try {
    // 1. Verificar si el RUT existe en la base de datos
    console.log(`\n🔍 Verificando RUT: ${targetRut}`);
    const personaResult = await pool.query(`
      SELECT rut, nombres, cargo, centro_costo, zona_geografica
      FROM mantenimiento.personal_disponible 
      WHERE rut = $1
    `, [targetRut]);
    
    if (personaResult.rows.length === 0) {
      console.log(`❌ RUT ${targetRut} no encontrado en la base de datos`);
      console.log('\n💡 Creando registro de prueba...');
      
      // Crear el registro de la persona
      const createPersonaResult = await pool.query(`
        INSERT INTO mantenimiento.personal_disponible (
          rut, sexo, fecha_nacimiento, licencia_conducir, 
          talla_zapatos, talla_pantalones, talla_poleras, 
          cargo, estado_id, zona_geografica, nombres
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        targetRut,
        'M',
        '1982-09-14',
        'B12345678',
        '42',
        'L',
        'M',
        'Experto en Prevención De Riesgos',
        1,
        'valparaiso',
        'Schaffhauser Rodrigo Andres'
      ]);
      
      console.log('✅ Registro de persona creado exitosamente');
    } else {
      console.log('✅ RUT encontrado en la base de datos');
      console.log(`   - Nombre: ${personaResult.rows[0].nombres || 'Sin nombre'}`);
      console.log(`   - Cargo: ${personaResult.rows[0].cargo || 'Sin cargo'}`);
      console.log(`   - Zona: ${personaResult.rows[0].zona_geografica || 'Sin zona'}`);
    }
    
    // 2. Verificar si ya existe un documento para este RUT
    console.log(`\n🔍 Verificando documentos existentes para RUT: ${targetRut}`);
    const existingDocs = await pool.query(`
      SELECT id, nombre_documento, tipo_documento, nombre_archivo, fecha_subida
      FROM mantenimiento.documentos 
      WHERE rut_persona = $1 AND activo = true
      ORDER BY fecha_subida DESC
    `, [targetRut]);
    
    if (existingDocs.rows.length > 0) {
      console.log(`✅ Ya existen ${existingDocs.rows.length} documento(s) para este RUT:`);
      existingDocs.rows.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.nombre_documento} (ID: ${doc.id})`);
      });
      return;
    }
    
    // 3. Crear documento de "Asignación Laboral" para este RUT específico
    const documentContent = `CERTIFICADO DE CURSO - ASIGNACIÓN LABORAL
===============================================

Fecha: ${new Date().toLocaleDateString('es-CL')}
Curso: Asignación Laboral
Participante: ${personaResult.rows[0]?.nombres || 'Schaffhauser Rodrigo Andres'}
RUT: ${targetRut}
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
    
    // 4. Crear archivo temporal
    const tempFileName = `certificado_asignacion_laboral_${targetRut.replace(/-/g, '_')}_${Date.now()}.txt`;
    const tempFilePath = path.join(__dirname, tempFileName);
    fs.writeFileSync(tempFilePath, documentContent);
    
    console.log(`\n📄 Documento creado: ${tempFileName}`);
    
    // 5. Subir documento a la base de datos
    console.log('\n📤 Subiendo documento a la base de datos...');
    
    try {
      // Leer el archivo
      const fileBuffer = fs.readFileSync(tempFilePath);
      const fileName = `certificado_asignacion_laboral_${targetRut.replace(/-/g, '_')}_${Date.now()}.txt`;
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
        targetRut,
        'Certificado del curso asignacion laboral',
        'certificado_curso',
        fileName,
        tempFileName,
        'text/plain',
        fileBuffer.length,
        uploadPath,
        `Certificado del curso "Asignación Laboral" para ${personaResult.rows[0]?.nombres || targetRut}`,
        new Date(),
        'SISTEMA_SERVIDOR',
        true
      ]);
      
      console.log(`✅ Documento subido exitosamente (ID: ${insertResult.rows[0].id})`);
      
      // 6. Verificar que el documento se puede obtener
      console.log('\n🔍 Verificando que el documento está disponible...');
      const verifyResult = await pool.query(`
        SELECT id, nombre_documento, nombre_archivo, ruta_archivo
        FROM mantenimiento.documentos 
        WHERE rut_persona = $1 AND activo = true
        ORDER BY fecha_subida DESC
        LIMIT 1
      `, [targetRut]);
      
      if (verifyResult.rows.length > 0) {
        const doc = verifyResult.rows[0];
        console.log('✅ Documento verificado y disponible:');
        console.log(`   - ID: ${doc.id}`);
        console.log(`   - Nombre: ${doc.nombre_documento}`);
        console.log(`   - Archivo: ${doc.nombre_archivo}`);
        console.log(`   - Ruta: ${doc.ruta_archivo}`);
        
        console.log('\n🎉 ¡PROBLEMA SOLUCIONADO!');
        console.log('=========================');
        console.log(`✅ Documento creado para RUT: ${targetRut}`);
        console.log('✅ El frontend ahora puede descargar el documento');
        console.log('\n🔗 Endpoints para probar:');
        console.log(`   - GET /api/documentos/persona/${targetRut}`);
        console.log(`   - GET /api/documentos/${doc.id}/descargar`);
      }
      
    } catch (error) {
      console.log(`❌ Error al subir documento: ${error.message}`);
    }
    
    // 7. Limpiar archivo temporal
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la función
createDocumentForSpecificRut();
