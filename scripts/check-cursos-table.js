const { query } = require('../config/postgresql');

/**
 * Verificar si existe la tabla cursos_certificaciones
 */

async function checkCursosTable() {
  console.log('🔍 VERIFICANDO TABLA CURSOS_CERTIFICACIONES');
  console.log('=' .repeat(50));
  
  try {
    // 1. Buscar tabla cursos_certificaciones
    console.log('📋 1. Buscando tabla cursos_certificaciones...');
    
    const checkTableQuery = `
      SELECT 
        table_name,
        column_name, 
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'cursos_certificaciones'
      ORDER BY ordinal_position
    `;
    
    const tableStructure = await query(checkTableQuery);
    
    if (tableStructure.rows.length === 0) {
      console.log('❌ Tabla cursos_certificaciones NO EXISTE en esquema mantenimiento');
      
      // Buscar cualquier tabla relacionada con cursos
      console.log('\n📋 2. Buscando tablas relacionadas con cursos...');
      
      const relatedTablesQuery = `
        SELECT DISTINCT table_name
        FROM information_schema.tables 
        WHERE table_schema = 'mantenimiento' 
        AND (
          table_name ILIKE '%curso%' OR 
          table_name ILIKE '%certif%' OR
          table_name ILIKE '%formacion%' OR
          table_name ILIKE '%capacitacion%'
        )
        ORDER BY table_name
      `;
      
      const relatedTables = await query(relatedTablesQuery);
      
      if (relatedTables.rows.length === 0) {
        console.log('❌ No se encontraron tablas relacionadas con cursos/certificaciones');
      } else {
        console.log(`✅ Encontradas ${relatedTables.rows.length} tablas relacionadas:`);
        relatedTables.rows.forEach(row => {
          console.log(`   - ${row.table_name}`);
        });
      }
      
      return false;
    }
    
    // 3. Si existe, mostrar estructura
    console.log(`✅ Tabla cursos_certificaciones EXISTE con ${tableStructure.rows.length} columnas:`);
    console.log('\n📊 Estructura de la tabla:');
    console.log('-'.repeat(70));
    console.log('COLUMNA'.padEnd(25) + 'TIPO'.padEnd(20) + 'NULL'.padEnd(10) + 'DEFAULT');
    console.log('-'.repeat(70));
    
    tableStructure.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'Sí' : 'No';
      const defaultValue = row.column_default || 'N/A';
      console.log(
        row.column_name.padEnd(25) + 
        row.data_type.padEnd(20) + 
        nullable.padEnd(10) + 
        defaultValue
      );
    });
    
    // 4. Contar registros
    console.log('\n📋 4. Contando registros...');
    
    const countQuery = `
      SELECT COUNT(*) as total FROM mantenimiento.cursos_certificaciones
    `;
    
    const countResult = await query(countQuery);
    const total = countResult.rows[0].total;
    
    console.log(`📊 Total de registros: ${total}`);
    
    if (parseInt(total) > 0) {
      // Mostrar algunos ejemplos
      const sampleQuery = `
        SELECT * FROM mantenimiento.cursos_certificaciones 
        ORDER BY id LIMIT 3
      `;
      
      const samples = await query(sampleQuery);
      
      console.log('\n📝 Ejemplos de datos:');
      samples.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ID: ${row.id}, Nombre: ${row.nombre_curso || 'N/A'}`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    return false;
  }
}

// Ejecutar
checkCursosTable()
  .then((exists) => {
    if (exists) {
      console.log('\n✅ La tabla existe y está lista para usar');
      console.log('🔧 Necesitas crear routes/cursos.js para los endpoints');
    } else {
      console.log('\n❌ La tabla NO existe');
      console.log('🔧 Necesitas crear la tabla primero');
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });












