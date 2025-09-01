const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config({ path: './config.env' });

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente con permisos de administrador para operaciones sensibles
const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Función para verificar la conexión
async function testConnection() {
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
  return supabase;
}

// Función para obtener el cliente admin de Supabase
function getSupabaseAdminClient() {
  return supabaseAdmin;
}

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  getSupabaseClient,
  getSupabaseAdminClient
};
