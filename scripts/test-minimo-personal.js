const axios = require('axios');

async function run() {
  const base = process.env.API_URL || 'http://localhost:3000';
  try {
    console.log('GET /api/servicios/minimo-personal/por-cliente');
    const porCliente = await axios.get(`${base}/api/servicios/minimo-personal/por-cliente`, { timeout: 20000 });
    console.log('Status:', porCliente.status);
    console.log(JSON.stringify(porCliente.data, null, 2));
  } catch (err) {
    console.error('Error por-cliente:', err.response ? (err.response.data || err.response.status) : err.message);
  }

  try {
    console.log('\nGET /api/servicios/minimo-personal/by-cliente/43');
    const byCliente = await axios.get(`${base}/api/servicios/minimo-personal/by-cliente/43`, { timeout: 20000 });
    console.log('Status:', byCliente.status);
    console.log(JSON.stringify(byCliente.data, null, 2));
  } catch (err) {
    console.error('Error by-cliente:', err.response ? (err.response.data || err.response.status) : err.message);
  }
}

run();
