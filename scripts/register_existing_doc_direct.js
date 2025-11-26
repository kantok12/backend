const { query } = require('../config/database');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error('Usage: node register_existing_doc_direct.js <rut_persona> <nombre_archivo> <ruta_local> <nombre_documento> [tipo_documento]');
    process.exit(1);
  }

  const [rut_input, nombre_archivo, ruta_local, nombre_documento, tipo_documento = 'otro'] = args;

  try {
    // Buscar persona canonical
    const personRes = await query(`SELECT rut, nombres FROM mantenimiento.personal_disponible WHERE translate(rut, '.', '') = translate($1, '.', '')`, [rut_input]);
    if (personRes.rows.length === 0) {
      console.error('No se encontró persona con rut:', rut_input);
      process.exit(2);
    }
    const persona = personRes.rows[0];

    const insertQuery = `
      INSERT INTO mantenimiento.documentos (
        rut_persona,
        nombre_documento,
        tipo_documento,
        nombre_archivo,
        nombre_original,
        tipo_mime,
        tamaño_bytes,
        ruta_archivo,
        descripcion,
        subido_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, fecha_subida
    `;

    const values = [
      persona.rut,
      nombre_documento,
      tipo_documento,
      nombre_archivo,
      nombre_archivo,
      'application/octet-stream',
      0,
      ruta_local,
      'registrado_directamente_para_pruebas',
      'sistema'
    ];

    const res = await query(insertQuery, values);
    console.log('Documento insertado:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error insertando documento:', err.message || err);
    process.exit(3);
  }
}

main();
