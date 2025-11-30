const db = require('../config/database');

async function run() {
  try {
    const rut = '10978973-9';
    const clienteId = 1;
    const res = await db.query('SELECT * FROM servicios.asignacion WHERE rut = $1 AND cliente_id = $2', [rut, clienteId]);
    console.log('Found rows:', res.rows.length);
    console.log(res.rows);
  } catch (err) {
    console.error('Error querying asignacion:', err.message);
  } finally {
    await db.closePool();
  }
}

if (require.main === module) run();
