const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/documentos/tipos',
  method: 'GET'
}, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('📋 TIPOS DE DOCUMENTO PERMITIDOS:');
      console.log('=================================');
      
      if (data.success && data.data) {
        data.data.forEach((tipo, index) => {
          console.log(`${index + 1}. ${tipo}`);
        });
        console.log(`\n✅ Total: ${data.data.length} tipos permitidos`);
        console.log(`🎯 Usaremos el primer tipo: "${data.data[0]}"`);
      } else {
        console.log('❌ No se pudieron obtener los tipos');
        console.log('Respuesta:', data);
      }
    } catch (e) {
      console.log('❌ Error al parsear respuesta:', e.message);
      console.log('Body:', body);
    }
  });
});

req.on('error', (err) => {
  console.log('❌ Error en la request:', err.message);
});

req.end();

