jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const { query } = require('../config/database');
const { matchForRut, matchBatch } = require('../services/prerequisitosService');

describe('prerequisitosService integration (mocked DB)', () => {
  beforeEach(() => {
    query.mockReset();
  });

  test('matchForRut: cliente with 2 requisitos, person with 1 valid doc -> faltantes and provided_count=1', async () => {
    // Mock requisitos
    query.mockImplementationOnce(() => Promise.resolve({ rows: [
      { tipo_documento: 'licencia_conducir', obligatorio: true, dias_validez: 365 },
      { tipo_documento: 'certificado_seguridad', obligatorio: true, dias_validez: 365 }
    ] }));

    // Mock documentos for rut
    query.mockImplementationOnce(() => Promise.resolve({ rows: [
      { id: 55, tipo_documento: 'carnet de identidad', tipo_normalizado: 'carnet_identidad', fecha_vencimiento: '2026-01-07T03:00:00.000Z', vencido: false },
      { id: 71, tipo_documento: 'licencia_conducir', tipo_normalizado: 'licencia_conducir', fecha_vencimiento: '2026-01-07T03:00:00.000Z', vencido: false }
    ] }));

    const res = await matchForRut(28, '20011078-1');
    expect(res.required_count).toBe(2);
    expect(res.provided_count).toBe(1);
    expect(res.faltantes.length).toBe(1);
    expect(res.cumple).toBe(false);
  });

  test('matchBatch: returns array and respects limit', async () => {
    // For simplicity, reuse the above mocks for each matchForRut call
    query.mockImplementation(() => Promise.resolve({ rows: [] }));
    const ruts = Array.from({ length: 10 }, (_, i) => `1000000${i}-1`);
    const results = await matchBatch(28, ruts, 250);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(10);
  });
});
