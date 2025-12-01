const {query} = require('./config/database');

async function checkColumns() {
  try {
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema='mantenimiento' 
        AND table_name='personal_disponible' 
      ORDER BY ordinal_position
    `);
    
    console.log('Columnas en personal_disponible:');
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkColumns();
