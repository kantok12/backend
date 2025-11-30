#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { query, closePool } = require('../config/database');

async function populate() {
  try {
    console.log('🔍 Poblando tipo_normalizado en tablas existentes...');

    // 1) Poblar mantenimiento.documentos
    const updDocs = await query(
      `UPDATE mantenimiento.documentos
       SET tipo_normalizado = mantenimiento.normalize_text(nombre_documento)
       WHERE tipo_normalizado IS NULL OR tipo_normalizado = '' RETURNING id, tipo_normalizado`);
    console.log(`✅ Documentos actualizados: ${updDocs.rowCount}`);

    // 2) Poblar mantenimiento.cliente_prerrequisitos
    const updPre = await query(
      `UPDATE mantenimiento.cliente_prerrequisitos
       SET tipo_normalizado = mantenimiento.normalize_text(tipo_documento)
       WHERE tipo_normalizado IS NULL OR tipo_normalizado = '' RETURNING id, tipo_normalizado`);
    console.log(`✅ Prerrequisitos actualizados: ${updPre.rowCount}`);

    // 3) Reportar valores distintos para validar
    const docsDistinct = await query(`SELECT DISTINCT tipo_normalizado FROM mantenimiento.documentos ORDER BY tipo_normalizado NULLS LAST`);
    const preDistinct = await query(`SELECT DISTINCT tipo_normalizado FROM mantenimiento.cliente_prerrequisitos ORDER BY tipo_normalizado NULLS LAST`);

    const outDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g,'-');

    fs.writeFileSync(path.join(outDir, `documentos_tipo_normalizado_${ts}.txt`), docsDistinct.rows.map(r => r.tipo_normalizado).join('\n'));
    fs.writeFileSync(path.join(outDir, `prerrequisitos_tipo_normalizado_${ts}.txt`), preDistinct.rows.map(r => r.tipo_normalizado).join('\n'));

    console.log('📁 Archivos con valores únicos escritos en /exports');

  } catch (err) {
    console.error('❌ Error poblando tipo_normalizado:', err.message);
  } finally {
    await closePool();
  }
}

if (require.main === module) populate();
