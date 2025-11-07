const { query, close } = require('../config/database');

const migrate = async () => {
  console.log('🚀 Iniciando migración para prerrequisitos globales...');

  try {
    // Iniciar una transacción para asegurar que todos los cambios se apliquen o ninguno
    await query('BEGIN');
    console.log('  1. Transacción iniciada.');

    // Paso 1: Eliminar la restricción de unicidad existente
    // Usamos un bloque DO para manejar el caso en que la restricción no exista y evitar un error.
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'cliente_prerrequisitos_cliente_id_tipo_documento_key'
        )
        THEN
          ALTER TABLE mantenimiento.cliente_prerrequisitos 
          DROP CONSTRAINT cliente_prerrequisitos_cliente_id_tipo_documento_key;
          
          RAISE NOTICE 'Restricción "cliente_prerrequisitos_cliente_id_tipo_documento_key" eliminada.';
        ELSE
          RAISE NOTICE 'La restricción "cliente_prerrequisitos_cliente_id_tipo_documento_key" no existía, no se hizo nada.';
        END IF;
      END;
      $$;
    `);
    console.log('  2. Antigua restricción de unicidad eliminada (si existía).');

    // Paso 2: Permitir que cliente_id sea NULL
    await query('ALTER TABLE mantenimiento.cliente_prerrequisitos ALTER COLUMN cliente_id DROP NOT NULL');
    console.log('  3. Columna "cliente_id" ahora permite valores NULL.');

    // Paso 3: Crear un índice único para prerrequisitos específicos del cliente
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS cliente_prerrequisitos_cliente_specific_key
      ON mantenimiento.cliente_prerrequisitos (cliente_id, tipo_documento)
      WHERE cliente_id IS NOT NULL;
    `);
    console.log('  4. Creado índice único para prerrequisitos específicos de cliente.');

    // Paso 4: Crear un índice único para prerrequisitos globales
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS cliente_prerrequisitos_global_key
      ON mantenimiento.cliente_prerrequisitos (tipo_documento)
      WHERE cliente_id IS NULL;
    `);
    console.log('  5. Creado índice único para prerrequisitos globales.');

    // Confirmar la transacción
    await query('COMMIT');
    console.log('  6. Transacción confirmada.');

    console.log('\n✅ Migración completada exitosamente.');
    console.log('   - La tabla "cliente_prerrequisitos" ahora soporta prerrequisitos globales (cliente_id = NULL).');
    console.log('   - Se han asegurado las reglas de unicidad para ambos casos (globales y específicos).');

  } catch (error) {
    // Revertir la transacción en caso de error
    await query('ROLLBACK');
    console.error('❌ Error durante la migración. Se revirtieron los cambios.');
    console.error(error);
    process.exit(1); // Terminar el script con un código de error
  } finally {
    await close();
    console.log('🔌 Conexión a la base de datos cerrada.');
  }
};

migrate();
