const http = require('http');
const fs = require('fs');
const path = require('path');

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
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

async function testDownloadComplete() {
  console.log('🧪 Probando funcionalidad completa de descarga...\n');

  try {
    // 1. Obtener lista de documentos
    console.log('1️⃣ Obteniendo lista de documentos...');
    const docsResponse = await makeRequest('GET', '/api/documentos?limit=5');
    console.log(`📊 Status: ${docsResponse.status}`);
    
    if (docsResponse.status !== 200 || !docsResponse.data.data || docsResponse.data.data.length === 0) {
      console.log('❌ No hay documentos disponibles para probar');
      return;
    }

    const documents = docsResponse.data.data;
    console.log(`📄 Documentos encontrados: ${documents.length}`);

    // 2. Probar descarga de cada documento
    for (let i = 0; i < Math.min(3, documents.length); i++) {
      const doc = documents[i];
      console.log(`\n2️⃣.${i + 1} Probando descarga de documento ID: ${doc.id}`);
      console.log(`   📄 Nombre: ${doc.nombre_documento}`);
      console.log(`   📁 Archivo: ${doc.nombre_archivo}`);
      console.log(`   📏 Tamaño: ${doc.tamaño_bytes} bytes`);
      
      // Probar endpoint de descarga
      const downloadResponse = await makeRequest('GET', `/api/documentos/${doc.id}/descargar`);
      console.log(`   📊 Status descarga: ${downloadResponse.status}`);
      
      if (downloadResponse.status === 200) {
        console.log(`   ✅ Descarga exitosa`);
        console.log(`   📋 Headers:`, {
          'Content-Type': downloadResponse.headers['content-type'],
          'Content-Disposition': downloadResponse.headers['content-disposition'],
          'Content-Length': downloadResponse.headers['content-length']
        });
      } else {
        console.log(`   ❌ Error en descarga:`, downloadResponse.data);
      }
    }

    // 3. Probar acceso directo a archivo estático
    console.log('\n3️⃣ Probando acceso directo a archivos estáticos...');
    const firstDoc = documents[0];
    const staticUrl = `/uploads/documentos/${firstDoc.nombre_archivo}`;
    console.log(`   🔗 URL estática: ${staticUrl}`);
    
    const staticResponse = await makeRequest('GET', staticUrl);
    console.log(`   📊 Status archivo estático: ${staticResponse.status}`);
    
    if (staticResponse.status === 200) {
      console.log(`   ✅ Archivo estático accesible`);
    } else {
      console.log(`   ❌ Error accediendo archivo estático:`, staticResponse.data);
    }

    // 4. Verificar estructura de directorios
    console.log('\n4️⃣ Verificando estructura de directorios...');
    const uploadsDir = path.join(__dirname, 'uploads', 'documentos');
    console.log(`   📁 Directorio uploads: ${uploadsDir}`);
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`   ✅ Directorio existe con ${files.length} archivos`);
      console.log(`   📄 Primeros 3 archivos:`, files.slice(0, 3));
    } else {
      console.log(`   ❌ Directorio no existe`);
    }

    // 5. Probar endpoint de información de documento
    console.log('\n5️⃣ Probando endpoint de información de documento...');
    const docInfoResponse = await makeRequest('GET', `/api/documentos/${firstDoc.id}`);
    console.log(`   📊 Status info: ${docInfoResponse.status}`);
    
    if (docInfoResponse.status === 200) {
      console.log(`   ✅ Información obtenida correctamente`);
      console.log(`   📋 Campos disponibles:`, Object.keys(docInfoResponse.data.data));
    } else {
      console.log(`   ❌ Error obteniendo información:`, docInfoResponse.data);
    }

    console.log('\n🎉 Pruebas de descarga completadas!');

  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
}

testDownloadComplete();





