const { query } = require('./config/database');

async function checkTable() {
  try {
    console.log('🔍 Verificando estructura de tabla programacion_semanal...');
    
    const result = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
        AND table_name = 'programacion_semanal' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estructura de la tabla:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('\n✅ Verificación completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTable();

