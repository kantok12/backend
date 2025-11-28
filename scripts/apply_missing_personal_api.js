#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['help'],
  string: ['report', 'api-url', 'zona', 'cargo', 'estado_id', 'token'],
  default: {
    report: path.join(__dirname, '..', 'exports', 'import_personal_check_1764259861448.json'),
    'api-url': 'http://localhost:3000',
    zona: 'Metropolitana de Santiago',
    cargo: 'OPERARIO',
    estado_id: '1',
    token: ''
  }
});

if (argv.help) {
  console.log('Usage: node apply_missing_personal_api.js [--report <path>] [--api-url <url>] [--zona <zona>] [--cargo <cargo>] [--estado_id <id>] [--token <jwt>]');
  process.exit(0);
}

function chunk(arr, size){
  const out = [];
  for (let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size));
  return out;
}

const reportPath = path.resolve(argv.report);
if (!fs.existsSync(reportPath)) { console.error('Report not found:', reportPath); process.exit(2); }
const report = JSON.parse(fs.readFileSync(reportPath,'utf8'));
const missing = report.missing || [];
if (missing.length === 0) { console.log('No missing RUTs to apply'); process.exit(0); }

const apiUrl = argv['api-url'].replace(/\/$/, '');
const zona = argv.zona;
const cargo = argv.cargo;
const estadoId = parseInt(argv.estado_id,10) || 1;
const token = argv.token || null;

const batchSize = 25;
const batches = chunk(missing, batchSize);

const created = [];
const errors = [];

(async function(){
  console.log(`Applying ${missing.length} missing RUTs in ${batches.length} batches (batch size ${batchSize}) to ${apiUrl}`);
  for (let bi = 0; bi < batches.length; bi++){
    const batch = batches[bi];
    console.log(`Batch ${bi+1}/${batches.length}: ${batch.length} RUTs`);
    for (const rut of batch){
      const body = {
        rut,
        sexo: 'N',
        fecha_nacimiento: '1970-01-01',
        licencia_conducir: 'N',
        talla_zapatos: '',
        talla_pantalones: '',
        talla_poleras: '',
        cargo,
        estado_id: estadoId,
        zona_geografica: zona,
        nombres: null,
        comentario_estado: `Importado masivo listado_claudio ${new Date().toISOString()}`
      };
      try {
        const res = await axios.post(apiUrl + '/api/personal-disponible', body, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, timeout: 15000 });
        if (res && res.data && res.data.success) {
          created.push(rut);
          console.log('CREATED', rut);
        } else {
          errors.push({ rut, response: res && res.data });
          console.warn('WARN creating', rut, res && res.data);
        }
      } catch (err) {
        if (err.response) errors.push({ rut, status: err.response.status, data: err.response.data });
        else errors.push({ rut, error: String(err.message || err) });
        console.error('ERROR creating', rut, err.response ? err.response.status : err.message);
      }
      // small pause to be gentle with the API
      await new Promise(r => setTimeout(r, 200));
    }
    // after each batch, write a partial report
    const out = { timestamp: new Date().toISOString(), total_missing: missing.length, created_count: created.length, errors_count: errors.length, created, errors };
    const outPath = path.join(__dirname, '..', 'exports', `import_personal_apply_partial_${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('Wrote partial report', outPath);
  }

  const finalPath = path.join(__dirname, '..', 'exports', `import_personal_apply_report_${Date.now()}.json`);
  const final = { timestamp: new Date().toISOString(), total_missing: missing.length, created_count: created.length, errors_count: errors.length, created, errors };
  fs.writeFileSync(finalPath, JSON.stringify(final, null, 2), 'utf8');
  console.log('Done. Final report:', finalPath, 'created:', created.length, 'errors:', errors.length);
})();
