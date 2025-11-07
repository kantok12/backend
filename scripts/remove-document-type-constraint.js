const { query, close } = require('../config/database');

const removeConstraint = async () => {
  console.log('🚀 Iniciando migración para eliminar la restricción de tipo de documento...');

  try {
    await query('BEGIN');
    console.log('  1. Transacción iniciada.');

    // Usamos un bloque DO para manejar el caso en que la restricción no exista y evitar un error.
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'documentos_tipo_documento_check' 
          AND conrelid = 'mantenimiento.documentos'::regclass
        )
        THEN
          ALTER TABLE mantenimiento.documentos 
          DROP CONSTRAINT documentos_tipo_documento_check;
          
          RAISE NOTICE 'Restricción "documentos_tipo_documento_check" eliminada exitosamente.';
        ELSE
          RAISE NOTICE 'La restricción "documentos_tipo_documento_check" no existía, no se hizo nada.';
        END IF;
      END;
      $$;
    `);
    console.log('  2. Restricción "documentos_tipo_documento_check" eliminada (si existía).');

    await query('COMMIT');
    console.log('  3. Transacción confirmada.');

    console.log('\n✅ Migración completada exitosamente.');
    console.log('   - La columna "tipo_documento" en la tabla "documentos" ahora es de texto libre.');

  } catch (error) {
    await query('ROLLBACK');
    console.error('❌ Error durante la migración. Se revirtieron los cambios.');
    console.error(error);
    process.exit(1);
  } finally {
    // La función close() no existe en el módulo de DB, así que la omitimos para evitar el error anterior.
    // La conexión del pool se maneja automáticamente.
  }
};

removeConstraint().finally(() => {
    // Cierra el pool de conexiones para que el script pueda terminar.
    const { pool } = require('../config/database');
    pool.end(() => {
        console.log('🔌 Pool de conexiones a la base de datos cerrado.');
    });
});
