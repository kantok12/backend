const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'exports', 'listado_claudio_full_rows_db_ready.json');
const out = path.join(__dirname, '..', 'exports', 'listado_claudio_full_rows_db_ready_filtered.json');

function normalizeRut(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;
  if (/^rut$/i.test(s)) return null;
  if (/listado/i.test(s)) return null;
  s = s.replace(/[.\s]/g, '');
  if (!/-/.test(s) && s.length > 1) s = s.slice(0, -1) + '-' + s.slice(-1);
  s = s.replace(/k$/i, 'K');
  // basic RUT validation: digits + '-' + digit|K
  if (!/^[0-9]+-[0-9Kk]$/.test(s)) return null;
  return s;
}

function main() {
  if (!fs.existsSync(src)) {
    console.error('Source not found:', src);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(src, 'utf8'));
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const filtered = rows.filter(r => {
    const rut = normalizeRut(r.rut || r.Rut || r.RUT || r["Rut"]);
    return !!rut;
  }).map(r => r);

  const outData = { timestamp: new Date().toISOString(), source: data.source, count: filtered.length, rows: filtered };
  fs.writeFileSync(out, JSON.stringify(outData, null, 2), 'utf8');
  console.log('Wrote filtered JSON:', out, 'rows:', filtered.length);
}

if (require.main === module) main();
