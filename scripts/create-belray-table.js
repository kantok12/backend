const { query } = require('../config/database');

async function crearTablaBelray() {
  try {
    console.log('🚀 Iniciando creación de tabla Belray...');

    // Verificar si la tabla ya existe
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = 'belray'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('⚠️  La tabla mantenimiento.belray ya existe');
      
      // Mostrar estructura actual
      const structure = await query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = 'belray'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Estructura actual de la tabla:');
      structure.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      return;
    }

    // Crear la tabla Belray
    console.log('📝 Creando tabla mantenimiento.belray...');
    
    const createTableQuery = `
      CREATE TABLE mantenimiento.belray (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        codigo VARCHAR(100) UNIQUE,
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuario_creacion VARCHAR(100),
        usuario_modificacion VARCHAR(100),
        observaciones TEXT
      );
    `;

    await query(createTableQuery);
    console.log('✅ Tabla mantenimiento.belray creada exitosamente');

    // Crear índices para optimizar consultas
    console.log('📊 Creando índices...');
    
    await query(`
      CREATE INDEX idx_belray_activo ON mantenimiento.belray(activo);
    `);
    
    await query(`
      CREATE INDEX idx_belray_codigo ON mantenimiento.belray(codigo);
    `);
    
    await query(`
      CREATE INDEX idx_belray_fecha_creacion ON mantenimiento.belray(fecha_creacion);
    `);
    
    console.log('✅ Índices creados exitosamente');

    // Crear trigger para actualizar fecha_modificacion automáticamente
    console.log('⚙️ Creando trigger para fecha_modificacion...');
    
    await query(`
      CREATE OR REPLACE FUNCTION mantenimiento.update_belray_modification_date()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.fecha_modificacion = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await query(`
      CREATE TRIGGER trigger_belray_update_modification_date
        BEFORE UPDATE ON mantenimiento.belray
        FOR EACH ROW
        EXECUTE FUNCTION mantenimiento.update_belray_modification_date();
    `);
    
    console.log('✅ Trigger creado exitosamente');

    // Insertar algunos datos de ejemplo
    console.log('📝 Insertando datos de ejemplo...');
    
    const insertExamples = [
      {
        nombre: 'Belray Principal',
        descripcion: 'Sistema principal de Belray',
        codigo: 'BELRAY-001',
        usuario_creacion: 'sistema'
      },
      {
        nombre: 'Belray Secundario',
        descripcion: 'Sistema secundario de Belray',
        codigo: 'BELRAY-002',
        usuario_creacion: 'sistema'
      },
      {
        nombre: 'Belray Backup',
        descripcion: 'Sistema de respaldo de Belray',
        codigo: 'BELRAY-003',
        usuario_creacion: 'sistema'
      }
    ];

    for (const example of insertExamples) {
      await query(`
        INSERT INTO mantenimiento.belray (nombre, descripcion, codigo, usuario_creacion)
        VALUES ($1, $2, $3, $4)
      `, [example.nombre, example.descripcion, example.codigo, example.usuario_creacion]);
    }
    
    console.log('✅ Datos de ejemplo insertados exitosamente');

    // Verificar la creación
    const count = await query('SELECT COUNT(*) as total FROM mantenimiento.belray');
    console.log(`📊 Total de registros en la tabla: ${count.rows[0].total}`);

    // Mostrar estructura final
    const finalStructure = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'belray'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estructura final de la tabla mantenimiento.belray:');
    finalStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n🎉 ¡Tabla Belray creada exitosamente!');

  } catch (error) {
    console.error('❌ Error creando tabla Belray:', error);
    throw error;
  }
}

if (require.main === module) {
  crearTablaBelray()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { crearTablaBelray };
