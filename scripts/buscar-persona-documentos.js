const { query } = require('../config/database');

async function buscarPersona() {
  try {
    console.log('🔍 Buscando información de Jenniffer Ana Estay Gonzalez...\n');

    // Buscar persona por nombre
    const personaResult = await query(`
      SELECT rut, nombres, cargo, zona_geografica 
      FROM mantenimiento.personal_disponible 
      WHERE nombres ILIKE $1
    `, ['%Jenniffer%Estay%']);

    if (personaResult.rows.length === 0) {
      console.log('❌ No se encontró la persona en la base de datos');
      return;
    }

    const persona = personaResult.rows[0];
    console.log('✅ Persona encontrada:');
    console.log('   RUT:', persona.rut);
    console.log('   Nombre:', persona.nombres);
    console.log('   Cargo:', persona.cargo || 'No especificado');
    console.log('   Zona:', persona.zona_geografica || 'No especificada');
    console.log('');

    // Buscar documentos en la base de datos
    const docsResult = await query(`
      SELECT id, nombre_documento, tipo_documento, nombre_archivo, fecha_subida, ruta_archivo
      FROM mantenimiento.documentos
      WHERE translate(rut_persona, '.', '') = translate($1, '.', '')
      ORDER BY fecha_subida DESC
    `, [persona.rut]);

    console.log(`📄 Documentos en BD: ${docsResult.rows.length}`);
    if (docsResult.rows.length > 0) {
      docsResult.rows.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.nombre_documento} (${doc.tipo_documento})`);
        console.log(`      Archivo: ${doc.nombre_archivo}`);
        console.log(`      Fecha: ${doc.fecha_subida}`);
        if (doc.ruta_archivo) {
          console.log(`      Ruta: ${doc.ruta_archivo}`);
        }
        console.log('');
      });
    }

    // Buscar carpeta en Google Drive
    const fs = require('fs');
    const path = require('path');
    const baseDir = 'G:/Unidades compartidas/Unidad de Apoyo/Personal';
    
    console.log('📂 Buscando carpeta en Google Drive...');
    
    try {
      const dirs = fs.readdirSync(baseDir, { withFileTypes: true }).filter(d => d.isDirectory());
      let foundFolder = null;
      
      for (const dir of dirs) {
        if (dir.name.includes(persona.rut.replace(/\./g, ''))) {
          foundFolder = path.join(baseDir, dir.name);
          break;
        }
      }
      
      if (foundFolder) {
        console.log('✅ Carpeta encontrada:', foundFolder);
        console.log('');
        
        // Listar archivos en documentos
        const documentosDir = path.join(foundFolder, 'documentos');
        if (fs.existsSync(documentosDir)) {
          const archivosDocumentos = fs.readdirSync(documentosDir);
          console.log(`📁 Carpeta "documentos": ${archivosDocumentos.length} archivos`);
          archivosDocumentos.forEach((archivo, i) => {
            console.log(`   ${i + 1}. ${archivo}`);
          });
          console.log('');
        } else {
          console.log('⚠️  No existe carpeta "documentos"');
          console.log('');
        }
        
        // Listar archivos en cursos_certificaciones
        const cursosDir = path.join(foundFolder, 'cursos_certificaciones');
        if (fs.existsSync(cursosDir)) {
          const archivosCursos = fs.readdirSync(cursosDir);
          console.log(`📁 Carpeta "cursos_certificaciones": ${archivosCursos.length} archivos`);
          archivosCursos.forEach((archivo, i) => {
            console.log(`   ${i + 1}. ${archivo}`);
          });
          console.log('');
        } else {
          console.log('⚠️  No existe carpeta "cursos_certificaciones"');
          console.log('');
        }
        
      } else {
        console.log('❌ No se encontró carpeta en Google Drive para el RUT:', persona.rut);
      }
      
    } catch (err) {
      console.error('❌ Error accediendo a Google Drive:', err.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

buscarPersona()
  .then(() => {
    console.log('🎉 Búsqueda completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
