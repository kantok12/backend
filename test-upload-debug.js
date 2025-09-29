const http = require('http');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUploadDebug() {
  console.log('🧪 PROBANDO SUBIDA DE DOCUMENTOS - DEBUG');
  console.log('========================================');
  
  try {
    // Crear un archivo de prueba
    const testContent = 'Este es un documento de prueba para el curso asignacion laboral';
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, testContent);
    
    console.log('📄 Archivo de prueba creado:', testFilePath);
    
    // Crear FormData
    const form = new FormData();
    form.append('archivo', fs.createReadStream(testFilePath), {
      filename: 'certificado-asignacion-laboral.txt',
      contentType: 'text/plain'
    });
    form.append('rut_persona', '15338132-1');
    form.append('nombre_documento', 'Certificado del curso asignacion laboral');
    form.append('tipo_documento', 'certificado_curso');
    form.append('descripcion', 'Certificado del curso de asignacion laboral');
    
    console.log('📋 Datos del formulario:');
    console.log('   - RUT: 15338132-1');
    console.log('   - Nombre: Certificado del curso asignacion laboral');
    console.log('   - Tipo: certificado_curso');
    console.log('   - Descripción: Certificado del curso de asignacion laboral');
    
    // Realizar petición
    console.log('\n🚀 Enviando petición POST...');
    
    const result = await makeUploadRequest('/api/documentos', form);
    
    console.log('\n📊 RESULTADO:');
    console.log('=============');
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message || 'N/A'}`);
    
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    
    if (result.data) {
      console.log('Data:', JSON.stringify(result.data, null, 2));
    }
    
    // Limpiar archivo de prueba
    fs.unlinkSync(testFilePath);
    console.log('\n🧹 Archivo de prueba eliminado');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('Stack:', error.stack);
  }
}

function makeUploadRequest(path, form) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ ...jsonBody, status: res.statusCode });
        } catch (e) {
          resolve({ 
            success: false, 
            message: 'Respuesta no es JSON válido', 
            body: body,
            status: res.statusCode 
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    form.pipe(req);
  });
}

// Ejecutar prueba
testUploadDebug();
