const { query } = require('../config/database');
const { normalizeTipo, mapAliasTipo, tiposMatch } = require('./prerequisitosUtil');

async function getRequisitosForCliente(clienteId) {
  const r = await query(`
    SELECT tipo_documento, obligatorio, dias_validez
    FROM mantenimiento.prerrequisitos_clientes
    WHERE cliente_id = $1
  `, [clienteId]);
  return r.rows;
}

async function getDocumentosForRut(rut) {
  const r = await query(`
    SELECT id, tipo_documento, coalesce(tipo_normalizado, '') as tipo_normalizado, fecha_vencimiento, fecha_subida
    , (fecha_vencimiento IS NOT NULL AND fecha_vencimiento < now()) as vencido
    FROM mantenimiento.documentos
    WHERE rut_persona = $1 AND activo = true
  `, [rut]);
  return r.rows;
}

function normalizeDocRecord(doc) {
  const tipo = (doc.tipo_normalizado && doc.tipo_normalizado.trim()) ? doc.tipo_normalizado : (doc.tipo_documento || '');
  const normalized = normalizeTipo(tipo);
  const aliased = mapAliasTipo(normalized);
  return { ...doc, tipo_normalizado_computed: aliased };
}

async function matchForRut(clienteId, rut) {
  if (!clienteId || !rut) throw new Error('clienteId and rut required');
  const requisitos = await getRequisitosForCliente(clienteId);
  const requisitosUsados = requisitos.length ? requisitos : [
    { tipo_documento: 'licencia_conducir', obligatorio: true, dias_validez: 365 },
    { tipo_documento: 'certificado_seguridad', obligatorio: true, dias_validez: 365 }
  ];

  const docs = await getDocumentosForRut(rut);
  const docsNorm = docs.map(normalizeDocRecord).filter(d => !d.vencido);

  // Normalize requisitos
  const reqNormalized = requisitosUsados.map(r => mapAliasTipo(normalizeTipo(r.tipo_documento)));

  const matched = [];
  const faltantes = [];
  const documentos_validos = [];

  for (const req of reqNormalized) {
    const found = docsNorm.find(d => tiposMatch(d.tipo_normalizado_computed, req));
    if (found) {
      matched.push(req);
      documentos_validos.push(found);
    } else {
      faltantes.push(req);
    }
  }

  const result = {
    rut,
    clienteId: Number(clienteId),
    cumple: faltantes.length === 0,
    required_count: reqNormalized.length,
    provided_count: matched.length,
    faltantes,
    missing_docs: faltantes.map(t => ({ tipo: t, label: t })),
    documentos_validos,
    timestamp: new Date().toISOString()
  };

  return result;
}

async function matchBatch(clienteId, ruts, limit = 250) {
  if (!Array.isArray(ruts)) throw new Error('ruts must be array');
  if (ruts.length > limit) {
    const err = new Error('Payload too large');
    err.code = 'PAYLOAD_TOO_LARGE';
    throw err;
  }

  const results = [];
  // Process in controlled parallelism (batch size 20)
  const batchSize = 20;
  for (let i = 0; i < ruts.length; i += batchSize) {
    const slice = ruts.slice(i, i + batchSize);
    const promises = slice.map(r => matchForRut(clienteId, r));
    const partial = await Promise.all(promises);
    results.push(...partial);
  }
  return results;
}

async function matchForCliente(clienteId, rutsOrSingle, options = {}) {
  // If a single string rut provided via routes, accept it
  if (typeof rutsOrSingle === 'string') {
    return [await matchForRut(clienteId, rutsOrSingle)];
  }
  if (!Array.isArray(rutsOrSingle)) {
    throw new Error('ruts must be array or string');
  }
  const limit = options.limit || 250;
  return await matchBatch(clienteId, rutsOrSingle, limit);
}

module.exports = { matchForRut, matchBatch, matchForCliente };

async function getPersonasQueCumplen(clienteId, options = {}) {
  // Naive implementation: paginate over `mantenimiento.personal_disponible` and use matchForRut
  const limit = options.limit || 1000;
  const offset = options.offset || 0;
  // Fetch RUTs from personal_disponible
  const r = await query(`SELECT rut FROM mantenimiento.personal_disponible ORDER BY nombres LIMIT $1 OFFSET $2`, [limit, offset]);
  const ruts = r.rows.map(row => row.rut);
  const results = [];
  for (const rut of ruts) {
    try {
      const match = await matchForRut(clienteId, rut);
      if (match && match.cumple) results.push(match);
    } catch (e) {
      console.warn('Error matching rut in getPersonasQueCumplen:', rut, e.message);
    }
  }
  return { message: 'OK', data: results };
}

module.exports.getPersonasQueCumplen = getPersonasQueCumplen;
