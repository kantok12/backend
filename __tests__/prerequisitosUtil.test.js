const { normalizeTipo, mapAliasTipo, tiposMatch } = require('../services/prerequisitosUtil');

describe('prerequisitosUtil', () => {
  test('normalizeTipo removes accents and non-alphanum', () => {
    expect(normalizeTipo('CARNÉ de Identidad')).toBe('carne_de_identidad');
    expect(normalizeTipo('Licencia-Conducir')).toBe('licencia_conducir');
  });

  test('mapAliasTipo maps known patterns', () => {
    expect(mapAliasTipo('contrato')).toBe('certificado_laboral');
    expect(mapAliasTipo('mi_licencia')).toBe('licencia_conducir');
    expect(mapAliasTipo('identidad')).toBe('carnet_identidad');
  });

  test('tiposMatch equality and inclusion', () => {
    expect(tiposMatch('licencia_conducir', 'licencia_conducir')).toBe(true);
    expect(tiposMatch('certificado_seguridad', 'seguridad')).toBe(true);
    expect(tiposMatch('otro_tipo', 'no_match')).toBe(false);
  });
});
