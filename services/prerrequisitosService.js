const { query } = require('../config/database');
const { normalizeTipo } = require('../lib/tipoDocumento');

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
    dias_duracion: r.dias_duracion
  }));

  // Build set of required types
  const requiredTypes = [...new Set(prereqs.map(p => p.tipo_norm))];

  if (!ruts || ruts.length === 0) return [];

  // 2. Cargar documentos para los ruts en batch
  // NOTE: some DB schemas may not have an `activo` boolean column on documentos.
  // To avoid "no existe la columna 'activo'" errors we fetch documents by rut
  // and rely on downstream logic (isVencido) to determine validity.
  const docsRes = await query(
    `SELECT * FROM mantenimiento.documentos WHERE rut_persona = ANY($1::text[]) ORDER BY fecha_subida DESC`,
    [ruts]
  );
  const docs = docsRes.rows;

  // Group documents by rut
  const docsByRut = {};
  for (const d of docs) {
    const rut = d.rut_persona;
    if (!docsByRut[rut]) docsByRut[rut] = [];
    docsByRut[rut].push(d);
  }

  // Prepare prereq lookup by tipo_norm
  const prereqByTipo = {};
  for (const p of prereqs) {
    if (!prereqByTipo[p.tipo_norm]) prereqByTipo[p.tipo_norm] = p;
  }

  const results = [];
  for (const rut of ruts) {
    const personDocs = (docsByRut[rut] || []).map(d => {
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
    const matchesAll = requireAll ? (faltantes.length === 0) : (satisfied.size > 0);

    results.push({
      rut,
      matchesAll,
      faltantes,
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
  const docsRes = await query(`SELECT * FROM mantenimiento.documentos WHERE rut_persona = ANY($1::text[]) ORDER BY fecha_subida DESC`, [ruts]);
  const docs = docsRes.rows;
  const docsByRut = {};
  for (const d of docs) {
    const rut = d.rut_persona;
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

  return { message: 'OK', data: results };
}

module.exports = { matchForCliente, isVencido, getPersonasQueCumplen };

