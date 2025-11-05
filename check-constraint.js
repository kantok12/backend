const {query} = require('./config/database');

(async () => {
  try {
    const r = await query(`
      SELECT pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conname = 'documentos_tipo_documento_check'
    `);
    console.log('Restricción CHECK:');
    console.log(r.rows[0].definition);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
