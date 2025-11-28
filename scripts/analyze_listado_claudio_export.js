const fs = require('fs');
const path = require('path');

function ts() { return Date.now(); }

function normalizeRut(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  // Remove dots and spaces
  s = s.replace(/\./g, '').replace(/\s+/g, '');
  // Ensure dash before check digit
  if (!s.includes('-') && s.length > 1) s = s.slice(0, -1) + '-' + s.slice(-1);
  return s.toUpperCase();
}

function likelyLabel(label, pieces) {
  if (!label) return false;
  const l = String(label).toLowerCase();
  return pieces.some(p => l.includes(p));
}

async function run() {
  // Try known filename, else pick the newest matching "listado" JSON in exports
  const exportsDir = path.join(__dirname, '..', 'exports');
  let srcPath = path.join(exportsDir, 'listado_claudio_full_rows.json');
  if (!fs.existsSync(srcPath)) {
    const candidates = fs.readdirSync(exportsDir)
      .filter(f => f.toLowerCase().endsWith('.json') && f.toLowerCase().includes('listado'))
      .map(f => ({ f, mtime: fs.statSync(path.join(exportsDir, f)).mtime.getTime() }))
      .sort((a,b)=>b.mtime-a.mtime);
    if (candidates.length === 0) {
      console.error('No candidate JSON exports found in', exportsDir);
      process.exit(1);
    }
    srcPath = path.join(exportsDir, candidates[0].f);
    console.log('Auto-selected source JSON:', srcPath);
  }
  const raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  const rows = raw.rows || [];
  if (!rows.length) {
    console.error('No rows found in source');
    process.exit(1);
  }

  // Detect header row: the first row where any cell equals 'Rut' or 'Listado de Empleados' == 'Rut'
  let headerRowIndex = null;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const r = rows[i];
    const vals = Object.values(r).map(v => (v||'').toString().toLowerCase());
    if (vals.includes('rut') || vals.includes('listado de empleados') || vals.includes('r.u.t')) { headerRowIndex = i; break; }
  }
  if (headerRowIndex === null) headerRowIndex = 0; // fallback

  const headerRow = rows[headerRowIndex];
  // Build mapping of keys -> labels
  const mapping = {};
  Object.keys(headerRow).forEach(k => { mapping[k] = headerRow[k]; });

  // identify keys
  const rutKey = Object.keys(mapping).find(k => likelyLabel(mapping[k], ['rut', 'listado de empleados'])) || Object.keys(mapping)[0];
  const nameKey = Object.keys(mapping).find(k => likelyLabel(mapping[k], ['nombre', 'nombres'])) || Object.keys(mapping)[1];
  const shoeKey = Object.keys(mapping).find(k => likelyLabel(mapping[k], ['talla zapato', 'talla zapat', 'talla'])) || null;

  // Process data rows (after headerRowIndex)
  const dataRows = rows.slice(headerRowIndex + 1);
  const processed = [];
  let countName = 0, countShoe = 0;
  dataRows.forEach((r, idx) => {
    const rawRut = r[rutKey];
    const rawName = r[nameKey];
    const rawShoe = shoeKey ? r[shoeKey] : null;
    const normRut = normalizeRut(rawRut);
    const name = rawName ? String(rawName).trim() : null;
    const shoe = rawShoe != null ? String(rawShoe).trim() : null;
    if (name && name !== '') countName++;
    if (shoe && shoe !== '' && shoe !== '-' ) countShoe++;
    processed.push({ row: headerRowIndex + 1 + idx + 1, rut_raw: rawRut, rut: normRut, nombre: name, talla_zapato_raw: rawShoe, talla_zapato: shoe });
  });

  const report = {
    timestamp: new Date().toISOString(),
    source: srcPath,
    row_count: rows.length,
    header_row_index: headerRowIndex,
    detected: { rutKey, nameKey, shoeKey, mapping },
    counts: { rows: dataRows.length, names_present: countName, shoes_present: countShoe },
    samples: processed.slice(0, 40),
    updates_preview: processed.filter(p => p.talla_zapato && p.talla_zapato !== '-').slice(0, 200)
  };

  const outPath = path.join(__dirname, '..', 'exports', `listado_claudio_mapping_${ts()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Mapping report written to', outPath);
  console.log(JSON.stringify({ rows: report.row_count, names_present: report.counts.names_present, shoes_present: report.counts.shoes_present }, null, 2));
  process.exit(0);
}

run();
