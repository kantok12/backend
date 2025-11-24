const { query } = require('../config/database');

describe('Check Personal Disponible Data', () => {
  test('Verify if names and cargos exist for all active personnel', async () => {
    const result = await query(
      `SELECT rut, nombres, cargo FROM mantenimiento.personal_disponible WHERE estado_id = 1`
    );

    const missingData = result.rows.filter(row => !row.nombres || !row.cargo);

    console.log('Missing Data:', missingData);

    expect(missingData.length).toBe(0);
  });
});