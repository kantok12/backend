const { query } = require('../config/database');

async function modificarRestriccionUnicidad() {
  try {
    console.log('🚀 Modificando restricción de unicidad para permitir múltiples días...');

    // Verificar restricciones actuales
    console.log('🔍 Verificando restricciones actuales...');
    const constraintsActuales = await query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'programacion_compatibilidad';
    `);

    console.log('📋 Restricciones actuales:');
    constraintsActuales.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.constraint_type}`);
    });

    // Eliminar restricción actual de unicidad por semana
    console.log('🗑️ Eliminando restricción de unicidad por semana...');
    await query(`
      ALTER TABLE mantenimiento.programacion_compatibilidad 
      DROP CONSTRAINT IF EXISTS programacion_compatibilidad_rut_cartera_semana_key;
    `);

    console.log('✅ Restricción de unicidad por semana eliminada');

    // Agregar nueva restricción de unicidad por día específico
    console.log('➕ Agregando nueva restricción de unicidad por día específico...');
    await query(`
      ALTER TABLE mantenimiento.programacion_compatibilidad 
      ADD CONSTRAINT programacion_compatibilidad_rut_cartera_dia_key 
      UNIQUE (rut, cartera_id, semana_inicio, dia_semana);
    `);

    console.log('✅ Nueva restricción de unicidad por día específico agregada');

    // Verificar nuevas restricciones
    console.log('🔍 Verificando nuevas restricciones...');
    const constraintsNuevas = await query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'programacion_compatibilidad';
    `);

    console.log('📋 Restricciones nuevas:');
    constraintsNuevas.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.constraint_type}`);
    });

    console.log('🎉 ¡Restricción de unicidad modificada exitosamente!');
    console.log('');
    console.log('📝 Cambios realizados:');
    console.log('✅ Eliminada: programacion_compatibilidad_rut_cartera_semana_key');
    console.log('✅ Agregada: programacion_compatibilidad_rut_cartera_dia_key');
    console.log('');
    console.log('🎯 Resultado:');
    console.log('- Ahora un usuario puede tener múltiples asignaciones en la misma semana');
    console.log('- Cada asignación debe ser para un día diferente');
    console.log('- Se mantiene la unicidad por día específico');

  } catch (err) {
    console.error('❌ Error modificando restricción de unicidad:', err.message);
    throw err;
  }
}

// Ejecutar la función
modificarRestriccionUnicidad()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error en el script:', err.message);
    process.exit(1);
  });
