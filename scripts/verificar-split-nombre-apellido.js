const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });
const { query, closePool } = require('../config/database');

function nowStamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, '-');
}

async function main() {
  console.log('🔎 Verificando split nombre/apellido en mantenimiento.personal_disponible');

  try {
    // 1) Verificar existencia de columnas
    const cols = await query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'mantenimiento'
         AND table_name = 'personal_disponible'
         AND column_name IN ('nombres','nombre','apellido')
       ORDER BY column_name;`
    );
    const foundCols = cols.rows.map(r => r.column_name);
    console.log('📋 Columnas encontradas:', foundCols.join(', '));
    if (!foundCols.includes('nombre') || !foundCols.includes('apellido')) {
      console.log('❌ Faltan columnas requeridas (nombre/apellido). Aborta verificación.');
      process.exitCode = 1;
      return;
    }

    // 2) Métricas generales
    const metricsSql = `
      WITH base AS (
        SELECT rut,
               trim(nombres) AS nombres_trim,
               regexp_split_to_array(trim(nombres), '\\s+') AS tokens,
               nombre,
               apellido
        FROM mantenimiento.personal_disponible
      ), dist AS (
        SELECT
          COUNT(*) FILTER (WHERE true) AS total,
          COUNT(*) FILTER (WHERE nombres_trim IS NOT NULL AND nombres_trim <> '') AS con_nombres,
          COUNT(*) FILTER (WHERE (nombre IS NOT NULL AND nombre <> '')) AS con_nombre,
          COUNT(*) FILTER (WHERE (apellido IS NOT NULL AND apellido <> '')) AS con_apellido,
          COUNT(*) FILTER (WHERE (nombres_trim IS NOT NULL AND nombres_trim <> '') AND (nombre IS NULL OR nombre = '' OR apellido IS NULL OR apellido = '')) AS faltantes_desde_nombres,
          COUNT(*) FILTER (WHERE array_length(tokens,1) = 1) AS tokens_1,
          COUNT(*) FILTER (WHERE array_length(tokens,1) = 2) AS tokens_2,
          COUNT(*) FILTER (WHERE array_length(tokens,1) >= 3) AS tokens_3p
        FROM base
      )
      SELECT * FROM dist;
    `;
    const metrics = (await query(metricsSql)).rows[0];
    console.log('📊 Métricas:');
    console.log(metrics);

    // 3) Comparar con heurística deseada y detectar diferencias
    const diffSql = `
      WITH base AS (
        SELECT rut,
               nombres,
               trim(nombres) AS nombres_trim,
               regexp_split_to_array(trim(nombres), '\\s+') AS tokens,
               nombre AS nombre_actual,
               apellido AS apellido_actual
        FROM mantenimiento.personal_disponible
        WHERE nombres IS NOT NULL AND trim(nombres) <> ''
      ), desired AS (
        SELECT b.rut,
               CASE
                 WHEN array_length(b.tokens, 1) >= 3 THEN b.tokens[1] || ' ' || b.tokens[2]
                 WHEN array_length(b.tokens, 1) = 2 THEN b.tokens[1]
                 WHEN array_length(b.tokens, 1) = 1 THEN NULL
                 ELSE NULL
               END AS apellido_ok,
               CASE
                 WHEN array_length(b.tokens, 1) >= 3 THEN array_to_string(b.tokens[3:array_length(b.tokens, 1)], ' ')
                 WHEN array_length(b.tokens, 1) = 2 THEN b.tokens[2]
                 WHEN array_length(b.tokens, 1) = 1 THEN b.tokens[1]
                 ELSE NULL
               END AS nombre_ok,
               array_length(b.tokens, 1) AS len,
               b.nombres,
               b.nombre_actual,
               b.apellido_actual
        FROM base b
      )
      SELECT *
      FROM desired d
      WHERE (COALESCE(d.nombre_actual,'') <> COALESCE(d.nombre_ok,''))
         OR (COALESCE(d.apellido_actual,'') <> COALESCE(d.apellido_ok,''))
      ORDER BY d.len DESC, d.rut
      LIMIT 50;
    `;
    const diffs = (await query(diffSql)).rows;
    console.log(`⚠️ Diferencias con heurística deseada: ${diffs.length} (muestra máx 50)`);
    if (diffs.length > 0) {
      console.table(
        diffs.map(d => ({
          rut: d.rut,
          len: d.len,
          nombres: d.nombres,
          apellido_actual: d.apellido_actual,
          apellido_ok: d.apellido_ok,
          nombre_actual: d.nombre_actual,
          nombre_ok: d.nombre_ok
        }))
      );
    }

    // 4) Exportar reporte JSON
    const report = {
      generated_at: new Date().toISOString(),
      columns_found: foundCols,
      metrics,
      diffs_sample_count: diffs.length,
      diffs_sample: diffs
    };
    const outDir = path.join(__dirname, '..', 'exports');
    const outPath = path.join(outDir, `verify_nombre_apellido_${nowStamp()}.json`);
    try {
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
      console.log('💾 Reporte guardado en', outPath);
    } catch (e) {
      console.log('⚠️ No se pudo guardar el reporte:', e.message);
    }

  } catch (err) {
    console.error('❌ Error en verificación:', err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
