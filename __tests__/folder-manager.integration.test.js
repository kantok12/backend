const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

describe('Integración: FolderManager renombrado y merge', () => {
  const rut = 'TEST-RUT-123';
  const oldName = 'Nombre Antiguo';
  const newName = 'Nombre Nuevo';
  const tempBase = path.join(__dirname, '..', 'uploads', 'folders-test');

  let FolderManager;

  beforeAll(async () => {
    process.env.DRIVE_BASE_PATH = tempBase;
    process.env.FOLDER_COLLISION_POLICY = 'merge';
    FolderManager = require('../services/folder-manager');
    await fsp.mkdir(tempBase, { recursive: true });
  });

  afterAll(async () => {
    try {
      const entries = await fsp.readdir(tempBase, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(tempBase, e.name);
        await fsp.rm(p, { recursive: true, force: true }).catch(() => {});
      }
      await fsp.rm(tempBase, { recursive: true, force: true }).catch(() => {});
    } catch (_) {}
  });

  test('Renombra carpeta cuando existe old y no existe new', async () => {
    const oldFolderName = `${oldName} - ${rut}`;
    const newFolderName = `${newName} - ${rut}`;
    const oldDir = path.join(tempBase, oldFolderName);
    const newDir = path.join(tempBase, newFolderName);

    await fsp.mkdir(oldDir, { recursive: true });
    await fsp.writeFile(path.join(oldDir, 'documentos.txt'), 'doc');

    const res = await FolderManager.renameFolder(rut, oldName, newName);
    expect(res.success).toBe(true);
    expect(['rename', 'merge-fallback']).toContain(res.action);
    expect(fs.existsSync(newDir)).toBe(true);
    expect(fs.existsSync(path.join(newDir, 'documentos'))).toBe(true);
    expect(fs.existsSync(oldDir)).toBe(false);
  });

  test('Fusiona contenido cuando both existen (collision)', async () => {
    const oldFolderName = `${oldName} - ${rut}`;
    const newFolderName = `${newName} - ${rut}`;
    const oldDir = path.join(tempBase, oldFolderName);
    const newDir = path.join(tempBase, newFolderName);

    await fsp.mkdir(oldDir, { recursive: true });
    await fsp.mkdir(newDir, { recursive: true });
    await fsp.writeFile(path.join(oldDir, 'a.txt'), 'A');
    await fsp.writeFile(path.join(newDir, 'a.txt'), 'B');

    const res = await FolderManager.renameFolder(rut, oldName, newName);
    expect(res.success).toBe(true);
    expect(res.action).toBe('merge');

    const files = await fsp.readdir(newDir);
    const aFiles = files.filter(f => f.startsWith('a'));
    expect(aFiles.length).toBeGreaterThanOrEqual(2);
  });

  test('Idempotente cuando no existe old pero sí new', async () => {
    const newFolderName = `${newName} - ${rut}`;
    const newDir = path.join(tempBase, newFolderName);
    const oldFolderName = `${oldName} - ${rut}`;
    const oldDir = path.join(tempBase, oldFolderName);
    await fsp.rm(oldDir, { recursive: true, force: true }).catch(() => {});
    await fsp.mkdir(newDir, { recursive: true });
    const res = await FolderManager.renameFolder(rut, oldName, newName);
    expect(res.success).toBe(true);
    expect(['idempotent', 'skip']).toContain(res.action);
    expect(fs.existsSync(path.join(newDir, 'documentos'))).toBe(true);
    expect(fs.existsSync(path.join(newDir, 'cursos_certificados'))).toBe(true);
  });
});
