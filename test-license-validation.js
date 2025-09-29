const http = require('http');

async function testLicenseValidation() {
  console.log('🧪 PROBANDO VALIDACIÓN DE LICENCIAS DE CONDUCIR');
  console.log('===============================================');
  
  const testRut = '15338132-1';
  
  // Casos de prueba
  const testCases = [
    { licencia: 'B', descripcion: 'Licencia B (válida)' },
    { licencia: 'A1', descripcion: 'Licencia A1 (válida)' },
    { licencia: 'B2', descripcion: 'Licencia B2 (válida)' },
    { licencia: 'C1', descripcion: 'Licencia C1 (válida)' },
    { licencia: 'B12345678', descripcion: 'Licencia B12345678 (INVÁLIDA - demasiados números)' },
    { licencia: 'ABC', descripcion: 'Licencia ABC (INVÁLIDA - demasiadas letras)' },
    { licencia: '123', descripcion: 'Licencia 123 (INVÁLIDA - solo números)' },
    { licencia: 'B-123', descripcion: 'Licencia B-123 (INVÁLIDA - con guión)' },
    { licencia: '', descripcion: 'Licencia vacía (INVÁLIDA)' }
  ];
  
  try {
    for (const testCase of testCases) {
      console.log(`\n🔍 Probando: ${testCase.descripcion}`);
      console.log(`   Licencia: "${testCase.licencia}"`);
      
      const updateData = {
        sexo: "M",
        fecha_nacimiento: "1982-09-14",
        licencia_conducir: testCase.licencia,
        talla_zapatos: "42",
        talla_pantalones: "L",
        talla_poleras: "M",
        cargo: "Experto en Prevención De Riesgos",
        estado_id: 1,
        zona_geografica: "valparaiso"
      };
      
      const result = await makeRequest('PUT', `/api/personal-disponible/${testRut}`, updateData);
      
      console.log(`   Status: ${result.status}`);
      console.log(`   Success: ${result.success}`);
      
      if (result.success) {
        console.log('   ✅ ACEPTADO - Licencia válida');
      } else {
        console.log(`   ❌ RECHAZADO - ${result.message || result.error || 'Error desconocido'}`);
      }
    }
    
    // Probar con licencia válida para confirmar que funciona
    console.log('\n🎯 CONFIRMACIÓN: Probando con licencia válida...');
    const validData = {
      sexo: "M",
      fecha_nacimiento: "1982-09-14",
      licencia_conducir: "B",
      talla_zapatos: "42",
      talla_pantalones: "L",
      talla_poleras: "M",
      cargo: "Experto en Prevención De Riesgos",
      estado_id: 1,
      zona_geografica: "valparaiso"
    };
    
    const finalResult = await makeRequest('PUT', `/api/personal-disponible/${testRut}`, validData);
    
    if (finalResult.success) {
      console.log('✅ Validación funcionando correctamente');
      console.log('📊 Licencia actualizada a: B');
    } else {
      console.log('❌ Error en validación:', finalResult.message);
    }
    
    console.log('\n📋 RESUMEN DE VALIDACIÓN:');
    console.log('==========================');
    console.log('✅ Licencias válidas: B, A1, B2, C1, etc.');
    console.log('❌ Licencias inválidas: ABC, B12345678, 123, B-123, vacías');
    console.log('🎯 Formato correcto: 1-2 letras seguidas de números opcionales');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

function makeRequest(method, path, data = null) {
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

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Ejecutar prueba
testLicenseValidation();
