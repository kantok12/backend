const { query } = require('../config/database');

async function main() {
  try {
    const result = await query(`
      SELECT rut, nombres, cargo, estado_id
      FROM mantenimiento.personal_disponible
      ORDER BY cargo, nombres
      LIMIT 50
    `);
    if (result.rows.length === 0) {
      console.log('No hay registros en mantenimiento.personal_disponible.');
      return;
    }
    console.log('Primeros registros de personal:');
    result.rows.forEach(row => {
      console.log(row);
    });
  } catch (err) {
    console.error('Error al consultar personal_disponible:', err);
  }
}

main();
