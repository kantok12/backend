const FormData = require('form-data');
const fs = require('fs');
const http = require('http');

async function testPostCurso() {
  const form = new FormData();
  
  // Crear un archivo PDF de prueba
  const pdfContent = Buffer.from('PDF Test Content - Curso via POST /api/cursos');
  fs.writeFileSync('./test_curso_api_cursos.pdf', pdfContent);
  
  // Agregar campos al formulario
  form.append('rut_persona', '20.320.662-3');
  form.append('nombre_curso', 'Primeros Auxilios Básicos');
  form.append('fecha_inicio', '2025-11-01');
  form.append('fecha_fin', '2025-11-03');
  form.append('fecha_vencimiento', '2026-11-03');
  form.append('estado', 'completado');
  form.append('institucion', 'Cruz Roja Chilena');
  form.append('descripcion', 'Curso de primeros auxilios nivel básico');
  form.append('dias_validez', '365');
  form.append('archivo', fs.createReadStream('./test_curso_api_cursos.pdf'), {
    filename: 'primeros_auxilios.pdf',
    contentType: 'application/pdf'
  });
  
  try {
    console.log('📤 Subiendo curso con archivo via POST /api/cursos...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/cursos',
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
        if (fs.existsSync('./test_curso_api_cursos.pdf')) {
          fs.unlinkSync('./test_curso_api_cursos.pdf');
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error en request:', error.message);
      if (fs.existsSync('./test_curso_api_cursos.pdf')) {
        fs.unlinkSync('./test_curso_api_cursos.pdf');
      }
    });
    
    form.pipe(req);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPostCurso();
