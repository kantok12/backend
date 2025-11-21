// Helpers para normalización y mapeo de tipos de documento
const DEFAULT_TYPE = 'otro';

function normalizeKey(input) {
  if (!input) return '';
  // Lowercase
  let s = String(input).toLowerCase();
  // Remove diacritics
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Replace non-alphanumeric by space
  s = s.replace(/[^a-z0-9]+/g, ' ').trim();
  // Remove common stopwords that interfere with mapping (e.g., 'de', 'del', 'la')
  s = s.replace(/\b(de|del|la|el|los|las|y|para|por)\b/g, ' ');
  // Collapse spaces
  s = s.replace(/\s+/g, ' ');
  return s;
}

const MAP = {
  // seguridad / EPP
  'epp': 'certificado_seguridad',
  'implementos de proteccion personal': 'certificado_seguridad',
  'implementos de proteccion': 'certificado_seguridad',
  'implementos proteccion': 'certificado_seguridad',
  'eps': 'certificado_seguridad',
  'entrega de epp': 'certificado_seguridad',

  // cursos / certificaciones
  'curso': 'certificado_curso',
  'certificado curso': 'certificado_curso',
  'certificacion': 'certificado_curso',
  'certificacion curso': 'certificado_curso',
  'diploma': 'certificado_curso',

  // licencia
  'licencia': 'licencia_conducir',
  'licencia conducir': 'licencia_conducir',

  // documento identidad
  'dni': 'carnet_identidad',
  'cedula': 'carnet_identidad',
  'cedula identidad': 'carnet_identidad',
  'carnet identidad': 'carnet_identidad',

  // otros
  'certificado medico': 'certificado_medico',
  'certificado laboral': 'certificado_laboral'
};

function mapTipo(key) {
  if (!key) return DEFAULT_TYPE;
  const k = normalizeKey(key);
  if (MAP[k]) return MAP[k];
  // try to match words
  for (const pat in MAP) {
    if (k.includes(pat)) return MAP[pat];
  }
  return DEFAULT_TYPE;
}

function normalizeTipo(input) {
  if (!input) return DEFAULT_TYPE;
  return mapTipo(input);
}

module.exports = { normalizeKey, mapTipo, normalizeTipo };
