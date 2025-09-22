const { query } = require('../config/database');

/**
 * Script para verificar qué tablas existen en el esquema "servicio" (minúscula)
 */

async function verificarEsquemaServicio() {
  try {
    console.log('🔍 Verificando esquema "servicio" (minúscula)...');
    
    // Verificar si existe el esquema servicio
    const esquemaServicio = await query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'servicio'
    `);
    
    if (esquemaServicio.rows.length === 0) {
      console.log('   ❌ El esquema "servicio" NO existe');
      return;
    }
    
    console.log('   ✅ El esquema "servicio" existe');
    
    // Verificar tablas en el esquema servicio
    const tablasServicio = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'servicio' 
      ORDER BY table_name
    `);
    
    console.log('   📋 Tablas en esquema "servicio":');
    if (tablasServicio.rows.length === 0) {
      console.log('      (No hay tablas)');
    } else {
      tablasServicio.rows.forEach(tabla => {
        console.log(`      - ${tabla.table_name}`);
      });
    }
    
    // Verificar estructura de cada tabla
    for (const tabla of tablasServicio.rows) {
      console.log(`\n📊 Estructura de la tabla "servicio.${tabla.table_name}":`);
      
      const estructura = await query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'servicio' 
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tabla.table_name]);
      
      estructura.rows.forEach(columna => {
        const tipo = columna.character_maximum_length 
          ? `${columna.data_type}(${columna.character_maximum_length})`
          : columna.data_type;
        const nullable = columna.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = columna.column_default ? ` DEFAULT ${columna.column_default}` : '';
        
        console.log(`   - ${columna.column_name}: ${tipo} ${nullable}${defaultVal}`);
      });
      
      // Verificar datos existentes
      const datos = await query(`SELECT COUNT(*) as total FROM servicio."${tabla.table_name}"`);
      console.log(`   📈 Total de registros: ${datos.rows[0].total}`);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar esquema servicio:', error);
    throw error;
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  verificarEsquemaServicio()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { verificarEsquemaServicio };
