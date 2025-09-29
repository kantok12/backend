const http = require('http');

async function checkDocumentsForRut() {
  console.log('🔍 VERIFICANDO DOCUMENTOS PARA RUT 15338132-1');
  console.log('==============================================');
  
  try {
    // 1. Obtener documentos por RUT
    console.log('\n📋 Obteniendo documentos por RUT...');
    const documentsResult = await makeRequest('GET', '/api/documentos/persona/15338132-1');
    
    if (documentsResult.success && documentsResult.data && documentsResult.data.documentos) {
      console.log(`✅ Encontrados ${documentsResult.data.documentos.length} documentos:`);
      
      documentsResult.data.documentos.forEach((doc, index) => {
        console.log(`\n📄 Documento ${index + 1}:`);
        console.log(`   - ID: ${doc.id}`);
        console.log(`   - Nombre: "${doc.nombre_documento}"`);
        console.log(`   - Tipo: ${doc.tipo_documento}`);
        console.log(`   - Fecha: ${doc.fecha_subida}`);
        console.log(`   - Archivo: ${doc.nombre_archivo}`);
      });
    } else {
      console.log('❌ No se encontraron documentos o error en la respuesta');
      console.log('Respuesta:', JSON.stringify(documentsResult, null, 2));
    }
    
    // 2. Obtener cursos para el mismo RUT
    console.log('\n📚 Obteniendo cursos para el mismo RUT...');
    const coursesResult = await makeRequest('GET', '/api/cursos?rut=15338132-1');
    
    if (coursesResult.success && coursesResult.data && coursesResult.data.cursos) {
      console.log(`✅ Encontrados ${coursesResult.data.cursos.length} cursos:`);
      
      coursesResult.data.cursos.forEach((course, index) => {
        console.log(`\n📖 Curso ${index + 1}:`);
        console.log(`   - ID: ${course.id}`);
        console.log(`   - Nombre: "${course.nombre_curso}"`);
        console.log(`   - Estado: ${course.estado}`);
        console.log(`   - Fecha creación: ${course.fecha_creacion}`);
      });
    } else {
      console.log('❌ No se encontraron cursos o error en la respuesta');
      console.log('Respuesta:', JSON.stringify(coursesResult, null, 2));
    }
    
    // 3. Análisis de la asociación
    console.log('\n🔍 ANÁLISIS DE ASOCIACIÓN:');
    console.log('==========================');
    
    if (documentsResult.success && coursesResult.success) {
      const docs = documentsResult.data.documentos || [];
      const courses = coursesResult.data.cursos || [];
      
      console.log(`📊 Documentos disponibles: ${docs.length}`);
      console.log(`📊 Cursos disponibles: ${courses.length}`);
      
      // Buscar coincidencias entre nombres de documentos y cursos
      console.log('\n🔗 Buscando coincidencias...');
      
      courses.forEach(course => {
        console.log(`\n📖 Curso: "${course.nombre_curso}"`);
        
        const matchingDocs = docs.filter(doc => 
          doc.nombre_documento.toLowerCase().includes(course.nombre_curso.toLowerCase()) ||
          course.nombre_curso.toLowerCase().includes(doc.nombre_documento.toLowerCase())
        );
        
        if (matchingDocs.length > 0) {
          console.log(`   ✅ Encontrados ${matchingDocs.length} documentos relacionados:`);
          matchingDocs.forEach(doc => {
            console.log(`      - "${doc.nombre_documento}" (ID: ${doc.id})`);
          });
        } else {
          console.log(`   ❌ No se encontraron documentos relacionados`);
          console.log(`   📋 Documentos disponibles:`);
          docs.forEach(doc => {
            console.log(`      - "${doc.nombre_documento}"`);
          });
        }
      });
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

// Ejecutar verificación
checkDocumentsForRut();
