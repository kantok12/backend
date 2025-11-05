/**
 * Test para POST /api/programacion-semanal/copiar-semana
 * Prueba el endpoint que copia la programación de una semana a la siguiente
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testCopiarProgramacion() {
  console.log('🧪 Test: POST /api/programacion-semanal/copiar-semana\n');

  // Configuración del test
  const testConfig = {
    // Fecha de inicio de la semana actual (cualquier día de la semana)
    // El endpoint calculará automáticamente el lunes y domingo de esa semana
    fecha_inicio: '2025-11-03', // Semana con programación disponible
    
    // ID de la cartera (debe existir en la BD)
    cartera_id: 6 // Cartera con programación activa
  };

  console.log('📋 Configuración del test:');
  console.log(`   Fecha inicio: ${testConfig.fecha_inicio}`);
  console.log(`   Cartera ID: ${testConfig.cartera_id}\n`);

  // 1. Primero, obtener la programación actual para ver qué hay
  console.log('📊 Paso 1: Consultando programación de la semana actual...\n');
  
  try {
    const consultaActual = await axios.get(
      `${API_BASE}/programacion-semanal`,
      {
        params: {
          cartera_id: testConfig.cartera_id,
          fecha_inicio: testConfig.fecha_inicio,
          fecha_fin: testConfig.fecha_inicio // Mismo día para ver la semana
        }
      }
    );

    console.log('✅ Programación actual encontrada:');
    console.log(`   Total de asignaciones: ${consultaActual.data.data?.programacion?.length || 0}`);
    
    if (consultaActual.data.data?.programacion?.length > 0) {
      console.log('   Ejemplo de asignaciones:');
      consultaActual.data.data.programacion.slice(0, 3).forEach((dia, idx) => {
        console.log(`     ${idx + 1}. Fecha: ${dia.fecha}, Trabajadores: ${dia.trabajadores?.length || 0}`);
      });
    }
    console.log('');

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️ No se encontró programación para esta semana');
      console.log('💡 Sugerencia: Ajusta fecha_inicio o cartera_id en testConfig\n');
      return;
    }
    console.error('❌ Error consultando programación actual:', error.message);
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
      `${API_BASE}/programacion-semanal/copiar-semana`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${TOKEN}` // Descomentar si requiere auth
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
      console.log('📝 Nuevas asignaciones creadas (primeras 5):');
      data.nuevas_asignaciones.slice(0, 5).forEach((asig, idx) => {
        console.log(`   ${idx + 1}. ID: ${asig.id}, RUT: ${asig.rut}, Fecha: ${asig.fecha_trabajo}`);
      });
    }

  } catch (error) {
    console.error('❌ Error al copiar programación:\n');
    
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error('📄 Respuesta:', JSON.stringify(error.response.data, null, 2));
      console.error('');
      
      // Análisis del error
      if (error.response.status === 400) {
        console.error('💡 Error 400: Validación fallida. Verifica:');
        console.error('   - fecha_inicio está en formato correcto (YYYY-MM-DD)');
        console.error('   - cartera_id está presente');
      } else if (error.response.status === 404) {
        console.error('💡 Error 404: No se encontró programación para copiar');
        console.error('   - Verifica que existe programación en la semana especificada');
        console.error('   - Ajusta fecha_inicio o cartera_id en testConfig');
      } else if (error.response.status === 409) {
        console.error('💡 Error 409: Ya existe programación en la semana siguiente');
        console.error('   - Elimina la programación existente si quieres reemplazarla');
        console.error('   - O elige otra semana de origen');
      } else if (error.response.status === 500) {
        console.error('💡 Error 500: Error del servidor');
        console.error('   - Revisar logs del servidor');
        console.error('   - Verificar conexión a la base de datos');
      }
      
    } else if (error.request) {
      console.error('⚠️ No se recibió respuesta del servidor');
      console.error('💡 Verifica que el servidor esté corriendo en', API_BASE);
    } else {
      console.error('❌ Error:', error.message);
    }
  }

  // 3. Verificar que se copió correctamente
  console.log('\n📊 Paso 3: Verificando la programación copiada...\n');

  try {
    // Calcular fecha de la siguiente semana
    const fechaSiguiente = new Date(testConfig.fecha_inicio);
    fechaSiguiente.setDate(fechaSiguiente.getDate() + 7);
    const fechaSiguienteStr = fechaSiguiente.toISOString().split('T')[0];

    const consultaNueva = await axios.get(
      `${API_BASE}/programacion-semanal`,
      {
        params: {
          cartera_id: testConfig.cartera_id,
          fecha_inicio: fechaSiguienteStr,
          fecha_fin: fechaSiguienteStr
        }
      }
    );

    console.log('✅ Programación de la siguiente semana:');
    console.log(`   Total de asignaciones: ${consultaNueva.data.data?.programacion?.length || 0}`);
    
    if (consultaNueva.data.data?.programacion?.length > 0) {
      console.log('   Ejemplo de asignaciones:');
      consultaNueva.data.data.programacion.slice(0, 3).forEach((dia, idx) => {
        console.log(`     ${idx + 1}. Fecha: ${dia.fecha}, Trabajadores: ${dia.trabajadores?.length || 0}`);
      });
    }

    console.log('\n🎉 Test completado exitosamente!');

  } catch (error) {
    console.error('⚠️ No se pudo verificar la programación copiada:', error.message);
  }
}

// Ejecutar el test
console.log('═══════════════════════════════════════════════════════');
console.log('  TEST: Copiar Programación Semanal');
console.log('═══════════════════════════════════════════════════════\n');

testCopiarProgramacion().then(() => {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Fin del test');
  console.log('═══════════════════════════════════════════════════════');
}).catch(err => {
  console.error('\n❌ Error fatal en el test:', err.message);
  process.exit(1);
});
