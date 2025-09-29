const { pool } = require('../config/database');

async function checkTableStructure() {
  console.log('🔍 VERIFICANDO ESTRUCTURA DE TABLAS');
  console.log('===================================');
  
  try {
    // Verificar estructura de personal_disponible
    console.log('\n📋 ESTRUCTURA DE personal_disponible:');
    const personalResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'personal_disponible'
      ORDER BY ordinal_position
    `);
    
    if (personalResult.rows.length > 0) {
      console.log('Columnas disponibles:');
      personalResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('❌ No se encontró la tabla personal_disponible');
    }
    
    // Verificar estructura de documentos
    console.log('\n📋 ESTRUCTURA DE documentos:');
    const documentosResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'documentos'
      ORDER BY ordinal_position
    `);
    
    if (documentosResult.rows.length > 0) {
      console.log('Columnas disponibles:');
      documentosResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('❌ No se encontró la tabla documentos');
    }
    
    // Verificar si hay datos de ejemplo
    console.log('\n📊 DATOS DE EJEMPLO EN personal_disponible:');
    const sampleResult = await pool.query(`
      SELECT * FROM mantenimiento.personal_disponible LIMIT 3
    `);
    
    if (sampleResult.rows.length > 0) {
      console.log('Registros de ejemplo:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`\nRegistro ${index + 1}:`);
        Object.keys(row).forEach(key => {
          console.log(`   ${key}: ${row[key]}`);
        });
      });
    } else {
      console.log('❌ No hay datos en personal_disponible');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTableStructure();
