const { query } = require('../config/postgresql');

async function checkPersonalTable() {
  try {
    console.log('🔍 Inspeccionando tabla personal_disponible...\n');

    // Estructura de la tabla
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'personal_disponible' 
      ORDER BY ordinal_position
    `;
    
    const structure = await query(structureQuery);
    
    console.log('📋 ESTRUCTURA DE LA TABLA:');
    console.log('=' .repeat(60));
    structure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
    });

    // Contar registros
    const countResult = await query('SELECT COUNT(*) as total FROM mantenimiento.personal_disponible');
    const totalRecords = countResult.rows[0].total;
    
    console.log(`\n📊 REGISTROS EXISTENTES: ${totalRecords}`);
    
    if (totalRecords > 0) {
      console.log('\n📄 EJEMPLOS DE DATOS:');
      console.log('=' .repeat(60));
      const sampleData = await query('SELECT * FROM mantenimiento.personal_disponible LIMIT 3');
      sampleData.rows.forEach((row, index) => {
        console.log(`\nRegistro ${index + 1}:`);
        console.log(JSON.stringify(row, null, 2));
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPersonalTable()
  .then(() => {
    console.log('\n✅ Inspección completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });



