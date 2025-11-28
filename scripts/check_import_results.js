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

async function main() {
  const file = path.join(__dirname, '..', 'exports', 'listado_claudio_full_rows_db_ready_filtered.json');
  if (!fs.existsSync(file)) {
    console.error('Filtered JSON not found:', file);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const ruts = rows.map(r => normalizeRut(r.rut || r.Rut || r.RUT || r['Rut'])).filter(Boolean);

  const client = await getClient();
  try {
    const totalRes = await client.query('SELECT COUNT(*)::int AS total FROM mantenimiento.personal_disponible');
    const total = totalRes.rows[0] && totalRes.rows[0].total;

    // Count how many of these RUTs exist in the table
    const vals = ruts.map((_, i) => `$${i+1}`).join(', ');
    let found = 0;
    if (ruts.length > 0) {
      const q = `SELECT COUNT(*)::int AS found FROM mantenimiento.personal_disponible WHERE rut IN (${vals})`;
      const res = await client.query(q, ruts);
      found = res.rows[0] && res.rows[0].found;
    }

    console.log('Table total rows:', total);
    console.log('RUTs in file:', ruts.length);
    console.log('Matching RUTs found in DB:', found);

    // show sample of 10 rows from the file and their DB record
    console.log('\nSample records (up to 10):');
    const sample = ruts.slice(0, 10);
    for (const rut of sample) {
      const res = await client.query('SELECT rut, nombres, cargo, estado_id, talla_zapato, talla_pantalon, telefono, correo_electronico, created_at FROM mantenimiento.personal_disponible WHERE rut=$1', [rut]);
      if (res.rows.length === 0) {
        console.log(rut, '-> NOT FOUND');
      } else {
        console.log(rut, '->', res.rows[0]);
      }
    }

    // show last backup tables in mantenimiento schema (simple check)
    const backups = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' OR schemaname='mantenimiento' ORDER BY tablename DESC LIMIT 20");
    console.log('\nRecent tables (limit 20):');
    console.log(backups.rows.map(r => r.tablename).join(', '));

  } finally {
    client.release();
  }
}

main().catch(err => { console.error('Error checking import results:', err); process.exit(1); });
