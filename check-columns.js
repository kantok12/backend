const {query} = require('./config/database');

async function checkColumns() {
  try {
    const tableName = process.argv[2] || 'personal_disponible';
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema='mantenimiento' 
        AND table_name=$1
      ORDER BY ordinal_position
    `, [tableName]);
    
    console.log(`Columnas en ${tableName}:`);
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkColumns();
