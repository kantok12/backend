const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function getDbDocuments(rut) {
  const q = `
    SELECT id, nombre_archivo, nombre_documento, tipo_documento, fecha_subida
    FROM mantenimiento.documentos
    WHERE translate(rut_persona, '.', '') = translate($1, '.', '')
    ORDER BY fecha_subida DESC
  `;
  const res = await query(q, [rut]);
  return res.rows;
}

function getDriveFiles(rut) {
  const baseDir = 'G:/Unidades compartidas/Unidad de Apoyo/Personal';
  const result = { documentos: [], cursos_certificaciones: [], folder: null };
  try {
    const dirs = fs.readdirSync(baseDir, { withFileTypes: true }).filter(d => d.isDirectory());
    for (const dir of dirs) {
      if (dir.name.includes(rut)) {
        const userDir = path.join(baseDir, dir.name);
        result.folder = userDir;
        const documentos = path.join(userDir, 'documentos');
        const cursos = path.join(userDir, 'cursos_certificaciones');
        if (fs.existsSync(documentos)) result.documentos = fs.readdirSync(documentos);
        if (fs.existsSync(cursos)) result.cursos_certificaciones = fs.readdirSync(cursos);
        return result;
      }
    }
    return result;
  } catch (err) {
    throw new Error('Error reading drive: ' + err.message);
  }
}

async function diagnose(rut) {
  try {
    const db = await getDbDocuments(rut);
    const drive = getDriveFiles(rut);
    const out = { rut, db_count: db.length, db, drive };
    console.log(JSON.stringify(out, null, 2));
  } catch (err) {
    console.error('Error diagnosing persona:', err.message);
  } finally {
    process.exit(0);
  }
}

const [,, rut] = process.argv;
if (!rut) { console.error('Usage: node diagnose_persona_combined.js <rut>'); process.exit(1); }

diagnose(rut);
