const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  const url = 'http://localhost:3000/api/programacion-optimizada/todas';
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) {
      console.error('Error en respuesta:', json);
      return;
    }
    if (!json.data || json.data.length === 0) {
      console.log('No hay programaciones registradas en ninguna cartera.');
      return;
    }
    console.log(`Total de registros: ${json.data.length}`);
    json.data.slice(0, 5).forEach((row, i) => {
      console.log(`\nRegistro ${i + 1}:`);
      console.log(row);
    });
    if (json.data.length > 5) {
      console.log(`... (${json.data.length - 5} registros más)`);
    }
  } catch (err) {
    console.error('Error al consultar el endpoint:', err);
  }
}

main();
