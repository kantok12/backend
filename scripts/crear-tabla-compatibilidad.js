const { query } = require('../config/database');

async function crearTablaCompatibilidad() {
  try {
    console.log('🚀 Creando tabla de compatibilidad...');

    // Verificar si la tabla ya existe
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = 'programacion_compatibilidad'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('⚠️  La tabla programacion_compatibilidad ya existe');
      return;
    }

    // Crear la tabla de compatibilidad
    await query(`
      CREATE TABLE mantenimiento.programacion_compatibilidad (
        id SERIAL PRIMARY KEY,
        rut VARCHAR(20) NOT NULL,
        cartera_id INTEGER NOT NULL,
        cliente_id INTEGER,
        nodo_id INTEGER,
        semana_inicio DATE NOT NULL,
        semana_fin DATE NOT NULL,
        lunes BOOLEAN DEFAULT FALSE,
        martes BOOLEAN DEFAULT FALSE,
        miercoles BOOLEAN DEFAULT FALSE,
        jueves BOOLEAN DEFAULT FALSE,
        viernes BOOLEAN DEFAULT FALSE,
        sabado BOOLEAN DEFAULT FALSE,
        domingo BOOLEAN DEFAULT FALSE,
        horas_estimadas INTEGER DEFAULT 8,
        observaciones TEXT,
        estado VARCHAR(20) DEFAULT 'activo',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        -- Restricción de unicidad: una asignación por persona por semana
        CONSTRAINT programacion_compatibilidad_rut_cartera_semana_key 
          UNIQUE (rut, cartera_id, semana_inicio)
      );
    `);

    console.log('✅ Tabla programacion_compatibilidad creada exitosamente');

    // Crear índices para optimización
    console.log('🔍 Creando índices...');

    await query(`
      CREATE INDEX idx_programacion_compatibilidad_cartera_semana 
      ON mantenimiento.programacion_compatibilidad (cartera_id, semana_inicio);
    `);

    await query(`
      CREATE INDEX idx_programacion_compatibilidad_rut 
      ON mantenimiento.programacion_compatibilidad (rut);
    `);

    await query(`
      CREATE INDEX idx_programacion_compatibilidad_estado 
      ON mantenimiento.programacion_compatibilidad (estado);
    `);

    console.log('✅ Índices creados exitosamente');

    // Crear función para actualizar updated_at automáticamente
    console.log('⚙️  Creando función de actualización automática...');

    await query(`
      CREATE OR REPLACE FUNCTION mantenimiento.update_programacion_compatibilidad_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Crear trigger para updated_at
    await query(`
      CREATE TRIGGER trigger_update_programacion_compatibilidad_updated_at
      BEFORE UPDATE ON mantenimiento.programacion_compatibilidad
      FOR EACH ROW
      EXECUTE FUNCTION mantenimiento.update_programacion_compatibilidad_updated_at();
    `);

    console.log('✅ Trigger de updated_at creado exitosamente');

    // Verificar la estructura de la tabla
    console.log('🔍 Verificando estructura de la tabla...');
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'programacion_compatibilidad'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Estructura de la tabla:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Verificar restricciones
    console.log('🔍 Verificando restricciones...');
    const constraints = await query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'programacion_compatibilidad';
    `);

    console.log('📋 Restricciones:');
    constraints.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.constraint_type}`);
    });

    // Verificar índices
    console.log('🔍 Verificando índices...');
    const indexes = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'mantenimiento' 
      AND tablename = 'programacion_compatibilidad';
    `);

    console.log('📋 Índices:');
    indexes.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

    console.log('🎉 ¡Tabla de compatibilidad creada exitosamente!');
    console.log('');
    console.log('📝 Próximos pasos:');
    console.log('1. Actualizar el endpoint de compatibilidad para usar esta tabla');
    console.log('2. Probar la funcionalidad con el frontend');
    console.log('3. Migrar datos existentes si es necesario');

  } catch (err) {
    console.error('❌ Error creando tabla de compatibilidad:', err.message);
    throw err;
  }
}

// Ejecutar la función
crearTablaCompatibilidad()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error en el script:', err.message);
    process.exit(1);
  });
