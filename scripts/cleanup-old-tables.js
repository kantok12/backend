const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mantenimiento_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

/**
 * Ejecuta la limpieza de tablas obsoletas
 * Elimina las tablas cursos_documentos y cursos_certificaciones
 */
async function cleanupOldTables() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Iniciando limpieza de tablas obsoletas...');
    
    // Leer el script SQL
    const sqlPath = path.join(__dirname, 'cleanup-old-tables.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el script SQL
    await client.query(sqlScript);
    
    console.log('✅ Limpieza de tablas obsoletas completada exitosamente');
    
    return {
      success: true,
      message: 'Limpieza completada exitosamente',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verifica el estado de la limpieza
 * Comprueba si las tablas obsoletas aún existen
 */
async function checkCleanupStatus() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estado de limpieza...');
    
    // Verificar si las tablas obsoletas aún existen
    const checkQuery = `
      SELECT 
        table_name,
        CASE 
          WHEN table_name IS NULL THEN 'ELIMINADA'
          ELSE 'EXISTE'
        END as estado
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento' 
      AND table_name IN ('cursos_documentos', 'cursos_certificaciones')
      ORDER BY table_name;
    `;
    
    const result = await client.query(checkQuery);
    
    // Verificar tablas restantes en el esquema
    const remainingTablesQuery = `
      SELECT 
        table_name,
        'ACTIVA' as estado
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento'
      ORDER BY table_name;
    `;
    
    const remainingResult = await client.query(remainingTablesQuery);
    
    const cleanupStatus = {
      obsoleteTables: result.rows,
      remainingTables: remainingResult.rows,
      isCleanupComplete: result.rows.length === 0,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Estado de limpieza:', cleanupStatus);
    
    return cleanupStatus;
    
  } catch (error) {
    console.error('❌ Error verificando estado de limpieza:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verifica si es seguro ejecutar la limpieza
 * Comprueba que los datos fueron migrados correctamente
 */
async function isCleanupSafe() {
  const client = await pool.connect();
  
  try {
    console.log('🔒 Verificando si es seguro ejecutar limpieza...');
    
    // Verificar que existe la tabla documentos
    const checkDocumentosQuery = `
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = 'documentos'
      ) as documentos_exists;
    `;
    
    const documentosResult = await client.query(checkDocumentosQuery);
    
    if (!documentosResult.rows[0].documentos_exists) {
      throw new Error('La tabla documentos no existe. No es seguro ejecutar la limpieza.');
    }
    
    // Verificar que hay datos en la tabla documentos
    const countDocumentosQuery = `
      SELECT COUNT(*) as total_documentos
      FROM mantenimiento.documentos;
    `;
    
    const countResult = await client.query(countDocumentosQuery);
    const totalDocumentos = parseInt(countResult.rows[0].total_documentos);
    
    if (totalDocumentos === 0) {
      throw new Error('No hay datos en la tabla documentos. No es seguro ejecutar la limpieza.');
    }
    
    console.log(`✅ Verificación de seguridad completada. Documentos encontrados: ${totalDocumentos}`);
    
    return {
      isSafe: true,
      totalDocumentos: totalDocumentos,
      message: 'Es seguro ejecutar la limpieza',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error en verificación de seguridad:', error);
    return {
      isSafe: false,
      error: error.message,
      message: 'NO es seguro ejecutar la limpieza',
      timestamp: new Date().toISOString()
    };
  } finally {
    client.release();
  }
}

module.exports = {
  cleanupOldTables,
  checkCleanupStatus,
  isCleanupSafe
};
