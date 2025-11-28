#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const infile = path.join(__dirname, '..', 'exports', 'listado para claudio.xlsx');
const outfile = path.join(__dirname, '..', 'exports', 'listado_claudio_analysis_full.json');

if (!fs.existsSync(infile)) {
  console.error('Input XLSX not found:', infile);
  process.exit(2);
}

const wb = XLSX.readFile(infile);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

if (!rows || rows.length === 0) {
  console.error('No rows found in sheet');
  process.exit(3);
}

// Find the column that likely contains RUTs: prefer header with 'rut' or 'emplead' or use first col
const headerRow = rows[0].map(c => String(c).trim());
let colIndex = 0;
for (let i = 0; i < headerRow.length; i++) {
  const h = headerRow[i].toLowerCase();
  if (h.includes('rut') || h.includes('emplead') || h.includes('listado')) { colIndex = i; break; }
}

const sampleRows = [];
for (let r = 1; r < rows.length; r++) {
  const cell = rows[r][colIndex];
  const val = (cell === undefined || cell === null) ? '' : String(cell).trim();
  if (!val) continue;
  sampleRows.push({ [headerRow[colIndex] || 'Listado de Empleados']: val });
}

const out = {
  sheetName,
  totalRows: rows.length - 1,
  columns: [headerRow[colIndex] || 'Listado de Empleados'],
  sampleRows
};

fs.writeFileSync(outfile, JSON.stringify(out, null, 2), 'utf8');
console.log('Wrote', outfile, 'rows:', sampleRows.length);
