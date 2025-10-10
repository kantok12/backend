const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/servicios';

async function testMinimoPersonal() {
  try {
    console.log('🧪 Probando endpoints de mínimo de personal y acuerdos...\n');

    // 1. Listar mínimos de personal existentes
    console.log('1️⃣ Listando mínimos de personal existentes...');
    const minimosResponse = await axios.get(`${BASE_URL}/minimo-personal`);
    console.log(`✅ Status: ${minimosResponse.status}`);
    console.log(`📊 Mínimos encontrados: ${minimosResponse.data.data.length}`);
    
    if (minimosResponse.data.data.length > 0) {
      const primerMinimo = minimosResponse.data.data[0];
      console.log(`📋 Primer mínimo: ID ${primerMinimo.id}, Cartera ${primerMinimo.cartera_id}, Mínimo base: ${primerMinimo.minimo_base}, Mínimo real: ${primerMinimo.minimo_real}`);
    }

    // 2. Crear un nuevo mínimo de personal
    console.log('\n2️⃣ Creando nuevo mínimo de personal...');
    const nuevoMinimo = {
      cartera_id: 1,
      minimo_base: 3,
      descripcion: 'Mínimo de personal para pruebas'
    };
    
    const crearMinimoResponse = await axios.post(`${BASE_URL}/minimo-personal`, nuevoMinimo);
    console.log(`✅ Status: ${crearMinimoResponse.status}`);
    console.log(`📋 Mínimo creado: ID ${crearMinimoResponse.data.data.id}`);
    const minimoId = crearMinimoResponse.data.data.id;

    // 3. Obtener el mínimo específico
    console.log('\n3️⃣ Obteniendo mínimo específico...');
    const minimoEspecificoResponse = await axios.get(`${BASE_URL}/minimo-personal/${minimoId}`);
    console.log(`✅ Status: ${minimoEspecificoResponse.status}`);
    console.log(`📋 Mínimo base: ${minimoEspecificoResponse.data.data.minimo_base}, Mínimo real: ${minimoEspecificoResponse.data.data.minimo_real}`);

    // 4. Crear un acuerdo de incremento
    console.log('\n4️⃣ Creando acuerdo de incremento...');
    const nuevoAcuerdo = {
      minimo_personal_id: minimoId,
      tipo_acuerdo: 'incremento',
      valor_modificacion: 2,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
      motivo: 'Incremento temporal por alta demanda',
      aprobado_por: 'Gerente de Operaciones'
    };
    
    const crearAcuerdoResponse = await axios.post(`${BASE_URL}/acuerdos`, nuevoAcuerdo);
    console.log(`✅ Status: ${crearAcuerdoResponse.status}`);
    console.log(`📋 Acuerdo creado: ID ${crearAcuerdoResponse.data.data.id}`);
    const acuerdoId = crearAcuerdoResponse.data.data.id;

    // 5. Calcular mínimo real
    console.log('\n5️⃣ Calculando mínimo real...');
    const calcularResponse = await axios.get(`${BASE_URL}/minimo-personal/${minimoId}/calcular`);
    console.log(`✅ Status: ${calcularResponse.status}`);
    console.log(`📊 Mínimo real calculado: ${calcularResponse.data.data.minimo_real}`);
    console.log(`📋 Acuerdos aplicados: ${calcularResponse.data.data.acuerdos_aplicados.length}`);

    // 6. Listar acuerdos
    console.log('\n6️⃣ Listando acuerdos...');
    const acuerdosResponse = await axios.get(`${BASE_URL}/acuerdos`);
    console.log(`✅ Status: ${acuerdosResponse.status}`);
    console.log(`📊 Acuerdos encontrados: ${acuerdosResponse.data.data.length}`);

    // 7. Crear un acuerdo de reducción
    console.log('\n7️⃣ Creando acuerdo de reducción...');
    const acuerdoReduccion = {
      minimo_personal_id: minimoId,
      tipo_acuerdo: 'reduccion',
      valor_modificacion: -1,
      fecha_inicio: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 días
      fecha_fin: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 días
      motivo: 'Reducción por mantenimiento programado',
      aprobado_por: 'Supervisor de Mantenimiento'
    };
    
    const crearReduccionResponse = await axios.post(`${BASE_URL}/acuerdos`, acuerdoReduccion);
    console.log(`✅ Status: ${crearReduccionResponse.status}`);
    console.log(`📋 Acuerdo de reducción creado: ID ${crearReduccionResponse.data.data.id}`);

    // 8. Calcular mínimo real con ambos acuerdos
    console.log('\n8️⃣ Calculando mínimo real con ambos acuerdos...');
    const calcularFinalResponse = await axios.get(`${BASE_URL}/minimo-personal/${minimoId}/calcular`);
    console.log(`✅ Status: ${calcularFinalResponse.status}`);
    console.log(`📊 Mínimo real final: ${calcularFinalResponse.data.data.minimo_real}`);
    console.log(`📋 Total acuerdos aplicados: ${calcularFinalResponse.data.data.acuerdos_aplicados.length}`);

    // 9. Listar acuerdos próximos a vencer
    console.log('\n9️⃣ Listando acuerdos próximos a vencer...');
    const vencerResponse = await axios.get(`${BASE_URL}/acuerdos/vencer?dias=60`);
    console.log(`✅ Status: ${vencerResponse.status}`);
    console.log(`📊 Acuerdos próximos a vencer: ${vencerResponse.data.data.length}`);

    // 10. Actualizar mínimo de personal
    console.log('\n🔟 Actualizando mínimo de personal...');
    const actualizarMinimo = {
      minimo_base: 4,
      descripcion: 'Mínimo actualizado para pruebas'
    };
    
    const actualizarResponse = await axios.put(`${BASE_URL}/minimo-personal/${minimoId}`, actualizarMinimo);
    console.log(`✅ Status: ${actualizarResponse.status}`);
    console.log(`📋 Mínimo actualizado: Base ${actualizarResponse.data.data.minimo_base}`);

    console.log('\n🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testMinimoPersonal();
}

module.exports = { testMinimoPersonal };

