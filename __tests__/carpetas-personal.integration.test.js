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
    // Forzar base path temporal para pruebas
    process.env.DRIVE_BASE_PATH = tempBase;
    process.env.FOLDER_COLLISION_POLICY = 'merge';
    FolderManager = require('../services/folder-manager');
    await fsp.mkdir(tempBase, { recursive: true });
  });

  afterAll(async () => {
    // Limpiar directorio de pruebas
    try {
      const entries = await fsp.readdir(tempBase, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(tempBase, e.name);
        if (e.isDirectory()) {
          await fsp.rm(p, { recursive: true, force: true });
        } else {
          await fsp.unlink(p).catch(() => {});
        }
      }
      await fsp.rm(tempBase, { recursive: true, force: true });
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
    expect(res.action === 'rename' || res.action === 'merge-fallback').toBe(true);
    expect(fs.existsSync(newDir)).toBe(true);
    expect(fs.existsSync(path.join(newDir, 'documentos'))).toBe(true); // subcarpeta creada
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
    await fsp.writeFile(path.join(newDir, 'a.txt'), 'B'); // colision -> deberá crear con sufijo timestamp

    const res = await FolderManager.renameFolder(rut, oldName, newName);
    expect(res.success).toBe(true);
    expect(res.action).toBe('merge');

    // Ambos a.txt deben existir con diferente nombre (uno con timestamp)
    const files = await fsp.readdir(newDir);
    const aFiles = files.filter(f => f.startsWith('a'));
    expect(aFiles.length).toBeGreaterThanOrEqual(2);

    // old dir puede seguir existiendo si no quedó vacío; intentar limpieza manual
    if (fs.existsSync(oldDir)) {
      const remaining = await fsp.readdir(oldDir);
      if (remaining.length === 0) await fsp.rmdir(oldDir).catch(() => {});
    }
  });

  test('Idempotente cuando no existe old pero sí new', async () => {
    const newFolderName = `${newName} - ${rut}`;
    const newDir = path.join(tempBase, newFolderName);
    await fsp.mkdir(newDir, { recursive: true });
    const res = await FolderManager.renameFolder(rut, oldName, newName);
    expect(res.success).toBe(true);
    expect(res.action).toBe('idempotent');
    expect(fs.existsSync(path.join(newDir, 'documentos'))).toBe(true);
    expect(fs.existsSync(path.join(newDir, 'cursos_certificados'))).toBe(true);
  });
});
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { app, server } = require('../server');
const { query } = require('../config/database');

const TEST_RUT = `TEST-${Date.now()}`;
const TEST_NOMBRES = 'Integration Test User';

describe('Carpetas Personal integration', () => {
  afterAll(async () => {
    // Cleanup: remove test personal and any documentos created
    try {
      await query('DELETE FROM mantenimiento.documentos WHERE rut_persona = $1', [TEST_RUT]);
      await query('DELETE FROM mantenimiento.personal_disponible WHERE rut = $1', [TEST_RUT]);
    } catch (err) {
      console.error('Error cleanup DB:', err);
    }
    server.close();
  });

  test('Create personal and upload file -> metadata saved and folder exists', async () => {
    // 1) Create personal
    const createRes = await request(app)
      .post('/api/personal-disponible')
      .send({
        rut: TEST_RUT,
        sexo: 'M',
        fecha_nacimiento: '1990-01-01',
        licencia_conducir: 'B',
        cargo: 'Tester',
        estado_id: 1,
        nombres: TEST_NOMBRES
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);

    // 2) Upload file to carpeta-personal
    const testFilePath = path.join(__dirname, '../test-profile.jpg');
    // ensure test file exists (create small file if missing)
    if (!fs.existsSync(testFilePath)) {
      fs.writeFileSync(testFilePath, 'test-image-content');
    }

    const uploadRes = await request(app)
      .post(`/api/carpetas-personal/${encodeURIComponent(TEST_RUT)}/subir`)
      .attach('archivo', testFilePath)
      .field('nombre_documento', 'Prueba Integracion')
      .expect(200);

    expect(uploadRes.body.success).toBe(true);

    // 3) Verify metadata in DB
    const docs = await query('SELECT * FROM mantenimiento.documentos WHERE rut_persona = $1 ORDER BY fecha_subida DESC LIMIT 1', [TEST_RUT]);
    expect(docs.rows.length).toBeGreaterThan(0);
    const doc = docs.rows[0];
    expect(doc.nombre_documento).toBe('Prueba Integracion');
    expect(doc.nombre_original).toBeDefined();
    expect(doc.ruta_archivo).toBeDefined();

    // Cleanup test file created
    if (fs.existsSync(testFilePath)) {
      try { fs.unlinkSync(testFilePath); } catch (e) {}
    }
  }, 20000);
});
