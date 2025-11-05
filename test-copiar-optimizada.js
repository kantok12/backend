/**
 * Test para POST /api/programacion-optimizada/copiar-semana
 * Prueba el endpoint que copia la programación optimizada de una semana a la siguiente
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testCopiarProgramacionOptimizada() {
  console.log('🧪 Test: POST /api/programacion-optimizada/copiar-semana\n');

  // Usar datos reales de la base de datos
  const testConfig = {
    fecha_inicio: '2025-11-04', // Lunes de la semana con programación
    cartera_id: 6                // Cartera con asignaciones en esa semana
  };

  console.log('📋 Configuración del test:');
  console.log(`   Fecha inicio: ${testConfig.fecha_inicio}`);
  console.log(`   Cartera ID: ${testConfig.cartera_id}\n`);

  // 1. Consultar la programación actual
  console.log('📊 Paso 1: Consultando programación de la semana actual...\n');
  
  try {
    const consultaActual = await axios.get(
      `${API_BASE}/programacion-optimizada`,
      {
        params: {
          cartera_id: testConfig.cartera_id,
          fecha_inicio: '2025-11-04',
          fecha_fin: '2025-11-10' // Fin de la semana (domingo sería 2025-11-10)
        }
      }
    );

    console.log('✅ Programación actual encontrada:');
    const programacionActual = consultaActual.data.data?.programacion || [];
    console.log(`   Total de días con asignaciones: ${programacionActual.length}`);
    
    let totalTrabajadores = 0;
    programacionActual.forEach(dia => {
      totalTrabajadores += dia.trabajadores?.length || 0;
    });
    console.log(`   Total de asignaciones: ${totalTrabajadores}`);
    
    if (programacionActual.length > 0) {
      console.log('   Ejemplo de días:');
      programacionActual.slice(0, 3).forEach((dia, idx) => {
        console.log(`     ${idx + 1}. ${dia.dia_semana} ${dia.fecha}: ${dia.trabajadores?.length || 0} trabajadores`);
      });
    }
    console.log('');

    if (totalTrabajadores === 0) {
      console.log('⚠️ No hay asignaciones para copiar');
      console.log('💡 Ajusta fecha_inicio o cartera_id en testConfig\n');
      return;
    }

  } catch (error) {
    console.error('❌ Error consultando programación actual:', error.response?.data || error.message);
    return;
  }

  // 2. Copiar la programación a la siguiente semana
  console.log('📅 Paso 2: Copiando programación a la siguiente semana...\n');

  const payload = {
    fecha_inicio: testConfig.fecha_inicio,
    cartera_id: testConfig.cartera_id
  };

  console.log('📤 Enviando payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await axios.post(
      `${API_BASE}/programacion-optimizada/copiar-semana`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Programación copiada exitosamente!\n');
    console.log('📊 Resultado:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    // Resumen
    const data = response.data.data;
    console.log('📋 Resumen:');
    console.log(`   Semana origen: ${data.semana_origen.inicio} → ${data.semana_origen.fin}`);
    console.log(`   Semana destino: ${data.semana_destino.inicio} → ${data.semana_destino.fin}`);
    console.log(`   Asignaciones copiadas: ${data.asignaciones_copiadas}`);
    console.log(`   Errores: ${data.errores}`);
    console.log('');

    if (data.nuevas_asignaciones && data.nuevas_asignaciones.length > 0) {
      console.log('📝 Nuevas asignaciones creadas:');
      data.nuevas_asignaciones.forEach((asig, idx) => {
        console.log(`   ${idx + 1}. ID: ${asig.id}, RUT: ${asig.rut}, Fecha: ${asig.fecha_trabajo}`);
      });
    }

  } catch (error) {
    console.error('❌ Error al copiar programación:\n');
    
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error('📄 Respuesta:', JSON.stringify(error.response.data, null, 2));
      console.error('');
      
      if (error.response.status === 400) {
        console.error('💡 Error 400: Validación fallida');
      } else if (error.response.status === 404) {
        console.error('💡 Error 404: No se encontró programación o cartera');
      } else if (error.response.status === 409) {
        console.error('💡 Error 409: Ya existe programación en la semana siguiente');
        console.error('   Solución: Elimina la programación de la semana siguiente primero');
      } else if (error.response.status === 500) {
        console.error('💡 Error 500: Error del servidor - revisar logs');
      }
      
    } else if (error.request) {
      console.error('⚠️ No se recibió respuesta del servidor');
      console.error('💡 Verifica que el servidor esté corriendo en', API_BASE);
    } else {
      console.error('❌ Error:', error.message);
    }
    return;
  }

  // 3. Verificar la programación copiada
  console.log('\n📊 Paso 3: Verificando la programación copiada...\n');

  try {
    const consultaNueva = await axios.get(
      `${API_BASE}/programacion-optimizada`,
      {
        params: {
          cartera_id: testConfig.cartera_id,
          fecha_inicio: '2025-11-11', // Siguiente semana (lunes)
          fecha_fin: '2025-11-17'     // Siguiente semana (domingo)
        }
      }
    );

    console.log('✅ Programación de la siguiente semana:');
    const programacionNueva = consultaNueva.data.data?.programacion || [];
    console.log(`   Total de días con asignaciones: ${programacionNueva.length}`);
    
    let totalTrabajadores = 0;
    programacionNueva.forEach(dia => {
      totalTrabajadores += dia.trabajadores?.length || 0;
    });
    console.log(`   Total de asignaciones: ${totalTrabajadores}`);
    
    if (programacionNueva.length > 0) {
      console.log('   Ejemplo de días:');
      programacionNueva.slice(0, 3).forEach((dia, idx) => {
        console.log(`     ${idx + 1}. ${dia.dia_semana} ${dia.fecha}: ${dia.trabajadores?.length || 0} trabajadores`);
      });
    }

    console.log('\n🎉 Test completado exitosamente!');
    console.log('✅ La programación se copió correctamente a la siguiente semana');

  } catch (error) {
    console.error('⚠️ No se pudo verificar la programación copiada:', error.response?.data || error.message);
  }
}

// Ejecutar el test
console.log('═══════════════════════════════════════════════════════');
console.log('  TEST: Copiar Programación Optimizada');
console.log('═══════════════════════════════════════════════════════\n');

testCopiarProgramacionOptimizada().then(() => {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Fin del test');
  console.log('═══════════════════════════════════════════════════════');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Error fatal en el test:', err.message);
  process.exit(1);
});
