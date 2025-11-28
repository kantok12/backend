const { query } = require('../config/database');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const BASE_PATH = 'G:/Unidades compartidas/Unidad de Apoyo/Personal';

function sanitizeFolderName(name) {
  if (!name) return '';
  return name.replace(/[<>:\\"/\\|?*\x00-\x1F]/g, '').trim();
}

async function ensureFolder(rut, nombres) {
  const nombreCarpeta = `${sanitizeFolderName(nombres)} - ${rut}`.trim();
  const carpetaPersonal = path.join(BASE_PATH, nombreCarpeta);
  try {
    if (!fs.existsSync(carpetaPersonal)) {
      await fsPromises.mkdir(carpetaPersonal, { recursive: true });
      // create subfolders
      const subcarpetas = ['documentos', 'cursos_certificados'];
      for (const sub of subcarpetas) {
        const subPath = path.join(carpetaPersonal, sub);
        if (!fs.existsSync(subPath)) {
          await fsPromises.mkdir(subPath, { recursive: true });
        }
      }
      return { created: true, path: carpetaPersonal };
    }
    return { created: false, path: carpetaPersonal };
  } catch (err) {
    return { error: err.message };
  }
}

async function run() {
  try {
    console.log('🔍 Obteniendo personal desde BD...');
    const result = await query(`SELECT rut, nombres FROM mantenimiento.personal_disponible ORDER BY nombres`);
    const personas = result.rows;
    console.log(`⚙️  Procesando ${personas.length} personas...`);

    const creados = [];
    const existentes = [];
    const fallidos = [];

    for (const p of personas) {
      const res = await ensureFolder(p.rut, p.nombres || '');
      if (res.error) {
        fallidos.push({ person: p, error: res.error });
      } else if (res.created) {
        creados.push({ person: p, path: res.path });
      } else {
        existentes.push({ person: p, path: res.path });
      }
    }

    console.log(`✅ Carpeta(s) creadas: ${creados.length}`);
    console.log(`ℹ️  Carpeta(s) existentes: ${existentes.length}`);
    console.log(`❌ Fallidos: ${fallidos.length}`);

    if (creados.length > 0) console.log('Ejemplos creados:', creados.slice(0,5));
    if (fallidos.length > 0) console.error('Ejemplos fallidos:', fallidos.slice(0,5));

    process.exit(0);
  } catch (err) {
    console.error('Error ejecutando script:', err);
    process.exit(1);
  }
}

run();
