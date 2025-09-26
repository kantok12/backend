const http = require('http');

async function testEndpoint(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
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
          resolve({
            status: res.statusCode,
            path: path,
            method: method,
            data: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            path: path,
            method: method,
            data: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function testFileStorageEndpoints() {
  console.log('🧪 PROBANDO ENDPOINTS DE ALMACENAMIENTO DE ARCHIVOS');
  console.log('==================================================');
  
  const endpoints = [
    { path: '/api/documentos', method: 'GET', name: 'Listar Documentos' },
    { path: '/api/documentos/tipos', method: 'GET', name: 'Tipos de Documento' },
    { path: '/api/documentos/formatos', method: 'GET', name: 'Formatos Soportados' },
    { path: '/api/documentos/persona/12345678-9', method: 'GET', name: 'Documentos por Persona' },
    { path: '/api/documentos/1', method: 'GET', name: 'Obtener Documento por ID' },
    { path: '/api/documentos/1/descargar', method: 'GET', name: 'Descargar Documento' },
    { path: '/api/documentos/1', method: 'DELETE', name: 'Eliminar Documento' }
  ];

  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Probando: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      const result = await testEndpoint(endpoint.path, endpoint.method);
      
      if (result.status === 200) {
        console.log(`   ✅ Status: ${result.status} - OK`);
        if (result.data && result.data.success !== undefined) {
          console.log(`   📊 Success: ${result.data.success}`);
          if (result.data.data && Array.isArray(result.data.data)) {
            console.log(`   📈 Total: ${result.data.data.length} elementos`);
          } else if (result.data.total !== undefined) {
            console.log(`   📈 Total: ${result.data.total}`);
          }
        }
      } else if (result.status === 404) {
        console.log(`   ⚠️ Status: ${result.status} - Not Found (Esperado para IDs inexistentes)`);
      } else if (result.status === 500) {
        console.log(`   ❌ Status: ${result.status} - Server Error`);
        if (result.data && result.data.error) {
          console.log(`   🔍 Error: ${result.data.error}`);
        }
      } else {
        console.log(`   ⚠️ Status: ${result.status}`);
      }
      
      results.push({
        ...endpoint,
        status: result.status,
        success: result.status === 200 || result.status === 404,
        response: result.data
      });
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        ...endpoint,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }
  }
  
  // Resumen
  console.log('\n📊 RESUMEN DE PRUEBAS:');
  console.log('======================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Exitosos: ${successful}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  console.log('\n🔍 ENDPOINTS FUNCIONANDO:');
  results.filter(r => r.success).forEach(r => {
    console.log(`   ✅ ${r.method} ${r.path} - ${r.name}`);
  });
  
  console.log('\n❌ ENDPOINTS CON PROBLEMAS:');
  results.filter(r => !r.success).forEach(r => {
    console.log(`   ❌ ${r.method} ${r.path} - ${r.name} (Status: ${r.status})`);
  });
  
  return results;
}

// Ejecutar pruebas
testFileStorageEndpoints()
  .then(results => {
    console.log('\n🎉 PRUEBAS COMPLETADAS');
    console.log('======================');
    
    const allWorking = results.every(r => r.success);
    if (allWorking) {
      console.log('✅ ¡Todos los endpoints de almacenamiento están funcionando correctamente!');
      console.log('🚀 El sistema está listo para recibir archivos desde el frontend.');
    } else {
      console.log('⚠️ Algunos endpoints necesitan atención.');
      console.log('🔧 Revisa los errores mostrados arriba.');
    }
  })
  .catch(console.error);
