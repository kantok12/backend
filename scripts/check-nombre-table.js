const { query } = require('../config/postgresql');

/**
 * Script para verificar la estructura de la tabla nombre
 */

async function checkNombreTable() {
  console.log('🔍 VERIFICANDO TABLA NOMBRE');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar si existe la tabla nombre
    console.log('📋 1. Verificando si existe la tabla nombre...');
    
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'nombre'
    `;
    
    const tables = await query(tablesQuery);
    
    if (tables.rows.length === 0) {
      console.log('❌ No se encontró la tabla nombre en el esquema mantenimiento');
      return;
    }
    
    console.log('✅ Tabla nombre encontrada');
    
    // 2. Verificar estructura de la tabla nombre
    console.log('\n📋 2. Verificando estructura de la tabla nombre...');
    
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'nombre' 
      ORDER BY ordinal_position
    `;
    
    const structure = await query(structureQuery);
    
    console.log('📊 Estructura de la tabla nombre:');
    structure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // 3. Verificar datos existentes
    console.log('\n📋 3. Verificando datos existentes...');
    
    const countQuery = 'SELECT COUNT(*) as total FROM mantenimiento.nombre';
    const countResult = await query(countQuery);
    const totalRecords = countResult.rows[0].total;
    
    console.log(`📊 Registros existentes: ${totalRecords}`);
    
    if (totalRecords > 0) {
      console.log('\n📄 Ejemplos de datos existentes:');
      const sampleQuery = 'SELECT * FROM mantenimiento.nombre LIMIT 5';
      const sampleResult = await query(sampleQuery);
      sampleResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(row)}`);
      });
    }
    
    // 4. Verificar restricciones FK si las hay
    console.log('\n📋 4. Verificando restricciones de clave foránea...');
    
    const constraintsQuery = `
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'mantenimiento'
        AND tc.table_name = 'nombre'
        AND tc.constraint_type = 'FOREIGN KEY'
    `;
    
    const constraints = await query(constraintsQuery);
    
    if (constraints.rows.length > 0) {
      console.log('✅ Restricciones de clave foránea encontradas:');
      constraints.rows.forEach(row => {
        console.log(`   - ${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
    } else {
      console.log('ℹ️  No se encontraron restricciones de clave foránea');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkNombreTable()
  .then(() => {
    console.log('\n✅ Verificación completada');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });



