const { Pool } = require('pg');

// Cargar variables de entorno
require('dotenv').config({ path: './config.env' });

// Configuración del pool de conexiones PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false // Requerido para Supabase
  },
  max: 20, // Máximo número de conexiones en el pool
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexión inactiva
  connectionTimeoutMillis: 2000, // Tiempo de espera para nueva conexión
});

// Función para probar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    console.log('🕒 Timestamp del servidor:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
    return false;
  }
}

// Función para ejecutar consultas
async function query(text, params) {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query ejecutado:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    throw error;
  }
}

// Función para obtener un cliente del pool
async function getClient() {
  return await pool.connect();
}

// Función para cerrar el pool
async function closePool() {
  await pool.end();
  console.log('🔒 Pool de conexiones cerrado');
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool
};
