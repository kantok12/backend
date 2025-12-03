const fs = require('fs');
const path = require('path');
const { query, closePool } = require('../config/database');

(async () => {
  const sqlPath = path.join(__dirname, '..', 'db', 'migrations', '002_split_nombre_apellido.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Applying migration 002_split_nombre_apellido.sql...');
  try {
    await query(sql);
    console.log('✅ Migration applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
})();
