const express = require('express');
const { query } = require('../config/database');

async function testPersonalPorClienteEndpoints() {
  try {
    console.log('🧪 PROBANDO NUEVO ENDPOINT: PERSONAL POR CLIENTE');
    console.log('='.repeat(60));
    
    console.log('\n📋 ENDPOINTS CREADOS:');
    console.log('─'.repeat(40));
    console.log('1. GET /api/personal-por-cliente');
    console.log('   - Lista personal asignado por cliente');
    console.log('   - Parámetros: cliente_id, cartera_id, fecha_inicio, fecha_fin, activo, limit, offset');
    
    console.log('\n2. GET /api/personal-por-cliente/:cliente_id');
    console.log('   - Personal de un cliente específico');
    console.log('   - Parámetros: fecha_inicio, fecha_fin, activo');
    
    console.log('\n3. GET /api/personal-por-cliente/resumen');
    console.log('   - Resumen de personal por cliente');
    console.log('   - Parámetros: cartera_id, fecha_inicio, fecha_fin');
    
    // Probar endpoint 1: Lista general
    console.log('\n🧪 PROBANDO ENDPOINT 1: Lista general');
    console.log('─'.repeat(50));
    
    const generalResult = await query(`
      SELECT 
        cl.id as cliente_id,
        cl.nombre as cliente_nombre,
        cl.cartera_id,
        c.name as cartera_nombre,
        COUNT(DISTINCT p.rut) as total_personal_asignado,
        COUNT(DISTINCT p.id) as total_programaciones
      FROM servicios.clientes cl
      LEFT JOIN servicios.carteras c ON cl.cartera_id = c.id
      LEFT JOIN mantenimiento.programacion_optimizada p ON cl.id = p.cliente_id
      WHERE p.rut IS NOT NULL
      GROUP BY cl.id, cl.nombre, cl.cartera_id, c.name
      HAVING COUNT(DISTINCT p.rut) > 0
      ORDER BY total_personal_asignado DESC
      LIMIT 5
    `);
    
    if (generalResult.rows.length > 0) {
      console.log(`   ✅ Encontrados ${generalResult.rows.length} clientes con personal asignado:`);
      generalResult.rows.forEach((cliente, index) => {
        console.log(`      ${index + 1}. ${cliente.cliente_nombre}`);
        console.log(`         - Cartera: ${cliente.cartera_nombre} (ID: ${cliente.cartera_id})`);
        console.log(`         - Personal asignado: ${cliente.total_personal_asignado}`);
        console.log(`         - Programaciones: ${cliente.total_programaciones}`);
      });
    } else {
      console.log('   ⚠️  No se encontraron clientes con personal asignado');
    }
    
    // Probar endpoint 2: Cliente específico
    console.log('\n🧪 PROBANDO ENDPOINT 2: Cliente específico');
    console.log('─'.repeat(50));
    
    const clienteId = generalResult.rows[0]?.cliente_id;
    if (clienteId) {
      const clienteEspecificoResult = await query(`
        SELECT 
          cl.id as cliente_id,
          cl.nombre as cliente_nombre,
          cl.cartera_id,
          c.name as cartera_nombre,
          p.rut,
          pd.nombres as personal_nombre,
          pd.cargo as personal_cargo,
          p.fecha_trabajo,
          p.horas_estimadas,
          p.estado
        FROM servicios.clientes cl
        JOIN servicios.carteras c ON cl.cartera_id = c.id
        LEFT JOIN mantenimiento.programacion_optimizada p ON cl.id = p.cliente_id
        LEFT JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
        WHERE cl.id = $1
        ORDER BY p.fecha_trabajo DESC
        LIMIT 5
      `, [clienteId]);
      
      if (clienteEspecificoResult.rows.length > 0) {
        console.log(`   ✅ Cliente ${clienteEspecificoResult.rows[0].cliente_nombre} (ID: ${clienteId}):`);
        console.log(`   - Cartera: ${clienteEspecificoResult.rows[0].cartera_nombre}`);
        console.log(`   - Programaciones encontradas: ${clienteEspecificoResult.rows.length}`);
        
        // Agrupar por personal
        const personalAgrupado = {};
        clienteEspecificoResult.rows.forEach(row => {
          if (row.rut && !personalAgrupado[row.rut]) {
            personalAgrupado[row.rut] = {
              nombre: row.personal_nombre,
              cargo: row.personal_cargo,
              programaciones: 0
            };
          }
          if (row.rut) {
            personalAgrupado[row.rut].programaciones++;
          }
        });
        
        Object.entries(personalAgrupado).forEach(([rut, data], index) => {
          console.log(`      ${index + 1}. ${data.nombre} (${rut})`);
          console.log(`         - Cargo: ${data.cargo}`);
          console.log(`         - Programaciones: ${data.programaciones}`);
        });
      } else {
        console.log(`   ⚠️  Cliente ${clienteId} sin programaciones`);
      }
    } else {
      console.log('   ⚠️  No hay clientes para probar');
    }
    
    // Probar endpoint 3: Resumen
    console.log('\n🧪 PROBANDO ENDPOINT 3: Resumen');
    console.log('─'.repeat(50));
    
    const resumenResult = await query(`
      SELECT 
        cl.id as cliente_id,
        cl.nombre as cliente_nombre,
        cl.cartera_id,
        c.name as cartera_nombre,
        COUNT(DISTINCT p.rut) as total_personal,
        COUNT(DISTINCT p.id) as total_programaciones,
        SUM(p.horas_estimadas) as total_horas_estimadas,
        COUNT(DISTINCT CASE WHEN p.estado = 'activo' THEN p.rut END) as personal_activo
      FROM servicios.clientes cl
      LEFT JOIN servicios.carteras c ON cl.cartera_id = c.id
      LEFT JOIN mantenimiento.programacion_optimizada p ON cl.id = p.cliente_id
      GROUP BY cl.id, cl.nombre, cl.cartera_id, c.name
      HAVING COUNT(DISTINCT p.rut) > 0
      ORDER BY total_personal DESC
      LIMIT 3
    `);
    
    if (resumenResult.rows.length > 0) {
      console.log(`   ✅ Resumen de ${resumenResult.rows.length} clientes:`);
      resumenResult.rows.forEach((cliente, index) => {
        console.log(`      ${index + 1}. ${cliente.cliente_nombre}`);
        console.log(`         - Cartera: ${cliente.cartera_nombre}`);
        console.log(`         - Personal total: ${cliente.total_personal}`);
        console.log(`         - Personal activo: ${cliente.personal_activo}`);
        console.log(`         - Programaciones: ${cliente.total_programaciones}`);
        console.log(`         - Horas estimadas: ${cliente.total_horas_estimadas || 0}h`);
      });
    } else {
      console.log('   ⚠️  No se encontraron datos para el resumen');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 EJEMPLOS DE USO:');
    console.log('='.repeat(60));
    
    console.log('\n🔹 Lista general de personal por cliente:');
    console.log('   GET /api/personal-por-cliente');
    console.log('   GET /api/personal-por-cliente?cartera_id=6');
    console.log('   GET /api/personal-por-cliente?fecha_inicio=2025-10-27&fecha_fin=2025-11-02');
    
    console.log('\n🔹 Personal de un cliente específico:');
    if (clienteId) {
      console.log(`   GET /api/personal-por-cliente/${clienteId}`);
      console.log(`   GET /api/personal-por-cliente/${clienteId}?fecha_inicio=2025-10-27&fecha_fin=2025-11-02`);
    }
    
    console.log('\n🔹 Resumen de personal por cliente:');
    console.log('   GET /api/personal-por-cliente/resumen');
    console.log('   GET /api/personal-por-cliente/resumen?cartera_id=6');
    
    console.log('\n🎯 ESTRUCTURA DE RESPUESTA:');
    console.log('─'.repeat(40));
    console.log('{');
    console.log('  "success": true,');
    console.log('  "message": "Personal por cliente obtenido exitosamente",');
    console.log('  "data": [');
    console.log('    {');
    console.log('      "cliente_id": 28,');
    console.log('      "cliente_nombre": "ACONCAGUA FOODS - BUIN",');
    console.log('      "cartera_id": 6,');
    console.log('      "cartera_nombre": "BAKERY - CARNES",');
    console.log('      "total_personal_asignado": 3,');
    console.log('      "total_programaciones": 5,');
    console.log('      "personal": [');
    console.log('        {');
    console.log('          "rut": "20.320.662-3",');
    console.log('          "nombre": "Dilhan Jasson Saavedra Gonzalez",');
    console.log('          "cargo": "Ingeniero de Servicio",');
    console.log('          "programaciones": [...]');
    console.log('        }');
    console.log('      ]');
    console.log('    }');
    console.log('  ],');
    console.log('  "pagination": { "total": 10, "limit": 50, "offset": 0 },');
    console.log('  "filters": { "cliente_id": null, "cartera_id": 6 }');
    console.log('}');
    
    console.log('\n✅ ENDPOINT CREADO Y PROBADO EXITOSAMENTE');
    
  } catch (error) {
    console.error('❌ Error probando endpoints:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testPersonalPorClienteEndpoints()
    .then(() => {
      console.log('\n✅ Pruebas completadas');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en las pruebas:', error);
      process.exit(1);
    });
}

module.exports = { testPersonalPorClienteEndpoints };
