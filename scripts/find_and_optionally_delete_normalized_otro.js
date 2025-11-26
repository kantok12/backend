// Lista prerrequisitos cuya normalización resulta en 'otro' y opcionalmente los elimina.
// Uso:
//  - Listar candidatos: node scripts/find_and_optionally_delete_normalized_otro.js
//  - Eliminar candidatos: node scripts/find_and_optionally_delete_normalized_otro.js --delete

const db = require('../config/database');
const { normalizeTipo } = require('../lib/tipoDocumento');

async function run() {
  try {
    console.log('Obteniendo todos los prerrequisitos...');
    const res = await db.query('SELECT id, cliente_id, tipo_documento FROM mantenimiento.cliente_prerrequisitos');
    const rows = res.rows;

    const candidates = rows.filter(r => {
      const norm = normalizeTipo(r.tipo_documento);
      return norm === 'otro';
    });

    console.log(`Total prerrequisitos: ${rows.length}`);
    console.log(`Candidatos que normalizan a 'otro': ${candidates.length}`);
    if (candidates.length > 0) {
      console.log('Ejemplos:');
      candidates.slice(0, 20).forEach(c => console.log(` - id=${c.id}, cliente_id=${c.cliente_id}, tipo_documento='${c.tipo_documento}'`));
    }

    const shouldDelete = process.argv.includes('--delete');
    if (!shouldDelete) {
      console.log('\nNo se realizará eliminación. Para borrar estos registros, vuelve a ejecutar con el flag --delete.');
      await db.closePool();
      process.exit(0);
    }

    // Delete flow
    if (candidates.length === 0) {
      console.log('No hay registros para eliminar. Saliendo.');
      await db.closePool();
      process.exit(0);
    }

    console.log('\nEliminando los prerrequisitos candidatos...');
    const ids = candidates.map(c => c.id);
    // Ejecutar delete en batches por seguridad
    const delRes = await db.query('DELETE FROM mantenimiento.cliente_prerrequisitos WHERE id = ANY($1::int[]) RETURNING id, cliente_id, tipo_documento', [ids]);
    console.log(`Eliminados ${delRes.rowCount} registros.`);
    delRes.rows.forEach(r => console.log(` - eliminado id=${r.id}, cliente_id=${r.cliente_id}, tipo_documento='${r.tipo_documento}'`));

    await db.closePool();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    try { await db.closePool(); } catch (e) {}
    process.exit(1);
  }
}

run();
