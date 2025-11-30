#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { query, closePool } = require('../config/database');

// Este script genera un CSV con sugerencias de mapeo entre tipos detectados
// en clientes_prerrequisitos y documentos, para ayudar a crear la tabla de mapeo semántico.

async function generate() {
  try {
    console.log('🔍 Generando sugerencias de tipo_normalizado...');

    const q = `
      SELECT 'prerrequisito' as source, id, tipo_documento as original,
             mantenimiento.normalize_text(tipo_documento) as normalized
      FROM mantenimiento.cliente_prerrequisitos
      UNION ALL
      SELECT 'documento' as source, id, nombre_documento as original,
             mantenimiento.normalize_text(nombre_documento) as normalized
      FROM mantenimiento.documentos
      ORDER BY normalized, source;
    `;

    const res = await query(q);
    const rows = res.rows;

    const outDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g,'-');
    const outPath = path.join(outDir, `tipo_normalizado_suggestions_${ts}.csv`);

    const header = 'source,id,original,normalized\n';
    const csv = rows.map(r => {
      // Escape quotes
      const orig = (r.original || '').replace(/"/g, '""');
      return `${r.source},${r.id},"${orig}",${r.normalized}`;
    }).join('\n');

    fs.writeFileSync(outPath, header + csv);
    console.log('✅ Suggestions CSV creado en:', outPath);

  } catch (err) {
    console.error('❌ Error generando sugerencias:', err.message);
  } finally {
    await closePool();
  }
}

if (require.main === module) generate();
