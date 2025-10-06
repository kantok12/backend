const { query } = require('../config/database');

async function migrateToServiciosSchema() {
  try {
    console.log('🚀 Iniciando migración de datos a esquema servicios...\n');

    // 1. Migrar carteras
    console.log('1️⃣ Migrando carteras...');
    const carterasResult = await query(`
      INSERT INTO servicios.carteras (name, created_at)
      SELECT nombre, fecha_creacion
      FROM mantenimiento.carteras
      WHERE activo = true
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `);

    console.log(`   ✅ ${carterasResult.rows.length} carteras migradas`);

    // 2. Migrar clientes
    console.log('\n2️⃣ Migrando clientes...');
    const clientesResult = await query(`
      INSERT INTO servicios.clientes (nombre, cartera_id, created_at)
      SELECT 
        c.nombre,
        sc.id as cartera_id,
        c.fecha_creacion
      FROM mantenimiento.clientes c
      JOIN servicios.carteras sc ON sc.name = (
        SELECT ca.nombre 
        FROM mantenimiento.carteras ca 
        WHERE ca.id = c.cartera_id
      )
      WHERE c.activo = true
      ON CONFLICT (nombre) DO NOTHING
      RETURNING id, nombre
    `);

    console.log(`   ✅ ${clientesResult.rows.length} clientes migrados`);

    // 3. Migrar nodos
    console.log('\n3️⃣ Migrando nodos...');
    const nodosResult = await query(`
      INSERT INTO servicios.nodos (nombre, cliente_id, created_at)
      SELECT 
        n.nombre,
        sc.id as cliente_id,
        n.fecha_creacion
      FROM mantenimiento.nodos n
      JOIN servicios.clientes sc ON sc.nombre = (
        SELECT cl.nombre 
        FROM mantenimiento.clientes cl 
        WHERE cl.id = n.cliente_id
      )
      WHERE n.activo = true
      ON CONFLICT (nombre) DO NOTHING
      RETURNING id, nombre
    `);

    console.log(`   ✅ ${nodosResult.rows.length} nodos migrados`);

    // 4. Verificar migración
    console.log('\n4️⃣ Verificando migración...');
    
    const carterasCount = await query('SELECT COUNT(*) as count FROM servicios.carteras');
    const clientesCount = await query('SELECT COUNT(*) as count FROM servicios.clientes');
    const nodosCount = await query('SELECT COUNT(*) as count FROM servicios.nodos');

    console.log(`   📊 Carteras en servicios: ${carterasCount.rows[0].count}`);
    console.log(`   📊 Clientes en servicios: ${clientesCount.rows[0].count}`);
    console.log(`   📊 Nodos en servicios: ${nodosCount.rows[0].count}`);

    // 5. Mostrar algunos ejemplos
    console.log('\n5️⃣ Ejemplos de datos migrados:');
    
    const carterasEjemplo = await query(`
      SELECT name, created_at 
      FROM servicios.carteras 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('   Carteras:');
    carterasEjemplo.rows.forEach(cartera => {
      console.log(`     - ${cartera.name} (${cartera.created_at})`);
    });

    const clientesEjemplo = await query(`
      SELECT c.nombre, ca.name as cartera
      FROM servicios.clientes c
      JOIN servicios.carteras ca ON ca.id = c.cartera_id
      ORDER BY c.created_at DESC 
      LIMIT 3
    `);
    
    console.log('   Clientes:');
    clientesEjemplo.rows.forEach(cliente => {
      console.log(`     - ${cliente.nombre} (${cliente.cartera})`);
    });

    const nodosEjemplo = await query(`
      SELECT n.nombre, c.nombre as cliente
      FROM servicios.nodos n
      JOIN servicios.clientes c ON c.id = n.cliente_id
      ORDER BY n.created_at DESC 
      LIMIT 3
    `);
    
    console.log('   Nodos:');
    nodosEjemplo.rows.forEach(nodo => {
      console.log(`     - ${nodo.nombre} (${nodo.cliente})`);
    });

    console.log('\n🎉 Migración completada exitosamente!');
    console.log('📊 Los datos ahora están disponibles en el esquema servicios');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
  }
}

migrateToServiciosSchema();

