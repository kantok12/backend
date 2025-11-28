#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { getClient } = require('../config/database');

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['help', 'apply', 'backup'],
  string: ['file', 'report', 'comment'],
  default: {
    file: path.join(__dirname, '..', 'exports', 'listado_claudio_full_rows.json'),
    apply: false,
    backup: true,
    report: path.join(__dirname, '..', 'exports', `update_personal_report_${Date.now()}.json`),
    comment: 'Actualizado desde listado_claudio'
  }
});

if (argv.help) {
  console.log('Usage: node update_personal_from_claudio_db.js [--file <json>] [--apply] [--backup true|false] [--report <path>]');
  console.log('By default performs a dry-run and writes a report. Use --apply to perform DB updates.');
  process.exit(0);
}

function normalizeRut(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/[.\s]/g, '');
  if (!/-/.test(s) && s.length > 1) s = s.slice(0, -1) + '-' + s.slice(-1);
  s = s.replace(/k$/i, 'K');
  return s;
}

function findHeader(keys, candidates) {
  const lc = keys.map(k => (k || '').toString().toLowerCase());
  for (const cand of candidates) {
    const idx = lc.findIndex(k => k.includes(cand.toLowerCase()));
    if (idx >= 0) return keys[idx];
  }
  return null;
}

async function main(){
  const filePath = path.resolve(argv.file);
  if (!fs.existsSync(filePath)) {
    console.error('Input JSON not found:', filePath);
    console.error('Run `node scripts/extract_full_listado_claudio.js` first to produce the file.');
    process.exit(2);
  }

  const raw = JSON.parse(fs.readFileSync(filePath,'utf8'));
  let rows = Array.isArray(raw.rows) ? raw.rows : (Array.isArray(raw.sampleRows) ? raw.sampleRows : []);
  // Detect case where the first row contains header labels (common when sheet had merged headers)
  if (rows.length > 0) {
    const first = rows[0];
    const firstValues = Object.values(first).map(v => (v === null || v === undefined) ? '' : String(v).trim());
    const hasRutLabel = firstValues.some(v => /^rut$/i.test(v) || v.toLowerCase().includes('rut'));
    const nonEmptyCount = firstValues.filter(v => v !== '' && isNaN(Number(v))).length;
    // if first row looks like header labels (many non-numeric strings or contains 'Rut'), treat it as header row
    if (hasRutLabel || nonEmptyCount >= Math.max(2, Object.keys(first).length / 2)) {
      const headerNames = {};
      Object.keys(first).forEach(k => {
        const val = first[k];
        const name = (val === null || val === undefined || String(val).trim() === '') ? k : String(val).trim();
        headerNames[k] = name;
      });
      // rebuild rows using headerNames and skip the header row
      const rebuilt = rows.slice(1).map(r => {
        const obj = {};
        Object.keys(r).forEach(k => {
          const hk = headerNames[k] || k;
          obj[hk] = r[k];
        });
        return obj;
      });
      // filter out empty rows
      rows = rebuilt.filter(row => Object.values(row).some(v => v !== null && String(v).trim() !== ''));
    }
  }
  if (!rows || rows.length === 0) {
    console.error('No rows found in JSON file:', filePath);
    process.exit(3);
  }

  const keys = Object.keys(rows[0]);

  // Candidate headers
  const rutCandidates = ['rut','listado','listado de empleados','ruts','run','run_rut'];
  const nameCandidates = ['nombre','nombres','nombre completo','apellidos','apellido','nombre y apellido','nombre apellido'];
  const shoeCandidates = ['talla_zapatos','talla zapatos','talla_zapato','shoe','shoe_size','talla','talla zapatos sapato','zapato'];

  const rutHeader = findHeader(keys, rutCandidates) || keys[0];
  const nameHeader = findHeader(keys, nameCandidates) || null;
  const shoeHeader = findHeader(keys, shoeCandidates) || null;

  console.log('Detected headers:', { rutHeader, nameHeader, shoeHeader });

  const parsed = [];
  for (const r of rows) {
    const rawRut = r[rutHeader] || r['Rut'] || r['RUT'] || r['Listado de Empleados'] || r['Listado'];
    const rut = normalizeRut(rawRut);
    if (!rut) continue;
    const nombres = nameHeader ? (r[nameHeader] || null) : null;
    const talla_zapatos = shoeHeader ? (r[shoeHeader] || null) : null;
    parsed.push({ rut, nombres: nombres === '' ? null : nombres, talla_zapatos: talla_zapatos === '' ? null : talla_zapatos, raw: r });
  }

  if (parsed.length === 0) {
    console.error('No valid RUTs parsed from file. Check header names.');
    process.exit(4);
  }

  console.log('Parsed', parsed.length, 'rows with RUTs. Connecting to DB to perform dry-run...');

  const client = await getClient();
  try {
    const ruts = parsed.map(p => p.rut);
    // fetch existing records for these ruts
    const res = await client.query('SELECT * FROM mantenimiento.personal_disponible WHERE rut = ANY($1::text[])', [ruts]);
    const existMap = {};
    for (const row of res.rows) existMap[row.rut] = row;

    const toUpdate = [];
    const notFound = [];
    for (const p of parsed) {
      const existing = existMap[p.rut];
      if (!existing) { notFound.push(p); continue; }
      const newName = p.nombres && String(p.nombres).trim() ? String(p.nombres).trim() : null;
      const newShoe = p.talla_zapatos && String(p.talla_zapatos).trim() ? String(p.talla_zapatos).trim() : null;
      // Decide whether to update: if newName present and different OR newShoe present and different
      const willUpdateName = newName && (!existing.nombres || String(existing.nombres).trim() !== newName);
      const willUpdateShoe = newShoe && (!existing.talla_zapatos || String(existing.talla_zapatos).trim() !== newShoe);
      if (willUpdateName || willUpdateShoe) {
        toUpdate.push({ rut: p.rut, newName, newShoe, existing });
      }
    }

    const report = {
      timestamp: new Date().toISOString(),
      source: filePath,
      total_rows_in_file: rows.length,
      parsed_rows: parsed.length,
      total_existing_found: Object.keys(existMap).length,
      to_update_count: toUpdate.length,
      not_found_count: notFound.length,
      not_found: notFound.map(n => n.rut),
      updates_preview: toUpdate.slice(0,200).map(u => ({ rut: u.rut, existing_nombres: u.existing.nombres, new_nombres: u.newName, existing_talla_zapatos: u.existing.talla_zapatos, new_talla_zapatos: u.newShoe }))
    };

    // write dry-run report
    const reportPath = path.resolve(argv.report);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log('Dry-run report written to', reportPath);

    if (!argv.apply) {
      console.log('Dry-run complete. Use --apply to perform updates.');
      process.exit(0);
    }

    // APPLY path
    console.log('Apply requested. Preparing backup and applying updates...');
    const ts = Date.now();
    if (argv.backup) {
      const backupPath = path.join(__dirname, '..', 'exports', `personal_update_backup_${ts}.json`);
      const backupRes = await client.query('SELECT * FROM mantenimiento.personal_disponible WHERE rut = ANY($1::text[])', [toUpdate.map(t => t.rut)]);
      fs.writeFileSync(backupPath, JSON.stringify({ timestamp: new Date().toISOString(), rows: backupRes.rows }, null, 2), 'utf8');
      console.log('Backup written to', backupPath);
    }

    // perform updates in a transaction
    await client.query('BEGIN');
    const applied = [];
    const errors = [];
    try {
      for (const u of toUpdate) {
        const parts = [];
        const vals = [];
        let idx = 1;
        if (u.newName) { parts.push(`nombres = $${idx++}`); vals.push(u.newName); }
        if (u.newShoe) { parts.push(`talla_zapatos = $${idx++}`); vals.push(u.newShoe); }
        parts.push(`comentario_estado = COALESCE(comentario_estado, '') || ' | ${String(argv.comment).replace(/'/g, "''")} ${new Date().toISOString()}'`);
        vals.push(u.rut);
        const q = `UPDATE mantenimiento.personal_disponible SET ${parts.join(', ')} WHERE rut = $${idx} RETURNING *`;
        try {
          const r = await client.query(q, vals);
          if (r.rows && r.rows[0]) applied.push({ rut: u.rut, row: r.rows[0] });
        } catch (e) {
          errors.push({ rut: u.rut, error: String(e.message || e) });
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }

    const finalReport = Object.assign({}, report, { applied_count: applied.length, applied, errors });
    const finalPath = path.join(__dirname, '..', 'exports', `update_personal_final_report_${ts}.json`);
    fs.writeFileSync(finalPath, JSON.stringify(finalReport, null, 2), 'utf8');
    console.log('Apply complete. Final report written to', finalPath, 'applied:', applied.length, 'errors:', errors.length);

  } finally {
    client.release();
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
