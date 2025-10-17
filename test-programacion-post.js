const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testProgramacionPost() {
  try {
    console.log('🧪 Probando POST /api/programacion...');
    
    const testData = {
      rut: "19838046-6", // RUT que sabemos que existe
      cartera_id: 1,
      cliente_id: 5,
      nodo_id: 12,
      semana_inicio: "2024-01-15",
      lunes: true,
      martes: true,
      miercoles: false,
      jueves: true,
      viernes: true,
      sabado: false,
      domingo: false,
      horas_estimadas: 8,
      observaciones: "Prueba de programación",
      estado: "programado"
    };
    
    console.log('📤 Enviando datos:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/programacion`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error en la petición:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Error:', error.response?.data?.error);
    console.error('Full response:', JSON.stringify(error.response?.data, null, 2));
  }
}

testProgramacionPost();




