const { query } = require('../config/database');

/**
 * Script para corregir la cartera de los clientes
 * Cambiar los clientes que están en la cartera "costa" a la cartera "carozzi"
 * Clientes a corregir: lda_spa, proa, sugal
 */

async function corregirCarteraClientes() {
  try {
    console.log('🚀 Iniciando corrección de carteras de clientes...');
    
    // Verificar estado actual
    console.log('📋 Estado actual de los clientes:');
    const clientesActuales = await query(`
      SELECT 
        c.id, 
        c.nombre, 
        c.cartera_id, 
        car.name as cartera_nombre,
        c.region_id,
        reg.nombre as region_nombre
      FROM "Servicios".clientes c
      LEFT JOIN "Servicios".carteras car ON c.cartera_id = car.id
      LEFT JOIN "Servicios".ubicacion_geografica reg ON c.region_id = reg.id
      WHERE c.nombre IN ('carozzi_planta_bresler', 'carozzi_planta_nos', 'carozzi_planta_pasta', 'lda_spa', 'proa', 'sugal')
      ORDER BY c.nombre
    `);
    
    clientesActuales.rows.forEach(cliente => {
      console.log(`   ID: ${cliente.id} | Nombre: ${cliente.nombre} | Cartera: ${cliente.cartera_nombre} | Región: ${cliente.region_nombre}`);
    });
    
    // Obtener ID de la cartera carozzi
    console.log('\n🔍 Obteniendo ID de la cartera carozzi...');
    const carteraCarozzi = await query(`SELECT id, name FROM "Servicios".carteras WHERE name = 'carozzi'`);
    
    if (carteraCarozzi.rows.length === 0) {
      throw new Error('No se encontró la cartera "carozzi"');
    }
    
    const carozziId = carteraCarozzi.rows[0].id;
    console.log(`   Cartera carozzi encontrada con ID: ${carozziId}`);
    
    // Clientes que necesitan ser corregidos (actualmente en cartera costa)
    const clientesACorregir = ['lda_spa', 'proa', 'sugal'];
    
    console.log('\n📝 Actualizando clientes a la cartera carozzi...');
    
    for (const nombreCliente of clientesACorregir) {
      console.log(`   Actualizando: ${nombreCliente} → cartera carozzi (ID: ${carozziId})`);
      
      const result = await query(`
        UPDATE "Servicios".clientes 
        SET cartera_id = $1
        WHERE nombre = $2
        RETURNING *
      `, [carozziId, nombreCliente]);
      
      if (result.rows.length === 0) {
        console.log(`   ⚠️  Cliente "${nombreCliente}" no encontrado`);
      } else {
        console.log(`   ✅ Cliente "${nombreCliente}" actualizado correctamente`);
      }
    }
    
    // Verificar el estado final
    console.log('\n🔍 Verificando estado final de los clientes:');
    const clientesFinales = await query(`
      SELECT 
        c.id, 
        c.nombre, 
        c.cartera_id, 
        car.name as cartera_nombre,
        c.region_id,
        reg.nombre as region_nombre
      FROM "Servicios".clientes c
      LEFT JOIN "Servicios".carteras car ON c.cartera_id = car.id
      LEFT JOIN "Servicios".ubicacion_geografica reg ON c.region_id = reg.id
      WHERE c.nombre IN ('carozzi_planta_bresler', 'carozzi_planta_nos', 'carozzi_planta_pasta', 'lda_spa', 'proa', 'sugal')
      ORDER BY c.nombre
    `);
    
    console.log('📊 Clientes después de la corrección:');
    clientesFinales.rows.forEach(cliente => {
      console.log(`   ID: ${cliente.id} | Nombre: ${cliente.nombre} | Cartera: ${cliente.cartera_nombre} | Región: ${cliente.region_nombre}`);
    });
    
    // Mostrar resumen por cartera
    console.log('\n📈 Resumen final por cartera:');
    const resumenFinal = await query(`
      SELECT 
        car.name as cartera_nombre,
        COUNT(c.id) as total_clientes
      FROM "Servicios".carteras car
      LEFT JOIN "Servicios".clientes c ON car.id = c.cartera_id
      WHERE c.nombre IN ('carozzi_planta_bresler', 'carozzi_planta_nos', 'carozzi_planta_pasta', 'lda_spa', 'proa', 'sugal')
      GROUP BY car.id, car.name
      ORDER BY car.name
    `);
    
    resumenFinal.rows.forEach(resumen => {
      console.log(`   ${resumen.cartera_nombre}: ${resumen.total_clientes} clientes`);
    });
    
    // Verificar que todos los clientes están en carozzi
    const clientesEnCarozzi = clientesFinales.rows.filter(c => c.cartera_nombre === 'carozzi');
    const totalClientes = clientesFinales.rows.length;
    
    if (clientesEnCarozzi.length === totalClientes) {
      console.log('\n✅ ¡Corrección completada exitosamente!');
      console.log(`   Todos los ${totalClientes} clientes están ahora en la cartera "carozzi"`);
    } else {
      console.log('\n⚠️  Algunos clientes no están en la cartera carozzi');
    }
    
  } catch (error) {
    console.error('❌ Error al corregir carteras de clientes:', error);
    throw error;
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  corregirCarteraClientes()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { corregirCarteraClientes };
