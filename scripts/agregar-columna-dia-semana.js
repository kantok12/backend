const { query } = require('../config/database');

async function agregarColumnaDiaSemana() {
  try {
    console.log('🚀 Agregando columna dia_semana para selección múltiple...');

    // Verificar si la columna ya existe
    const columnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = 'programacion_compatibilidad'
        AND column_name = 'dia_semana'
      );
    `);

    if (columnExists.rows[0].exists) {
      console.log('⚠️  La columna dia_semana ya existe');
      return;
    }

    // Agregar columna dia_semana
    console.log('➕ Agregando columna dia_semana...');
    await query(`
      ALTER TABLE mantenimiento.programacion_compatibilidad 
      ADD COLUMN dia_semana VARCHAR(10);
    `);

    console.log('✅ Columna dia_semana agregada exitosamente');

    // Verificar estructura de la tabla
    console.log('🔍 Verificando estructura de la tabla...');
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'programacion_compatibilidad'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Estructura actualizada:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    console.log('🎉 ¡Columna dia_semana agregada exitosamente!');
    console.log('');
    console.log('📝 Próximo paso:');
    console.log('✅ Ahora se puede agregar la restricción de unicidad por día específico');

  } catch (err) {
    console.error('❌ Error agregando columna dia_semana:', err.message);
    throw err;
  }
}

// Ejecutar la función
agregarColumnaDiaSemana()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error en el script:', err.message);
    process.exit(1);
  });
