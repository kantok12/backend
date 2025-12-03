const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

const BASE_PATH = process.env.DRIVE_BASE_PATH || 'G:\\Unidades compartidas\\Unidad de Apoyo\\Personal';
const COLLISION_POLICY = process.env.FOLDER_COLLISION_POLICY || 'merge'; // merge | skip | error

function sanitizeFolderName(name) {
  if (!name) return '';
  return name.replace(/[<>:\"/\\|?*\x00-\x1F]/g, '').trim();
}

function buildFolderName(nombres, rut) {
  const safe = sanitizeFolderName(nombres || '');
  return `${safe} - ${rut}`.trim();
}

async function ensureSubfolders(dir) {
  const subs = ['documentos', 'cursos_certificados'];
  for (const s of subs) {
    const p = path.join(dir, s);
    try {
      await fsp.access(p);
    } catch {
      await fsp.mkdir(p, { recursive: true });
    }
  }
}

async function ensureFolder(rut, nombres) {
  const folderName = buildFolderName(nombres, rut);
  const dir = path.join(BASE_PATH, folderName);
  try {
    await fsp.access(dir);
  } catch {
    await fsp.mkdir(dir, { recursive: true });
  }
  await ensureSubfolders(dir);
  return { success: true, path: dir };
}

async function mergeFolders(source, target) {
  try {
    await fsp.access(target).catch(async () => {
      await fsp.mkdir(target, { recursive: true });
    });

    const entries = await fsp.readdir(source, { withFileTypes: true });
    for (const e of entries) {
      const src = path.join(source, e.name);
      const dst = path.join(target, e.name);
      if (e.isDirectory()) {
        await mergeFolders(src, dst);
      } else {
        let finalDst = dst;
        if (fs.existsSync(dst)) {
          const ext = path.extname(e.name);
          const base = path.basename(e.name, ext);
          finalDst = path.join(target, `${base}_${Date.now()}${ext}`);
        }
        await fsp.copyFile(src, finalDst);
      }
    }
    // Try remove source if empty
    const after = await fsp.readdir(source);
    if (after.length === 0) {
      await fsp.rmdir(source);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function renameFolder(rut, oldNombres, newNombres) {
  const oldName = buildFolderName(oldNombres, rut);
  const newName = buildFolderName(newNombres, rut);

  if (oldName === newName) {
    const dir = path.join(BASE_PATH, newName);
    await ensureSubfolders(dir).catch(() => {});
    return { success: true, action: 'noop', path: dir };
  }

  const oldDir = path.join(BASE_PATH, oldName);
  const newDir = path.join(BASE_PATH, newName);

  const oldExists = fs.existsSync(oldDir);
  const newExists = fs.existsSync(newDir);

  if (oldExists && !newExists) {
    try {
      await fsp.rename(oldDir, newDir);
      await ensureSubfolders(newDir);
      return { success: true, action: 'rename', path: newDir };
    } catch (err) {
      // Fallback to merge
      const m = await mergeFolders(oldDir, newDir);
      await ensureSubfolders(newDir).catch(() => {});
      return { success: !!m.success, action: 'merge-fallback', path: newDir, warnings: m.success ? undefined : m.error };
    }
  }

  if (oldExists && newExists) {
    if (COLLISION_POLICY === 'merge') {
      const m = await mergeFolders(oldDir, newDir);
      await ensureSubfolders(newDir).catch(() => {});
      return { success: !!m.success, action: 'merge', path: newDir, warnings: m.success ? undefined : m.error };
    }
    if (COLLISION_POLICY === 'skip') {
      await ensureSubfolders(newDir).catch(() => {});
      return { success: true, action: 'skip', path: newDir, warnings: 'target already exists' };
    }
    return { success: false, action: 'error', path: newDir, warnings: 'target already exists' };
  }

  if (!oldExists && newExists) {
    await ensureSubfolders(newDir).catch(() => {});
    return { success: true, action: 'idempotent', path: newDir };
  }

  // Neither exists -> create new
  const res = await ensureFolder(rut, newNombres);
  return { ...res, action: 'create' };
}

// Buscar carpeta existente por RUT independientemente del nombre actual
async function findFolderByRut(rut) {
  try {
    const entries = await fsp.readdir(BASE_PATH, { withFileTypes: true });
    const suffix = ` - ${rut}`;
    for (const e of entries) {
      if (e.isDirectory() && e.name.endsWith(suffix)) {
        const dir = path.join(BASE_PATH, e.name);
        return { success: true, path: dir, folderName: e.name };
      }
    }
    return { success: false, message: 'not-found' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

module.exports = {
  BASE_PATH,
  sanitizeFolderName,
  buildFolderName,
  ensureSubfolders,
  ensureFolder,
  renameFolder,
  findFolderByRut,
};
