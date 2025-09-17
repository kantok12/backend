const { query } = require('./config/postgresql');

async function checkTables() {
  try {
    console.log('🔍 Verificando tablas en esquema mantenimiento...');
    
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tablas encontradas:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Verificar si existen las nuevas tablas del ERD
    const newTables = ['personal_estados', 'estado_unificado'];
    console.log('\n🔍 Verificando nuevas tablas del ERD:');
    
    for (const table of newTables) {
      const exists = result.rows.some(row => row.table_name === table);
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTE' : 'NO EXISTE'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();


