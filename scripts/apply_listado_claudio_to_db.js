#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { getClient } = require('../config/database');

const src = process.env.LISTADO_FILE ? path.resolve(process.env.LISTADO_FILE) : path.join(__dirname, '..', 'exports', 'listado_claudio_full_rows_db_ready.json');

function normalizeRut(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (/^rut$/i.test(s)) return null;
  s = s.replace(/[.\s]/g, '');
  if (!/-/.test(s) && s.length > 1) s = s.slice(0, -1) + '-' + s.slice(-1);
  s = s.replace(/k$/i, 'K');
  return s;
}

function normalizeDate(v) {
  if (!v) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    // filter placeholder 1970-01-01
    const year = d.getUTCFullYear();
    if (year === 1970) return null;
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return null;
  }
}

function prepareValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '' || s.toLowerCase() === 'null') return null;
    return s;
  }
  return val;
}

const columns = [
  'rut','sexo','fecha_nacimiento','licencia_conducir','cargo','estado_id','documentacion_id',
  'nombres','estado_civil','pais','region','comuna','ciudad','telefono','correo_electronico',
  'contacto_emergencia','talla_ropa','talla_pantalon','talla_zapato','id_centro_costo','centro_costo',
  'sede','created_at','profesion','telefono_2','fecha_inicio_contrato','id_area','area','supervisor',
  'nombre_contacto_emergencia','vinculo_contacto_emergencia','telefono_contacto_emergencia','tipo_asistencia'
];

async function main() {
  if (!fs.existsSync(src)) {
    console.error('Source file not found:', src);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(src, 'utf8'));
  const rows = Array.isArray(data.rows) ? data.rows : [];
  console.log('Rows to process:', rows.length);

  console.log('\nIMPORTANT: This script WILL modify the database.');
  console.log('If you want to proceed, re-run with environment variable CONFIRM_APPLY=1');
  console.log('Example (PowerShell): $env:CONFIRM_APPLY=1; node scripts\\apply_listado_claudio_to_db.js\n');
  if (!process.env.CONFIRM_APPLY) {
    console.log('\nAborting: CONFIRM_APPLY not set. No DB changes performed.');
    process.exit(0);
  }

  const client = await getClient();
  const ts = Date.now();
  const backupTable = `mantenimiento.personal_disponible_backup_${ts}`;

  try {
    console.log('Creating backup table:', backupTable);
    await client.query(`CREATE TABLE IF NOT EXISTS ${backupTable} AS TABLE mantenimiento.personal_disponible`);
    console.log('Backup created.');

    // We'll run each upsert individually so a single bad row doesn't abort the whole run
    const insertCols = columns.filter(c => c !== 'id');
    const colList = insertCols.map(c => c).join(', ');
    const placeholders = insertCols.map((_, i) => `$${i+1}`).join(', ');
    const insertSql = `INSERT INTO mantenimiento.personal_disponible (${colList}) VALUES (${placeholders}) ON CONFLICT (rut) DO NOTHING RETURNING rut`;
    const updateCols = insertCols.filter(c => c !== 'rut');
    const updateSet = updateCols.map((c, i) => `${c} = $${i+2}`).join(', '); // $2.. used with rut as first param
    const updateSql = `UPDATE mantenimiento.personal_disponible SET ${updateSet} WHERE rut = $1`;

    let created = 0, updated = 0, errors = [];

    for (const r of rows) {
      try {
        const rut = normalizeRut(r.rut || r.Rut || r.RUT || r['Rut']);
        if (!rut) continue;

        const vals = insertCols.map(col => {
          const raw = r[col] !== undefined ? r[col] : (r[col.toLowerCase()] !== undefined ? r[col.toLowerCase()] : null);
          if (col === 'fecha_nacimiento' || col === 'fecha_inicio_contrato' || col.startsWith('vencimiento')) return normalizeDate(raw);
          if (col === 'created_at') return normalizeDate(raw) || new Date().toISOString();
          if (col === 'estado_id' || col === 'id_centro_costo' || col === 'id_area' || col === 'documentacion_id') {
            const p = prepareValue(raw);
            if (p === null) return null;
            const n = parseInt(String(p).replace(/[^0-9]/g, ''), 10);
            return isNaN(n) ? null : n;
          }
          return prepareValue(raw);
        });

          // ensure required defaults
          const sexoIdx = insertCols.indexOf('sexo');
          if (sexoIdx >= 0 && (vals[sexoIdx] === null || vals[sexoIdx] === undefined)) vals[sexoIdx] = 'N';
          // default estado_id if missing
          const defaultEstado = parseInt(process.env.DEFAULT_ESTADO_ID || '1', 10) || 1;
          const estadoIdx = insertCols.indexOf('estado_id');
          if (estadoIdx >= 0 && (vals[estadoIdx] === null || vals[estadoIdx] === undefined)) vals[estadoIdx] = defaultEstado;

        // first try insert returning rut when inserted
        const insertRes = await client.query(insertSql, vals);
        if (insertRes && insertRes.rows && insertRes.rows.length > 0) {
          created += 1;
          continue;
        }

        // otherwise perform update (build values with rut as first param)
        const updateVals = [rut].concat(updateCols.map(c => {
          const raw = r[c] !== undefined ? r[c] : (r[c.toLowerCase()] !== undefined ? r[c.toLowerCase()] : null);
          if (c === 'fecha_nacimiento' || c === 'fecha_inicio_contrato' || c.startsWith('vencimiento')) return normalizeDate(raw);
          if (c === 'created_at') return normalizeDate(raw) || new Date().toISOString();
          if (c === 'estado_id' || c === 'id_centro_costo' || c === 'id_area' || c === 'documentacion_id') {
            const p = prepareValue(raw);
            if (p === null) {
              if (c === 'estado_id') return defaultEstado;
              return null;
            }
            const n = parseInt(String(p).replace(/[^0-9]/g, ''), 10);
            return isNaN(n) ? (c === 'estado_id' ? defaultEstado : null) : n;
          }
          // sexo default for updates
          if (c === 'sexo') {
            const p = prepareValue(raw);
            return (p === null || p === undefined) ? 'N' : p;
          }
          return prepareValue(raw);
        }));

        const upd = await client.query(updateSql, updateVals);
        if (upd && typeof upd.rowCount === 'number' && upd.rowCount > 0) updated += upd.rowCount;
      } catch (err) {
        errors.push({ row: r.rut || r.Rut, error: String(err && err.message ? err.message : err) });
      }
    }

    console.log(`Import complete. created~${created} updated~${updated} errors~${errors.length}`);
    const reportPath = path.join(__dirname, '..', 'exports', `apply_listado_claudio_report_${ts}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), rows: rows.length, created, updated, errors }, null, 2), 'utf8');
    console.log('Report written to', reportPath);
  } catch (err) {
    console.error('Fatal error during import:', err);
  } finally {
    client.release();
  }
}

main().catch(err => { console.error('Unhandled:', err); process.exit(1); });
