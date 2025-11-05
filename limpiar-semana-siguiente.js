/**
 * Script para eliminar programación de una semana específica
 * Útil para probar el endpoint de copiar
 */

const { query } = require('./config/database');

async function eliminarProgramacionSemana() {
  try {
    const cartera_id = 6;
    const fecha_inicio_siguiente = '2025-11-10'; // Lunes de la siguiente semana
    const fecha_fin_siguiente = '2025-11-16';    // Domingo de la siguiente semana

    console.log('🗑️ Eliminando programación existente...\n');
    console.log(`   Cartera: ${cartera_id}`);
    console.log(`   Semana: ${fecha_inicio_siguiente} → ${fecha_fin_siguiente}\n`);

    // Ver qué hay antes de eliminar
    const antes = await query(`
      SELECT id, rut, fecha_trabajo, dia_semana 
      FROM mantenimiento.programacion_optimizada 
      WHERE cartera_id = $1 
        AND fecha_trabajo BETWEEN $2 AND $3
      ORDER BY fecha_trabajo, rut
    `, [cartera_id, fecha_inicio_siguiente, fecha_fin_siguiente]);

    console.log(`📋 Asignaciones encontradas: ${antes.rows.length}`);
    if (antes.rows.length > 0) {
      antes.rows.forEach((asig, idx) => {
        console.log(`   ${idx + 1}. ID ${asig.id}: ${asig.rut} - ${asig.dia_semana} ${asig.fecha_trabajo}`);
      });
      console.log('');
    }

    // Eliminar
    const resultado = await query(`
      DELETE FROM mantenimiento.programacion_optimizada 
      WHERE cartera_id = $1 
        AND fecha_trabajo BETWEEN $2 AND $3
    `, [cartera_id, fecha_inicio_siguiente, fecha_fin_siguiente]);

    console.log(`✅ Eliminadas ${resultado.rowCount} asignaciones`);
    console.log('\n💡 Ahora puedes ejecutar: node test-copiar-optimizada.js\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

eliminarProgramacionSemana();
