const { query } = require('../config/database');

async function main() {
  try {
    const result = await query(`
      SELECT id, tabla_afectada, operacion, registro_id, datos_anteriores, datos_nuevos, usuario, timestamp, endpoint, contexto
      FROM sistema.auditoria_log
      ORDER BY id DESC
      LIMIT 20
    `);
    if (result.rows.length === 0) {
      console.log('No hay registros en sistema.auditoria_log.');
      return;
    }
    console.log('Últimos registros en sistema.auditoria_log:');
    result.rows.forEach(row => {
      console.log(row);
    });
  } catch (err) {
    console.error('Error al consultar sistema.auditoria_log:', err);
  }
}

main();
