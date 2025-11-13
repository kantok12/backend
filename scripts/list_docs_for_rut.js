const { query } = require('../config/database');

async function list(rut) {
  try {
    const q = `
      SELECT id, nombre_archivo, nombre_documento, fecha_subida
      FROM mantenimiento.documentos
      WHERE translate(rut_persona, '.', '') = translate($1, '.', '')
      ORDER BY fecha_subida DESC
    `;
    const res = await query(q, [rut]);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('Error listing documents for rut:', e.message);
  } finally {
    process.exit(0);
  }
}

const [,, rut] = process.argv;
if (!rut) {
  console.error('Usage: node list_docs_for_rut.js <rut>');
  process.exit(1);
}

list(rut);
