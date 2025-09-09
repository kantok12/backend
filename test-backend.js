const http = require('http');

// Función para hacer peticiones HTTP simples
function testEndpoint(path, port = 3000) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsedData,
            success: res.statusCode === 200
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            success: false,
            error: 'JSON Parse Error'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        success: false,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

// Tests del backend
async function runTests() {
  console.log('🧪 Iniciando tests del backend...\n');

  const tests = [
    { name: 'Health Check', path: '/api/health' },
    { name: 'Frontend Debug', path: '/api/debug/frontend' },
    { name: 'Root Endpoint', path: '/' },
    { name: 'Personal Disponible', path: '/api/personal-disponible' },
    { name: 'Estados', path: '/api/estados' },
    { name: 'Cursos', path: '/api/cursos' }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name} (${test.path})`);
      
      const result = await testEndpoint(test.path);
      
      if (result.success) {
        console.log(`✅ ${test.name}: OK (${result.status})`);
        if (test.path === '/api/health') {
          console.log(`   📊 Status: ${result.data.status}`);
          console.log(`   🕒 Environment: ${result.data.environment}`);
        }
        passedTests++;
      } else {
        console.log(`❌ ${test.name}: FAIL (${result.status})`);
        console.log(`   📝 Error: ${result.error || 'HTTP Error'}`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`);
      console.log(`   📝 Error: ${error.error}`);
    }
    
    console.log(''); // Línea en blanco
  }

  console.log('📊 Resumen de Tests:');
  console.log(`✅ Pasaron: ${passedTests}/${totalTests}`);
  console.log(`❌ Fallaron: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ¡Todos los tests pasaron! Backend funcionando correctamente.');
    console.log('\n🔗 URLs disponibles:');
    console.log('   • Health Check: http://localhost:3000/api/health');
    console.log('   • Frontend Debug: http://localhost:3000/api/debug/frontend');
    console.log('   • Personal: http://localhost:3000/api/personal-disponible');
  } else {
    console.log('\n⚠️  Algunos tests fallaron. Verificar configuración del servidor.');
  }
}

// Ejecutar tests
runTests().catch(console.error);









