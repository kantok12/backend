const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config({ path: './config.env' });

// ============================================================================
// CONFIGURACIÓN POSTGRESQL (PRINCIPAL)
// ============================================================================

// Configuración del pool de conexiones PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false, // Deshabilitado para PostgreSQL local
  max: 20, // Máximo número de conexiones en el pool
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexión inactiva
  connectionTimeoutMillis: 2000, // Tiempo de espera para nueva conexión
});

// ============================================================================
// CONFIGURACIÓN SUPABASE (LEGACY - PARA COMPATIBILIDAD)
// ============================================================================

// Configuración de Supabase (solo si las variables están definidas)
let supabase = null;
let supabaseAdmin = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  // Crear cliente de Supabase
  supabase = createClient(supabaseUrl, supabaseKey);
  
  // Cliente con permisos de administrador para operaciones sensibles
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
}

// ============================================================================
// FUNCIONES POSTGRESQL
// ============================================================================

// Función para probar la conexión PostgreSQL
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

// Función para ejecutar consultas PostgreSQL
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

// ============================================================================
// FUNCIONES SUPABASE (LEGACY)
// ============================================================================

// Función para verificar la conexión Supabase
async function testSupabaseConnection() {
  if (!supabase) {
    console.log('⚠️ Supabase no configurado - usando solo PostgreSQL');
    return false;
  }
  
  try {
    const { data, error } = await supabase
      .from('mantenimiento.personal_servicio')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error de conexión a Supabase:', error);
      return false;
    }
    
    console.log('✅ Conexión a Supabase establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con Supabase:', error);
    return false;
  }
}

// Función para obtener el cliente de Supabase
function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Verifica las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY');
  }
  return supabase;
}

// Función para obtener el cliente admin de Supabase
function getSupabaseAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin no está configurado. Verifica la variable de entorno SUPABASE_SERVICE_ROLE_KEY');
  }
  return supabaseAdmin;
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

// Función para probar todas las conexiones
async function testAllConnections() {
  console.log('🔍 Probando conexiones...');
  
  const postgresOk = await testConnection();
  const supabaseOk = await testSupabaseConnection();
  
  return {
    postgresql: postgresOk,
    supabase: supabaseOk,
    allOk: postgresOk && (supabaseOk || !supabase) // Supabase es opcional
  };
}

// Función para obtener información de configuración
function getConfigInfo() {
  return {
    postgresql: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      configured: !!(process.env.DB_HOST && process.env.DB_NAME)
    },
    supabase: {
      url: process.env.SUPABASE_URL,
      configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      adminConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  };
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

module.exports = {
  // PostgreSQL (Principal)
  pool,
  query,
  getClient,
  testConnection,
  closePool,
  
  // Supabase (Legacy - Compatibilidad)
  supabase,
  supabaseAdmin,
  getSupabaseClient,
  getSupabaseAdminClient,
  testSupabaseConnection,
  
  // Utilidades
  testAllConnections,
  getConfigInfo
};