const {query} = require('./config/database');

async function findClienteTables() {
  try {
    const result = await query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%cliente%'
      ORDER BY table_schema, table_name
    `);
    
    console.log('Tablas que contienen "cliente":');
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findClienteTables();
