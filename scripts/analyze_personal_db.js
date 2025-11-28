const fs = require('fs');
const path = require('path');
const db = require('../config/database');

function ts() {
  return Date.now();
}

async function run() {
  const out = { timestamp: new Date().toISOString(), queries: {} };
  try {
    // Basic connectivity check
    await db.testConnection();

    // 1) total rows
    const totalRes = await db.query('SELECT COUNT(*)::int AS total FROM mantenimiento.personal_disponible');
    out.queries.total = totalRes.rows[0].total;

    // 2) nombres null or empty
    const nombresNullRes = await db.query("SELECT COUNT(*)::int AS cnt FROM mantenimiento.personal_disponible WHERE nombres IS NULL OR trim(nombres) = ''");
    out.queries.nombres_null_or_empty = nombresNullRes.rows[0].cnt;

    // 3) talla_zapato null/empty or '-'
    const tallaNullRes = await db.query("SELECT COUNT(*)::int AS cnt FROM mantenimiento.personal_disponible WHERE talla_zapato IS NULL OR trim(talla_zapato) = '' OR trim(talla_zapato) = '-' ");
    out.queries.talla_zapato_missing = tallaNullRes.rows[0].cnt;

    // 4) count by estado_id (top groups)
    const estadoRes = await db.query('SELECT estado_id, COUNT(*)::int AS cnt FROM mantenimiento.personal_disponible GROUP BY estado_id ORDER BY cnt DESC LIMIT 50');
    out.queries.estado_counts = estadoRes.rows;

    // 5) sample rows where nombres is null
    const sampleNull = await db.query(`SELECT id, rut, nombres, talla_zapato, cargo, estado_id, created_at FROM mantenimiento.personal_disponible WHERE nombres IS NULL OR trim(nombres) = '' LIMIT 20`);
    out.samples = out.samples || {};
    out.samples.nombres_null = sampleNull.rows;

    // 6) sample rows where nombres is not null
    const sampleNotNull = await db.query(`SELECT id, rut, nombres, talla_zapato, cargo, estado_id, created_at FROM mantenimiento.personal_disponible WHERE NOT (nombres IS NULL OR trim(nombres) = '') ORDER BY created_at DESC LIMIT 20`);
    out.samples.nombres_present = sampleNotNull.rows;

    // 7) count how many rows were created after migration time (heuristic: last 7 days)
    const recentRes = await db.query("SELECT COUNT(*)::int AS cnt FROM mantenimiento.personal_disponible WHERE created_at >= now() - interval '7 days'");
    out.queries.created_last_7_days = recentRes.rows[0].cnt;

    // Write report
    const outPath = path.join(__dirname, '..', 'exports', `personal_db_analysis_${ts()}.json`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');

    console.log('Analysis written to', outPath);
    console.log(JSON.stringify({ total: out.queries.total, nombres_missing: out.queries.nombres_null_or_empty, talla_missing: out.queries.talla_zapato_missing }, null, 2));
    await db.closePool();
    process.exit(0);
  } catch (err) {
    console.error('Error during DB analysis:', err.message || err);
    try { await db.closePool(); } catch (e) {}
    process.exit(1);
  }
}

run();
