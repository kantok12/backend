const http = require('http');

async function testPersonalEndpoint() {
  console.log('🧪 PROBANDO ENDPOINT PERSONAL-DISPONIBLE');
  console.log('=========================================');
  
  const testRut = '15338132-1'; // RUT del error
  
  try {
    // 1. Verificar si el RUT existe
    console.log(`\n🔍 Verificando si el RUT ${testRut} existe...`);
    const getResult = await makeRequest('GET', `/api/personal-disponible/${testRut}`);
    
    if (getResult.success && getResult.data) {
      console.log('✅ RUT encontrado en la base de datos');
      console.log('📋 Datos actuales:');
      console.log(`   - RUT: ${getResult.data.rut}`);
      console.log(`   - Sexo: ${getResult.data.sexo}`);
      console.log(`   - Fecha nacimiento: ${getResult.data.fecha_nacimiento}`);
      console.log(`   - Licencia: ${getResult.data.licencia_conducir}`);
      console.log(`   - Cargo: ${getResult.data.cargo}`);
      console.log(`   - Estado ID: ${getResult.data.estado_id}`);
      console.log(`   - Zona: ${getResult.data.zona_geografica}`);
      
      // 2. Probar actualización con datos válidos
      console.log('\n📝 Probando actualización con datos válidos...');
      
      const updateData = {
        sexo: getResult.data.sexo || 'M',
        fecha_nacimiento: getResult.data.fecha_nacimiento || '1990-01-01',
        licencia_conducir: getResult.data.licencia_conducir || 'B',
        talla_zapatos: getResult.data.talla_zapatos || '42',
        talla_pantalones: getResult.data.talla_pantalones || 'L',
        talla_poleras: getResult.data.talla_poleras || 'M',
        cargo: getResult.data.cargo || 'Operador',
        estado_id: getResult.data.estado_id || 1,
        zona_geografica: getResult.data.zona_geografica || 'Norte'
      };
      
      console.log('📤 Datos a enviar:');
      console.log(JSON.stringify(updateData, null, 2));
      
      const updateResult = await makeRequest('PUT', `/api/personal-disponible/${testRut}`, updateData);
      
      if (updateResult.success) {
        console.log('✅ Actualización exitosa!');
        console.log('📊 Datos actualizados:');
        console.log(JSON.stringify(updateResult.data, null, 2));
      } else {
        console.log('❌ Error en actualización:');
        console.log(`   - Status: ${updateResult.status || 'N/A'}`);
        console.log(`   - Message: ${updateResult.message || 'N/A'}`);
        console.log(`   - Error: ${updateResult.error || 'N/A'}`);
      }
      
    } else {
      console.log('❌ RUT no encontrado en la base de datos');
      console.log('📋 Respuesta:', getResult);
      
      // Probar con un RUT que sí existe
      console.log('\n🔄 Probando con un RUT que existe...');
      const existingRuts = ['19838046-6', '20227477-3', '20181372-7'];
      
      for (const rut of existingRuts) {
        console.log(`\n🔍 Probando con RUT: ${rut}`);
        const testResult = await makeRequest('GET', `/api/personal-disponible/${rut}`);
        
        if (testResult.success && testResult.data) {
          console.log('✅ RUT encontrado, probando actualización...');
          
          const testUpdateData = {
            sexo: testResult.data.sexo,
            fecha_nacimiento: testResult.data.fecha_nacimiento,
            licencia_conducir: testResult.data.licencia_conducir,
            talla_zapatos: testResult.data.talla_zapatos || '42',
            talla_pantalones: testResult.data.talla_pantalones || 'L',
            talla_poleras: testResult.data.talla_poleras || 'M',
            cargo: testResult.data.cargo,
            estado_id: testResult.data.estado_id,
            zona_geografica: testResult.data.zona_geografica || 'Norte'
          };
          
          const testUpdateResult = await makeRequest('PUT', `/api/personal-disponible/${rut}`, testUpdateData);
          
          if (testUpdateResult.success) {
            console.log('✅ Actualización exitosa con RUT válido');
            break;
          } else {
            console.log('❌ Error en actualización:', testUpdateResult.message);
          }
        }
      }
    }
    
    // 3. Probar con datos incompletos para ver el error exacto
    console.log('\n🧪 Probando con datos incompletos para ver el error...');
    const incompleteData = {
      sexo: 'M',
      // fecha_nacimiento: faltante
      licencia_conducir: 'B',
      cargo: 'Operador',
      estado_id: 1
    };
    
    const incompleteResult = await makeRequest('PUT', `/api/personal-disponible/${testRut}`, incompleteData);
    console.log('📋 Respuesta con datos incompletos:');
    console.log(JSON.stringify(incompleteResult, null, 2));
    
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
testPersonalEndpoint();
