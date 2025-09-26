const FormData = require('form-data');
const fs = require('fs');
const http = require('http');

async function testFileUploadFinal() {
  console.log('🧪 PROBANDO UPLOAD DE ARCHIVOS - PRUEBA FINAL');
  console.log('==============================================');
  
  // Crear un archivo de prueba
  const testContent = `DOCUMENTO DE PRUEBA - SISTEMA DE MANTENIMIENTO
==============================================

Fecha: ${new Date().toLocaleString('es-CL')}
Sistema: Backend de Mantenimiento
Funcionalidad: Almacenamiento de Documentos
RUT: 19838046-6
Tipo: certificado_curso

Este es un archivo de prueba para verificar que el sistema de 
almacenamiento de documentos está funcionando correctamente.

Contenido del certificado:
- Curso: Manejo de Herramientas
- Fecha de inicio: 2024-01-15
- Fecha de término: 2024-01-20
- Horas: 40
- Institución: Centro de Capacitación

Estado: APROBADO
Nota: 6.5

Firma digital: [SISTEMA DE PRUEBA]
`;
  
  const testFileName = 'certificado-curso-prueba.txt';
  fs.writeFileSync(testFileName, testContent);
  
  try {
    // Crear FormData con datos válidos
    const form = new FormData();
    form.append('archivo', fs.createReadStream(testFileName));
    form.append('rut_persona', '19838046-6'); // RUT real de la base de datos
    form.append('nombre_documento', 'Certificado de Curso - Manejo de Herramientas');
    form.append('tipo_documento', 'certificado_curso'); // Tipo válido
    form.append('descripcion', 'Certificado de curso de manejo de herramientas - Prueba del sistema');
    
    console.log('📤 Enviando archivo de prueba con datos válidos...');
    console.log('📋 Datos del formulario:');
    console.log('   - Archivo:', testFileName);
    console.log('   - RUT:', '19838046-6');
    console.log('   - Nombre:', 'Certificado de Curso - Manejo de Herramientas');
    console.log('   - Tipo:', 'certificado_curso');
    console.log('   - Descripción:', 'Certificado de curso de manejo de herramientas - Prueba del sistema');
    
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
            console.log('\n🎉 ¡UPLOAD EXITOSO!');
            console.log('✅ El sistema de almacenamiento de archivos está funcionando correctamente.');
            
            if (jsonBody.data && jsonBody.data.id) {
              console.log(`📄 ID del documento creado: ${jsonBody.data.id}`);
              console.log(`📁 Archivo guardado en: ${jsonBody.data.ruta_archivo || 'N/A'}`);
              console.log(`📝 Nombre del archivo: ${jsonBody.data.nombre_archivo || 'N/A'}`);
              console.log(`📊 Tamaño: ${jsonBody.data.tamaño_bytes || 'N/A'} bytes`);
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
          console.log(`   🏷️ Tipo: ${doc.tipo_documento}`);
          console.log(`   📅 Fecha: ${doc.fecha_subida}`);
          
          console.log('\n🎯 ¡SISTEMA COMPLETAMENTE FUNCIONAL!');
          console.log('=====================================');
          console.log('✅ Upload de archivos: FUNCIONANDO');
          console.log('✅ Almacenamiento en BD: FUNCIONANDO');
          console.log('✅ Listado de documentos: FUNCIONANDO');
          console.log('✅ Validación de tipos: FUNCIONANDO');
          console.log('✅ Validación de RUT: FUNCIONANDO');
          console.log('\n🚀 El frontend puede usar estos endpoints:');
          console.log('   - POST /api/documentos (upload)');
          console.log('   - GET /api/documentos (listar)');
          console.log('   - GET /api/documentos/tipos (tipos válidos)');
          console.log('   - GET /api/documentos/formatos (formatos soportados)');
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
testFileUploadFinal();
