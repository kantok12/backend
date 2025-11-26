const { query } = require('../config/database');
const { normalizeTipo } = require('../lib/tipoDocumento');

function normalizeRut(rut) {
  if (!rut) return '';
  return String(rut).replace(/\./g, '').trim();
}

// Helper para determinar si un documento está vencido según reglas
function isVencido(doc, prerrequisito) {
  // doc: object with fecha_vencimiento (Date|null), fecha_subida (Date|null)
  // prerrequisito: object with dias_duracion (int|null)
  const hoy = new Date();

  if (doc.fecha_vencimiento) {
    const fv = new Date(doc.fecha_vencimiento);
    return fv < hoy;
  }

  if (prerrequisito && prerrequisito.dias_duracion) {
    const dias = parseInt(prerrequisito.dias_duracion, 10);
    const fecha = doc.fecha_subida ? new Date(doc.fecha_subida) : null;
    if (!fecha) return false; // si no hay fecha de subida, asumimos válido
    const limite = new Date(fecha.getTime() + dias * 24 * 60 * 60 * 1000);
    return limite < hoy;
  }

  // Si no hay reglas de vigencia, asumimos no vencido
  return false;
}

async function matchForCliente(clienteId, ruts = [], opts = {}) {
  // opts: { requireAll: true/false, includeGlobal: true/false }
  const requireAll = opts.requireAll !== undefined ? opts.requireAll : true;
  const includeGlobal = opts.includeGlobal !== undefined ? opts.includeGlobal : true;

  // 1. Cargar prerrequisitos del cliente (y globales si apply)
  const prereqParams = [clienteId];
  let prereqQuery = `SELECT id, cliente_id, tipo_documento, descripcion, dias_duracion FROM mantenimiento.cliente_prerrequisitos WHERE cliente_id = $1`;
  if (includeGlobal) {
    prereqQuery = `SELECT id, cliente_id, tipo_documento, descripcion, dias_duracion FROM mantenimiento.cliente_prerrequisitos WHERE cliente_id = $1 OR cliente_id IS NULL`;
  }
  const prereqRes = await query(prereqQuery, prereqParams);
  const prereqs = prereqRes.rows.map(r => ({
    id: r.id,
    cliente_id: r.cliente_id,
    tipo_original: r.tipo_documento,
    tipo_norm: normalizeTipo(r.tipo_documento),
    descripcion: r.descripcion,
    dias_duracion: r.dias_duracion
  }));

  // Build set of required types
  const requiredTypes = [...new Set(prereqs.map(p => p.tipo_norm))];

  if (!ruts || (Array.isArray(ruts) && ruts.length === 0) || (!Array.isArray(ruts) && String(ruts).trim() === '')) return [];

  // Normalize ruts to always be an array of strings so we can use ANY($1::text[])
  const rutArray = Array.isArray(ruts) ? ruts : [ruts];
  const rutArrayNorm = rutArray.map(normalizeRut);

  // 2. Cargar documentos para los ruts en batch (comparando rut sin puntos)
  // NOTE: some DB schemas may not have an `activo` boolean column on documentos.
  // To avoid "no existe la columna 'activo'" errors we fetch documents by normalized rut
  // and rely on downstream logic (isVencido) to determine validity.
  const docsRes = await query(
    `SELECT * FROM mantenimiento.documentos WHERE translate(rut_persona, '.', '') = ANY($1::text[]) ORDER BY fecha_subida DESC`,
    [rutArrayNorm]
  );
  const docs = docsRes.rows;

  // Group documents by rut
  const docsByRut = {};
  for (const d of docs) {
    const rut = normalizeRut(d.rut_persona);
    if (!docsByRut[rut]) docsByRut[rut] = [];
    docsByRut[rut].push(d);
  }

  // Prepare prereq lookup by tipo_norm
  const prereqByTipo = {};
  for (const p of prereqs) {
    if (!prereqByTipo[p.tipo_norm]) prereqByTipo[p.tipo_norm] = p;
  }

  const results = [];
  for (const rut of rutArray) {
    const rutNorm = normalizeRut(rut);
    const personDocs = (docsByRut[rutNorm] || []).map(d => {
      const tipoRaw = d.tipo_documento || d.nombre_documento || '';
      const tipo_norm = normalizeTipo(tipoRaw);
      return Object.assign({}, d, { tipo_norm });
    });

    // Determine which required types are satisfied by valid documents
    const satisfied = new Set();
    const documentosResumen = [];

    for (const d of personDocs) {
      const prereq = prereqByTipo[d.tipo_norm] || null;
      const venc = isVencido(d, prereq);
      if (!venc) {
        satisfied.add(d.tipo_norm);
        documentosResumen.push({
          id: d.id,
          tipo_original: d.tipo_documento || d.nombre_documento,
          tipo_normalizado: d.tipo_norm,
          fecha_vencimiento: d.fecha_vencimiento,
          fecha_subida: d.fecha_subida,
          vencido: venc
        });
      } else {
        // include vencido documents also in resumen but mark vencido
        documentosResumen.push({
          id: d.id,
          tipo_original: d.tipo_documento || d.nombre_documento,
          tipo_normalizado: d.tipo_norm,
          fecha_vencimiento: d.fecha_vencimiento,
          fecha_subida: d.fecha_subida,
          vencido: venc
        });
      }
    }

    const faltantes = requiredTypes.filter(t => !satisfied.has(t));
    const required_count = requiredTypes.length;
    // Count how many REQUIRED types are actually satisfied (intersection)
    const provided_count = requiredTypes.filter(t => satisfied.has(t)).length;
    const matchesAll = requireAll ? (faltantes.length === 0) : (provided_count > 0);

    // Build missing_docs with value+label
    const missing_docs = faltantes.map(t => ({
      value: t,
      label: (prereqByTipo[t] && prereqByTipo[t].descripcion) ? prereqByTipo[t].descripcion : t,
      required: true
    }));

    // Determine estado_acreditacion: 'all' | 'some' | 'none'
    let estado_acreditacion = 'none';
    if (provided_count >= required_count) estado_acreditacion = 'all';
    else if (provided_count > 0) estado_acreditacion = 'some';

    results.push({
      rut,
      matchesAll,
      required_count,
      provided_count,
      estado_acreditacion,
      // Compatibilidad: devolver también `faltantes` como array de strings
      faltantes: faltantes,
      missing_docs,
      documentos: documentosResumen
    });
  }

  return results;
}

// Devuelve las personas que cumplen TODOS los prerrequisitos de un cliente
// Opciones: includeGlobal (default true), limit, offset
async function getPersonasQueCumplen(clienteId, opts = {}) {
  const includeGlobal = opts.includeGlobal !== undefined ? opts.includeGlobal : true;
  const limit = opts.limit || 1000;
  const offset = opts.offset || 0;

  // 1. Cargar prerrequisitos
  const prereqQuery = includeGlobal
    ? `SELECT id, cliente_id, tipo_documento, descripcion, dias_duracion FROM mantenimiento.cliente_prerrequisitos WHERE cliente_id = $1 OR cliente_id IS NULL`
    : `SELECT id, cliente_id, tipo_documento, descripcion, dias_duracion FROM mantenimiento.cliente_prerrequisitos WHERE cliente_id = $1`;
  const prereqRes = await query(prereqQuery, [clienteId]);
  const prereqs = prereqRes.rows.map(r => ({
    id: r.id,
    cliente_id: r.cliente_id,
    tipo_original: r.tipo_documento,
    tipo_norm: normalizeTipo(r.tipo_documento),
    dias_duracion: r.dias_duracion
  }));

  const requiredTypes = [...new Set(prereqs.map(p => p.tipo_norm))];
  if (requiredTypes.length === 0) {
    // No hay prerrequisitos -> devolver vacío con mensaje (evita retornar toda la tabla de personal)
    return { message: 'No prerequisites defined for this client', data: [] };
  }

  // 2. Obtener lista de personal considerado "activo" en el esquema existente
  // la tabla `mantenimiento.personal_disponible` usa `estado_id` para indicar el estado
  // (por ejemplo 1 = 'Activo'). Evitamos usar una columna `activo` que no existe.
  const personsRes = await query(
    `SELECT rut, nombres, cargo, zona_geografica FROM mantenimiento.personal_disponible WHERE estado_id = 1 LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const persons = personsRes.rows;
  const ruts = persons.map(p => p.rut);

  if (ruts.length === 0) return { message: 'No personnel found', data: [] };

  // 3. Obtener documentos de estos ruts
  // Avoid referencing a non-existent `activo` column; pull all docs for these ruts
  // and let `isVencido` and `estado_documento` determine eligibility.
  const rutsNorm = ruts.map(normalizeRut);
  const docsRes = await query(`SELECT * FROM mantenimiento.documentos WHERE translate(rut_persona, '.', '') = ANY($1::text[]) ORDER BY fecha_subida DESC`, [rutsNorm]);
  const docs = docsRes.rows;
  const docsByRut = {};
  for (const d of docs) {
    const rut = normalizeRut(d.rut_persona);
    if (!docsByRut[rut]) docsByRut[rut] = [];
    docsByRut[rut].push(d);
  }

  // prepare prereq lookup
  const prereqByTipo = {};
  for (const p of prereqs) {
    if (!prereqByTipo[p.tipo_norm]) prereqByTipo[p.tipo_norm] = p;
  }

  const results = [];
  for (const person of persons) {
    const rut = person.rut;
    const personDocs = (docsByRut[rut] || []).map(d => {
      const tipoRaw = d.tipo_documento || d.nombre_documento || '';
      const tipo_norm = normalizeTipo(tipoRaw);
      return Object.assign({}, d, { tipo_norm });
    });

    const satisfied = new Set();
    const documentosResumen = [];
    for (const d of personDocs) {
      const prereq = prereqByTipo[d.tipo_norm] || null;
      const venc = isVencido(d, prereq);
      if (!venc) satisfied.add(d.tipo_norm);
      documentosResumen.push({ id: d.id, tipo_original: d.tipo_documento || d.nombre_documento, tipo_normalizado: d.tipo_norm, fecha_vencimiento: d.fecha_vencimiento, fecha_subida: d.fecha_subida, vencido: venc });
    }

    const faltantes = requiredTypes.filter(t => !satisfied.has(t));
    if (faltantes.length === 0) {
      results.push({
        persona: person,
        documentos: documentosResumen
      });
    }
  }

  // If some results have missing nombre info, try to batch-fill from personal_disponible
  const missingRuts = results
    .filter(r => r.persona && (!r.persona.nombres || r.persona.nombres.trim() === ''))
    .map(r => r.persona && r.persona.rut)
    .filter(Boolean);

  if (missingRuts.length > 0) {
    try {
      const namesRes = await query(`SELECT rut, nombres, cargo FROM mantenimiento.personal_disponible WHERE rut = ANY($1::text[])`, [missingRuts]);
      const namesMap = {};
      for (const row of namesRes.rows) namesMap[row.rut] = row;

      for (const entry of results) {
        const rut = entry.persona && entry.persona.rut;
        if (rut && (!entry.persona.nombres || entry.persona.nombres.trim() === '')) {
          const p = namesMap[rut];
          if (p) {
            entry.persona.nombres = p.nombres;
            entry.persona.cargo = entry.persona.cargo || p.cargo;
          }
        }
      }
    } catch (e) {
      console.error('❌ Error rellenando nombres faltantes en getPersonasQueCumplenAlgunos:', e.message);
    }
  }

  return { message: 'OK', data: results };
}

// Devuelve las personas que cumplen algunos pero NO todos los prerrequisitos de un cliente
// Opciones: includeGlobal (default true), limit, offset
async function getPersonasQueCumplenAlgunos(clienteId, opts = {}) {
  const includeGlobal = opts.includeGlobal !== undefined ? opts.includeGlobal : true;
  const limit = opts.limit || 1000;
  const offset = opts.offset || 0;

  // 1. Cargar prerrequisitos
  const prereqQuery = includeGlobal
    ? `SELECT id, cliente_id, tipo_documento, descripcion, dias_duracion FROM mantenimiento.cliente_prerrequisitos WHERE cliente_id = $1 OR cliente_id IS NULL`
    : `SELECT id, cliente_id, tipo_documento, descripcion, dias_duracion FROM mantenimiento.cliente_prerrequisitos WHERE cliente_id = $1`;
  const prereqRes = await query(prereqQuery, [clienteId]);
  const prereqs = prereqRes.rows.map(r => ({
    id: r.id,
    tipo: normalizeTipo(r.tipo_documento),
    descripcion: r.descripcion,
    dias_duracion: r.dias_duracion
  }));

  const requiredTypes = [...new Set(prereqs.map(p => p.tipo))];
  if (requiredTypes.length === 0) {
    return { message: 'No prerequisites defined for this client', data: [] };
  }

  // 2. Obtener personal considerado activo
  const personsRes = await query(
    `SELECT rut, nombres, cargo FROM mantenimiento.personal_disponible WHERE estado_id = 1 LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const persons = personsRes.rows;
  const ruts = persons.map(p => p.rut);
  if (ruts.length === 0) return { message: 'No personnel found', data: [] };

  // 3. Obtener documentos de estos ruts
  const rutsNorm = ruts.map(normalizeRut);
  const docsRes = await query(`SELECT * FROM mantenimiento.documentos WHERE translate(rut_persona, '.', '') = ANY($1::text[]) ORDER BY fecha_subida DESC`, [rutsNorm]);
  const docs = docsRes.rows;
  const docsByRut = {};
  for (const d of docs) {
    const rut = normalizeRut(d.rut_persona);
    if (!docsByRut[rut]) docsByRut[rut] = [];
    docsByRut[rut].push({
      tipo: normalizeTipo(d.tipo_documento || d.nombre_documento || ''),
      fecha_vencimiento: d.fecha_vencimiento,
      fecha_subida: d.fecha_subida,
      vencido: isVencido(d, prereqs.find(p => p.tipo === normalizeTipo(d.tipo_documento || d.nombre_documento || '')))
    });
  }

  const results = persons.map(person => {
    const rut = person.rut;
    const documentos = docsByRut[rut] || [];

    const tiposCumplidos = new Set(documentos.filter(d => !d.vencido).map(d => d.tipo));
    const faltantes = requiredTypes.filter(t => !tiposCumplidos.has(t));

    if (tiposCumplidos.size > 0 || faltantes.length > 0) {
      return {
        rut,
        nombres: person.nombres || 'Nombre no disponible',
        cargo: person.cargo || 'Cargo no disponible',
        documentos,
        faltantes
      };
    }
    return null;
  }).filter(Boolean);

  return { message: 'OK', data: results };
}

// Convenience wrapper for single-rut checks used by routes (mach)
async function machForCliente(clienteId, rut, opts = {}) {
  const results = await matchForCliente(clienteId, [rut], opts);
  const r = (results && results[0]) ? results[0] : null;

  // Build persona info (try to enrich from personal_disponible)
  let persona = { rut, nombres: 'Nombre no disponible', cargo: 'Cargo no disponible', zona_geografica: null };
  try {
    const res = await query('SELECT rut, nombres, cargo, zona_geografica FROM mantenimiento.personal_disponible WHERE rut = $1', [rut]);
    if (res && res.rows && res.rows[0]) persona = res.rows[0];
  } catch (e) {
    // ignore enrichment errors
  }

  if (!r) {
    return { success: false, message: 'No data for rut', data: { persona } };
  }

  const cumple = !!r.matchesAll;
  const message = cumple ? 'Match completo' : 'No match - faltan prerrequisitos';

  return {
    success: true,
    message,
    data: {
      persona,
      cumple,
      required_count: r.required_count,
      provided_count: r.provided_count,
      faltantes: r.faltantes,
      missing_docs: r.missing_docs,
      documentos: r.documentos,
      estado_acreditacion: r.estado_acreditacion
    }
  };
}

module.exports = { matchForCliente, machForCliente, isVencido, getPersonasQueCumplen, getPersonasQueCumplenAlgunos };

