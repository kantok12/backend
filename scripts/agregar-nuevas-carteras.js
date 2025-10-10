const { query } = require('../config/database');

/**
 * Script para agregar las nuevas carteras solicitadas:
 * - INDUSTRIA 1
 * - INDUSTRIA 2
 * - INDUSTRIA
 * - NESTLE
 */

async function agregarNuevasCarteras() {
  try {
    console.log('🚀 Iniciando creación de nuevas carteras...');
    
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
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    
    carterasActuales.rows.forEach(cartera => {
      console.log(`   ID: ${cartera.id} | Nombre: ${cartera.name} | Clientes: ${cartera.total_clientes} | Nodos: ${cartera.total_nodos}`);
    });
    
    // Definir las nuevas carteras a crear
    const nuevasCarteras = [
      'INDUSTRIA 1',
      'INDUSTRIA 2', 
      'INDUSTRIA',
      'NESTLE'
    ];
    
    console.log('\n📝 Verificando carteras existentes...');
    
    // Verificar cuáles carteras ya existen
    for (const nombreCartera of nuevasCarteras) {
      const carteraExistente = await query(`
        SELECT id, name FROM servicios.carteras WHERE name = $1
      `, [nombreCartera]);
      
      if (carteraExistente.rows.length > 0) {
        console.log(`   ⚠️  Cartera "${nombreCartera}" ya existe con ID: ${carteraExistente.rows[0].id}`);
      } else {
        console.log(`   ✅ Cartera "${nombreCartera}" no existe, se creará`);
      }
    }
    
    console.log('\n🔄 Creando nuevas carteras...');
    
    const carterasCreadas = [];
    
    for (const nombreCartera of nuevasCarteras) {
      // Verificar si ya existe
      const carteraExistente = await query(`
        SELECT id FROM servicios.carteras WHERE name = $1
      `, [nombreCartera]);
      
      if (carteraExistente.rows.length === 0) {
        console.log(`   📝 Creando cartera: "${nombreCartera}"`);
        
        const result = await query(`
          INSERT INTO servicios.carteras (name, created_at)
          VALUES ($1, NOW())
          RETURNING id, name, created_at
        `, [nombreCartera]);
        
        const carteraCreada = result.rows[0];
        carterasCreadas.push(carteraCreada);
        console.log(`   ✅ Cartera "${nombreCartera}" creada con ID: ${carteraCreada.id}`);
      } else {
        console.log(`   ⏭️  Cartera "${nombreCartera}" ya existe, omitiendo`);
      }
    }
    
    // Verificación final
    console.log('\n🔍 Verificación final de carteras:');
    const carterasFinales = await query(`
      SELECT 
        c.id,
        c.name,
        c.created_at,
        COUNT(cl.id) as total_clientes,
        COUNT(n.id) as total_nodos
      FROM servicios.carteras c
      LEFT JOIN servicios.clientes cl ON c.id = cl.cartera_id
      LEFT JOIN servicios.nodos n ON cl.id = n.cliente_id
      GROUP BY c.id, c.name, c.created_at
      ORDER BY c.name
    `);
    
    console.log('📊 Todas las carteras en la base de datos:');
    carterasFinales.rows.forEach(cartera => {
      const fecha = new Date(cartera.created_at).toLocaleDateString('es-CL');
      console.log(`   ID: ${cartera.id} | Nombre: ${cartera.name} | Clientes: ${cartera.total_clientes} | Nodos: ${cartera.total_nodos} | Creado: ${fecha}`);
    });
    
    // Mostrar resumen de carteras creadas
    if (carterasCreadas.length > 0) {
      console.log('\n🎉 Carteras creadas exitosamente:');
      carterasCreadas.forEach(cartera => {
        const fecha = new Date(cartera.created_at).toLocaleDateString('es-CL');
        console.log(`   ✅ ${cartera.name} (ID: ${cartera.id}) - Creado: ${fecha}`);
      });
    } else {
      console.log('\n📋 No se crearon nuevas carteras (todas ya existían)');
    }
    
    console.log('\n🎉 ¡Proceso completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al crear carteras:', error);
    throw error;
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  agregarNuevasCarteras()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { agregarNuevasCarteras };
