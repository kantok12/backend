const fs = require('fs');
const path = require('path');
const { query, closePool } = require('../config/database');

(async () => {
  const sqlPath = path.join(__dirname, '..', 'db', 'migrations', '003_fix_split_nombre_apellido.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Applying migration 003_fix_split_nombre_apellido.sql...');
  try {
    await query(sql);
    console.log('✅ Migration 003 applied successfully');
  } catch (err) {
    console.error('❌ Migration 003 failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
})();
