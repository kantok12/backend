#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const argv = require('minimist')(process.argv.slice(2), {
  string: ['file', 'out'],
  default: {
    file: path.join(__dirname, '..', 'exports', 'listado para claudio.xlsx'),
    out: path.join(__dirname, '..', 'exports', 'listado_claudio_full_rows.json')
  }
});

const filePath = path.resolve(argv.file);
if (!fs.existsSync(filePath)) {
  console.error('Excel file not found:', filePath);
  process.exit(2);
}

console.log('Reading Excel file:', filePath);
const wb = xlsx.readFile(filePath, { cellDates: true });
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];

// Convert sheet to JSON using the first row as headers. Keep empty cells as null.
const raw = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false });

// Normalize keys: trim whitespace from header names
function normalizeKey(k) {
  if (k === null || k === undefined) return k;
  return String(k).trim();
}

const normalized = raw.map(row => {
  const out = {};
  Object.keys(row).forEach(k => {
    out[normalizeKey(k)] = row[k];
  });
  return out;
});

const outPath = path.resolve(argv.out);
const payload = {
  timestamp: new Date().toISOString(),
  source: filePath,
  sheet: sheetName,
  count: normalized.length,
  rows: normalized
};

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
console.log('Wrote JSON with', normalized.length, 'rows to', outPath);

// Print a small preview to console
const previewCount = Math.min(5, normalized.length);
console.log('Preview (first', previewCount, 'rows):');
for (let i = 0; i < previewCount; i++) console.log(JSON.stringify(normalized[i]));

process.exit(0);
