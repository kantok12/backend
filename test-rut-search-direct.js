const { pool } = require('./config/database');

async function testRutSearchDirect() {
  console.log('🔍 PROBANDO BÚSQUEDA POR RUT DIRECTAMENTE');
  console.log('==========================================');
  
  const testRut = '15338132-1';
  
  try {
    // 1. Verificar que la persona existe
    console.log(`\n👤 Verificando persona con RUT: ${testRut}`);
    const personResult = await pool.query(`
      SELECT rut, nombre, cargo, zona_geografica 
      FROM mantenimiento.personal_disponible 
      WHERE rut = $1
    `, [testRut]);
    
    if (personResult.rows.length === 0) {
      console.log('❌ Persona no encontrada');
      return;
    }
    
    console.log('✅ Persona encontrada:');
    console.log(`   - RUT: ${personResult.rows[0].rut}`);
    console.log(`   - Nombre: ${personResult.rows[0].nombre}`);
    console.log(`   - Cargo: ${personResult.rows[0].cargo}`);
    
    // 2. Buscar documentos directamente
    console.log(`\n📄 Buscando documentos para RUT: ${testRut}`);
    const docsResult = await pool.query(`
      SELECT 
        d.id,
        d.nombre_documento,
        d.tipo_documento,
        d.nombre_archivo,
        d.nombre_original,
        d.tipo_mime,
        d.tamaño_bytes,
        d.descripcion,
        d.fecha_subida,
        d.subido_por,
        d.activo
      FROM mantenimiento.documentos d
      WHERE d.rut_persona = $1 AND d.activo = true
      ORDER BY d.fecha_subida DESC, d.nombre_documento
    `, [testRut]);
    
    console.log(`📊 Resultado de la consulta directa:`);
    console.log(`   - Filas encontradas: ${docsResult.rows.length}`);
    
    if (docsResult.rows.length > 0) {
      console.log('✅ Documentos encontrados:');
      docsResult.rows.forEach((doc, index) => {
        console.log(`   ${index + 1}. ID: ${doc.id}`);
        console.log(`      - Nombre: ${doc.nombre_documento}`);
        console.log(`      - Tipo: ${doc.tipo_documento}`);
        console.log(`      - Archivo: ${doc.nombre_archivo}`);
        console.log(`      - Activo: ${doc.activo}`);
        console.log(`      - Fecha: ${doc.fecha_subida}`);
      });
    } else {
      console.log('❌ No se encontraron documentos');
      
      // Verificar si hay documentos inactivos
      console.log('\n🔍 Verificando documentos inactivos...');
      const inactiveDocsResult = await pool.query(`
        SELECT id, nombre_documento, activo
        FROM mantenimiento.documentos 
        WHERE rut_persona = $1
        ORDER BY fecha_subida DESC
      `, [testRut]);
      
      if (inactiveDocsResult.rows.length > 0) {
        console.log('📋 Documentos inactivos encontrados:');
        inactiveDocsResult.rows.forEach((doc, index) => {
          console.log(`   ${index + 1}. ID: ${doc.id} - ${doc.nombre_documento} (Activo: ${doc.activo})`);
        });
      } else {
        console.log('❌ No hay documentos para este RUT (ni activos ni inactivos)');
      }
    }
    
    // 3. Verificar todos los documentos en la tabla
    console.log('\n📋 Verificando todos los documentos en la tabla...');
    const allDocsResult = await pool.query(`
      SELECT rut_persona, nombre_documento, activo, id
      FROM mantenimiento.documentos 
      WHERE rut_persona = $1
      ORDER BY fecha_subida DESC
    `, [testRut]);
    
    console.log(`📊 Total documentos para RUT ${testRut}: ${allDocsResult.rows.length}`);
    allDocsResult.rows.forEach((doc, index) => {
      console.log(`   ${index + 1}. ID: ${doc.id} - ${doc.nombre_documento} (Activo: ${doc.activo})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Ejecutar prueba
testRutSearchDirect();
