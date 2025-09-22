const { query } = require('../config/database');

/**
 * Script para verificar la estructura de la tabla clientes en el esquema Servicios
 */

async function verificarEstructuraClientes() {
  try {
    console.log('🔍 Verificando estructura de la tabla clientes en esquema "Servicios"...');
    
    // Verificar estructura de la tabla clientes
    console.log('\n📋 Estructura de la tabla "Servicios.clientes":');
    const estructura = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'Servicios' 
      AND table_name = 'clientes'
      ORDER BY ordinal_position
    `);
    
    if (estructura.rows.length === 0) {
      console.log('   ❌ No se encontró la tabla clientes en el esquema Servicios');
      return;
    }
    
    estructura.rows.forEach(columna => {
      const tipo = columna.character_maximum_length 
        ? `${columna.data_type}(${columna.character_maximum_length})`
        : columna.data_type;
      const nullable = columna.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = columna.column_default ? ` DEFAULT ${columna.column_default}` : '';
      
      console.log(`   - ${columna.column_name}: ${tipo} ${nullable}${defaultVal}`);
    });
    
    // Verificar datos existentes
    console.log('\n📊 Datos existentes en la tabla clientes:');
    const datos = await query(`
      SELECT * FROM "Servicios".clientes 
      ORDER BY id
    `);
    
    if (datos.rows.length === 0) {
      console.log('   (No hay datos en la tabla)');
    } else {
      console.log(`   Total de registros: ${datos.rows.length}`);
      datos.rows.forEach((cliente, index) => {
        console.log(`   ${index + 1}. ID: ${cliente.id} | Nombre: ${cliente.nombre || 'N/A'} | Cartera ID: ${cliente.cartera_id || 'N/A'} | Región ID: ${cliente.region_id || 'N/A'}`);
      });
    }
    
    // Verificar carteras disponibles para referencia
    console.log('\n🏢 Carteras disponibles:');
    const carteras = await query(`
      SELECT id, name FROM "Servicios".carteras ORDER BY id
    `);
    
    carteras.rows.forEach(cartera => {
      console.log(`   ID: ${cartera.id} | Nombre: ${cartera.name}`);
    });
    
    // Verificar ubicaciones geográficas disponibles
    console.log('\n🌍 Ubicaciones geográficas disponibles:');
    const ubicaciones = await query(`
      SELECT id, nombre FROM "Servicios".ubicacion_geografica ORDER BY id
    `);
    
    ubicaciones.rows.forEach(ubicacion => {
      console.log(`   ID: ${ubicacion.id} | Nombre: ${ubicacion.nombre}`);
    });
    
    // Verificar restricciones y índices
    console.log('\n🔒 Restricciones y índices:');
    const restricciones = await query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'Servicios' 
      AND tc.table_name = 'clientes'
      ORDER BY tc.constraint_type, tc.constraint_name
    `);
    
    if (restricciones.rows.length === 0) {
      console.log('   (No hay restricciones definidas)');
    } else {
      restricciones.rows.forEach(restriccion => {
        console.log(`   - ${restriccion.constraint_type}: ${restriccion.constraint_name} (${restriccion.column_name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error al verificar estructura de clientes:', error);
    throw error;
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  verificarEstructuraClientes()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { verificarEstructuraClientes };
