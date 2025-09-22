const { query } = require('../config/database');

/**
 * Script para agregar los clientes solicitados a la tabla clientes del schema Servicios
 * Clientes a agregar: carozzi_planta_bresler, carozzi_planta_nos, carozzi_planta_pasta, lda_spa, proa, sugal
 */

async function agregarClientes() {
  try {
    console.log('🚀 Iniciando inserción de clientes en schema Servicios...');
    
    // Verificar si los clientes ya existen
    console.log('📋 Verificando clientes existentes...');
    const clientesExistentes = await query(`
      SELECT nombre 
      FROM "Servicios".clientes 
      WHERE nombre IN ('carozzi_planta_bresler', 'carozzi_planta_nos', 'carozzi_planta_pasta', 'lda_spa', 'proa', 'sugal')
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
        nombre: 'carozzi_planta_bresler',
        cartera_id: 2, // carozzi
        region_id: 1   // Quinta Region
      },
      {
        nombre: 'carozzi_planta_nos',
        cartera_id: 2, // carozzi
        region_id: 1   // Quinta Region
      },
      {
        nombre: 'carozzi_planta_pasta',
        cartera_id: 2, // carozzi
        region_id: 1   // Quinta Region
      },
      {
        nombre: 'lda_spa',
        cartera_id: 5, // costa
        region_id: 2   // Region Metropolitana
      },
      {
        nombre: 'proa',
        cartera_id: 5, // costa
        region_id: 2   // Region Metropolitana
      },
      {
        nombre: 'sugal',
        cartera_id: 5, // costa
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
      WHERE c.nombre IN ('carozzi_planta_bresler', 'carozzi_planta_nos', 'carozzi_planta_pasta', 'lda_spa', 'proa', 'sugal')
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
      WHERE c.nombre IN ('carozzi_planta_bresler', 'carozzi_planta_nos', 'carozzi_planta_pasta', 'lda_spa', 'proa', 'sugal')
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
  agregarClientes()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { agregarClientes };
