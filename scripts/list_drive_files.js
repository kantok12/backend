const fs = require('fs');
const path = require('path');

function list(rut) {
  const baseDir = 'G:/Unidades compartidas/Unidad de Apoyo/Personal';
  try {
    const dirs = fs.readdirSync(baseDir, { withFileTypes: true }).filter(d => d.isDirectory());
    for (const dir of dirs) {
      if (dir.name.includes(rut)) {
        const userDir = path.join(baseDir, dir.name);
        const documentos = path.join(userDir, 'documentos');
        const cursos = path.join(userDir, 'cursos_certificaciones');
        console.log('Found folder:', userDir);
        if (fs.existsSync(documentos)) {
          console.log('\n--- documentos ---');
          fs.readdirSync(documentos).forEach(f => console.log(f));
        } else console.log('\nNo documentos folder');
        if (fs.existsSync(cursos)) {
          console.log('\n--- cursos_certificaciones ---');
          fs.readdirSync(cursos).forEach(f => console.log(f));
        } else console.log('\nNo cursos_certificaciones folder');
        return;
      }
    }
    console.log('No folder found for rut', rut);
  } catch (err) {
    console.error('Error reading drive:', err.message);
  }
}

const [,, rut] = process.argv;
if (!rut) { console.error('Usage: node list_drive_files.js <rut>'); process.exit(1); }
list(rut);
