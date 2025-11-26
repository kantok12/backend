const asignacionesService = require('../services/asignacionesService');

async function run() {
  try {
    const clienteId = 28;
    const rut = '20011078-1';
    console.log(`Probando asignarPersonal(${clienteId}, ${rut})`);
    const res = await asignacionesService.asignarPersonal(clienteId, rut);
    console.log('Resultado:', res);
    process.exit(0);
  } catch (err) {
    console.error('Error ejecutando asignarPersonal:', err);
    process.exit(1);
  }
}

run();
