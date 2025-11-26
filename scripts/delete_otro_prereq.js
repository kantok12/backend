// Script to delete 'otro' prerequisites using config/database.js
// Run: node scripts/delete_otro_prereq.js

const db = require('../config/database');

async function run() {
  try {
    console.log('Buscando prerrequisitos con tipo_documento = "otro" (case-insensitive)');
    const selectRes = await db.query("SELECT id, cliente_id, tipo_documento FROM mantenimiento.cliente_prerrequisitos WHERE LOWER(TRIM(tipo_documento)) = 'otro'");
    console.log(`Encontrados ${selectRes.rows.length} registros:`);
    for (const r of selectRes.rows) {
      console.log(` - id=${r.id}, cliente_id=${r.cliente_id}, tipo_documento='${r.tipo_documento}'`);
    }

    if (selectRes.rows.length === 0) {
      console.log('No hay registros para eliminar. Saliendo.');
      process.exit(0);
    }

    // Confirmación simple por consola (no interactiva en script): realizar eliminación
    const delRes = await db.query("DELETE FROM mantenimiento.cliente_prerrequisitos WHERE LOWER(TRIM(tipo_documento)) = 'otro' RETURNING id, cliente_id");
    console.log(`Eliminados ${delRes.rowCount} prerrequisitos.`);
    for (const r of delRes.rows) console.log(` - eliminado id=${r.id}, cliente_id=${r.cliente_id}`);

    await db.closePool();
    process.exit(0);
  } catch (err) {
    console.error('Error ejecutando script:', err.message || err);
    try { await db.closePool(); } catch(e){}
    process.exit(1);
  }
}

run();
