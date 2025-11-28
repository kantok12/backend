const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');
// No external CSV dependency: build CSV manually

const BASE_PATH = 'G:/Unidades compartidas/Unidad de Apoyo/Personal';

function sanitizeFolderName(name) {
  if (!name) return '';
  return name.replace(/[<>:\\"/\\|?*\x00-\x1F]/g, '').trim();
}

async function run() {
  try {
    console.log('🔍 Obteniendo personal desde BD...');
    const result = await query(`SELECT rut, nombres FROM mantenimiento.personal_disponible ORDER BY nombres`);
    const personas = result.rows;

    const records = [];

    for (const p of personas) {
      const nombreCarpeta = `${sanitizeFolderName(p.nombres)} - ${p.rut}`.trim();
      const carpetaPersonal = path.join(BASE_PATH, nombreCarpeta);
      const existe = fs.existsSync(carpetaPersonal);
      records.push({ rut: p.rut, nombres: p.nombres, carpeta: carpetaPersonal, existe });
    }

    const outDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `personal_folders_report_${Date.now()}.csv`);

    // Compose CSV content
    const header = ['RUT','NOMBRES','CARPETA','EXISTE'];
    const lines = [header.join(',')];
    for (const r of records) {
      // Escape quotes by doubling
      const nombresEsc = `"${(r.nombres || '').replace(/"/g, '""')}"`;
      const carpetaEsc = `"${(r.carpeta || '').replace(/"/g, '""')}"`;
      lines.push([r.rut, nombresEsc, carpetaEsc, r.existe ? 'TRUE' : 'FALSE'].join(','));
    }
    fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
    console.log('✅ Reporte CSV generado en:', outPath);
  } catch (err) {
    console.error('Error generando reporte CSV:', err);
    process.exit(1);
  }
}

run();
