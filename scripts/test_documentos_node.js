const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Config desde environment o defaults
const HOST = process.env.API_URL || process.env.HOST_URL || 'http://localhost:3000';
const AUTH_HEADER = process.env.AUTH_HEADER || ''; // ejemplo: 'Bearer TOKEN'
const RUT = process.env.RUT || '20011078-1';

const log = (title, data) => {
  console.log('\n=== ' + title + ' ===');
  if (data === undefined) return console.log('(sin datos)');
  try {
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } catch (e) {
    console.log(data);
  }
};

async function run() {
  const headers = {};
  if (AUTH_HEADER) headers['Authorization'] = AUTH_HEADER;

  // 1) GET /api/documentos/persona/:rut
  try {
    const url = `${HOST}/api/documentos/persona/${encodeURIComponent(RUT)}`;
    log('GET persona - URL', url);
    const res = await axios.get(url, { headers, timeout: 20000 });
    log('GET persona - response', res.data);
  } catch (error) {
    log('GET persona - error', formatAxiosError(error));
  }

  // 2) POST /api/documentos/registrar-existente (JSON)
  try {
    const url = `${HOST}/api/documentos/registrar-existente`;
    const payload = {
      rut_persona: RUT,
      nombre_documento: 'Prueba desde script Node',
      nombre_archivo: 'testfile.txt',
      ruta_local: path.join(__dirname, 'testfile.txt'),
      nombre_archivo_destino: 'prueba_script_registrar.txt',
      tipo_documento: 'certificado_curso'
    };
    log('POST registrar-existente - URL', url);
    log('POST registrar-existente - payload', payload);
    const res = await axios.post(url, payload, { headers: { ...headers, 'Content-Type': 'application/json' }, timeout: 30000 });
    log('POST registrar-existente - response', res.data);
  } catch (error) {
    log('POST registrar-existente - error', formatAxiosError(error));
  }

  // 3) POST /api/documentos - multipart upload
  try {
    const url = `${HOST}/api/documentos`;
    const filePath = path.join(__dirname, 'testfile.txt');
    if (!fs.existsSync(filePath)) {
      // crear archivo de prueba si no existe
      fs.writeFileSync(filePath, 'Archivo de prueba para upload desde script Node - ' + new Date().toISOString());
      console.log('Archivo de prueba creado en', filePath);
    }

    const form = new FormData();
    // field name expected by backend: 'archivo' (acepta hasta 5)
    form.append('archivo', fs.createReadStream(filePath));
    form.append('rut_persona', RUT);
    form.append('nombre_documento', 'Prueba upload Node');
    form.append('tipo_documento', 'certificado_curso');
    form.append('nombre_archivo_destino', 'prueba_upload_script.txt');

    const formHeaders = form.getHeaders();
    if (AUTH_HEADER) formHeaders['Authorization'] = AUTH_HEADER;

    log('POST upload - URL', url);
    log('POST upload - form headers', Object.keys(formHeaders));

    const res = await axios.post(url, form, {
      headers: formHeaders,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000
    });

    log('POST upload - response', res.data);
  } catch (error) {
    log('POST upload - error', formatAxiosError(error));
  }
}

function formatAxiosError(err) {
  if (!err) return null;
  if (err.response) {
    return { status: err.response.status, data: err.response.data };
  }
  if (err.request) {
    return { message: 'No response received', request: String(err.request) };
  }
  return { message: err.message };
}

run().then(() => {
  console.log('\n=== Done ===');
}).catch(err => {
  console.error('\n=== Fatal error ===', err);
  process.exit(1);
});
