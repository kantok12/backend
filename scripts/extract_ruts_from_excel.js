const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function normalizeRut(s) {
  if (!s && s !== 0) return null;
  let str = String(s).trim();
  // remove spaces
  str = str.replace(/\s+/g, '');
  // remove dots
  str = str.replace(/\./g, '');
  // ensure hyphen before verifier if missing (rare)
  // if last char is digit or K and there is no hyphen, insert before last char
  if (!str.includes('-') && str.length > 1) {
    str = str.slice(0, -1) + '-' + str.slice(-1);
  }
  return str.toUpperCase();
}

function isRutLike(s) {
  if (!s) return false;
  const normalized = normalizeRut(s);
  return /^[0-9]{1,9}-[0-9K]$/.test(normalized);
}

function extractRutsFromWorkbook(filePath) {
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheetNames = wb.SheetNames;
  const found = new Set();

  for (const name of sheetNames) {
    const ws = wb.Sheets[name];
    const range = ws['!ref'];
    if (!range) continue;
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false });
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (!cell && cell !== 0) continue;
        const text = String(cell).trim();
        if (isRutLike(text)) {
          found.add(normalizeRut(text));
          continue;
        }
        // check if cell contains a rut within text
        const matches = text.match(/([0-9\.\s]{3,12}-[0-9Kk])/g);
        if (matches) {
          for (const m of matches) {
            if (isRutLike(m)) found.add(normalizeRut(m));
            else {
              const cleaned = m.replace(/\s+/g, '').replace(/\./g, '').toUpperCase();
              if (/^[0-9]{1,9}-[0-9K]$/.test(cleaned)) found.add(cleaned);
            }
          }
        }
      }
    }
  }
  return Array.from(found);
}

(async function(){
  try {
    const arg = process.argv[2] || 'docs/archivos-csv/listado para claudio (1).xlsx';
    const filePath = path.resolve(arg);
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      process.exit(2);
    }

    const ruts = extractRutsFromWorkbook(filePath);
    // sort by numeric part
    ruts.sort((a,b)=>{
      const an = a.replace(/[^0-9]/g,'');
      const bn = b.replace(/[^0-9]/g,'');
      if (an.length !== bn.length) return an.length - bn.length;
      return an.localeCompare(bn, undefined, {numeric: true});
    });

    // print one per line
    for (const r of ruts) console.log(r);
    console.error(`\nExtracted ${ruts.length} unique RUTs from ${filePath}`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
