const { pool } = require('./config/database');

async function getAvailableRuts() {
  try {
    const result = await pool.query('SELECT rut, nombre FROM mantenimiento.personal_disponible LIMIT 3');
    
    console.log('RUTs disponibles en la base de datos:');
    console.log('=====================================');
    
    if (result.rows.length > 0) {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. RUT: ${row.rut} - Nombre: ${row.nombre}`);
      });
      
      console.log(`\n✅ Total: ${result.rows.length} registros encontrados`);
      console.log(`🎯 Usaremos el primer RUT: ${result.rows[0].rut}`);
    } else {
      console.log('❌ No se encontraron registros en personal_disponible');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

getAvailableRuts();
