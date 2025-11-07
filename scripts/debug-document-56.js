const { query, pool } = require('../config/database');

async function checkDocument() {
  const documentId = 56;
  console.log(`🔍 Buscando información para el documento con ID: ${documentId}`);

  try {
    const result = await query('SELECT * FROM mantenimiento.documentos WHERE id = $1', [documentId]);

    if (result.rows.length === 0) {
      console.log(`❌ No se encontró ningún registro en la tabla "mantenimiento.documentos" con el ID ${documentId}.`);
    } else {
      console.log('✅ Registro encontrado. Aquí están los detalles:');
      console.table(result.rows);
      
      const doc = result.rows[0];
      console.log('\n--- Información Clave para la Descarga ---');
      console.log(`ID: ${doc.id}`);
      console.log(`Activo: ${doc.activo}`);
      console.log(`Ruta Archivo (BD): ${doc.ruta_archivo}`);
      console.log(`Nombre Archivo (BD): ${doc.nombre_archivo}`);
      console.log('------------------------------------------');
      
      if (!doc.activo) {
        console.warn('⚠️ ADVERTENCIA: El documento está marcado como inactivo (activo = false). El endpoint de descarga lo ignorará.');
      }
    }
  } catch (error) {
    console.error('🔥 Ocurrió un error al consultar la base de datos:', error);
  } finally {
    await pool.end();
    console.log('🔌 Conexión a la base de datos cerrada.');
  }
}

checkDocument();
