const { query } = require('../config/database');

/**
 * Script para unir carteras según los requerimientos:
 * - costa + puertos → costa-puerto
 * - bakery + carnes → bakery-carnes (ya existe como bakery_carnes)
 * 
 * Este script:
 * 1. Crea las nuevas carteras consolidadas
 * 2. Migra todos los clientes de las carteras originales
 * 3. Migra todos los nodos asociados
 * 4. Elimina las carteras originales
 */

async function unirCarteras() {
  try {
    console.log('🚀 Iniciando proceso de unión de carteras...');
    
    // Verificar estado actual de las carteras
    console.log('📋 Estado actual de las carteras:');
    const carterasActuales = await query(`
      SELECT 
        c.id,
        c.name,
        COUNT(cl.id) as total_clientes,
        COUNT(n.id) as total_nodos
      FROM servicios.carteras c
      LEFT JOIN servicios.clientes cl ON c.id = cl.cartera_id
      LEFT JOIN servicios.nodos n ON cl.id = n.cliente_id
      WHERE c.name IN ('COSTA', 'PUERTOS', 'BAKERY - CARNES')
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    
    carterasActuales.rows.forEach(cartera => {
      console.log(`   ID: ${cartera.id} | Nombre: ${cartera.name} | Clientes: ${cartera.total_clientes} | Nodos: ${cartera.total_nodos}`);
    });
    
    // =====================================================
    // 1. UNIR COSTA + PUERTOS → COSTA-PUERTO
    // =====================================================
    
    console.log('\n🔄 Procesando unión: costa + puertos → costa-puerto');
    
    // Verificar si ya existe la cartera costa-puerto
    const carteraCostaPuertoExistente = await query(`
      SELECT id FROM servicios.carteras WHERE name = 'COSTA - PUERTO'
    `);
    
    let carteraCostaPuertoId;
    
    if (carteraCostaPuertoExistente.rows.length > 0) {
      carteraCostaPuertoId = carteraCostaPuertoExistente.rows[0].id;
      console.log(`   ✅ Cartera 'costa-puerto' ya existe con ID: ${carteraCostaPuertoId}`);
    } else {
      // Crear nueva cartera costa-puerto
      const nuevaCartera = await query(`
        INSERT INTO servicios.carteras (name, created_at)
        VALUES ('COSTA - PUERTO', NOW())
        RETURNING id
      `);
      carteraCostaPuertoId = nuevaCartera.rows[0].id;
      console.log(`   ✅ Cartera 'costa-puerto' creada con ID: ${carteraCostaPuertoId}`);
    }
    
    // Obtener IDs de las carteras originales
    const carteraCosta = await query(`SELECT id FROM servicios.carteras WHERE name = 'COSTA'`);
    const carteraPuertos = await query(`SELECT id FROM servicios.carteras WHERE name = 'PUERTOS'`);
    
    if (carteraCosta.rows.length === 0) {
      console.log('   ⚠️  Cartera "costa" no encontrada');
    } else {
      const costaId = carteraCosta.rows[0].id;
      console.log(`   📝 Migrando clientes de cartera "costa" (ID: ${costaId}) a "costa-puerto"`);
      
      // Migrar clientes de costa a costa-puerto
      const clientesCosta = await query(`
        UPDATE servicios.clientes 
        SET cartera_id = $1
        WHERE cartera_id = $2
        RETURNING id, nombre
      `, [carteraCostaPuertoId, costaId]);
      
      console.log(`   ✅ ${clientesCosta.rows.length} clientes migrados de "costa" a "costa-puerto"`);
    }
    
    if (carteraPuertos.rows.length === 0) {
      console.log('   ⚠️  Cartera "puertos" no encontrada');
    } else {
      const puertosId = carteraPuertos.rows[0].id;
      console.log(`   📝 Migrando clientes de cartera "puertos" (ID: ${puertosId}) a "costa-puerto"`);
      
      // Migrar clientes de puertos a costa-puerto
      const clientesPuertos = await query(`
        UPDATE servicios.clientes 
        SET cartera_id = $1
        WHERE cartera_id = $2
        RETURNING id, nombre
      `, [carteraCostaPuertoId, puertosId]);
      
      console.log(`   ✅ ${clientesPuertos.rows.length} clientes migrados de "puertos" a "costa-puerto"`);
    }
    
    // =====================================================
    // 2. VERIFICAR BAKERY-CARNES
    // =====================================================
    
    console.log('\n🔄 Verificando cartera bakery-carnes...');
    
    const carteraBakeryCarnes = await query(`SELECT id FROM servicios.carteras WHERE name = 'BAKERY - CARNES'`);
    
    if (carteraBakeryCarnes.rows.length > 0) {
      const bakeryCarnesId = carteraBakeryCarnes.rows[0].id;
      console.log(`   ✅ Cartera 'bakery_carnes' ya existe con ID: ${bakeryCarnesId}`);
      
      // Verificar si hay clientes en esta cartera
      const clientesBakeryCarnes = await query(`
        SELECT COUNT(*) as total FROM servicios.clientes WHERE cartera_id = $1
      `, [bakeryCarnesId]);
      
      console.log(`   📊 Clientes en bakery_carnes: ${clientesBakeryCarnes.rows[0].total}`);
    } else {
      console.log('   ⚠️  Cartera "bakery_carnes" no encontrada');
    }
    
    // =====================================================
    // 3. ELIMINAR CARTERAS ORIGINALES (solo si no tienen clientes)
    // =====================================================
    
    console.log('\n🗑️  Verificando carteras para eliminación...');
    
    // Verificar si las carteras originales tienen clientes
    if (carteraCosta.rows.length > 0) {
      const clientesRestantesCosta = await query(`
        SELECT COUNT(*) as total FROM servicios.clientes WHERE cartera_id = $1
      `, [carteraCosta.rows[0].id]);
      
      if (clientesRestantesCosta.rows[0].total === '0') {
        console.log('   🗑️  Eliminando cartera "costa" (sin clientes)');
        await query(`DELETE FROM servicios.carteras WHERE id = $1`, [carteraCosta.rows[0].id]);
        console.log('   ✅ Cartera "costa" eliminada');
      } else {
        console.log(`   ⚠️  Cartera "costa" aún tiene ${clientesRestantesCosta.rows[0].total} clientes, no se elimina`);
      }
    }
    
    if (carteraPuertos.rows.length > 0) {
      const clientesRestantesPuertos = await query(`
        SELECT COUNT(*) as total FROM servicios.clientes WHERE cartera_id = $1
      `, [carteraPuertos.rows[0].id]);
      
      if (clientesRestantesPuertos.rows[0].total === '0') {
        console.log('   🗑️  Eliminando cartera "puertos" (sin clientes)');
        await query(`DELETE FROM servicios.carteras WHERE id = $1`, [carteraPuertos.rows[0].id]);
        console.log('   ✅ Cartera "puertos" eliminada');
      } else {
        console.log(`   ⚠️  Cartera "puertos" aún tiene ${clientesRestantesPuertos.rows[0].total} clientes, no se elimina`);
      }
    }
    
    // =====================================================
    // 4. VERIFICACIÓN FINAL
    // =====================================================
    
    console.log('\n🔍 Verificación final de carteras:');
    const carterasFinales = await query(`
      SELECT 
        c.id,
        c.name,
        COUNT(cl.id) as total_clientes,
        COUNT(n.id) as total_nodos
      FROM servicios.carteras c
      LEFT JOIN servicios.clientes cl ON c.id = cl.cartera_id
      LEFT JOIN servicios.nodos n ON cl.id = n.cliente_id
      WHERE c.name IN ('COSTA - PUERTO', 'BAKERY - CARNES', 'CAROZZI', 'SNACK', 'CEMENTERAS')
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    
    carterasFinales.rows.forEach(cartera => {
      console.log(`   ID: ${cartera.id} | Nombre: ${cartera.name} | Clientes: ${cartera.total_clientes} | Nodos: ${cartera.total_nodos}`);
    });
    
    // Mostrar clientes por cartera
    console.log('\n📊 Clientes por cartera:');
    const clientesPorCartera = await query(`
      SELECT 
        car.name as cartera_nombre,
        cl.nombre as cliente_nombre,
        reg.nombre as region_nombre
      FROM servicios.carteras car
      LEFT JOIN servicios.clientes cl ON car.id = cl.cartera_id
      LEFT JOIN servicios.ubicacion_geografica reg ON cl.region_id = reg.id
      WHERE car.name IN ('COSTA - PUERTO', 'BAKERY - CARNES', 'CAROZZI')
      ORDER BY car.name, cl.nombre
    `);
    
    let carteraActual = '';
    clientesPorCartera.rows.forEach(cliente => {
      if (cliente.cartera_nombre !== carteraActual) {
        carteraActual = cliente.cartera_nombre;
        console.log(`\n   📁 ${carteraActual}:`);
      }
      if (cliente.cliente_nombre) {
        console.log(`      - ${cliente.cliente_nombre} (${cliente.region_nombre})`);
      }
    });
    
    console.log('\n🎉 ¡Proceso de unión de carteras completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al unir carteras:', error);
    throw error;
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  unirCarteras()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { unirCarteras };
