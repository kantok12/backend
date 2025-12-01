const { query } = require('../../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const migrationFile = path.join(__dirname, '003_add_talla_pantalones_column.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('Running migration to add talla_pantalones column...');
    await query(sql);
    console.log('Migration completed successfully.');
    
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

runMigration();
