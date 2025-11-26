const { query } = require('./config/database');

async function checkDocumentTypeConstraint() {
  try {
    console.log('Verificando restricción CHECK de tipo_documento...');

    const result = await query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'documentos_tipo_documento_check'
    `);

    if (result.rows.length > 0) {
      console.log('Restricción encontrada:');
      console.log(result.rows[0].definition);
    } else {
      console.log('No se encontró la restricción documentos_tipo_documento_check');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDocumentTypeConstraint();