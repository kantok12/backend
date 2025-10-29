const express = require('express');
const { query } = require('../config/database');

async function showProgrammingEndpoints() {
  try {
    console.log('📋 ENDPOINTS DE PROGRAMACIÓN DISPONIBLES');
    console.log('='.repeat(80));
    
    // 1. Endpoints de Programación Básica
    console.log('\n🔹 PROGRAMACIÓN BÁSICA (/api/programacion)');
    console.log('─'.repeat(50));
    console.log('GET    /api/programacion');
    console.log('POST   /api/programacion');
    console.log('PUT    /api/programacion/:id');
    console.log('DELETE /api/programacion/:id');
    
    // 2. Endpoints de Programación Semanal
    console.log('\n🔹 PROGRAMACIÓN SEMANAL (/api/programacion-semanal)');
    console.log('─'.repeat(50));
    console.log('GET    /api/programacion-semanal');
    console.log('POST   /api/programacion-semanal');
    console.log('PUT    /api/programacion-semanal/:id');
    console.log('DELETE /api/programacion-semanal/:id');
    
    // 3. Endpoints de Programación Optimizada
    console.log('\n🔹 PROGRAMACIÓN OPTIMIZADA (/api/programacion-optimizada)');
    console.log('─'.repeat(50));
    console.log('GET    /api/programacion-optimizada');
    console.log('POST   /api/programacion-optimizada');
    console.log('PUT    /api/programacion-optimizada/:id');
    console.log('DELETE /api/programacion-optimizada/:id');
    
    // 4. Endpoints de Asignaciones
    console.log('\n🔹 ASIGNACIONES (/api/asignaciones)');
    console.log('─'.repeat(50));
    console.log('GET    /api/asignaciones/persona/:rut');
    console.log('POST   /api/asignaciones/persona/:rut/carteras');
    console.log('DELETE /api/asignaciones/persona/:rut/carteras/:cartera_id');
    console.log('POST   /api/asignaciones/persona/:rut/clientes');
    console.log('DELETE /api/asignaciones/persona/:rut/clientes/:cliente_id');
    console.log('POST   /api/asignaciones/persona/:rut/nodos');
    console.log('DELETE /api/asignaciones/persona/:rut/nodos/:nodo_id');
    
    // 5. Endpoints de Clientes
    console.log('\n🔹 CLIENTES (/api/clientes)');
    console.log('─'.repeat(50));
    console.log('GET    /api/clientes');
    console.log('GET    /api/clientes/:id');
    console.log('POST   /api/clientes');
    console.log('PUT    /api/clientes/:id');
    console.log('DELETE /api/clientes/:id');
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 INFORMACIÓN SOBRE CLIENTES Y ASIGNACIONES');
    console.log('='.repeat(80));
    
    // Mostrar información de clientes disponibles
    console.log('\n👥 CLIENTES DISPONIBLES:');
    console.log('─'.repeat(50));
    
    const clientesResult = await query(`
      SELECT 
        cl.id,
        cl.nombre,
        cl.cartera_id,
        c.name as cartera_nombre,
        COUNT(n.id) as total_nodos
      FROM servicios.clientes cl
      LEFT JOIN servicios.carteras c ON cl.cartera_id = c.id
      LEFT JOIN servicios.nodos n ON cl.id = n.cliente_id
      GROUP BY cl.id, cl.nombre, cl.cartera_id, c.name
      ORDER BY cl.nombre
      LIMIT 10
    `);
    
    if (clientesResult.rows.length > 0) {
      clientesResult.rows.forEach((cliente, index) => {
        console.log(`   ${index + 1}. ${cliente.nombre}`);
        console.log(`      - ID: ${cliente.id}`);
        console.log(`      - Cartera: ${cliente.cartera_nombre} (ID: ${cliente.cartera_id})`);
        console.log(`      - Nodos: ${cliente.total_nodos}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No se encontraron clientes');
    }
    
    // Mostrar información de carteras disponibles
    console.log('\n💼 CARTERAS DISPONIBLES:');
    console.log('─'.repeat(50));
    
    const carterasResult = await query(`
      SELECT 
        c.id,
        c.name as nombre,
        COUNT(cl.id) as total_clientes
      FROM servicios.carteras c
      LEFT JOIN servicios.clientes cl ON c.id = cl.cartera_id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    
    if (carterasResult.rows.length > 0) {
      carterasResult.rows.forEach((cartera, index) => {
        console.log(`   ${index + 1}. ${cartera.nombre}`);
        console.log(`      - ID: ${cartera.id}`);
        console.log(`      - Clientes: ${cartera.total_clientes}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No se encontraron carteras');
    }
    
    // Mostrar información de personal con asignaciones
    console.log('\n👤 PERSONAL CON ASIGNACIONES:');
    console.log('─'.repeat(50));
    
    const personalResult = await query(`
      SELECT 
        pd.rut,
        pd.nombres,
        pd.cargo,
        COUNT(DISTINCT pc.cartera_id) as carteras_asignadas,
        COUNT(DISTINCT pcli.cliente_id) as clientes_asignados,
        COUNT(DISTINCT pn.nodo_id) as nodos_asignados
      FROM mantenimiento.personal_disponible pd
      LEFT JOIN mantenimiento.personal_carteras pc ON pd.rut = pc.rut
      LEFT JOIN mantenimiento.personal_clientes pcli ON pd.rut = pcli.rut
      LEFT JOIN mantenimiento.personal_nodos pn ON pd.rut = pn.rut
      GROUP BY pd.rut, pd.nombres, pd.cargo
      HAVING COUNT(DISTINCT pc.cartera_id) > 0 
          OR COUNT(DISTINCT pcli.cliente_id) > 0 
          OR COUNT(DISTINCT pn.nodo_id) > 0
      ORDER BY pd.nombres
      LIMIT 10
    `);
    
    if (personalResult.rows.length > 0) {
      personalResult.rows.forEach((persona, index) => {
        console.log(`   ${index + 1}. ${persona.nombres}`);
        console.log(`      - RUT: ${persona.rut}`);
        console.log(`      - Cargo: ${persona.cargo}`);
        console.log(`      - Carteras: ${persona.carteras_asignadas}`);
        console.log(`      - Clientes: ${persona.clientes_asignados}`);
        console.log(`      - Nodos: ${persona.nodos_asignados}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No se encontró personal con asignaciones');
    }
    
    // Mostrar programaciones recientes
    console.log('\n📅 PROGRAMACIONES RECIENTES:');
    console.log('─'.repeat(50));
    
    const programacionResult = await query(`
      SELECT 
        p.id,
        pd.nombres as persona,
        c.name as cartera,
        cl.nombre as cliente,
        n.nombre as nodo,
        p.fecha_trabajo,
        p.horas_estimadas,
        p.estado
      FROM mantenimiento.programacion_optimizada p
      JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      JOIN servicios.carteras c ON c.id = p.cartera_id
      LEFT JOIN servicios.clientes cl ON cl.id = p.cliente_id
      LEFT JOIN servicios.nodos n ON n.id = p.nodo_id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);
    
    if (programacionResult.rows.length > 0) {
      programacionResult.rows.forEach((prog, index) => {
        console.log(`   ${index + 1}. ${prog.persona} - ${prog.cartera}`);
        console.log(`      - Cliente: ${prog.cliente || 'Sin asignar'}`);
        console.log(`      - Nodo: ${prog.nodo || 'Sin asignar'}`);
        console.log(`      - Fecha: ${prog.fecha_trabajo}`);
        console.log(`      - Horas: ${prog.horas_estimadas}h`);
        console.log(`      - Estado: ${prog.estado}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No se encontraron programaciones');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 EJEMPLOS DE USO DE ENDPOINTS');
    console.log('='.repeat(80));
    
    const ejemploRut = personalResult.rows[0]?.rut || '20.011.078-1';
    const ejemploCartera = carterasResult.rows[0]?.id || 1;
    const ejemploCliente = clientesResult.rows[0]?.id || 1;
    
    console.log('\n🔹 OBTENER PROGRAMACIÓN:');
    console.log(`   GET /api/programacion-optimizada?cartera_id=${ejemploCartera}&fecha_inicio=2024-01-15&fecha_fin=2024-01-21`);
    
    console.log('\n🔹 OBTENER ASIGNACIONES DE PERSONA:');
    console.log(`   GET /api/asignaciones/persona/${ejemploRut}`);
    
    console.log('\n🔹 OBTENER CLIENTES:');
    console.log(`   GET /api/clientes?cartera_id=${ejemploCartera}`);
    
    console.log('\n🔹 CREAR PROGRAMACIÓN:');
    console.log(`   POST /api/programacion-optimizada`);
    console.log(`   Body: {`);
    console.log(`     "rut": "${ejemploRut}",`);
    console.log(`     "cartera_id": ${ejemploCartera},`);
    console.log(`     "cliente_id": ${ejemploCliente},`);
    console.log(`     "fechas_trabajo": ["2024-01-15", "2024-01-16"],`);
    console.log(`     "horas_estimadas": 8`);
    console.log(`   }`);
    
    console.log('\n🔹 ASIGNAR CLIENTE A PERSONA:');
    console.log(`   POST /api/asignaciones/persona/${ejemploRut}/clientes`);
    console.log(`   Body: { "cliente_id": ${ejemploCliente} }`);
    
    console.log('\n✅ INFORMACIÓN COMPLETA MOSTRADA');
    
  } catch (error) {
    console.error('❌ Error obteniendo información:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  showProgrammingEndpoints()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { showProgrammingEndpoints };
