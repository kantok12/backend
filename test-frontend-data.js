const http = require('http');

async function testFrontendData() {
  console.log('🧪 PROBANDO CON DATOS EXACTOS DEL FRONTEND');
  console.log('===========================================');
  
  const testRut = '15338132-1';
  
  try {
    // 1. Verificar si el RUT existe
    console.log(`\n🔍 Verificando RUT: ${testRut}`);
    const getResult = await makeRequest('GET', `/api/personal-disponible/${testRut}`);
    
    if (getResult.success && getResult.data) {
      console.log('✅ RUT encontrado en la base de datos');
    } else {
      console.log('❌ RUT no encontrado, creando registro de prueba...');
      
      // Crear el registro primero
      const createData = {
        rut: testRut,
        sexo: 'M',
        fecha_nacimiento: '1982-09-14',
        licencia_conducir: 'B12345678',
        talla_zapatos: '42',
        talla_pantalones: 'L',
        talla_poleras: 'M',
        cargo: 'Experto en Prevención De Riesgos',
        estado_id: 1,
        zona_geografica: 'valparaiso'
      };
      
      const createResult = await makeRequest('POST', '/api/personal-disponible', createData);
      if (createResult.success) {
        console.log('✅ Registro creado exitosamente');
      } else {
        console.log('❌ Error al crear registro:', createResult.message);
        return;
      }
    }
    
    // 2. Probar con datos exactos del frontend (problema de formato de fecha)
    console.log('\n📝 Probando con datos del frontend (formato de fecha ISO)...');
    
    const frontendData = {
      nombre: "Schaffhauser",
      apellido: "Rodrigo Andres",
      sexo: "M",
      fecha_nacimiento: "1982-09-14T04:00:00.000Z", // Formato ISO del frontend
      licencia_conducir: "B12345678",
      cargo: "Experto en Prevención De Riesgos",
      estado_id: 1,
      zona_geografica: "valparaiso"
    };
    
    console.log('📤 Datos del frontend:');
    console.log(JSON.stringify(frontendData, null, 2));
    
    const result1 = await makeRequest('PUT', `/api/personal-disponible/${testRut}`, frontendData);
    console.log('\n📋 Resultado con formato ISO:');
    console.log(`Status: ${result1.status}`);
    console.log(`Success: ${result1.success}`);
    console.log(`Message: ${result1.message || 'N/A'}`);
    
    // 3. Probar con datos corregidos (formato de fecha simple)
    console.log('\n📝 Probando con datos corregidos (formato de fecha simple)...');
    
    const correctedData = {
      sexo: "M",
      fecha_nacimiento: "1982-09-14", // Formato simple
      licencia_conducir: "B12345678",
      talla_zapatos: "42",
      talla_pantalones: "L", 
      talla_poleras: "M",
      cargo: "Experto en Prevención De Riesgos",
      estado_id: 1,
      zona_geografica: "valparaiso"
    };
    
    console.log('📤 Datos corregidos:');
    console.log(JSON.stringify(correctedData, null, 2));
    
    const result2 = await makeRequest('PUT', `/api/personal-disponible/${testRut}`, correctedData);
    console.log('\n📋 Resultado con formato corregido:');
    console.log(`Status: ${result2.status}`);
    console.log(`Success: ${result2.success}`);
    console.log(`Message: ${result2.message || 'N/A'}`);
    
    if (result2.success) {
      console.log('✅ ¡Actualización exitosa!');
      console.log('📊 Datos actualizados:');
      console.log(JSON.stringify(result2.data, null, 2));
    }
    
    // 4. Probar con datos completos del editData
    console.log('\n📝 Probando con datos completos del editData...');
    
    const completeData = {
      sexo: "M",
      fecha_nacimiento: "1982-09-14",
      licencia_conducir: "B12345678",
      talla_zapatos: "42",
      talla_pantalones: "L",
      talla_poleras: "M",
      cargo: "Experto en Prevención De Riesgos",
      estado_id: 1,
      zona_geografica: "valparaiso"
    };
    
    const result3 = await makeRequest('PUT', `/api/personal-disponible/${testRut}`, completeData);
    console.log('\n📋 Resultado con datos completos:');
    console.log(`Status: ${result3.status}`);
    console.log(`Success: ${result3.success}`);
    console.log(`Message: ${result3.message || 'N/A'}`);
    
    // 5. Resumen y recomendaciones
    console.log('\n🎯 RESUMEN Y RECOMENDACIONES:');
    console.log('==============================');
    
    if (result1.status === 400) {
      console.log('❌ PROBLEMA IDENTIFICADO: Formato de fecha ISO no compatible');
      console.log('💡 SOLUCIÓN: El frontend debe enviar fecha en formato "YYYY-MM-DD"');
    }
    
    if (result2.success) {
      console.log('✅ SOLUCIÓN CONFIRMADA: Con formato de fecha correcto funciona');
    }
    
    console.log('\n🔧 CAMBIOS NECESARIOS EN EL FRONTEND:');
    console.log('1. Convertir fecha ISO a formato simple: "1982-09-14T04:00:00.000Z" → "1982-09-14"');
    console.log('2. Incluir todos los campos obligatorios: talla_zapatos, talla_pantalones, talla_poleras');
    console.log('3. Enviar solo los campos que acepta el backend (no nombre, apellido, activo, etc.)');
    
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
testFrontendData();
