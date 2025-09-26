const http = require('http');

async function testEndpoint(path, method = 'GET', data = null) {
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

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🧪 PROBANDO TODOS LOS ENDPOINTS DE SERVICIOS');
  console.log('=============================================');
  
  const endpoints = [
    // Endpoints básicos
    { path: '/', method: 'GET', name: 'Root' },
    { path: '/api/health', method: 'GET', name: 'Health Check' },
    
    // Endpoints de carteras
    { path: '/api/carteras', method: 'GET', name: 'Listar Carteras' },
    { path: '/api/carteras/1', method: 'GET', name: 'Obtener Cartera por ID' },
    { path: '/api/carteras/1/estadisticas', method: 'GET', name: 'Estadísticas de Cartera' },
    
    // Endpoints de clientes
    { path: '/api/clientes', method: 'GET', name: 'Listar Clientes' },
    { path: '/api/clientes/1', method: 'GET', name: 'Obtener Cliente por ID' },
    
    // Endpoints de nodos
    { path: '/api/nodos', method: 'GET', name: 'Listar Nodos' },
    { path: '/api/nodos/1', method: 'GET', name: 'Obtener Nodo por ID' },
    
    // Endpoints de personal
    { path: '/api/personal-disponible', method: 'GET', name: 'Listar Personal' },
    { path: '/api/personal-disponible/1', method: 'GET', name: 'Obtener Personal por ID' },
    
    // Endpoints de estados
    { path: '/api/estados', method: 'GET', name: 'Listar Estados' },
    { path: '/api/estados/1', method: 'GET', name: 'Obtener Estado por ID' },
    
    // Endpoints de nombres
    { path: '/api/nombres', method: 'GET', name: 'Listar Nombres' },
    { path: '/api/nombres/stats', method: 'GET', name: 'Estadísticas de Nombres' },
    { path: '/api/nombres/search?q=test', method: 'GET', name: 'Buscar Nombres' },
    
    // Endpoints de cursos
    { path: '/api/cursos', method: 'GET', name: 'Listar Cursos' },
    { path: '/api/cursos/1', method: 'GET', name: 'Obtener Curso por ID' },
    
    // Endpoints de documentos
    { path: '/api/documentos', method: 'GET', name: 'Listar Documentos' },
    { path: '/api/documentos/1', method: 'GET', name: 'Obtener Documento por ID' }
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
          if (result.data.total !== undefined) {
            console.log(`   📈 Total: ${result.data.total}`);
          }
        }
      } else if (result.status === 404) {
        console.log(`   ⚠️ Status: ${result.status} - Not Found`);
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
        success: result.status === 200
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
  console.log('\n📊 RESUMEN DE ENDPOINTS:');
  console.log('========================');
  
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
}

testAllEndpoints().catch(console.error);
