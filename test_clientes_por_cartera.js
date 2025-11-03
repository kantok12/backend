// Script para probar el endpoint de clientes por cartera

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const cartera_id = 1;
const url = `http://localhost:3000/api/clientes?cartera_id=${cartera_id}`;

fetch(url, {
  headers: { 'Accept': 'application/json' }
})
  .then(res => res.json())
  .then(data => {
    console.log('Respuesta del endpoint /api/clientes?cartera_id=1:');
    console.dir(data, { depth: null });
  })
  .catch(err => {
    console.error('Error al consultar el endpoint:', err);
  });
