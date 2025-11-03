// Script de prueba para consultar el endpoint y mostrar la respuesta real

const fetch = require('node-fetch');

const cartera_id = 1; // Cambia según tu caso
const fecha = new Date().toISOString().split('T')[0]; // Fecha actual

const url = `http://localhost:3000/api/programacion-optimizada?cartera_id=${cartera_id}&fecha=${fecha}`;

fetch(url, {
  headers: { 'Accept': 'application/json' }
})
  .then(res => res.json())
  .then(data => {
    console.log('Respuesta del endpoint /api/programacion-optimizada:');
    console.dir(data, { depth: null });
  })
  .catch(err => {
    console.error('Error al consultar el endpoint:', err);
  });
