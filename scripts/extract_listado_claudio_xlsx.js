const Excel = require('exceljs');
const fs = require('fs');
const path = require('path');

async function run() {
  const exportsDir = path.join(__dirname, '..', 'exports');
  const xlsxName = 'listado para claudio.xlsx';
  const xlsxPath = path.join(exportsDir, xlsxName);
  if (!fs.existsSync(xlsxPath)) {
    console.error('Excel source not found:', xlsxPath);
    process.exit(1);
  }

  const wb = new Excel.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const sheet = wb.getWorksheet('Listado') || wb.worksheets[0];
  if (!sheet) {
    console.error('No worksheet found in workbook');
    process.exit(1);
  }

  // Build header keys from first row
  const headerRow = sheet.getRow(1);
  const headerKeys = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const val = (cell.value === null || cell.value === undefined) ? null : String(cell.value).trim();
    if (val && val !== '') headerKeys[colNumber] = val;
    else headerKeys[colNumber] = colNumber === 1 ? 'Listado de Empleados' : `__EMPTY${colNumber-1}`;
  });

  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const obj = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = headerKeys[colNumber] || `__EMPTY${colNumber-1}`;
      let value = cell.value;
      if (value && typeof value === 'object' && value.text) value = value.text;
      if (value === undefined) value = null;
      if (value !== null) value = String(value).trim();
      obj[key] = value === '' ? null : value;
    });
    rows.push(obj);
  });

  const out = {
    timestamp: new Date().toISOString(),
    source: xlsxPath,
    sheet: sheet.name,
    count: rows.length,
    rows
  };

  const outPath = path.join(exportsDir, 'listado_claudio_full_rows.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', outPath, 'rows:', rows.length);
}

run().catch(err => { console.error(err); process.exit(1); });
