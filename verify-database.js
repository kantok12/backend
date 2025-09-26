const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

async function verifyDatabase() {
  console.log('🔍 VERIFICANDO CONEXIÓN A BASE DE DATOS LOCAL');
  console.log('================================================');
  
  // Mostrar configuración actual
  console.log('📋 Configuración actual:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Puerto: ${process.env.DB_PORT}`);
  console.log(`   Base de datos: ${process.env.DB_NAME}`);
  console.log(`   Usuario: ${process.env.DB_USER}`);
  console.log(`   Contraseña: ${process.env.DB_PASSWORD ? '***configurada***' : 'NO CONFIGURADA'}`);
  console.log('');

  // Crear pool de conexión
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
  });

  try {
    console.log('🔌 Conectando a PostgreSQL...');
    const client = await pool.connect();
    
    // Verificar conexión
    const result = await client.query('SELECT NOW() as timestamp, current_database() as database_name, current_user as user_name');
    console.log('✅ Conexión exitosa!');
    console.log(`   Timestamp: ${result.rows[0].timestamp}`);
    console.log(`   Base de datos: ${result.rows[0].database_name}`);
    console.log(`   Usuario: ${result.rows[0].user_name}`);
    console.log('');

    // Verificar esquemas
    console.log('📊 Verificando esquemas disponibles:');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    
    schemas.rows.forEach(row => {
      console.log(`   - ${row.schema_name}`);
    });
    console.log('');

    // Verificar tablas en esquema mantenimiento
    console.log('📋 Verificando tablas en esquema mantenimiento:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   ⚠️ No se encontraron tablas en el esquema mantenimiento');
    }
    console.log('');

    // Verificar datos en personal_disponible
    console.log('👥 Verificando datos en personal_disponible:');
    const count = await client.query('SELECT COUNT(*) as total FROM mantenimiento.personal_disponible');
    console.log(`   Total de registros: ${count.rows[0].total}`);
    
    if (parseInt(count.rows[0].total) > 0) {
      const sample = await client.query('SELECT rut, nombres FROM mantenimiento.personal_disponible LIMIT 3');
      console.log('   Muestra de datos:');
      sample.rows.forEach(row => {
        console.log(`     - ${row.rut}: ${row.nombres}`);
      });
    }
    console.log('');

    client.release();
    await pool.end();
    
    console.log('🎉 VERIFICACIÓN COMPLETADA');
    console.log(`✅ Estás usando la base de datos: ${process.env.DB_NAME}`);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('');
    console.log('🔧 Posibles soluciones:');
    console.log('   1. Verificar que PostgreSQL esté ejecutándose');
    console.log('   2. Verificar que la base de datos "Propuesta_solucion" exista');
    console.log('   3. Verificar credenciales de usuario');
    console.log('   4. Verificar que el puerto 5432 esté disponible');
  }
}

verifyDatabase();
