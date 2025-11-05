const FormData = require('form-data');
const fs = require('fs');
const https = require('https');
const http = require('http');

async function testUploadCurso() {
  const form = new FormData();
  
  // Crear un archivo PDF de prueba
  const pdfContent = Buffer.from('PDF Test Content - Curso de Prueba');
  fs.writeFileSync('./test_curso_upload.pdf', pdfContent);
  
  // Agregar campos al formulario
  form.append('rut_persona', '20.320.662-3');
  form.append('nombre_documento', 'Curso de Prueba Backend');
  form.append('tipo_documento', 'certificado_curso'); // ← Debe guardar en cursos_certificaciones
  form.append('fecha_emision', '2025-11-05');
  form.append('fecha_vencimiento', '2026-11-05');
  form.append('dias_validez', '365');
  form.append('institucion_emisora', 'Instituto de Pruebas Backend');
  form.append('archivo', fs.createReadStream('./test_curso_upload.pdf'), {
    filename: 'test_curso_upload.pdf',
    contentType: 'application/pdf'
  });
  
  try {
    console.log('📤 Subiendo documento tipo=curso...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/documentos',
      method: 'POST',
      headers: form.getHeaders()
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n✅ Respuesta del servidor:');
        try {
          const jsonData = JSON.parse(data);
          console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log('Raw response:', data);
        }
        
        // Limpiar archivo de prueba
        if (fs.existsSync('./test_curso_upload.pdf')) {
          fs.unlinkSync('./test_curso_upload.pdf');
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error en request:', error.message);
      console.error('Error completo:', error);
      if (fs.existsSync('./test_curso_upload.pdf')) {
        fs.unlinkSync('./test_curso_upload.pdf');
      }
    });
    
    form.pipe(req);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUploadCurso();
