#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { getClient } = require('../config/database');

function normalizeRut(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  s = s.replace(/[.\s]/g, '');
  if (!/-/.test(s) && s.length > 1) s = s.slice(0, -1) + '-' + s.slice(-1);
  s = s.replace(/k$/i, 'K');
  return s;
}

const infile = path.join(__dirname, '..', 'exports', 'listado_claudio_analysis_full.json');
if (!fs.existsSync(infile)) {
  console.error('Input JSON not found:', infile);
  process.exit(2);
}

const raw = JSON.parse(fs.readFileSync(infile, 'utf8'));
let values = [];
if (Array.isArray(raw.sampleRows) && raw.sampleRows.length > 0) {
  const col = raw.columns && raw.columns[0];
  values = raw.sampleRows.map(r => r[col]);
} else if (Array.isArray(raw.rows)) {
  values = raw.rows;
} else {
  console.error('No rows found in analysis JSON');
  process.exit(3);
}

const ruts = values.map(normalizeRut).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);

(async function(){
  const client = await getClient();
  try {
    const res = await client.query('SELECT * FROM mantenimiento.personal_disponible WHERE rut = ANY($1)', [ruts]);
    const out = { timestamp: new Date().toISOString(), query_count: ruts.length, rows: res.rows };
    const outPath = path.join(__dirname, '..', 'exports', `personal_existing_backup_${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('Wrote backup to', outPath, 'rows:', res.rows.length);
  } catch (err) {
    console.error('Error querying DB:', err.message || err);
    process.exit(4);
  } finally {
    client.release();
  }
})();
