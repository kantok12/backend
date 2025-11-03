const { query } = require('../config/database');

async function main() {
  try {
    const result = await query(`
      SELECT id, rut, cartera_id, cliente_id, nodo_id, fecha_trabajo, dia_semana, horas_estimadas, estado, created_at
      FROM mantenimiento.programacion_optimizada
      ORDER BY fecha_trabajo DESC, created_at DESC
      LIMIT 30
    `);
    if (result.rows.length === 0) {
      console.log('No hay programaciones creadas en programacion_optimizada.');
      return;
    }
    console.log('Últimas programaciones creadas:');
    result.rows.forEach(row => {
      console.log(row);
    });
  } catch (err) {
    console.error('Error al consultar programaciones:', err);
  }
}

main();
