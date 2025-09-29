const http = require('http');

async function testCourseDocumentSearch() {
  console.log('🧪 PROBANDO BÚSQUEDA DE DOCUMENTOS POR CURSO');
  console.log('============================================');
  
  try {
    // 1. Probar búsqueda por curso "data"
    console.log('\n🔍 Buscando documentos para curso "data"...');
    const dataResult = await makeRequest('GET', '/api/documentos/curso/data');
    
    console.log('📊 Resultado para curso "data":');
    console.log(`Status: ${dataResult.status}`);
    console.log(`Success: ${dataResult.success}`);
    console.log(`Message: ${dataResult.message || 'N/A'}`);
    
    if (dataResult.success && dataResult.data && dataResult.data.documentos) {
      console.log(`✅ Encontrados ${dataResult.data.documentos.length} documentos:`);
      
      dataResult.data.documentos.forEach((doc, index) => {
        console.log(`\n📄 Documento ${index + 1}:`);
        console.log(`   - ID: ${doc.id}`);
        console.log(`   - Nombre: "${doc.nombre_documento}"`);
        console.log(`   - Tipo: ${doc.tipo_documento}`);
        console.log(`   - RUT: ${doc.rut_persona}`);
        console.log(`   - Fecha: ${doc.fecha_subida}`);
      });
    } else {
      console.log('❌ No se encontraron documentos para curso "data"');
    }
    
    // 2. Probar búsqueda por curso "asignacion"
    console.log('\n🔍 Buscando documentos para curso "asignacion"...');
    const asignacionResult = await makeRequest('GET', '/api/documentos/curso/asignacion');
    
    console.log('📊 Resultado para curso "asignacion":');
    console.log(`Status: ${asignacionResult.status}`);
    console.log(`Success: ${asignacionResult.success}`);
    console.log(`Message: ${asignacionResult.message || 'N/A'}`);
    
    if (asignacionResult.success && asignacionResult.data && asignacionResult.data.documentos) {
      console.log(`✅ Encontrados ${asignacionResult.data.documentos.length} documentos:`);
      
      asignacionResult.data.documentos.forEach((doc, index) => {
        console.log(`\n📄 Documento ${index + 1}:`);
        console.log(`   - ID: ${doc.id}`);
        console.log(`   - Nombre: "${doc.nombre_documento}"`);
        console.log(`   - Tipo: ${doc.tipo_documento}`);
        console.log(`   - RUT: ${doc.rut_persona}`);
        console.log(`   - Fecha: ${doc.fecha_subida}`);
      });
    } else {
      console.log('❌ No se encontraron documentos para curso "asignacion"');
    }
    
    // 3. Verificar todos los documentos disponibles
    console.log('\n📋 Verificando todos los documentos disponibles...');
    const allDocsResult = await makeRequest('GET', '/api/documentos');
    
    if (allDocsResult.success && allDocsResult.data && allDocsResult.data.documentos) {
      console.log(`📊 Total de documentos en el sistema: ${allDocsResult.data.documentos.length}`);
      
      console.log('\n📄 Documentos que contienen "data":');
      const dataDocs = allDocsResult.data.documentos.filter(doc => 
        doc.nombre_documento.toLowerCase().includes('data') ||
        doc.descripcion.toLowerCase().includes('data')
      );
      
      if (dataDocs.length > 0) {
        dataDocs.forEach(doc => {
          console.log(`   - "${doc.nombre_documento}" (ID: ${doc.id}, RUT: ${doc.rut_persona})`);
        });
      } else {
        console.log('   ❌ No hay documentos que contengan "data"');
      }
    }
    
    console.log('\n🎯 RESUMEN:');
    console.log('===========');
    console.log('✅ Endpoint /api/documentos/curso/:nombre creado');
    console.log('🔍 Búsqueda por nombre de curso implementada');
    console.log('📊 Búsqueda en nombre_documento y descripción');
    
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
testCourseDocumentSearch();
