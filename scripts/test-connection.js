const { query } = require('../config/postgresql');

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a PostgreSQL...');
    
    // Probar conexión básica
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Conexión exitosa:', result.rows[0].current_time);
    
    // Verificar esquema mantenimiento
    const schemaResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.schemata 
        WHERE schema_name = 'mantenimiento'
      ) as schema_exists
    `);
    console.log('📋 Esquema mantenimiento existe:', schemaResult.rows[0].schema_exists);
    
    // Verificar tablas existentes
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento'
      ORDER BY table_name
    `);
    
    console.log('📊 Tablas en esquema mantenimiento:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Verificar si ya existe la tabla documentos
    const documentosExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = 'documentos'
      ) as tabla_existe
    `);
    
    console.log('📄 Tabla documentos existe:', documentosExists.rows[0].tabla_existe);
    
    if (documentosExists.rows[0].tabla_existe) {
      // Contar registros en documentos
      const countResult = await query('SELECT COUNT(*) as total FROM mantenimiento.documentos');
      console.log('📈 Registros en tabla documentos:', countResult.rows[0].total);
    }
    
    // Verificar tabla cursos_documentos
    const cursosDocsExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = 'cursos_documentos'
      ) as tabla_existe
    `);
    
    console.log('📚 Tabla cursos_documentos existe:', cursosDocsExists.rows[0].tabla_existe);
    
    if (cursosDocsExists.rows[0].tabla_existe) {
      const countResult = await query('SELECT COUNT(*) as total FROM mantenimiento.cursos_documentos WHERE activo = true');
      console.log('📈 Registros activos en cursos_documentos:', countResult.rows[0].total);
    }
    
  } catch (error) {
    console.error('❌ Error en la conexión:', error);
    throw error;
  }
}

testConnection()
  .then(() => {
    console.log('\n✅ Prueba de conexión completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
