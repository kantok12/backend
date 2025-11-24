const removeDiacritics = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '');

function normalizeTipo(raw) {
  if (!raw) return '';
  let s = raw.toString().toLowerCase();
  s = removeDiacritics(s);
  // replace non-alphanumeric with underscore
  s = s.replace(/[^a-z0-9]+/g, '_');
  // collapse underscores
  s = s.replace(/_+/g, '_');
  // trim
  s = s.replace(/^_+|_+$/g, '');
  return s;
}

function mapAliasTipo(normalized) {
  if (!normalized) return normalized;
  const m = normalized;
  if (/contrato/.test(m)) return 'certificado_laboral';
  if (/(carnet|identidad)/.test(m)) return 'carnet_identidad';
  if (/licencia/.test(m)) return 'licencia_conducir';
  if (/(seguridad|epp|eps)/.test(m)) return 'certificado_seguridad';
  return m;
}

function tiposMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b)) return true;
  if (b.includes(a)) return true;
  return false;
}

module.exports = { normalizeTipo, mapAliasTipo, tiposMatch };
