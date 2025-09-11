const { migrateDocumentosStructure, checkMigrationStatus } = require('./migrate-documentos-structure');

async function runMigration() {
  try {
    console.log('🚀 Iniciando migración de documentos...');
    await migrateDocumentosStructure();
    console.log('✅ Migración completada exitosamente');
    
    console.log('\n🔍 Verificando estado...');
    await checkMigrationStatus();
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

runMigration();
