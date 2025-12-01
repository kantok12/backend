const { query } = require('../../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const migrationFile = path.join(__dirname, '004_add_metodo_subida_documentos.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('🚀 Ejecutando migración: Agregar método de subida de documentos...');
    await query(sql);
    console.log('✅ Migración completada exitosamente.');
    
    // Verificar cambios
    const result = await query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_schema='servicios' 
        AND table_name='clientes' 
        AND column_name IN ('metodo_subida_documentos', 'config_subida_documentos')
      ORDER BY column_name
    `);
    
    console.log('\n📋 Columnas agregadas:');
    result.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Contar clientes actualizados
    const countResult = await query(`
      SELECT COUNT(*) as total FROM servicios.clientes
    `);
    
    console.log(`\n✅ ${countResult.rows[0].total} clientes configurados con valores por defecto.`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  }
}

runMigration();
