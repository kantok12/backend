const { query } = require('../config/database');

async function check(rut, nombre_archivo) {
  try {
    console.log('Checking duplicates for', rut, nombre_archivo);
    const q = `
      SELECT id, rut_persona, nombre_documento, nombre_archivo, fecha_subida
      FROM mantenimiento.documentos
      WHERE translate(rut_persona, '.', '') = translate($1, '.', '')
        AND nombre_archivo = $2
      ORDER BY fecha_subida ASC
    `;
    const res = await query(q, [rut, nombre_archivo]);
    console.log('Found rows:', res.rows.length);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error checking duplicates:', err.message);
  } finally {
    process.exit(0);
  }
}

const [,, rut, nombre] = process.argv;
if (!rut || !nombre) {
  console.error('Usage: node check_document_duplicates.js <rut> <nombre_archivo>');
  process.exit(1);
}

check(rut, nombre);
