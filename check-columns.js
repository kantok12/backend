const {query} = require('./config/database');

async function checkColumns() {
  try {
    const tableName = process.argv[2] || 'personal_disponible';
    const schemaName = process.argv[3] || 'mantenimiento';
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema=$1
        AND table_name=$2
      ORDER BY ordinal_position
    `, [schemaName, tableName]);
    
    console.log(`Columnas en ${schemaName}.${tableName}:`);
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkColumns();
