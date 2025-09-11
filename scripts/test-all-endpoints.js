const http = require('http');

async function testAllEndpoints() {
  console.log('🧪 PROBANDO TODOS LOS ENDPOINTS CORREGIDOS');
  console.log('==========================================');
  
  const baseUrl = 'http://localhost:3000';
  const endpoints = [
    // Endpoints que funcionan
    { path: '/api/faenas', name: 'Faenas', expected: 200 },
    { path: '/api/plantas', name: 'Plantas', expected: 200 },
    { path: '/api/lubricantes', name: 'Lubricantes', expected: 200 },
    { path: '/api/punto-lubricacion', name: 'Punto Lubricación', expected: 200 },
    
    // Endpoints que necesitan corrección
    { path: '/api/lineas', name: 'Líneas', expected: 500 },
    { path: '/api/equipos', name: 'Equipos', expected: 500 },
    { path: '/api/componentes', name: 'Componentes', expected: 500 },
    { path: '/api/tareas-proyectadas', name: 'Tareas Proyectadas', expected: 500 },
    { path: '/api/tareas-programadas', name: 'Tareas Programadas', expected: 500 },
    { path: '/api/tareas-ejecutadas', name: 'Tareas Ejecutadas', expected: 500 },
    
    // Endpoints que funcionan
    { path: '/api/personal-disponible', name: 'Personal', expected: 200 },
    { path: '/api/cursos', name: 'Cursos', expected: 200 },
    { path: '/api/estados', name: 'Estados', expected: 200 },
    
    // Endpoint faltante
    { path: '/api/cursos/stats', name: 'Cursos Stats', expected: 404 }
  ];
  
  const results = {
    working: [],
    errors: [],
    missing: []
  };
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Probando ${endpoint.name} (${endpoint.path})...`);
      
      const result = await makeRequest('GET', endpoint.path);
      console.log(`   Status: ${result.statusCode}`);
      
      if (result.statusCode === 200) {
        console.log(`   ✅ ${endpoint.name} - Funcionando correctamente`);
        if (Array.isArray(result.data)) {
          console.log(`   📊 Registros: ${result.data.length}`);
        }
        results.working.push(endpoint);
      } else if (result.statusCode === 500) {
        console.log(`   ❌ ${endpoint.name} - Error 500`);
        if (typeof result.data === 'object' && result.data.error) {
          console.log(`   📋 Error: ${result.data.error}`);
        }
        results.errors.push(endpoint);
      } else if (result.statusCode === 404) {
        console.log(`   ⚠️ ${endpoint.name} - No encontrado (404)`);
        results.missing.push(endpoint);
      } else {
        console.log(`   ⚠️ ${endpoint.name} - Status inesperado: ${result.statusCode}`);
        results.errors.push(endpoint);
      }
      
    } catch (error) {
      console.log(`   ❌ ${endpoint.name} - Error de conexión: ${error.message}`);
      results.errors.push(endpoint);
    }
  }
  
  // Resumen
  console.log('\n📊 RESUMEN DE PRUEBAS');
  console.log('=====================');
  console.log(`✅ Endpoints funcionando: ${results.working.length}`);
  results.working.forEach(ep => console.log(`   - ${ep.name}`));
  
  console.log(`\n❌ Endpoints con errores: ${results.errors.length}`);
  results.errors.forEach(ep => console.log(`   - ${ep.name}`));
  
  console.log(`\n⚠️ Endpoints faltantes: ${results.missing.length}`);
  results.missing.forEach(ep => console.log(`   - ${ep.name}`));
  
  // Próximos pasos
  console.log('\n🎯 PRÓXIMOS PASOS');
  console.log('==================');
  if (results.errors.length > 0) {
    console.log('1. Corregir endpoints con errores 500:');
    results.errors.forEach(ep => console.log(`   - ${ep.name}`));
  }
  if (results.missing.length > 0) {
    console.log('2. Implementar endpoints faltantes:');
    results.missing.forEach(ep => console.log(`   - ${ep.name}`));
  }
  
  return results;
}

function makeRequest(method, endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, 'http://localhost:3000');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

testAllEndpoints().catch(console.error);

