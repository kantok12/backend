const FormData = require('form-data');
const fs = require('fs');
const http = require('http');

async function testFileUploadWithRealRut() {
  console.log('🧪 PROBANDO UPLOAD DE ARCHIVOS CON RUT REAL');
  console.log('===========================================');
  
  // Crear un archivo de prueba
  const testContent = 'Este es un archivo de prueba para testing del sistema de documentos.\n\nContenido del documento:\n- Fecha: ' + new Date().toISOString() + '\n- Sistema: Backend de Mantenimiento\n- Funcionalidad: Almacenamiento de Documentos';
  const testFileName = 'test-document-real.txt';
  fs.writeFileSync(testFileName, testContent);
  
  try {
    // Crear FormData con RUT real
    const form = new FormData();
    form.append('archivo', fs.createReadStream(testFileName));
    form.append('rut_persona', '19838046-6'); // RUT real de la base de datos
    form.append('nombre_documento', 'Documento de Prueba Real');
    form.append('tipo_documento', 'certificado');
    form.append('descripcion', 'Archivo de prueba para testing del sistema con RUT real');
    
    console.log('📤 Enviando archivo de prueba con RUT real...');
    console.log('📋 Datos del formulario:');
    console.log('   - Archivo:', testFileName);
    console.log('   - RUT:', '19838046-6');
    console.log('   - Nombre:', 'Documento de Prueba Real');
    console.log('   - Tipo:', 'certificado');
    console.log('   - Descripción:', 'Archivo de prueba para testing del sistema con RUT real');
    
    // Enviar request
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/documentos',
      method: 'POST',
      headers: form.getHeaders()
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log('\n📥 RESPUESTA DEL SERVIDOR:');
        console.log('===========================');
        console.log('Status:', res.statusCode);
        
        try {
          const jsonBody = JSON.parse(body);
          console.log('Body:', JSON.stringify(jsonBody, null, 2));
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('\n✅ ¡UPLOAD EXITOSO!');
            console.log('🎉 El sistema de almacenamiento de archivos está funcionando correctamente.');
            
            if (jsonBody.data && jsonBody.data.id) {
              console.log(`📄 ID del documento creado: ${jsonBody.data.id}`);
              console.log(`📁 Archivo guardado en: ${jsonBody.data.ruta_archivo || 'N/A'}`);
            }
            
            // Probar que el documento se puede listar
            console.log('\n🔍 Verificando que el documento aparece en la lista...');
            testDocumentListing();
          } else {
            console.log('\n❌ UPLOAD FALLIDO');
            console.log('🔍 Revisa los errores mostrados arriba.');
          }
        } catch (e) {
          console.log('Body (texto):', body);
          console.log('\n⚠️ Respuesta no es JSON válido');
        }
        
        // Limpiar archivo de prueba
        if (fs.existsSync(testFileName)) {
          fs.unlinkSync(testFileName);
          console.log(`\n🧹 Archivo de prueba ${testFileName} eliminado`);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Error en la request:', err.message);
      
      // Limpiar archivo de prueba
      if (fs.existsSync(testFileName)) {
        fs.unlinkSync(testFileName);
        console.log(`🧹 Archivo de prueba ${testFileName} eliminado`);
      }
    });
    
    // Enviar el formulario
    form.pipe(req);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    // Limpiar archivo de prueba
    if (fs.existsSync(testFileName)) {
      fs.unlinkSync(testFileName);
      console.log(`🧹 Archivo de prueba ${testFileName} eliminado`);
    }
  }
}

async function testDocumentListing() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/documentos',
    method: 'GET',
    headers: {
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
        if (jsonBody.success && jsonBody.data && jsonBody.data.length > 0) {
          console.log(`✅ Documento encontrado en la lista: ${jsonBody.data.length} documento(s)`);
          const doc = jsonBody.data[0];
          console.log(`   📄 ID: ${doc.id}`);
          console.log(`   📝 Nombre: ${doc.nombre_documento}`);
          console.log(`   👤 RUT: ${doc.rut_persona}`);
          console.log(`   📁 Archivo: ${doc.nombre_archivo}`);
        } else {
          console.log('⚠️ No se encontraron documentos en la lista');
        }
      } catch (e) {
        console.log('⚠️ Error al parsear respuesta de listado');
      }
    });
  });

  req.on('error', (err) => {
    console.log('❌ Error al verificar listado:', err.message);
  });

  req.end();
}

// Ejecutar prueba
testFileUploadWithRealRut();

