const axios = require('axios');

async function runTest() {
  const base = process.env.API_URL || 'http://localhost:3000';
  const clienteId = process.env.CLIENTE_ID || '43';

  const payload = {
    ruts: [
      '20011078-1',
      '11111111-1'
    ],
    requireAll: true,
    includeGlobal: true
  };

  console.log(`🔎 Test de matching -> POST ${base}/api/prerrequisitos/clientes/${clienteId}/match`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const res = await axios.post(`${base}/api/prerrequisitos/clientes/${clienteId}/match`, payload, {
      timeout: 20000
    });

    console.log('✅ Status:', res.status);
    console.log('Respuesta:');
    console.log(JSON.stringify(res.data, null, 2));
    process.exit(0);
  } catch (err) {
    if (err.response) {
      console.error('❌ Error response status:', err.response.status);
      try { console.error(JSON.stringify(err.response.data, null, 2)); } catch (e) { console.error(err.response.data); }
    } else if (err.request) {
      console.error('❌ No response received. Request sent but no response.');
      console.error(err.message);
    } else {
      console.error('❌ Error construyendo request:', err.message);
    }
    process.exit(2);
  }
}

runTest();
