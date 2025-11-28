#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getClient } = require('../config/database');

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['apply', 'help', 'use-api', 'check-only'],
  string: ['file', 'zona', 'cargo', 'estado_id', 'api-url', 'token'],
  default: {
    file: path.join(__dirname, '..', 'exports', 'listado_claudio_analysis.json'),
    apply: false,
    cargo: 'OPERARIO',
    estado_id: '1',
    'api-url': 'http://localhost:3000'
  }
});

if (argv.help) {
  console.log(`Usage: node scripts/import_personal_from_claudio.js [--file <path>] [--apply] [--use-api] [--check-only] [--api-url <url>] [--zona <zona>] [--cargo <cargo>] [--estado_id <id>]`);
  process.exit(0);
}

function normalizeRut(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (/^rut$/i.test(s)) return null;
  s = s.replace(/[.\s]/g, '');
  if (!/-/.test(s) && s.length > 1) s = s.slice(0, -1) + '-' + s.slice(-1);
  s = s.replace(/k$/i, 'K');
  return s;
}

function readValues(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let values = [];
  if (Array.isArray(raw.sampleRows) && raw.sampleRows.length > 0) {
    const col = raw.columns && raw.columns[0];
    if (col) values = raw.sampleRows.map(r => r[col]);
  }
  if (values.length === 0 && raw.summaryColumns) {
    const col = raw.columns && raw.columns[0];
    if (col && raw.summaryColumns[col] && raw.summaryColumns[col].topValues) {
      values = raw.summaryColumns[col].topValues.map(v => v.value);
    }
  }
  return values.map(normalizeRut).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
}

async function checkViaApi(ruts, apiUrl, token) {
  const report = { timestamp: new Date().toISOString(), total: ruts.length, exists: [], missing: [], errors: [] };
  for (const rut of ruts) {
    try {
      const getUrl = `${apiUrl.replace(/\/$/, '')}/api/personal-disponible/${encodeURIComponent(rut)}`;
      await axios.get(getUrl, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, timeout: 5000 });
      report.exists.push(rut);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        report.missing.push(rut);
      } else {
        report.errors.push({ rut, error: String(err.message || err) });
      }
    }
  }
  return report;
}

async function createViaApi(ruts, apiUrl, token, zona, cargo, estadoId) {
  const created = [];
  const errors = [];
  for (const rut of ruts) {
    const postUrl = `${apiUrl.replace(/\/$/, '')}/api/personal-disponible`;
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
      comentario_estado: `Importado: listado_claudio ${new Date().toISOString()}`
    };
    try {
      const res = await axios.post(postUrl, body, { headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}), timeout: 10000 });
      if (res && res.data && res.data.success) created.push(rut);
      else errors.push({ rut, response: res && res.data });
    } catch (err) {
      if (err.response) errors.push({ rut, status: err.response.status, data: err.response.data });
      else errors.push({ rut, error: String(err.message || err) });
    }
  }
  return { created, errors };
}

async function checkViaDb(ruts) {
  const report = { timestamp: new Date().toISOString(), total: ruts.length, exists: [], missing: [], errors: [] };
  const client = await getClient();
  try {
    for (const rut of ruts) {
      try {
        const res = await client.query('SELECT rut FROM mantenimiento.personal_disponible WHERE rut = $1', [rut]);
        if (res.rows.length > 0) report.exists.push(rut);
        else report.missing.push(rut);
      } catch (err) {
        report.errors.push({ rut, error: String(err.message || err) });
      }
    }
  } finally {
    client.release();
  }
  return report;
}

async function createViaDb(ruts, zona, cargo, estadoId) {
  const client = await getClient();
  const created = [];
  const errors = [];
  try {
    await client.query('BEGIN');
    const insertText = `INSERT INTO mantenimiento.personal_disponible (
      rut, sexo, fecha_nacimiento, licencia_conducir, talla_zapatos, talla_pantalones, talla_poleras,
      cargo, estado_id, zona_geografica, nombres, comentario_estado
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (rut) DO NOTHING RETURNING rut`;
    for (const rut of ruts) {
      try {
        const sexo = 'N';
        const fecha_nacimiento = null;
        const licencia_conducir = 'N';
        const talla_zapatos = '';
        const talla_pantalones = '';
        const talla_poleras = '';
        const nombres = null;
        const comentario_estado = `Importado: listado_claudio ${new Date().toISOString()}`;
        const res = await client.query(insertText, [rut, sexo, fecha_nacimiento, licencia_conducir, talla_zapatos, talla_pantalones, talla_poleras, cargo, estadoId, zona, nombres, comentario_estado]);
        if (res.rows && res.rows.length > 0) created.push(rut);
      } catch (err) {
        errors.push({ rut, error: String(err.message || err) });
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    throw err;
  } finally {
    client.release();
  }
  return { created, errors };
}

async function main() {
  const filePath = path.resolve(argv.file);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(2);
  }

  const normalized = readValues(filePath);
  console.log(`Found ${normalized.length} unique normalized RUTs to import`);

  const apiUrl = argv['api-url'];
  const zona = argv.zona || null;
  const cargo = argv.cargo || 'OPERARIO';
  const estadoId = parseInt(argv.estado_id, 10) || 1;
  const useApi = !!argv['use-api'];
  const checkOnly = !!argv['check-only'];
  const outReport = path.join(__dirname, '..', 'exports', `import_personal_check_${Date.now()}.json`);

  let report;
  if (useApi) {
    report = await checkViaApi(normalized, apiUrl, argv.token);
    console.log(`Check complete. exists=${report.exists.length} missing=${report.missing.length} errors=${report.errors.length}`);
    fs.mkdirSync(path.dirname(outReport), { recursive: true });
    fs.writeFileSync(outReport, JSON.stringify(report, null, 2), 'utf8');
    console.log('Report written to', outReport);

    if (checkOnly) return;

    if (argv.apply) {
      if (report.missing.length === 0) {
        console.log('No missing RUTs to create');
        return;
      }
      const { created, errors } = await createViaApi(report.missing, apiUrl, argv.token, zona, cargo, estadoId);
      report.created = created;
      report.create_errors = errors;
      fs.writeFileSync(outReport, JSON.stringify(report, null, 2), 'utf8');
      console.log(`Created ${created.length} records via API. Report updated.`);
    }
  } else {
    report = await checkViaDb(normalized);
    console.log(`Check complete. exists=${report.exists.length} missing=${report.missing.length} errors=${report.errors.length}`);
    fs.mkdirSync(path.dirname(outReport), { recursive: true });
    fs.writeFileSync(outReport, JSON.stringify(report, null, 2), 'utf8');
    console.log('Report written to', outReport);

    if (checkOnly) return;

    if (argv.apply) {
      if (report.missing.length === 0) {
        console.log('No missing RUTs to create');
        return;
      }
      const { created, errors } = await createViaDb(report.missing, zona, cargo, estadoId);
      report.created = created;
      report.create_errors = errors;
      fs.writeFileSync(outReport, JSON.stringify(report, null, 2), 'utf8');
      console.log(`Created ${created.length} records via DB. Report updated.`);
    }
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
