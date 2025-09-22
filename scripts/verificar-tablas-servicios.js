const { query } = require('../config/database');

/**
 * Script para verificar las tablas en el esquema Servicios
 */

async function verificarTablasServicios() {
  try {
    console.log('🔍 Verificando tablas en esquema "Servicios"...');
    
    // Verificar tablas en el esquema Servicios
    const tablas = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'Servicios' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas en esquema "Servicios":');
    if (tablas.rows.length === 0) {
      console.log('   (No hay tablas)');
    } else {
      tablas.rows.forEach(tabla => {
        console.log(`   - ${tabla.table_name}`);
      });
    }
    
    // Verificar estructura de cada tabla
    for (const tabla of tablas.rows) {
      console.log(`\n📊 Estructura de la tabla "Servicios.${tabla.table_name}":`);
      
      const estructura = await query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'Servicios' 
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
      const datos = await query(`SELECT COUNT(*) as total FROM "Servicios"."${tabla.table_name}"`);
      console.log(`   📈 Total de registros: ${datos.rows[0].total}`);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar tablas:', error);
    throw error;
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  verificarTablasServicios()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { verificarTablasServicios };
