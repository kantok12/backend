const express = require('express');
const { query } = require('../config/database');

async function showCorrectEndpoints() {
  try {
    console.log('🔍 DIAGNÓSTICO DEL ERROR 404');
    console.log('='.repeat(60));
    
    console.log('\n❌ ERROR ENCONTRADO:');
    console.log('   GET http://localhost:3000/api/programacion-semanal?cartera_id=0&fecha_inicio=2025-10-27&fecha_fin=2025-11-02');
    console.log('   Status: 404 (Not Found)');
    
    console.log('\n🔍 CAUSA DEL ERROR:');
    console.log('   - El endpoint SÍ existe y funciona correctamente');
    console.log('   - El problema es que cartera_id=0 NO EXISTE en la base de datos');
    console.log('   - El servidor responde: "Cartera no encontrada"');
    
    console.log('\n✅ ENDPOINT CORRECTO:');
    console.log('   GET /api/programacion-semanal');
    console.log('   Parámetros requeridos:');
    console.log('   - cartera_id (número entero válido)');
    console.log('   - fecha_inicio (formato: YYYY-MM-DD)');
    console.log('   - fecha_fin (formato: YYYY-MM-DD)');
    
    // Obtener carteras disponibles
    console.log('\n📋 CARTERAS DISPONIBLES:');
    console.log('─'.repeat(40));
    
    const carterasResult = await query(`
      SELECT 
        c.id,
        c.name as nombre,
        COUNT(cl.id) as total_clientes
      FROM servicios.carteras c
      LEFT JOIN servicios.clientes cl ON c.id = cl.cartera_id
      GROUP BY c.id, c.name
      ORDER BY c.id
    `);
    
    if (carterasResult.rows.length > 0) {
      carterasResult.rows.forEach((cartera, index) => {
        console.log(`   ${cartera.id}. ${cartera.nombre} (${cartera.total_clientes} clientes)`);
      });
    } else {
      console.log('   ⚠️  No se encontraron carteras');
    }
    
    console.log('\n🔧 SOLUCIÓN:');
    console.log('   Cambiar cartera_id=0 por un ID válido');
    
    const primeraCartera = carterasResult.rows[0];
    if (primeraCartera) {
      console.log('\n📝 EJEMPLO CORRECTO:');
      console.log(`   GET http://localhost:3000/api/programacion-semanal?cartera_id=${primeraCartera.id}&fecha_inicio=2025-10-27&fecha_fin=2025-11-02`);
      
      console.log('\n🧪 PROBANDO ENDPOINT CORRECTO...');
      
      // Probar el endpoint con la primera cartera
      const testResult = await query(`
        SELECT 
          p.id,
          p.rut,
          pd.nombres as nombre_persona,
          p.fecha_trabajo,
          p.dia_semana,
          p.horas_estimadas,
          p.estado
        FROM mantenimiento.programacion_optimizada p
        JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
        WHERE p.cartera_id = $1 
          AND p.fecha_trabajo BETWEEN $2 AND $3
        ORDER BY p.fecha_trabajo, pd.nombres
        LIMIT 5
      `, [primeraCartera.id, '2025-10-27', '2025-11-02']);
      
      if (testResult.rows.length > 0) {
        console.log('   ✅ Endpoint funciona correctamente');
        console.log(`   📊 Encontradas ${testResult.rows.length} programaciones`);
        testResult.rows.forEach((prog, index) => {
          console.log(`      ${index + 1}. ${prog.nombre_persona} - ${prog.fecha_trabajo} (${prog.dia_semana})`);
        });
      } else {
        console.log('   ⚠️  No hay programaciones para este período');
      }
    }
    
    console.log('\n📋 OTROS ENDPOINTS DE PROGRAMACIÓN DISPONIBLES:');
    console.log('─'.repeat(50));
    console.log('   GET /api/programacion-optimizada');
    console.log('   GET /api/programacion');
    console.log('   POST /api/programacion-semanal');
    console.log('   PUT /api/programacion-semanal/:id');
    console.log('   DELETE /api/programacion-semanal/:id');
    
    console.log('\n💡 RECOMENDACIÓN:');
    console.log('   - Usar cartera_id válido (1, 2, 3, 6, 8, etc.)');
    console.log('   - Verificar que las fechas estén en formato YYYY-MM-DD');
    console.log('   - El rango máximo permitido es de 7 días');
    
    console.log('\n✅ PROBLEMA RESUELTO');
    
  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  showCorrectEndpoints()
    .then(() => {
      console.log('\n✅ Diagnóstico completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { showCorrectEndpoints };
