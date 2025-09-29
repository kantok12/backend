const http = require('http');

async function debugDownloadIssue() {
  console.log('🔍 INVESTIGANDO PROBLEMA DE DESCARGA');
  console.log('====================================');
  
  const testRut = '15338132-1';
  
  try {
    // 1. Verificar documentos disponibles para el RUT
    console.log(`\n📋 Verificando documentos para RUT: ${testRut}`);
    const listResult = await makeRequest('GET', `/api/documentos/persona/${testRut}`);
    
    console.log('📊 Respuesta del endpoint:');
    console.log(`Status: ${listResult.status}`);
    console.log(`Success: ${listResult.success}`);
    console.log(`Message: ${listResult.message || 'N/A'}`);
    
    if (listResult.data && listResult.data.length > 0) {
      console.log(`✅ Encontrados ${listResult.data.length} documento(s):`);
      listResult.data.forEach((doc, index) => {
        console.log(`   ${index + 1}. ID: ${doc.id} - ${doc.nombre_documento}`);
        console.log(`      Archivo: ${doc.nombre_archivo}`);
        console.log(`      Tipo: ${doc.tipo_documento}`);
        console.log(`      Fecha: ${doc.fecha_subida}`);
      });
      
      // 2. Probar descarga del primer documento
      const firstDoc = listResult.data[0];
      console.log(`\n📥 Probando descarga del documento ID: ${firstDoc.id}`);
      
      const downloadResult = await makeRequest('GET', `/api/documentos/${firstDoc.id}/descargar`);
      
      console.log('📊 Resultado de descarga:');
      console.log(`Status: ${downloadResult.status}`);
      console.log(`Success: ${downloadResult.success}`);
      console.log(`Message: ${downloadResult.message || 'N/A'}`);
      
      if (downloadResult.status === 200) {
        console.log('✅ Descarga exitosa - el endpoint funciona correctamente');
      } else {
        console.log('❌ Error en descarga - revisar endpoint');
      }
      
    } else {
      console.log('❌ No se encontraron documentos para este RUT');
      console.log('\n🔍 Verificando todos los documentos disponibles...');
      
      const allDocsResult = await makeRequest('GET', '/api/documentos');
      if (allDocsResult.success && allDocsResult.data) {
        console.log(`📋 Total documentos en el sistema: ${allDocsResult.data.length}`);
        allDocsResult.data.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.rut_persona} - ${doc.nombre_documento} (ID: ${doc.id})`);
        });
      }
    }
    
    // 3. Verificar endpoint de descarga directamente
    console.log('\n🧪 Probando endpoint de descarga con ID conocido...');
    
    // Usar un ID que sabemos que existe (del script anterior)
    const knownId = 17; // ID del documento que creamos
    const directDownloadResult = await makeRequest('GET', `/api/documentos/${knownId}/descargar`);
    
    console.log('📊 Resultado de descarga directa:');
    console.log(`Status: ${directDownloadResult.status}`);
    console.log(`Success: ${directDownloadResult.success}`);
    console.log(`Message: ${directDownloadResult.message || 'N/A'}`);
    
    if (directDownloadResult.status === 200) {
      console.log('✅ Endpoint de descarga funciona correctamente');
    } else {
      console.log('❌ Problema con el endpoint de descarga');
    }
    
    // 4. Verificar información del documento por ID
    console.log(`\n📄 Verificando información del documento ID: ${knownId}`);
    const docInfoResult = await makeRequest('GET', `/api/documentos/${knownId}`);
    
    console.log('📊 Información del documento:');
    console.log(`Status: ${docInfoResult.status}`);
    console.log(`Success: ${docInfoResult.success}`);
    if (docInfoResult.data) {
      console.log(`   - RUT: ${docInfoResult.data.rut_persona}`);
      console.log(`   - Nombre: ${docInfoResult.data.nombre_documento}`);
      console.log(`   - Archivo: ${docInfoResult.data.nombre_archivo}`);
      console.log(`   - Ruta: ${docInfoResult.data.ruta_archivo}`);
      console.log(`   - Activo: ${docInfoResult.data.activo}`);
    }
    
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
          // Para endpoints que devuelven archivos, esto es normal
          resolve({ 
            success: true, 
            message: 'Archivo descargado', 
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

// Ejecutar debug
debugDownloadIssue();
