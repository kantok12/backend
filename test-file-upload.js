const FormData = require('form-data');
const fs = require('fs');
const http = require('http');

async function testFileUpload() {
  console.log('🧪 PROBANDO UPLOAD DE ARCHIVOS');
  console.log('==============================');
  
  // Crear un archivo de prueba
  const testContent = 'Este es un archivo de prueba para testing del sistema de documentos.';
  const testFileName = 'test-document.txt';
  fs.writeFileSync(testFileName, testContent);
  
  try {
    // Crear FormData
    const form = new FormData();
    form.append('archivo', fs.createReadStream(testFileName));
    form.append('rut_persona', '12345678-9');
    form.append('nombre_documento', 'Documento de Prueba');
    form.append('tipo_documento', 'certificado');
    form.append('descripcion', 'Archivo de prueba para testing del sistema');
    
    console.log('📤 Enviando archivo de prueba...');
    console.log('📋 Datos del formulario:');
    console.log('   - Archivo:', testFileName);
    console.log('   - RUT:', '12345678-9');
    console.log('   - Nombre:', 'Documento de Prueba');
    console.log('   - Tipo:', 'certificado');
    console.log('   - Descripción:', 'Archivo de prueba para testing del sistema');
    
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
        console.log('Headers:', res.headers);
        
        try {
          const jsonBody = JSON.parse(body);
          console.log('Body:', JSON.stringify(jsonBody, null, 2));
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('\n✅ ¡UPLOAD EXITOSO!');
            console.log('🎉 El sistema de almacenamiento de archivos está funcionando correctamente.');
            
            if (jsonBody.data && jsonBody.data.id) {
              console.log(`📄 ID del documento creado: ${jsonBody.data.id}`);
            }
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

// Ejecutar prueba
testFileUpload();

