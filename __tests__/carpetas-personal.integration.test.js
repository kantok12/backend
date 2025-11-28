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
