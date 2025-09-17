const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupDocumentos() {
  try {
    console.log('🔧 Configurando sistema de documentos para cursos...');
    
    // Leer el script SQL
    const sqlPath = path.join(__dirname, 'create-documentos-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el script SQL
    await query(sqlContent);
    
    console.log('✅ Tabla de documentos creada exitosamente');
    
    // Verificar que la tabla se creó correctamente
    const checkTableQuery = `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'cursos_documentos'
      ORDER BY ordinal_position
    `;
    
    const result = await query(checkTableQuery);
    
    if (result.rows.length > 0) {
      console.log('📋 Estructura de la tabla cursos_documentos:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    }
    
    // Crear directorio de uploads si no existe
    const uploadsDir = path.join(__dirname, '../uploads/cursos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Directorio de uploads creado');
    }
    
    console.log('🎉 Sistema de documentos configurado completamente');
    
  } catch (error) {
    console.error('❌ Error configurando sistema de documentos:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDocumentos()
    .then(() => {
      console.log('✅ Configuración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en configuración:', error);
      process.exit(1);
    });
}

module.exports = { setupDocumentos };
