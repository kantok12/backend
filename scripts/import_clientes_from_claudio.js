#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { query, getClient } = require('../config/database');

// Simple CLI parsing
const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['apply', 'help'],
  string: ['file', 'cartera', 'region'],
  default: {
    file: path.join(__dirname, '..', 'exports', 'listado_claudio_analysis.json'),
    apply: false
  }
});

if (argv.help) {
  console.log(`Usage: node scripts/import_clientes_from_claudio.js [--file <path>] [--cartera <id>] [--region <id>] [--apply]\n
Options:\n  --file    Path to the analysis JSON (default: exports/listado_claudio_analysis.json)\n  --cartera ID to use as cartera_id for new clientes (if omitted the script will pick the first existing cartera when --apply)\n  --region  ID to use as region_id for new clientes (if omitted the script will pick the first existing region when --apply)\n  --apply   Actually perform DB inserts. Without --apply the script runs in dry-run mode and only prints the planned actions.\n`);
  process.exit(0);
}

function normalizeRut(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  // Skip header-like values
  if (/^rut$/i.test(s)) return null;
  // Remove dots and spaces
  s = s.replace(/[.\s]/g, '');
  // Ensure dash before verifier
  if (!/-/.test(s) && s.length > 1) {
    s = s.slice(0, -1) + '-' + s.slice(-1);
  }
  // Uppercase K
  s = s.replace(/k$/i, 'K');
  return s;
}

async function main() {
  const filePath = path.resolve(argv.file);

  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(2);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // The analysis file has sampleRows or a single column list. Try to extract values.
  let values = [];
  if (Array.isArray(raw.sampleRows) && raw.sampleRows.length > 0) {
    // sampleRows is an array of objects with the column name as key
    const col = raw.columns && raw.columns[0];
    if (col) {
      values = raw.sampleRows.map(r => r[col]);
    }
  }

  // Fallback: attempt to read from a top-level 'rows' or the summary
  if (values.length === 0 && raw.summaryColumns) {
    const col = raw.columns && raw.columns[0];
    if (col && raw.summaryColumns[col] && raw.summaryColumns[col].topValues) {
      values = raw.summaryColumns[col].topValues.map(v => v.value);
    }
  }

  if (values.length === 0) {
    console.error('No candidate values found in analysis file. Inspect', filePath);
    process.exit(3);
  }

  // Normalize and dedupe
  const normalized = values
    .map(normalizeRut)
    .filter(v => v && v.length > 0)
    .map(v => v.trim())
    .filter((v, i, arr) => arr.indexOf(v) === i);

  console.log(`Found ${values.length} raw entries, ${normalized.length} unique normalized entries (header/invalid removed).`);

  if (!argv.apply) {
    console.log('\nDRY-RUN: no changes will be made. To apply changes pass --apply');
    console.log('Sample of normalized values:', normalized.slice(0, 20));
    console.log('\nPlanned actions:');
    console.log(`- Insert up to ${normalized.length} rows into table 'clientes' using columna 'nombre' = RUT normalizado`);
    console.log(`- Each insert will require a valid 'cartera_id' and 'region_id'. If you do not pass --cartera or --region the script will pick the first existing values when run with --apply.`);
    process.exit(0);
  }

  // APPLY mode: perform DB operations
  const client = await getClient();
  try {
    // Determine cartera_id and region_id
    let carteraId = argv.cartera ? parseInt(argv.cartera, 10) : null;
    let regionId = argv.region ? parseInt(argv.region, 10) : null;

    if (!carteraId) {
      const res = await client.query('SELECT id FROM carteras ORDER BY id LIMIT 1');
      if (res.rows.length === 0) throw new Error('No carteras found in DB. Create at least one cartera or pass --cartera');
      carteraId = res.rows[0].id;
      console.log('Using cartera_id =', carteraId);
    }
    if (!regionId) {
      const res = await client.query('SELECT id FROM ubicacion_geografica ORDER BY id LIMIT 1');
      if (res.rows.length === 0) throw new Error('No ubicacion_geografica found in DB. Create at least one region or pass --region');
      regionId = res.rows[0].id;
      console.log('Using region_id =', regionId);
    }

    // Start transaction
    await client.query('BEGIN');

    const insertText = `INSERT INTO clientes (nombre, cartera_id, region_id, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (nombre, cartera_id) DO NOTHING
      RETURNING id`;

    let inserted = 0;
    let skipped = 0;

    // Batch loop
    for (const value of normalized) {
      try {
        const res = await client.query(insertText, [value, carteraId, regionId]);
        if (res.rows.length > 0) {
          inserted++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error('Error inserting', value, err.message);
        // don't abort on single row error; continue
      }
    }

        if (!argv.apply) {
          console.log('\nDRY-RUN: no changes will be made. To apply changes pass --apply');
          console.log('Sample of normalized values:', normalized.slice(0, 20));
          console.log('\nPlanned actions:');
          console.log(`- Insert up to ${normalized.length} rows into table 'clientes' using columna 'nombre' = RUT normalizado`);
          console.log(`- Each insert will set 'region_id' (required). If you do not pass --cartera the script will pick the first existing cartera when run with --apply.`);
          console.log(`- To run apply you must pass --region <id> (or the script will error).`);
          process.exit(0);
      console.log('Rolled back transaction');
    } catch (rbErr) {
      console.error('Rollback error:', rbErr.message);
    }
    process.exit(4);
  } finally {
          // Require regionId explicitly to ensure imports are region-driven
          if (!regionId) {
            throw new Error('Region ID is required when running with --apply. Pass --region <id>');
          }

          if (!carteraId) {
            // pick a default cartera if not provided (DB requires cartera_id NOT NULL)
            const res = await client.query('SELECT id FROM carteras ORDER BY id LIMIT 1');
            if (res.rows.length === 0) throw new Error('No carteras found in DB. Create at least one cartera or pass --cartera');
            carteraId = res.rows[0].id;
            console.log('No --cartera provided; using default cartera_id =', carteraId);
          }
