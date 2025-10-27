const { query } = require('../config/database');

async function agregarColumnasProgramacionSemanal() {
  try {
    console.log('🚀 Iniciando actualización de tabla programacion_semanal...');

    // Verificar si las columnas ya existen
    const checkColumns = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
        AND table_name = 'programacion_semanal' 
        AND column_name IN ('fecha_trabajo', 'dia_semana', 'horas_reales')
    `);

    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('📋 Columnas existentes:', existingColumns);

    // Agregar fecha_trabajo si no existe
    if (!existingColumns.includes('fecha_trabajo')) {
      console.log('➕ Agregando columna fecha_trabajo...');
      await query(`
        ALTER TABLE mantenimiento.programacion_semanal 
        ADD COLUMN fecha_trabajo DATE
      `);
      console.log('✅ Columna fecha_trabajo agregada');
    } else {
      console.log('ℹ️ Columna fecha_trabajo ya existe');
    }

    // Agregar dia_semana si no existe
    if (!existingColumns.includes('dia_semana')) {
      console.log('➕ Agregando columna dia_semana...');
      await query(`
        ALTER TABLE mantenimiento.programacion_semanal 
        ADD COLUMN dia_semana VARCHAR(10)
      `);
      console.log('✅ Columna dia_semana agregada');
    } else {
      console.log('ℹ️ Columna dia_semana ya existe');
    }

    // Agregar horas_reales si no existe
    if (!existingColumns.includes('horas_reales')) {
      console.log('➕ Agregando columna horas_reales...');
      await query(`
        ALTER TABLE mantenimiento.programacion_semanal 
        ADD COLUMN horas_reales INTEGER
      `);
      console.log('✅ Columna horas_reales agregada');
    } else {
      console.log('ℹ️ Columna horas_reales ya existe');
    }

    // Crear índices para optimización
    console.log('🔍 Creando índices de optimización...');
    
    try {
      await query(`
        CREATE INDEX IF NOT EXISTS idx_programacion_semanal_cartera_fecha 
        ON mantenimiento.programacion_semanal (cartera_id, fecha_trabajo)
      `);
      console.log('✅ Índice cartera_fecha creado');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('ℹ️ Índice cartera_fecha ya existe');
      } else {
        throw err;
      }
    }

    try {
      await query(`
        CREATE INDEX IF NOT EXISTS idx_programacion_semanal_rut 
        ON mantenimiento.programacion_semanal (rut)
      `);
      console.log('✅ Índice rut creado');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('ℹ️ Índice rut ya existe');
      } else {
        throw err;
      }
    }

    try {
      await query(`
        CREATE INDEX IF NOT EXISTS idx_programacion_semanal_estado 
        ON mantenimiento.programacion_semanal (estado)
      `);
      console.log('✅ Índice estado creado');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('ℹ️ Índice estado ya existe');
      } else {
        throw err;
      }
    }

    // Verificar estructura final
    console.log('🔍 Verificando estructura final...');
    const finalStructure = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
        AND table_name = 'programacion_semanal' 
      ORDER BY ordinal_position
    `);

    console.log('📋 Estructura final de programacion_semanal:');
    finalStructure.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}`);
    });

    console.log('🎉 Actualización completada exitosamente!');

  } catch (err) {
    console.error('❌ Error actualizando tabla programacion_semanal:', err);
    throw err;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  agregarColumnasProgramacionSemanal()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { agregarColumnasProgramacionSemanal };
