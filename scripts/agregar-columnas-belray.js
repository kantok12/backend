const { query } = require('../config/database');

async function agregarColumnasBelray() {
  try {
    console.log('🚀 Iniciando adición de columnas a la tabla Belray...');

    // Verificar si la tabla existe
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = 'belray'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ La tabla mantenimiento.belray no existe');
      return;
    }

    console.log('✅ Tabla mantenimiento.belray encontrada');

    // Verificar estructura actual
    const currentStructure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'belray'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Estructura actual de la tabla:');
    currentStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Lista de columnas a agregar
    const nuevasColumnas = [
      {
        nombre: 'giro',
        tipo: 'VARCHAR(255)',
        descripcion: 'Giro comercial de la empresa'
      },
      {
        nombre: 'numero_telefono',
        tipo: 'VARCHAR(20)',
        descripcion: 'Número de teléfono de contacto'
      },
      {
        nombre: 'direccion',
        tipo: 'TEXT',
        descripcion: 'Dirección física de la empresa'
      }
    ];

    console.log('\n📝 Agregando nuevas columnas...');

    for (const columna of nuevasColumnas) {
      // Verificar si la columna ya existe
      const columnaExiste = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'mantenimiento' 
          AND table_name = 'belray' 
          AND column_name = $1
        );
      `, [columna.nombre]);

      if (columnaExiste.rows[0].exists) {
        console.log(`   ⚠️  Columna "${columna.nombre}" ya existe, omitiendo...`);
        continue;
      }

      // Agregar la columna
      const alterQuery = `
        ALTER TABLE mantenimiento.belray 
        ADD COLUMN ${columna.nombre} ${columna.tipo};
      `;

      await query(alterQuery);
      console.log(`   ✅ Columna "${columna.nombre}" agregada exitosamente`);
    }

    // Crear índices para las nuevas columnas
    console.log('\n📊 Creando índices para las nuevas columnas...');
    
    const indices = [
      { columna: 'giro', nombre: 'idx_belray_giro' },
      { columna: 'numero_telefono', nombre: 'idx_belray_telefono' }
    ];

    for (const indice of indices) {
      try {
        await query(`
          CREATE INDEX ${indice.nombre} ON mantenimiento.belray(${indice.columna});
        `);
        console.log(`   ✅ Índice "${indice.nombre}" creado exitosamente`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Índice "${indice.nombre}" ya existe, omitiendo...`);
        } else {
          console.log(`   ❌ Error creando índice "${indice.nombre}": ${error.message}`);
        }
      }
    }

    // Actualizar registros existentes con datos de ejemplo
    console.log('\n📝 Actualizando registros existentes con datos de ejemplo...');
    
    const datosEjemplo = [
      {
        id: 1,
        giro: 'Servicios de Mantenimiento Industrial',
        numero_telefono: '+56 2 2345 6789',
        direccion: 'Av. Industrial 1234, Santiago, Región Metropolitana'
      },
      {
        id: 2,
        giro: 'Consultoría Técnica Especializada',
        numero_telefono: '+56 2 2345 6790',
        direccion: 'Calle Técnica 567, Providencia, Santiago'
      },
      {
        id: 3,
        giro: 'Sistemas de Respaldo y Backup',
        numero_telefono: '+56 2 2345 6791',
        direccion: 'Plaza Backup 890, Las Condes, Santiago'
      }
    ];

    for (const dato of datosEjemplo) {
      await query(`
        UPDATE mantenimiento.belray 
        SET giro = $1, numero_telefono = $2, direccion = $3
        WHERE id = $4
      `, [dato.giro, dato.numero_telefono, dato.direccion, dato.id]);
      
      console.log(`   ✅ Registro ID ${dato.id} actualizado`);
    }

    // Verificar la estructura final
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

    // Mostrar datos actualizados
    const datosActualizados = await query(`
      SELECT id, nombre, giro, numero_telefono, direccion
      FROM mantenimiento.belray
      ORDER BY id;
    `);

    console.log('\n📊 Datos actualizados:');
    datosActualizados.rows.forEach(registro => {
      console.log(`   ID ${registro.id}: ${registro.nombre}`);
      console.log(`      Giro: ${registro.giro}`);
      console.log(`      Teléfono: ${registro.numero_telefono}`);
      console.log(`      Dirección: ${registro.direccion}`);
      console.log('');
    });

    console.log('🎉 ¡Columnas agregadas exitosamente a la tabla Belray!');

  } catch (error) {
    console.error('❌ Error agregando columnas a Belray:', error);
    throw error;
  }
}

if (require.main === module) {
  agregarColumnasBelray()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { agregarColumnasBelray };
