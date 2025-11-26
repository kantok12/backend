const { query } = require('../config/database');

(async () => {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node update_doc_rut.js <rut_persona> <doc_id>');
    process.exit(1);
  }
  const [rut, id] = args;
  try {
    const res = await query('UPDATE mantenimiento.documentos SET rut_persona=$1 WHERE id=$2', [rut, parseInt(id, 10)]);
    console.log('Updated rows:', res.rowCount);
    process.exit(0);
  } catch (err) {
    console.error('Error updating document rut:', err.message || err);
    process.exit(2);
  }
})();
