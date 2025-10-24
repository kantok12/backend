const { query } = require('../config/database');

async function agregarColumnasAntecedentesBelray() {
  try {
    console.log('🚀 Agregando columnas de antecedentes generales a la tabla Belray...');

    // Lista de columnas a agregar
    const columnas = [
      { nombre: 'razon_social', tipo: 'VARCHAR(255)' },
      { nombre: 'rut_empresa', tipo: 'VARCHAR(20)' },
      { nombre: 'comuna', tipo: 'VARCHAR(100)' },
      { nombre: 'correo_electronico', tipo: 'VARCHAR(255)' },
      { nombre: 'representante_legal', tipo: 'VARCHAR(255)' },
      { nombre: 'gerente_general', tipo: 'VARCHAR(255)' },
      { nombre: 'numero_trabajadores_obra', tipo: 'INTEGER' },
      { nombre: 'organismo_admin_ley_16744', tipo: 'VARCHAR(255)' },
      { nombre: 'numero_adherentes', tipo: 'INTEGER' },
      { nombre: 'tasa_siniestralidad_generica', tipo: 'DECIMAL(5,2)' },
      { nombre: 'tasa_siniestralidad_adicional', tipo: 'DECIMAL(5,2)' },
      { nombre: 'experto_prevencion_riesgos', tipo: 'VARCHAR(255)' },
      { nombre: 'supervisor_coordinador_obra', tipo: 'VARCHAR(255)' }
    ];

    console.log(`📋 Columnas a agregar: ${columnas.length}`);

    // Verificar columnas existentes
    const columnasExistentes = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'belray'
      ORDER BY column_name
    `);

    console.log('📊 Columnas existentes en mantenimiento.belray:');
    columnasExistentes.rows.forEach(col => {
      console.log(`   ✅ ${col.column_name}`);
    });

    // Agregar columnas que no existen
    for (const columna of columnas) {
      try {
        // Verificar si la columna ya existe
        const existe = columnasExistentes.rows.find(c => c.column_name === columna.nombre);
        
        if (existe) {
          console.log(`   ⚠️  Columna "${columna.nombre}" ya existe, omitiendo...`);
        } else {
          await query(`
            ALTER TABLE mantenimiento.belray 
            ADD COLUMN ${columna.nombre} ${columna.tipo}
          `);
          console.log(`   ✅ Columna "${columna.nombre}" agregada (${columna.tipo})`);
        }
      } catch (error) {
        console.error(`   ❌ Error agregando columna "${columna.nombre}":`, error.message);
      }
    }

    // Crear índices para las nuevas columnas importantes
    console.log('\n📈 Creando índices para nuevas columnas...');
    const indices = [
      { nombre: 'idx_belray_rut_empresa', columna: 'rut_empresa' },
      { nombre: 'idx_belray_razon_social', columna: 'razon_social' },
      { nombre: 'idx_belray_comuna', columna: 'comuna' }
    ];

    for (const indice of indices) {
      try {
        await query(`
          CREATE INDEX IF NOT EXISTS ${indice.nombre} 
          ON mantenimiento.belray(${indice.columna})
        `);
        console.log(`   ✅ Índice "${indice.nombre}" creado`);
      } catch (error) {
        console.error(`   ❌ Error creando índice "${indice.nombre}":`, error.message);
      }
    }

    // Verificar estructura final
    console.log('\n🔍 Verificando estructura final...');
    const estructuraFinal = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'belray'
      ORDER BY ordinal_position
    `);

    console.log('📋 Estructura final de mantenimiento.belray:');
    estructuraFinal.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const default_val = col.column_default ? `DEFAULT ${col.column_default}` : '';
      console.log(`   ${col.column_name}: ${col.data_type} ${nullable} ${default_val}`);
    });

    // Actualizar la configuración de auditoría para incluir las nuevas columnas sensibles
    console.log('\n⚙️ Actualizando configuración de auditoría...');
    const nuevasColumnasSensibles = [
      'razon_social', 'rut_empresa', 'correo_electronico', 
      'representante_legal', 'gerente_general', 'experto_prevencion_riesgos'
    ];

    await query(`
      UPDATE sistema.configuracion_auditoria 
      SET campos_sensibles = $1
      WHERE tabla = 'belray'
    `, [nuevasColumnasSensibles]);

    console.log('✅ Configuración de auditoría actualizada');

    console.log('\n🎉 ¡Columnas de antecedentes generales agregadas exitosamente!');

  } catch (error) {
    console.error('❌ Error agregando columnas de antecedentes:', error);
    throw error;
  }
}

if (require.main === module) {
  agregarColumnasAntecedentesBelray()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { agregarColumnasAntecedentesBelray };





