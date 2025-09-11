const { query } = require('../config/postgresql');

/**
 * Script para actualizar los estados según los requerimientos:
 * - Estado "activo" con 2 versiones: "proceso de activo" y "de acreditación"
 */

async function checkCurrentEstados() {
  console.log('🔍 VERIFICANDO ESTADOS ACTUALES');
  console.log('=' .repeat(50));
  
  try {
    // Verificar estados existentes
    const estadosQuery = `
      SELECT id, nombre, descripcion, activo
      FROM mantenimiento.estados
      ORDER BY id
    `;
    
    const result = await query(estadosQuery);
    
    if (result.rows.length === 0) {
      console.log('⚠️ No hay estados en la tabla');
      return [];
    }
    
    console.log('📋 Estados actuales:');
    result.rows.forEach(row => {
      console.log(`   ID: ${row.id} | Nombre: "${row.nombre}" | Descripción: "${row.descripcion || 'Sin descripción'}" | Activo: ${row.activo}`);
    });
    
    return result.rows;
    
  } catch (error) {
    console.error('❌ Error verificando estados:', error);
    throw error;
  }
}

async function updateEstados() {
  console.log('\n🔄 ACTUALIZANDO ESTADOS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar estados actuales
    const currentEstados = await checkCurrentEstados();
    
    // 2. Definir los nuevos estados según requerimientos
    const nuevosEstados = [
      { nombre: 'Proceso de Activo', descripcion: 'Personal en proceso de activación' },
      { nombre: 'De Acreditación', descripcion: 'Personal en proceso de acreditación' },
      { nombre: 'Inactivo', descripcion: 'Personal temporalmente inactivo' },
      { nombre: 'Vacaciones', descripcion: 'Personal en período de vacaciones' }
    ];
    
    console.log('\n📋 Estados a configurar:');
    nuevosEstados.forEach((estado, index) => {
      console.log(`   ${index + 1}. "${estado.nombre}" - ${estado.descripcion}`);
    });
    
    // 3. Limpiar estados existentes si es necesario
    if (currentEstados.length > 0) {
      console.log('\n🗑️ Eliminando estados existentes...');
      await query('DELETE FROM mantenimiento.estados');
      console.log('✅ Estados existentes eliminados');
    }
    
    // 4. Insertar nuevos estados
    console.log('\n💾 Insertando nuevos estados...');
    
    const insertQuery = `
      INSERT INTO mantenimiento.estados (nombre, descripcion, activo)
      VALUES 
        ('Proceso de Activo', 'Personal en proceso de activación', true),
        ('De Acreditación', 'Personal en proceso de acreditación', true),
        ('Inactivo', 'Personal temporalmente inactivo', true),
        ('Vacaciones', 'Personal en período de vacaciones', true)
      RETURNING id, nombre, descripcion, activo
    `;
    
    const result = await query(insertQuery);
    
    console.log('✅ Estados creados exitosamente:');
    result.rows.forEach(row => {
      console.log(`   ID: ${row.id} | Nombre: "${row.nombre}" | Descripción: "${row.descripcion}"`);
    });
    
    return result.rows;
    
  } catch (error) {
    console.error('❌ Error actualizando estados:', error);
    throw error;
  }
}

async function verifyEstadosUpdate() {
  console.log('\n🔍 VERIFICANDO ACTUALIZACIÓN');
  console.log('=' .repeat(50));
  
  try {
    // Verificar que los estados se crearon correctamente
    const estadosQuery = `
      SELECT id, nombre, descripcion, activo
      FROM mantenimiento.estados
      ORDER BY id
    `;
    
    const result = await query(estadosQuery);
    
    console.log('📋 Estados finales:');
    result.rows.forEach(row => {
      console.log(`   ID: ${row.id} | Nombre: "${row.nombre}" | Descripción: "${row.descripcion}" | Activo: ${row.activo}`);
    });
    
    // Verificar que hay exactamente 4 estados
    if (result.rows.length === 4) {
      console.log('\n✅ Verificación exitosa: Se crearon 4 estados correctamente');
    } else {
      console.log(`\n⚠️ Advertencia: Se esperaban 4 estados, pero se encontraron ${result.rows.length}`);
    }
    
    // Verificar que los estados específicos existen
    const estadosEsperados = ['Proceso de Activo', 'De Acreditación', 'Inactivo', 'Vacaciones'];
    const estadosEncontrados = result.rows.map(row => row.nombre);
    
    console.log('\n🔍 Verificando estados específicos:');
    estadosEsperados.forEach(estado => {
      if (estadosEncontrados.includes(estado)) {
        console.log(`   ✅ "${estado}" - Encontrado`);
      } else {
        console.log(`   ❌ "${estado}" - No encontrado`);
      }
    });
    
    return result.rows;
    
  } catch (error) {
    console.error('❌ Error verificando actualización:', error);
    throw error;
  }
}

async function checkPersonalEstados() {
  console.log('\n👥 VERIFICANDO PERSONAL CON ESTADOS');
  console.log('=' .repeat(50));
  
  try {
    // Verificar cuántos personal tienen cada estado
    const personalQuery = `
      SELECT 
        e.nombre as estado_nombre,
        COUNT(p.rut) as cantidad_personal
      FROM mantenimiento.estados e
      LEFT JOIN mantenimiento.personal_disponible p ON e.id = p.estado_id
      GROUP BY e.id, e.nombre
      ORDER BY e.id
    `;
    
    const result = await query(personalQuery);
    
    console.log('📊 Distribución de personal por estado:');
    result.rows.forEach(row => {
      console.log(`   "${row.estado_nombre}": ${row.cantidad_personal} personas`);
    });
    
    // Verificar si hay personal con estados que ya no existen
    const personalOrphanQuery = `
      SELECT COUNT(*) as cantidad
      FROM mantenimiento.personal_disponible p
      LEFT JOIN mantenimiento.estados e ON p.estado_id = e.id
      WHERE e.id IS NULL
    `;
    
    const orphanResult = await query(personalOrphanQuery);
    const orphanCount = parseInt(orphanResult.rows[0].cantidad);
    
    if (orphanCount > 0) {
      console.log(`\n⚠️ Advertencia: ${orphanCount} personas tienen estados que ya no existen`);
      console.log('   Se recomienda actualizar estos registros');
    } else {
      console.log('\n✅ Todos los personal tienen estados válidos');
    }
    
  } catch (error) {
    console.error('❌ Error verificando personal:', error);
    throw error;
  }
}

async function runEstadosUpdate() {
  try {
    console.log('🚀 ACTUALIZANDO ESTADOS DEL SISTEMA');
    console.log('=' .repeat(60));
    console.log('📋 Objetivo: Configurar 4 estados con "activo" dividido en 2 versiones');
    console.log('   1. Proceso de Activo');
    console.log('   2. De Acreditación');
    console.log('   3. Inactivo');
    console.log('   4. Vacaciones');
    console.log('=' .repeat(60));
    
    // Actualizar estados
    await updateEstados();
    
    // Verificar actualización
    await verifyEstadosUpdate();
    
    // Verificar impacto en personal
    await checkPersonalEstados();
    
    console.log('\n🎉 ACTUALIZACIÓN DE ESTADOS COMPLETADA');
    console.log('=' .repeat(60));
    console.log('✅ Estados actualizados correctamente');
    console.log('✅ Verificación completada');
    console.log('✅ Impacto en personal verificado');
    
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Verificar que los endpoints de estados funcionan');
    console.log('   2. Actualizar personal que tenga estados obsoletos');
    console.log('   3. Probar la funcionalidad completa');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA ACTUALIZACIÓN:', error);
    console.error('\n🔧 Posibles soluciones:');
    console.error('   1. Verificar conexión a la base de datos');
    console.error('   2. Verificar permisos de usuario');
    console.error('   3. Verificar que la tabla estados existe');
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runEstadosUpdate()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = {
  runEstadosUpdate,
  checkCurrentEstados,
  updateEstados,
  verifyEstadosUpdate,
  checkPersonalEstados
};
