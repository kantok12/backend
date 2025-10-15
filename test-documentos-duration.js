const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testDocumentosDuration() {
  console.log('🧪 Probando nuevos endpoints de documentos con duración...\n');

  try {
    // 1. Probar documentos vencidos
    console.log('1️⃣ Probando GET /documentos/vencidos...');
    const vencidosResponse = await makeRequest('GET', '/api/documentos/vencidos?tipo=todos&limit=5');
    console.log(`📊 Status: ${vencidosResponse.status}`);
    console.log(`📊 Documentos encontrados: ${vencidosResponse.data.data?.length || 0}`);
    if (vencidosResponse.data.data?.length > 0) {
      console.log('📄 Ejemplo:', vencidosResponse.data.data[0].nombre_documento, '- Estado:', vencidosResponse.data.data[0].estado_vencimiento);
    }

    // 2. Probar documentos por vencer
    console.log('\n2️⃣ Probando GET /documentos/vencer...');
    const vencerResponse = await makeRequest('GET', '/api/documentos/vencer?dias=30&limit=5');
    console.log(`📊 Status: ${vencerResponse.status}`);
    console.log(`📊 Documentos por vencer: ${vencerResponse.data.data?.length || 0}`);
    if (vencerResponse.data.data?.length > 0) {
      console.log('📄 Ejemplo:', vencerResponse.data.data[0].nombre_documento, '- Días restantes:', vencerResponse.data.data[0].dias_restantes);
    }

    // 3. Probar actualización de documento
    console.log('\n3️⃣ Probando PUT /documentos/:id...');
    if (vencidosResponse.data.data?.length > 0) {
      const docId = vencidosResponse.data.data[0].id;
      const updateData = {
        fecha_vencimiento: '2025-12-31',
        dias_validez: 365,
        institucion_emisora: 'Institución de Prueba',
        estado_documento: 'vigente'
      };
      
      const updateResponse = await makeRequest('PUT', `/api/documentos/${docId}`, updateData);
      console.log(`📊 Status: ${updateResponse.status}`);
      console.log(`📊 Actualización: ${updateResponse.data.success ? 'Exitosa' : 'Fallida'}`);
      if (updateResponse.data.data) {
        console.log('📄 Documento actualizado:', updateResponse.data.data.nombre_documento);
        console.log('📅 Nueva fecha vencimiento:', updateResponse.data.data.fecha_vencimiento);
      }
    }

    // 4. Verificar estructura de documentos
    console.log('\n4️⃣ Verificando estructura de documentos...');
    const estructuraResponse = await makeRequest('GET', '/api/documentos?limit=1');
    if (estructuraResponse.data.data?.length > 0) {
      const doc = estructuraResponse.data.data[0];
      console.log('📋 Campos disponibles:');
      console.log('  - fecha_emision:', doc.fecha_emision || 'No definida');
      console.log('  - fecha_vencimiento:', doc.fecha_vencimiento || 'No definida');
      console.log('  - dias_validez:', doc.dias_validez || 'No definido');
      console.log('  - estado_documento:', doc.estado_documento || 'No definido');
      console.log('  - institucion_emisora:', doc.institucion_emisora || 'No definida');
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
}

testDocumentosDuration();


