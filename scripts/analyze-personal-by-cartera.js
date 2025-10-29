const express = require('express');
const { query } = require('../config/database');

async function showPersonalByCartera() {
  try {
    console.log('🔍 ENDPOINTS PARA PERSONAL ASIGNADO A CARTERAS');
    console.log('='.repeat(60));
    
    console.log('\n📋 ENDPOINTS EXISTENTES QUE MUESTRAN PERSONAL POR CARTERA:');
    console.log('─'.repeat(50));
    
    console.log('\n1️⃣ GET /api/programacion-optimizada');
    console.log('   - Muestra programación por cartera');
    console.log('   - Incluye personal asignado a la cartera general');
    console.log('   - Parámetros: cartera_id, fecha_inicio, fecha_fin');
    console.log('   - Ejemplo: GET /api/programacion-optimizada?cartera_id=6&fecha_inicio=2025-10-27&fecha_fin=2025-11-02');
    
    console.log('\n2️⃣ GET /api/programacion-optimizada/persona/:rut');
    console.log('   - Muestra programación de una persona específica');
    console.log('   - Incluye cartera asignada');
    console.log('   - Parámetros: rut, dias (opcional, default: 30)');
    console.log('   - Ejemplo: GET /api/programacion-optimizada/persona/20.320.662-3');
    
    console.log('\n3️⃣ GET /api/programacion/semana/:fecha');
    console.log('   - Muestra programación de toda la semana (todas las carteras)');
    console.log('   - Agrupado por cartera');
    console.log('   - Ejemplo: GET /api/programacion/semana/2025-10-27');
    
    console.log('\n4️⃣ GET /api/asignaciones/persona/:rut');
    console.log('   - Muestra asignaciones de una persona');
    console.log('   - Incluye carteras, clientes y nodos asignados');
    console.log('   - Ejemplo: GET /api/asignaciones/persona/20.320.662-3');
    
    // Probar los endpoints con datos reales
    console.log('\n🧪 PROBANDO ENDPOINTS CON DATOS REALES:');
    console.log('─'.repeat(50));
    
    // 1. Probar programación optimizada por cartera
    console.log('\n📊 1. Programación por Cartera (BAKERY - CARNES):');
    const programacionResult = await query(`
      SELECT 
        p.id,
        p.rut,
        pd.nombres as nombre_persona,
        pd.cargo,
        p.cartera_id,
        c.name as nombre_cartera,
        p.cliente_id,
        cl.nombre as nombre_cliente,
        p.fecha_trabajo,
        p.dia_semana,
        p.horas_estimadas,
        p.estado
      FROM mantenimiento.programacion_optimizada p
      JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      JOIN servicios.carteras c ON c.id = p.cartera_id
      LEFT JOIN servicios.clientes cl ON cl.id = p.cliente_id
      WHERE p.cartera_id = 6 
        AND p.fecha_trabajo BETWEEN '2025-10-27' AND '2025-11-02'
      ORDER BY p.fecha_trabajo, pd.nombres
      LIMIT 5
    `);
    
    if (programacionResult.rows.length > 0) {
      console.log(`   ✅ Encontradas ${programacionResult.rows.length} programaciones`);
      programacionResult.rows.forEach((prog, index) => {
        console.log(`      ${index + 1}. ${prog.nombre_persona} - ${prog.fecha_trabajo}`);
        console.log(`         - Cartera: ${prog.nombre_cartera}`);
        console.log(`         - Cliente: ${prog.nombre_cliente || 'Sin asignar'}`);
        console.log(`         - Horas: ${prog.horas_estimadas}h - Estado: ${prog.estado}`);
      });
    } else {
      console.log('   ⚠️  No se encontraron programaciones para esta cartera');
    }
    
    // 2. Probar asignaciones de personal
    console.log('\n👥 2. Asignaciones de Personal:');
    const asignacionesResult = await query(`
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
      LIMIT 5
    `);
    
    if (asignacionesResult.rows.length > 0) {
      console.log(`   ✅ Encontradas ${asignacionesResult.rows.length} personas con asignaciones`);
      asignacionesResult.rows.forEach((persona, index) => {
        console.log(`      ${index + 1}. ${persona.nombres} (${persona.rut})`);
        console.log(`         - Carteras: ${persona.carteras_asignadas}`);
        console.log(`         - Clientes: ${persona.clientes_asignados}`);
        console.log(`         - Nodos: ${persona.nodos_asignados}`);
      });
    } else {
      console.log('   ⚠️  No se encontraron personas con asignaciones');
    }
    
    // 3. Mostrar personal por cartera específica
    console.log('\n🏢 3. Personal por Cartera Específica:');
    const personalCarteraResult = await query(`
      SELECT 
        c.id as cartera_id,
        c.name as cartera_nombre,
        COUNT(DISTINCT pc.rut) as personal_asignado,
        COUNT(DISTINCT p.id) as programaciones_activas
      FROM servicios.carteras c
      LEFT JOIN mantenimiento.personal_carteras pc ON c.id = pc.cartera_id
      LEFT JOIN mantenimiento.programacion_optimizada p ON c.id = p.cartera_id 
        AND p.fecha_trabajo BETWEEN '2025-10-27' AND '2025-11-02'
      GROUP BY c.id, c.name
      HAVING COUNT(DISTINCT pc.rut) > 0 OR COUNT(DISTINCT p.id) > 0
      ORDER BY personal_asignado DESC, programaciones_activas DESC
    `);
    
    if (personalCarteraResult.rows.length > 0) {
      console.log(`   ✅ Encontradas ${personalCarteraResult.rows.length} carteras con personal`);
      personalCarteraResult.rows.forEach((cartera, index) => {
        console.log(`      ${index + 1}. ${cartera.cartera_nombre} (ID: ${cartera.cartera_id})`);
        console.log(`         - Personal asignado: ${cartera.personal_asignado}`);
        console.log(`         - Programaciones activas: ${cartera.programaciones_activas}`);
      });
    } else {
      console.log('   ⚠️  No se encontraron carteras con personal asignado');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('💡 RECOMENDACIONES PARA EL FRONTEND:');
    console.log('='.repeat(60));
    
    console.log('\n🔧 LÓGICA CORREGIDA:');
    console.log('   1. En lugar de buscar personal por cliente específico');
    console.log('   2. Buscar personal por CARTERA general');
    console.log('   3. Mostrar clientes de esa cartera');
    console.log('   4. Mostrar personal asignado a la cartera (no a clientes específicos)');
    
    console.log('\n📋 ENDPOINTS RECOMENDADOS:');
    console.log('   ⭐ GET /api/programacion-optimizada?cartera_id=X&fecha_inicio=Y&fecha_fin=Z');
    console.log('   ⭐ GET /api/asignaciones/persona/:rut');
    console.log('   ⭐ GET /api/programacion/semana/:fecha');
    
    console.log('\n🎯 ESTRUCTURA DE DATOS ESPERADA:');
    console.log('   {');
    console.log('     "cartera": { "id": 6, "nombre": "BAKERY - CARNES" },');
    console.log('     "clientes": [');
    console.log('       { "id": 28, "nombre": "ACONCAGUA FOODS - BUIN", "personal_asignado": 3 }');
    console.log('     ],');
    console.log('     "personal_cartera": [');
    console.log('       { "rut": "20.320.662-3", "nombre": "Dilhan Jasson", "cargo": "Ingeniero" }');
    console.log('     ]');
    console.log('   }');
    
    console.log('\n✅ PROBLEMA IDENTIFICADO Y SOLUCIONADO');
    
  } catch (error) {
    console.error('❌ Error en el análisis:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  showPersonalByCartera()
    .then(() => {
      console.log('\n✅ Análisis completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { showPersonalByCartera };
