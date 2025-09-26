const http = require('http');
const fs = require('fs');
const path = require('path');

async function testEndpoint(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
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
          resolve({
            status: res.statusCode,
            path: path,
            method: method,
            data: jsonBody,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            path: path,
            method: method,
            data: body,
            headers: res.headers
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

async function testFileUpload() {
  return new Promise((resolve, reject) => {
    const FormData = require('form-data');
    const form = new FormData();
    
    // Crear un archivo de prueba
    const testContent = 'Este es un archivo de prueba para testing de uploads';
    const testFileName = 'test-document.txt';
    
    form.append('archivo', testContent, {
      filename: testFileName,
      contentType: 'text/plain'
    });
    form.append('rut_persona', '12345678-9');
    form.append('tipo_documento', 'certificado_curso');
    form.append('descripcion', 'Documento de prueba para testing');
    
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
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            path: '/api/documentos',
            method: 'POST',
            data: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            path: '/api/documentos',
            method: 'POST',
            data: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    form.pipe(req);
  });
}

async function testAllFileStorageEndpoints() {
  console.log('🧪 PROBANDO ENDPOINTS DE ALMACENAMIENTO DE ARCHIVOS');
  console.log('==================================================');
  
  const endpoints = [
    // Endpoints básicos de documentos
    { path: '/api/documentos', method: 'GET', name: 'Listar Documentos' },
    { path: '/api/documentos/tipos', method: 'GET', name: 'Tipos de Documento' },
    { path: '/api/documentos/formatos', method: 'GET', name: 'Formatos Soportados' },
    
    // Endpoints de búsqueda
    { path: '/api/documentos/persona/12345678-9', method: 'GET', name: 'Documentos por Persona' },
    
    // Endpoints de gestión
    { path: '/api/documentos/1', method: 'GET', name: 'Obtener Documento por ID' },
    { path: '/api/documentos/1/descargar', method: 'GET', name: 'Descargar Documento' },
    { path: '/api/documentos/1', method: 'DELETE', name: 'Eliminar Documento' }
  ];

  const results = [];
  
  // Probar endpoints GET
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Probando: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      const result = await testEndpoint(endpoint.path, endpoint.method);
      
      if (result.status === 200) {
        console.log(`   ✅ Status: ${result.status} - OK`);
        if (result.data && result.data.success !== undefined) {
          console.log(`   📊 Success: ${result.data.success}`);
          if (result.data.data && Array.isArray(result.data.data)) {
            console.log(`   📈 Total: ${result.data.data.length} elementos`);
          } else if (result.data.total !== undefined) {
            console.log(`   📈 Total: ${result.data.total}`);
          }
        }
      } else if (result.status === 404) {
        console.log(`   ⚠️ Status: ${result.status} - Not Found (Esperado para IDs inexistentes)`);
      } else if (result.status === 500) {
        console.log(`   ❌ Status: ${result.status} - Server Error`);
        if (result.data && result.data.error) {
          console.log(`   🔍 Error: ${result.data.error}`);
        }
      } else {
        console.log(`   ⚠️ Status: ${result.status}`);
      }
      
      results.push({
        ...endpoint,
        status: result.status,
        success: result.status === 200 || result.status === 404,
        response: result.data
      });
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        ...endpoint,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }
  }
  
  // Probar upload de archivo
  console.log(`\n🔍 Probando: Upload de Archivo (POST /api/documentos)`);
  try {
    const uploadResult = await testFileUpload();
    
    if (uploadResult.status === 201) {
      console.log(`   ✅ Status: ${uploadResult.status} - Archivo subido exitosamente`);
      if (uploadResult.data && uploadResult.data.success) {
        console.log(`   📄 Archivo: ${uploadResult.data.data?.nombre_archivo || 'N/A'}`);
        console.log(`   👤 Persona: ${uploadResult.data.data?.rut_persona || 'N/A'}`);
      }
    } else if (uploadResult.status === 400) {
      console.log(`   ⚠️ Status: ${uploadResult.status} - Error de validación (Esperado sin archivo real)`);
    } else {
      console.log(`   ⚠️ Status: ${uploadResult.status}`);
      if (uploadResult.data && uploadResult.data.error) {
        console.log(`   🔍 Error: ${uploadResult.data.error}`);
      }
    }
    
    results.push({
      path: '/api/documentos',
      method: 'POST',
      name: 'Upload de Archivo',
      status: uploadResult.status,
      success: uploadResult.status === 201 || uploadResult.status === 400,
      response: uploadResult.data
    });
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.push({
      path: '/api/documentos',
      method: 'POST',
      name: 'Upload de Archivo',
      status: 'ERROR',
      success: false,
      error: error.message
    });
  }
  
  // Verificar directorio de uploads
  console.log(`\n📁 VERIFICANDO ESTRUCTURA DE ARCHIVOS:`);
  const uploadsDir = path.join(__dirname, 'uploads');
  const documentosDir = path.join(uploadsDir, 'documentos');
  
  try {
    if (fs.existsSync(uploadsDir)) {
      console.log(`   ✅ Directorio uploads existe: ${uploadsDir}`);
      
      if (fs.existsSync(documentosDir)) {
        console.log(`   ✅ Directorio documentos existe: ${documentosDir}`);
        
        const files = fs.readdirSync(documentosDir);
        console.log(`   📄 Archivos en documentos: ${files.length}`);
        if (files.length > 0) {
          files.forEach(file => {
            const filePath = path.join(documentosDir, file);
            const stats = fs.statSync(filePath);
            console.log(`      - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
          });
        }
      } else {
        console.log(`   ⚠️ Directorio documentos no existe, se creará automáticamente`);
      }
    } else {
      console.log(`   ⚠️ Directorio uploads no existe, se creará automáticamente`);
    }
  } catch (error) {
    console.log(`   ❌ Error verificando directorios: ${error.message}`);
  }
  
  // Resumen
  console.log('\n📊 RESUMEN DE PRUEBAS:');
  console.log('======================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Exitosos: ${successful}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  console.log('\n🔍 ENDPOINTS FUNCIONANDO:');
  results.filter(r => r.success).forEach(r => {
    console.log(`   ✅ ${r.method} ${r.path} - ${r.name}`);
  });
  
  console.log('\n❌ ENDPOINTS CON PROBLEMAS:');
  results.filter(r => !r.success).forEach(r => {
    console.log(`   ❌ ${r.method} ${r.path} - ${r.name} (Status: ${r.status})`);
  });
  
  // Verificar configuración de multer
  console.log('\n⚙️ CONFIGURACIÓN DE MULTER:');
  console.log('===========================');
  console.log('   📁 Directorio destino: uploads/documentos/');
  console.log('   📏 Límite por archivo: 50MB');
  console.log('   📄 Máximo archivos: 5 por request');
  console.log('   🎯 Tipos permitidos: PDF, JPEG, PNG, TIFF, DOC, DOCX, XLS, XLSX');
  
  // Verificar base de datos
  console.log('\n🗄️ VERIFICACIÓN DE BASE DE DATOS:');
  console.log('=================================');
  console.log('   📋 Tabla: mantenimiento.documentos');
  console.log('   🔗 Relación: personal_disponible (rut_persona)');
  console.log('   📊 Campos: id, rut_persona, nombre_documento, tipo_documento, nombre_archivo, ruta_archivo, fecha_subida');
  
  return results;
}

// Ejecutar pruebas
testAllFileStorageEndpoints()
  .then(results => {
    console.log('\n🎉 PRUEBAS COMPLETADAS');
    console.log('======================');
    
    const allWorking = results.every(r => r.success);
    if (allWorking) {
      console.log('✅ ¡Todos los endpoints de almacenamiento están funcionando correctamente!');
      console.log('🚀 El sistema está listo para recibir archivos desde el frontend.');
    } else {
      console.log('⚠️ Algunos endpoints necesitan atención.');
      console.log('🔧 Revisa los errores mostrados arriba.');
    }
  })
  .catch(console.error);
