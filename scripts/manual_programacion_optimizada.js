
// Importación dinámica de node-fetch para compatibilidad con Node.js CommonJS
async function main() {
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

  const cartera_id = 1;
  const fecha_inicio = '2025-11-03';
  const fecha_fin = '2025-11-09';
  const url = `http://localhost:3000/api/programacion-optimizada?cartera_id=${cartera_id}&fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) {
      console.error('Error en respuesta:', json);
      return;
    }
    console.log('Cartera:', json.data.cartera);
    json.data.programacion.forEach(dia => {
      console.log(`\nFecha: ${dia.fecha} (${dia.dia_semana})`);
      dia.trabajadores.forEach(trabajador => {
        console.log({
          id: trabajador.id,
          rut: trabajador.rut,
          nombre_persona: trabajador.nombre_persona,
          cliente_id: trabajador.cliente_id,
          nombre_cliente: trabajador.nombre_cliente
        });
      });
    });
  } catch (err) {
    console.error('Error al consultar:', err);
  }
}

main();
