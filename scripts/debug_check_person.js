const { query, testConnection, closePool } = require('../config/database');

async function normalizeVariants(rut) {
  const clean = rut.replace(/\./g, '').replace(/\s+/g, '');
  const withDash = clean.includes('-') ? clean : clean.slice(0, -1) + '-' + clean.slice(-1);
  const dotted = clean.replace(/(\d{2})(\d{3})(\d{3})-(\w)/, '$1.$2.$3-$4');
  return Array.from(new Set([rut, clean, withDash, dotted]));
}

async function run() {
  await testConnection();
  const target = process.argv[2] || '20011078-1';
  console.log('Comprobando variantes para:', target);
  const variants = await normalizeVariants(target);
  for (const v of variants) {
    try {
      const res = await query('SELECT rut, nombres, cargo, zona_geografica FROM mantenimiento.personal_disponible WHERE rut = $1', [v]);
      console.log('Variant:', v, ' -> rows:', res.rowCount);
      if (res.rowCount > 0) console.log(res.rows[0]);
    } catch (err) {
      console.error('Error querying for', v, err.message);
    }
  }

  // try ILIKE search
  try {
    const likeRes = await query("SELECT rut, nombres, cargo FROM mantenimiento.personal_disponible WHERE rut ILIKE $1 LIMIT 10", ['%20011078%']);
    console.log('ILIKE search rows:', likeRes.rowCount);
    console.log(likeRes.rows.slice(0,5));
  } catch (e) {
    console.error('Error running ILIKE search', e.message);
  }

  await closePool();
}

run().catch(err => {
  console.error('Fatal error', err.message);
  process.exit(1);
});
