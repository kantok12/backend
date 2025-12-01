const fs = require('fs');
const path = require('path');

function normalize(r){
  if(!r) return null;
  r = String(r).trim().toUpperCase();
  r = r.replace(/\./g,'');
  r = r.replace(/\s+/g,'');
  return r;
}

const csvPath = path.join(__dirname, '..', 'docs', 'archivos-csv', 'listado para claudio (1).csv');
const dbPath = path.join(__dirname, '..', 'tmp_personal.json');

const csvRaw = fs.readFileSync(csvPath, 'utf8');
const lines = csvRaw.split(/\r?\n/).filter(Boolean);
const csvRuts = new Set();
for(let i=1;i<lines.length;i++){
  const cols = lines[i].split(';');
  const r = normalize(cols[0]);
  if(r) csvRuts.add(r);
}

const dbRaw = fs.readFileSync(dbPath);
let dbJson;
try{
  // detect UTF-16 LE BOM and decode accordingly
  let text;
  if(dbRaw[0] === 0xFF && dbRaw[1] === 0xFE){
    text = dbRaw.toString('utf16le');
  } else {
    text = dbRaw.toString('utf8');
  }
  const firstBrace = text.indexOf('{');
  if(firstBrace > 0) text = text.slice(firstBrace);
  dbJson = JSON.parse(text);
} catch(e){ console.error('Failed to parse tmp_personal.json', e); process.exit(1); }
const dbRuts = new Set();
if(Array.isArray(dbJson.data)){
  for(const p of dbJson.data){
    const r = normalize(p.rut);
    if(r) dbRuts.add(r);
  }
} else {
  console.error('tmp_personal.json missing data array'); process.exit(1);
}

function setDiff(a,b){
  const out = [];
  for(const x of a) if(!b.has(x)) out.push(x);
  out.sort();
  return out;
}

const csvOnly = setDiff(csvRuts, dbRuts);
const dbOnly = setDiff(dbRuts, csvRuts);

console.log('CSV total RUTs:', csvRuts.size);
console.log('DB total RUTs:', dbRuts.size);
console.log('CSV-only count:', csvOnly.length);
console.log('DB-only count:', dbOnly.length);

console.log('\nCSV-only RUTs (present in CSV but NOT in DB):');
console.log(csvOnly.join('\n'));

console.log('\nDB-only RUTs (present in DB but NOT in CSV):');
console.log(dbOnly.join('\n'));

// write results to files
fs.writeFileSync(path.join(__dirname, '..', 'exports', 'ruts_csv_only.txt'), csvOnly.join('\n'));
fs.writeFileSync(path.join(__dirname, '..', 'exports', 'ruts_db_only.txt'), dbOnly.join('\n'));
console.log('\nWrote exports/ruts_csv_only.txt and exports/ruts_db_only.txt');
