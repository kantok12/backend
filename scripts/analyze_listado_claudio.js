const fs = require('fs');
const path = require('path');
const Excel = require('exceljs');

async function analyze() {
  const filePath = path.join(__dirname, '..', 'exports', 'listado para claudio.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error('Archivo no encontrado:', filePath);
    process.exit(1);
  }

  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    console.error('No se encontró hoja en el archivo.');
    process.exit(1);
  }

  // Read rows and headers
  const rows = [];
  let headers = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const values = row.values; // note: values[0] is null
    // first non-empty row we'll treat as header if values are strings
    if (rowNumber === 1) {
      // try to detect header: if many strings, use as header
      const candidate = values.slice(1).map(v => (v === null || v === undefined) ? '' : String(v).trim());
      const strings = candidate.filter(c => c.length > 0).length;
      if (strings >= 1) {
        headers = candidate.map(h => h || `column_${candidate.indexOf(h)+1}`);
        return; // skip header as data row
      }
    }
    // if headers empty, create generic headers based on column count
    if (headers.length === 0) {
      const count = values.length - 1;
      headers = [];
      for (let i = 0; i < count; i++) headers.push(`col_${i+1}`);
    }

    const obj = {};
    for (let i = 1; i <= headers.length; i++) {
      const key = headers[i-1] || `col_${i}`;
      const raw = values[i];
      obj[key] = (raw === null || raw === undefined) ? null : (typeof raw === 'string' ? raw.trim() : raw);
    }
    rows.push(obj);
  });

  const totalRows = rows.length;
  const columns = headers.slice();

  const columnStats = {};
  for (const col of columns) {
    columnStats[col] = { nonEmpty: 0, empty: 0, uniques: new Map() };
  }

  for (const r of rows) {
    for (const col of columns) {
      const v = r[col];
      if (v === null || v === '') columnStats[col].empty++;
      else {
        columnStats[col].nonEmpty++;
        const key = String(v);
        columnStats[col].uniques.set(key, (columnStats[col].uniques.get(key) || 0) + 1);
      }
    }
  }

  // Summarize uniques and duplicates
  const summaryColumns = {};
  for (const col of columns) {
    const stat = columnStats[col];
    const uniquesCount = stat.uniques.size;
    // top values
    const top = Array.from(stat.uniques.entries()).sort((a,b) => b[1]-a[1]).slice(0,10).map(([value,count]) => ({ value, count }));
    const duplicates = top.filter(t => t.count > 1);
    summaryColumns[col] = {
      nonEmpty: stat.nonEmpty,
      empty: stat.empty,
      uniques: uniquesCount,
      topValues: top,
      duplicateSamples: duplicates
    };
  }

  // Detect candidate identifier columns (e.g., rut, id, documento)
  const candIdCols = columns.filter(c => /rut|dni|id|documento|codigo|email/i.test(c));
  const duplicateReports = {};
  for (const col of candIdCols.length ? candIdCols : columns) {
    const map = columnStats[col].uniques;
    const dups = Array.from(map.entries()).filter(([v,c]) => c > 1).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([v,c]) => ({ value: v, count: c }));
    if (dups.length) duplicateReports[col] = dups;
  }

  // Rows with any missing critical fields: detect columns with low empty proportion and consider them critical
  const criticalCols = columns.filter(col => summaryColumns[col].empty / Math.max(1, totalRows) < 0.2 && summaryColumns[col].nonEmpty > 0);
  const rowsWithMissing = [];
  for (let i=0;i<rows.length;i++) {
    const r = rows[i];
    const missing = criticalCols.filter(c => r[c] === null || r[c] === '');
    if (missing.length) rowsWithMissing.push({ row: i+1, missingCols: missing, data: r });
    if (rowsWithMissing.length >= 20) break;
  }

  const report = {
    file: filePath,
    totalRows,
    totalColumns: columns.length,
    columns,
    summaryColumns,
    candidateIdColumns: candIdCols,
    duplicateReports,
    criticalCols,
    sampleRows: rows.slice(0,10),
    rowsWithMissingSample: rowsWithMissing
  };

  const outPath = path.join(__dirname, '..', 'exports', 'listado_claudio_analysis.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Análisis completado. Reporte guardado en:', outPath);
  console.log(`Filas: ${totalRows}, Columnas: ${columns.length}`);
  console.log('Columnas detectadas:', columns.join(', '));
  if (Object.keys(duplicateReports).length) {
    console.log('Se detectaron duplicados en estas columnas (muestra):', Object.keys(duplicateReports).join(', '));
  } else {
    console.log('No se detectaron duplicados relevantes en columnas candidatas.');
  }
}

analyze().catch(err => {
  console.error('Error en análisis:', err);
  process.exit(1);
});
