/**
 * Test para POST /api/documentos/registrar-existente
 * Prueba el endpoint que registra documentos existentes en Google Drive
 * 
 * CASO DE USO:
 * - El frontend encuentra archivos ya existentes en Google Drive
 * - Necesita registrarlos en la base de datos sin volver a subirlos
 * - El archivo puede estar en cualquier carpeta de Google Drive
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';

async function testRegistrarExistente() {
  console.log('🧪 Test: POST /api/documentos/registrar-existente\n');
  console.log('📋 Este test requiere:');
  console.log('   1. Un archivo existente en Google Drive (G:/)');
  console.log('   2. Un RUT válido en la base de datos\n');

  // Configuración del test
  const testConfig = {
    // Reemplazar con un RUT válido de tu base de datos
    rut_persona: '12345678-9',
    
    // Ruta de un archivo que YA EXISTE en Google Drive
    // Ejemplo: 'G:/Unidades compartidas/Unidad de Apoyo/Personal/JUAN PEREZ - 12345678-9/cursos_certificaciones/certificado-existente.pdf'
    ruta_local: 'G:/Unidades compartidas/Unidad de Apoyo/Personal/test-file.pdf',
    
    nombre_archivo: 'certificado-test.pdf',
    nombre_documento: 'Certificado de Prueba Existente',
    tipo_documento: 'certificado_curso', // Irá a cursos_certificaciones/
    descripcion: 'Documento existente en Google Drive para test',
    fecha_emision: '2024-01-15',
    fecha_vencimiento: '2025-01-15',
    institucion_emisora: 'Universidad Test'
  };

  // Validar que el archivo existe antes de hacer la petición
  console.log(`📁 Verificando archivo en: ${testConfig.ruta_local}`);
  
  if (!fs.existsSync(testConfig.ruta_local)) {
    console.log('❌ El archivo no existe en la ruta especificada');
    console.log('⚠️ Por favor, ajusta la ruta en testConfig.ruta_local');
    console.log('⚠️ O crea un archivo de prueba en Google Drive');
    return;
  }

  console.log('✅ Archivo encontrado\n');

  // 3. Payload para registrar documento existente
  const payload = {
    rut_persona: testConfig.rut_persona,
    nombre_archivo: testConfig.nombre_archivo,
    ruta_local: testConfig.ruta_local,
    nombre_documento: testConfig.nombre_documento,
    tipo_documento: testConfig.tipo_documento,
    descripcion: testConfig.descripcion,
    fecha_emision: testConfig.fecha_emision,
    fecha_vencimiento: testConfig.fecha_vencimiento,
    institucion_emisora: testConfig.institucion_emisora
  };

  console.log('📤 Enviando payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await axios.post(
      `${API_BASE}/documentos/registrar-existente`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${TOKEN}` // Descomentar si requiere auth
        }
      }
    );

    console.log('✅ Respuesta exitosa:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`\n📊 Status: ${response.status}`);
    console.log('\n🎯 El documento existente fue registrado en la base de datos');

  } catch (error) {
    console.error('❌ Error en la petición:\n');
    
    if (error.response) {
      // El servidor respondió con un status fuera del rango 2xx
      console.error(`📊 Status: ${error.response.status}`);
      console.error('📄 Respuesta:', JSON.stringify(error.response.data, null, 2));
      
      // Análisis del error
      if (error.response.status === 400) {
        console.error('\n💡 Error 400: Validación fallida. Verifica:');
        console.error('   - Todos los campos requeridos están presentes');
        console.error('   - tipo_documento es válido');
      } else if (error.response.status === 404) {
        console.error('\n💡 Error 404: Recurso no encontrado. Verifica:');
        console.error('   - El RUT existe en la base de datos');
        console.error('   - El archivo existe en la ruta especificada');
      } else if (error.response.status === 500) {
        console.error('\n💡 Error 500: Error del servidor. Posibles causas:');
        console.error('   - Error de permisos en Google Drive');
        console.error('   - Error en la base de datos');
        console.error('   - Revisar logs del servidor');
      }
      
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error('⚠️ No se recibió respuesta del servidor');
      console.error('💡 Verifica que el servidor esté corriendo en', API_BASE);
    } else {
      // Algo más sucedió
      console.error('❌ Error:', error.message);
    }
  }
}

// Ejecutar el test
testRegistrarExistente();
