const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  const url = 'http://localhost:3000/api/personal/cargos-estados';
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) {
      console.error('Error en respuesta:', json);
      return;
    }
    if (!json.data || json.data.length === 0) {
      console.log('No hay datos de cargos y estados.');
      return;
    }
    console.log(`Total de cargos encontrados: ${json.data.length}`);
    json.data.forEach((cargo, i) => {
      console.log(`\nCargo ${i + 1}: ${cargo.cargo}`);
      console.log(`Total personas: ${cargo.total}`);
      console.log('Estados:');
      Object.entries(cargo.estados).forEach(([estado, cantidad]) => {
        console.log(`  ${estado}: ${cantidad}`);
      });
    });
  } catch (err) {
    console.error('Error al consultar el endpoint:', err);
  }
}

main();
