const { query } = require('../config/database');

/**
 * Script para agregar los clientes solicitados a la cartera bakery_carnes
 * Clientes a agregar: airztia, ariztia_melipilla, brede_master, brueggen_s.a_planta_ceriales_laf, 
 * cecinas_bavaria_LTDA, CIAL, IDEAL_QUILICURA, planta_alimento_hamburgo, soprole, walmart_(ex-aliser)
 */

async function agregarClientesBakeryCarnes() {
  try {
    console.log('🚀 Iniciando inserción de clientes en cartera bakery_carnes...');
    
    // Verificar si los clientes ya existen
    console.log('📋 Verificando clientes existentes...');
    const clientesExistentes = await query(`
      SELECT nombre 
      FROM "Servicios".clientes 
      WHERE nombre IN (
        'airztia', 'ariztia_melipilla', 'brede_master', 'brueggen_s.a_planta_ceriales_laf',
        'cecinas_bavaria_LTDA', 'CIAL', 'IDEAL_QUILICURA', 'planta_alimento_hamburgo', 
        'soprole', 'walmart_(ex-aliser)'
      )
    `);
    
    if (clientesExistentes.rows.length > 0) {
      console.log('⚠️  Los siguientes clientes ya existen:');
      clientesExistentes.rows.forEach(cliente => {
        console.log(`   - ${cliente.nombre}`);
      });
    }
    
    // Obtener IDs de carteras y regiones
    console.log('🔍 Obteniendo IDs de carteras y regiones...');
    const carteras = await query(`SELECT id, name FROM "Servicios".carteras ORDER BY id`);
    const regiones = await query(`SELECT id, nombre FROM "Servicios".ubicacion_geografica ORDER BY id`);
    
    console.log('📊 Carteras disponibles:');
    carteras.rows.forEach(cartera => {
      console.log(`   ID: ${cartera.id} | Nombre: ${cartera.name}`);
    });
    
    console.log('🌍 Regiones disponibles:');
    regiones.rows.forEach(region => {
      console.log(`   ID: ${region.id} | Nombre: ${region.nombre}`);
    });
    
    // Definir los clientes a insertar con sus carteras y regiones correspondientes
    const clientesAInsertar = [
      {
        nombre: 'airztia',
        cartera_id: 6, // bakery_carnes
        region_id: 2   // Region Metropolitana
      },
      {
        nombre: 'ariztia_melipilla',
        cartera_id: 6, // bakery_carnes
        region_id: 2   // Region Metropolitana
      },
      {
        nombre: 'brede_master',
        cartera_id: 6, // bakery_carnes
        region_id: 2   // Region Metropolitana
      },
      {
        nombre: 'brueggen_s.a_planta_ceriales_laf',
        cartera_id: 6, // bakery_carnes
        region_id: 2   // Region Metropolitana
      },
      {
        nombre: 'cecinas_bavaria_LTDA',
        cartera_id: 6, // bakery_carnes
        region_id: 2   // Region Metropolitana
      },
      {
        nombre: 'CIAL',
        cartera_id: 6, // bakery_carnes
        region_id: 2   // Region Metropolitana
      },
      {
        nombre: 'IDEAL_QUILICURA',
        cartera_id: 6, // bakery_carnes
        region_id: 2   // Region Metropolitana
      },
      {
        nombre: 'planta_alimento_hamburgo',
        cartera_id: 6, // bakery_carnes
        region_id: 2   // Region Metropolitana
      },
      {
        nombre: 'soprole',
        cartera_id: 6, // bakery_carnes
        region_id: 2   // Region Metropolitana
      },
      {
        nombre: 'walmart_(ex-aliser)',
        cartera_id: 6, // bakery_carnes
        region_id: 2   // Region Metropolitana
      }
    ];
    
    console.log('\n📝 Insertando clientes...');
    
    for (const cliente of clientesAInsertar) {
      console.log(`   Insertando: ${cliente.nombre} (Cartera ID: ${cliente.cartera_id}, Región ID: ${cliente.region_id})`);
      
      const result = await query(`
        INSERT INTO "Servicios".clientes (nombre, cartera_id, region_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [cliente.nombre, cliente.cartera_id, cliente.region_id]);
      
      console.log(`   ✅ Cliente "${cliente.nombre}" insertado con ID: ${result.rows[0].id}`);
    }
    
    // Verificar los clientes insertados
    console.log('\n🔍 Verificando clientes insertados...');
    const clientesVerificacion = await query(`
      SELECT 
        c.id, 
        c.nombre, 
        c.cartera_id, 
        car.name as cartera_nombre,
        c.region_id,
        reg.nombre as region_nombre,
        c.created_at
      FROM "Servicios".clientes c
      LEFT JOIN "Servicios".carteras car ON c.cartera_id = car.id
      LEFT JOIN "Servicios".ubicacion_geografica reg ON c.region_id = reg.id
      WHERE c.nombre IN (
        'airztia', 'ariztia_melipilla', 'brede_master', 'brueggen_s.a_planta_ceriales_laf',
        'cecinas_bavaria_LTDA', 'CIAL', 'IDEAL_QUILICURA', 'planta_alimento_hamburgo', 
        'soprole', 'walmart_(ex-aliser)'
      )
      ORDER BY c.nombre
    `);
    
    console.log('📊 Clientes en la base de datos:');
    clientesVerificacion.rows.forEach(cliente => {
      console.log(`   ID: ${cliente.id} | Nombre: ${cliente.nombre} | Cartera: ${cliente.cartera_nombre} | Región: ${cliente.region_nombre} | Creado: ${cliente.created_at}`);
    });
    
    // Mostrar resumen por cartera
    console.log('\n📈 Resumen por cartera:');
    const resumenCarteras = await query(`
      SELECT 
        car.name as cartera_nombre,
        COUNT(c.id) as total_clientes
      FROM "Servicios".carteras car
      LEFT JOIN "Servicios".clientes c ON car.id = c.cartera_id
      WHERE c.nombre IN (
        'airztia', 'ariztia_melipilla', 'brede_master', 'brueggen_s.a_planta_ceriales_laf',
        'cecinas_bavaria_LTDA', 'CIAL', 'IDEAL_QUILICURA', 'planta_alimento_hamburgo', 
        'soprole', 'walmart_(ex-aliser)'
      )
      GROUP BY car.id, car.name
      ORDER BY car.name
    `);
    
    resumenCarteras.rows.forEach(resumen => {
      console.log(`   ${resumen.cartera_nombre}: ${resumen.total_clientes} clientes`);
    });
    
    console.log('\n🎉 ¡Inserción de clientes completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al insertar clientes:', error);
    throw error;
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  agregarClientesBakeryCarnes()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { agregarClientesBakeryCarnes };
