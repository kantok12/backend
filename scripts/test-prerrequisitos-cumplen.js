const axios = require('axios');

async function run() {
  const base = process.env.API_URL || 'http://localhost:3000';
  const clienteId = process.env.CLIENTE_ID || '43';
  try {
    console.log(`GET /api/prerrequisitos/clientes/${clienteId}/cumplen`);
    const res = await axios.get(`${base}/api/prerrequisitos/clientes/${clienteId}/cumplen?includeGlobal=true&limit=500`, { timeout: 20000 });
    console.log('Status:', res.status);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) console.error('Error response:', err.response.status, err.response.data);
    else console.error('Error:', err.message);
  }
}

run();
