const axios = require('axios');

const BASE_URL = 'http://192.168.10.194:3000/api';

async function testCursosDocumentos() {
  try {
    console.log('🔍 Probando endpoints de cursos con documentos...\n');

    // 1. Probar obtener documentos de una persona
    console.log('1. Probando GET /api/cursos/persona/{rut}/documentos');
    try {
      const response = await axios.get(`${BASE_URL}/cursos/persona/15338132-1/documentos`);
      console.log('✅ Respuesta:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. Probar obtener tipos de documentos
    console.log('2. Probando GET /api/documentos/tipos');
    try {
      const response = await axios.get(`${BASE_URL}/documentos/tipos`);
      console.log('✅ Tipos de documentos:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. Probar obtener documentos de personal (sistema separado)
    console.log('3. Probando GET /api/documentos/persona/{rut}');
    try {
      const response = await axios.get(`${BASE_URL}/documentos/persona/15338132-1`);
      console.log('✅ Documentos de personal:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testCursosDocumentos();
