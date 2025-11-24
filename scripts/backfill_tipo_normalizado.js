#!/usr/bin/env node
/**
 * Script de backfill para `tipo_normalizado` en mantenimiento.documentos
 * Requiere que config/database.js exporte `query` que use env vars de conexión.
 */
const { query } = require('../config/database');
const { normalizeTipo, mapAliasTipo } = require('../services/prerequisitosUtil');

async function run() {
  console.log('Backfill tipo_normalizado: buscando documentos sin tipo_normalizado...');
  const res = await query("SELECT id, tipo_documento FROM mantenimiento.documentos WHERE tipo_normalizado IS NULL OR tipo_normalizado = ''");
  console.log(`Encontrados ${res.rows.length} documentos`);
  for (const row of res.rows) {
    const raw = row.tipo_documento || '';
    const normalized = mapAliasTipo(normalizeTipo(raw));
    try {
      await query('UPDATE mantenimiento.documentos SET tipo_normalizado = $1 WHERE id = $2', [normalized, row.id]);
      console.log(`id=${row.id} -> ${normalized}`);
    } catch (e) {
      console.error('Error actualizando id=', row.id, e.message);
    }
  }
  console.log('Backfill completado');
}

if (require.main === module) {
  run().catch(e => { console.error(e); process.exit(1); });
}
