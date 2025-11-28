const fs = require('fs');
const path = require('path');

function ts() { return Date.now(); }

const exportsDir = path.join(__dirname, '..', 'exports');
const srcName = 'listado_claudio_full_rows.json';
const srcPath = path.join(exportsDir, srcName);
if (!fs.existsSync(srcPath)) {
  console.error('Source JSON not found:', srcPath);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const rows = raw.rows || [];
if (rows.length < 2) {
  console.error('Not enough rows to detect header');
  process.exit(1);
}

// Header is usually the second row (index 1) after a possible title row.
const headerRow = rows[1];

// Build mapping from original keys to header labels (use label if present, else keep original key)
const mapping = {};
Object.keys(headerRow).forEach(k => {
  const label = headerRow[k];
  if (label && String(label).trim() !== '') mapping[k] = String(label).trim();
  else mapping[k] = k;
});

// If the first column key is 'Listado de Empleados' label in headerRow["Listado de Empleados"] may be 'Rut'
if (headerRow['Listado de Empleados'] && String(headerRow['Listado de Empleados']).toLowerCase().includes('rut')) {
  mapping['Listado de Empleados'] = 'Rut';
}

// Apply mapping to all rows
const renamedRows = rows.map(r => {
  const out = {};
  Object.keys(r).forEach(k => {
    const newKey = mapping[k] || k;
    out[newKey] = r[k];
  });
  return out;
});

// Write backup of original
const backupPath = path.join(exportsDir, `${srcName.replace('.json','')}_bak_${ts()}.json`);
fs.copyFileSync(srcPath, backupPath);

const outName = 'listado_claudio_full_rows_renamed.json';
const outPath = path.join(exportsDir, outName);
const outObj = Object.assign({}, raw, { rows: renamedRows });
fs.writeFileSync(outPath, JSON.stringify(outObj, null, 2), 'utf8');

console.log('Wrote renamed JSON to', outPath);
console.log('Backup of original at', backupPath);
console.log('Sample mapping:', Object.entries(mapping).slice(0,10));
