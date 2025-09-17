const { query } = require('../config/database');

/**
 * Script para buscar la tabla nombre en todos los esquemas
 */

async function findNombreTable() {
  console.log('🔍 BUSCANDO TABLA NOMBRE EN TODOS LOS ESQUEMAS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Buscar la tabla nombre en todos los esquemas
    console.log('📋 1. Buscando tabla nombre en todos los esquemas...');
    
    const findTableQuery = `
      SELECT 
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_name = 'nombre'
      ORDER BY table_schema
    `;
    
    const tables = await query(findTableQuery);
    
    if (tables.rows.length === 0) {
      console.log('❌ No se encontró la tabla nombre en ningún esquema');
      
      // Buscar tablas que contengan 'nombre' en el nombre
      console.log('\n📋 Buscando tablas que contengan "nombre"...');
      const similarTablesQuery = `
        SELECT 
          table_schema,
          table_name
        FROM information_schema.tables 
        WHERE table_name ILIKE '%nombre%'
        ORDER BY table_schema, table_name
      `;
      
      const similarTables = await query(similarTablesQuery);
      
      if (similarTables.rows.length > 0) {
        console.log('✅ Tablas similares encontradas:');
        similarTables.rows.forEach(row => {
          console.log(`   - ${row.table_schema}.${row.table_name}`);
        });
      } else {
        console.log('❌ No se encontraron tablas similares');
      }
      
      return;
    }
    
    console.log('✅ Tabla(s) nombre encontrada(s):');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_schema}.${row.table_name} (${row.table_type})`);
    });
    
    // 2. Para cada tabla encontrada, obtener su estructura
    for (const table of tables.rows) {
      console.log(`\n📋 2. Estructura de ${table.table_schema}.${table.table_name}:`);
      
      const structureQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = $2 
        ORDER BY ordinal_position
      `;
      
      const structure = await query(structureQuery, [table.table_schema, table.table_name]);
      
      console.log('📊 Columnas:');
      structure.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
      
      // 3. Verificar datos existentes
      const countQuery = `SELECT COUNT(*) as total FROM ${table.table_schema}.${table.table_name}`;
      const countResult = await query(countQuery);
      const totalRecords = countResult.rows[0].total;
      
      console.log(`📊 Registros existentes: ${totalRecords}`);
      
      if (totalRecords > 0 && totalRecords <= 5) {
        console.log('📄 Datos existentes:');
        const sampleQuery = `SELECT * FROM ${table.table_schema}.${table.table_name} LIMIT 5`;
        const sampleResult = await query(sampleQuery);
        sampleResult.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${JSON.stringify(row)}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findNombreTable()
  .then(() => {
    console.log('\n✅ Búsqueda completada');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });












