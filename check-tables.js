const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

async function checkTables() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
  });

  try {
    const client = await pool.connect();
    
    console.log('📋 TABLAS EN ESQUEMA MANTENIMIENTO:');
    console.log('=====================================');
    
    const tables = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'mantenimiento' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'mantenimiento'
      ORDER BY table_name
    `);
    
    for (const table of tables.rows) {
      console.log(`\n📊 Tabla: ${table.table_name} (${table.column_count} columnas)`);
      
      // Obtener columnas
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'mantenimiento' AND table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
      // Contar registros
      try {
        const count = await client.query(`SELECT COUNT(*) as total FROM mantenimiento.${table.table_name}`);
        console.log(`   📈 Registros: ${count.rows[0].total}`);
      } catch (error) {
        console.log(`   ❌ Error al contar registros: ${error.message}`);
      }
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();