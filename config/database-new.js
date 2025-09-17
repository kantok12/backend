const { Pool } = require('pg');

// Cargar variables de entorno
require('dotenv').config({ path: './config.env' });

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mantenimiento_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  max: 20, // máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // tiempo de inactividad antes de cerrar conexión
  connectionTimeoutMillis: 2000, // tiempo máximo para obtener conexión
});

// Función para verificar la conexión
async function testConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() as timestamp');
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    console.log('🕒 Timestamp del servidor:', result.rows[0].timestamp);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error);
    return false;
  } finally {
    client.release();
  }
}

// Función para obtener el pool de conexiones
function getPool() {
  return pool;
}

// Función para ejecutar consultas
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('❌ Error en consulta SQL:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Función para obtener un cliente del pool
async function getClient() {
  return await pool.connect();
}

// Función para cerrar el pool de conexiones
async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  testConnection,
  getPool,
  query,
  getClient,
  closePool
};
