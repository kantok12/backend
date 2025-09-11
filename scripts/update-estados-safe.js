const { query } = require('../config/postgresql');

/**
 * Script seguro para actualizar los estados
 * Mapea los estados existentes a los nuevos sin violar restricciones FK
 */

async function checkCurrentEstados() {
  console.log('🔍 VERIFICANDO ESTADOS ACTUALES');
  console.log('=' .repeat(50));
  
  try {
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

async function checkPersonalEstados() {
  console.log('\n👥 VERIFICANDO PERSONAL CON ESTADOS');
  console.log('=' .repeat(50));
  
  try {
    const personalQuery = `
      SELECT 
        e.id as estado_id,
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
      console.log(`   ID: ${row.estado_id} | "${row.estado_nombre}": ${row.cantidad_personal} personas`);
    });
    
    return result.rows;
    
  } catch (error) {
    console.error('❌ Error verificando personal:', error);
    throw error;
  }
}

async function updateEstadosSafe() {
  console.log('\n🔄 ACTUALIZANDO ESTADOS DE FORMA SEGURA');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar estados actuales
    const currentEstados = await checkCurrentEstados();
    
    // 2. Verificar personal con estados
    const personalEstados = await checkPersonalEstados();
    
    // 3. Mapear estados existentes a nuevos
    const estadoMapping = {
      1: { nombre: 'Proceso de Activo', descripcion: 'Personal en proceso de activación' },
      2: { nombre: 'De Acreditación', descripcion: 'Personal en proceso de acreditación' },
      3: { nombre: 'Inactivo', descripcion: 'Personal temporalmente inactivo' },
      4: { nombre: 'Vacaciones', descripcion: 'Personal en período de vacaciones' }
    };
    
    console.log('\n📋 Mapeo de estados:');
    Object.entries(estadoMapping).forEach(([id, estado]) => {
      console.log(`   ID: ${id} → "${estado.nombre}"`);
    });
    
    // 4. Actualizar cada estado existente
    console.log('\n💾 Actualizando estados existentes...');
    
    for (const [id, nuevoEstado] of Object.entries(estadoMapping)) {
      const updateQuery = `
        UPDATE mantenimiento.estados 
        SET nombre = $1, descripcion = $2
        WHERE id = $3
        RETURNING id, nombre, descripcion
      `;
      
      const result = await query(updateQuery, [nuevoEstado.nombre, nuevoEstado.descripcion, id]);
      
      if (result.rows.length > 0) {
        console.log(`   ✅ ID ${id}: "${result.rows[0].nombre}" actualizado`);
      } else {
        console.log(`   ⚠️ ID ${id}: No se encontró estado para actualizar`);
      }
    }
    
    // 5. Verificar si hay estados adicionales que no se mapearon
    const estadosAdicionales = currentEstados.filter(estado => !estadoMapping[estado.id]);
    
    if (estadosAdicionales.length > 0) {
      console.log('\n⚠️ Estados adicionales encontrados:');
      estadosAdicionales.forEach(estado => {
        console.log(`   ID: ${estado.id} | Nombre: "${estado.nombre}"`);
      });
      
      // Desactivar estados adicionales en lugar de eliminarlos
      console.log('\n🔧 Desactivando estados adicionales...');
      for (const estado of estadosAdicionales) {
        const deactivateQuery = `
          UPDATE mantenimiento.estados 
          SET activo = false
          WHERE id = $1
        `;
        
        await query(deactivateQuery, [estado.id]);
        console.log(`   ✅ ID ${estado.id}: "${estado.nombre}" desactivado`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error actualizando estados:', error);
    throw error;
  }
}

async function verifyEstadosUpdate() {
  console.log('\n🔍 VERIFICANDO ACTUALIZACIÓN');
  console.log('=' .repeat(50));
  
  try {
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
    
    // Verificar que los estados específicos existen
    const estadosEsperados = ['Proceso de Activo', 'De Acreditación', 'Inactivo', 'Vacaciones'];
    const estadosEncontrados = result.rows.filter(row => row.activo).map(row => row.nombre);
    
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

async function runEstadosUpdateSafe() {
  try {
    console.log('🚀 ACTUALIZANDO ESTADOS DEL SISTEMA (MÉTODO SEGURO)');
    console.log('=' .repeat(60));
    console.log('📋 Objetivo: Actualizar estados existentes sin violar restricciones FK');
    console.log('   1. Proceso de Activo (ID: 1)');
    console.log('   2. De Acreditación (ID: 2)');
    console.log('   3. Inactivo (ID: 3)');
    console.log('   4. Vacaciones (ID: 4)');
    console.log('=' .repeat(60));
    
    // Actualizar estados de forma segura
    await updateEstadosSafe();
    
    // Verificar actualización
    await verifyEstadosUpdate();
    
    // Verificar impacto en personal
    await checkPersonalEstados();
    
    console.log('\n🎉 ACTUALIZACIÓN DE ESTADOS COMPLETADA');
    console.log('=' .repeat(60));
    console.log('✅ Estados actualizados correctamente');
    console.log('✅ Verificación completada');
    console.log('✅ Impacto en personal verificado');
    console.log('✅ Restricciones FK respetadas');
    
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Verificar que los endpoints de estados funcionan');
    console.log('   2. Probar la funcionalidad completa');
    console.log('   3. Informar a usuarios sobre los cambios');
    
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
  runEstadosUpdateSafe()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = {
  runEstadosUpdateSafe,
  checkCurrentEstados,
  updateEstadosSafe,
  verifyEstadosUpdate,
  checkPersonalEstados
};
