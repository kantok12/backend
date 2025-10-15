const { query } = require('../config/database');

async function dropBelrayColumns() {
  try {
    console.log('🚀 Iniciando eliminación de columnas en mantenimiento.belray...');

    // Eliminar trigger y función primero (dependen de fecha_modificacion)
    console.log('⚙️ Eliminando trigger/función si existen...');
    await query(`
      DO $$
      BEGIN
        -- Eliminar trigger si existe
        IF EXISTS (
          SELECT 1 FROM information_schema.triggers
          WHERE event_object_schema = 'mantenimiento'
            AND event_object_table = 'belray'
            AND trigger_name = 'trigger_belray_update_modification_date'
        ) THEN
          EXECUTE 'DROP TRIGGER IF EXISTS trigger_belray_update_modification_date ON mantenimiento.belray';
        END IF;

        -- Eliminar función si existe
        IF EXISTS (
          SELECT 1 FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE p.proname = 'update_belray_modification_date'
            AND n.nspname = 'mantenimiento'
        ) THEN
          EXECUTE 'DROP FUNCTION IF EXISTS mantenimiento.update_belray_modification_date() CASCADE';
        END IF;
      END
      $$;
    `);

    // Eliminar índices relacionados
    console.log('📊 Eliminando índices si existen...');
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relkind = 'i' AND c.relname = 'idx_belray_codigo'
        ) THEN
          EXECUTE 'DROP INDEX IF EXISTS idx_belray_codigo';
        END IF;
      END
      $$;
    `);

    // Eliminar columnas solicitadas si existen
    console.log('🧹 Eliminando columnas si existen...');
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'mantenimiento' AND table_name = 'belray' AND column_name = 'codigo'
        ) THEN
          EXECUTE 'ALTER TABLE mantenimiento.belray DROP COLUMN codigo';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'mantenimiento' AND table_name = 'belray' AND column_name = 'activo'
        ) THEN
          EXECUTE 'ALTER TABLE mantenimiento.belray DROP COLUMN activo';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'mantenimiento' AND table_name = 'belray' AND column_name = 'fecha_creacion'
        ) THEN
          EXECUTE 'ALTER TABLE mantenimiento.belray DROP COLUMN fecha_creacion';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'mantenimiento' AND table_name = 'belray' AND column_name = 'fecha_modificacion'
        ) THEN
          EXECUTE 'ALTER TABLE mantenimiento.belray DROP COLUMN fecha_modificacion';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'mantenimiento' AND table_name = 'belray' AND column_name = 'usuario_creacion'
        ) THEN
          EXECUTE 'ALTER TABLE mantenimiento.belray DROP COLUMN usuario_creacion';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'mantenimiento' AND table_name = 'belray' AND column_name = 'usuario_modificacion'
        ) THEN
          EXECUTE 'ALTER TABLE mantenimiento.belray DROP COLUMN usuario_modificacion';
        END IF;
      END
      $$;
    `);

    // Mostrar estructura final
    const finalStructure = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'mantenimiento' AND table_name = 'belray'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Columnas actuales en mantenimiento.belray:');
    for (const c of finalStructure.rows) {
      console.log(` - ${c.column_name}: ${c.data_type}`);
    }

    console.log('🎉 Eliminación completada.');
  } catch (err) {
    console.error('❌ Error eliminando columnas:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  dropBelrayColumns().then(() => process.exit(0));
}

module.exports = { dropBelrayColumns };
