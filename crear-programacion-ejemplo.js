/**
 * Script para crear programación de ejemplo para probar el endpoint de copiar
 */

const { query } = require('./config/database');

async function crearProgramacionEjemplo() {
  try {
    console.log('🔍 Verificando datos existentes...\n');

    // 1. Verificar carteras disponibles
    const carteras = await query('SELECT id, name FROM servicios.carteras LIMIT 5');
    console.log(`📁 Carteras disponibles: ${carteras.rows.length}`);
    if (carteras.rows.length > 0) {
      carteras.rows.forEach(c => console.log(`   - ID ${c.id}: ${c.name}`));
    } else {
      console.log('⚠️ No hay carteras. Crear carteras primero.');
      return;
    }
    console.log('');

    // 2. Verificar personal disponible
    const personal = await query('SELECT rut, nombres, cargo FROM mantenimiento.personal_disponible LIMIT 5');
    console.log(`👥 Personal disponible: ${personal.rows.length}`);
    if (personal.rows.length > 0) {
      personal.rows.forEach(p => console.log(`   - ${p.rut}: ${p.nombres} (${p.cargo || 'Sin cargo'})`));
    } else {
      console.log('⚠️ No hay personal. Agregar personal primero.');
      return;
    }
    console.log('');

    // 3. Verificar clientes
    const clientes = await query('SELECT id, nombre FROM servicios.clientes LIMIT 3');
    console.log(`🏢 Clientes disponibles: ${clientes.rows.length}`);
    if (clientes.rows.length > 0) {
      clientes.rows.forEach(c => console.log(`   - ID ${c.id}: ${c.nombre}`));
    }
    console.log('');

    // 4. Verificar programación existente
    const programacionActual = await query(`
      SELECT COUNT(*) as total, 
             MIN(fecha_trabajo) as min_fecha, 
             MAX(fecha_trabajo) as max_fecha
      FROM mantenimiento.programacion_semanal 
      WHERE estado = 'activo'
    `);
    
    console.log(`📅 Programación existente: ${programacionActual.rows[0].total} registros`);
    if (parseInt(programacionActual.rows[0].total) > 0) {
      console.log(`   Rango de fechas: ${programacionActual.rows[0].min_fecha} → ${programacionActual.rows[0].max_fecha}`);
    }
    console.log('');

    // Preguntar si crear datos de ejemplo
    if (parseInt(programacionActual.rows[0].total) > 0) {
      console.log('✅ Ya existe programación. Puedes probar el endpoint con esos datos.');
      console.log('💡 Ajusta fecha_inicio en test-copiar-programacion.js a una fecha dentro del rango mostrado.\n');
      return;
    }

    console.log('📝 Creando programación de ejemplo...\n');

    // Calcular semana actual
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const semanaInicio = lunes.toISOString().split('T')[0];
    const semanaFin = domingo.toISOString().split('T')[0];

    console.log(`📅 Semana a crear: ${semanaInicio} → ${semanaFin}\n`);

    // Crear programación para los primeros 3 trabajadores
    const carteraId = carteras.rows[0].id;
    const clienteId = clientes.rows.length > 0 ? clientes.rows[0].id : null;
    
    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    let totalCreados = 0;

    for (let i = 0; i < Math.min(3, personal.rows.length); i++) {
      const trabajador = personal.rows[i];
      
      // Crear asignaciones para lunes a viernes
      for (let dia = 0; dia < 5; dia++) {
        const fechaTrabajo = new Date(lunes);
        fechaTrabajo.setDate(lunes.getDate() + dia);
        const fechaTrabajoStr = fechaTrabajo.toISOString().split('T')[0];

        try {
          await query(`
            INSERT INTO mantenimiento.programacion_semanal 
            (rut, cartera_id, cliente_id, fecha_trabajo, dia_semana, horas_estimadas, observaciones, estado, semana_inicio, semana_fin)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (rut, cartera_id, semana_inicio) DO NOTHING
          `, [
            trabajador.rut,
            carteraId,
            clienteId,
            fechaTrabajoStr,
            diasSemana[dia],
            8,
            `Programación de ejemplo - ${trabajador.nombres}`,
            'activo',
            semanaInicio,
            semanaFin
          ]);

          totalCreados++;
          console.log(`✅ ${trabajador.rut} - ${diasSemana[dia]} ${fechaTrabajoStr}`);
        } catch (err) {
          if (!err.message.includes('duplicate')) {
            console.error(`❌ Error: ${err.message}`);
          }
        }
      }
    }

    console.log(`\n🎉 Programación de ejemplo creada: ${totalCreados} asignaciones`);
    console.log(`\n📋 Datos para test-copiar-programacion.js:`);
    console.log(`   fecha_inicio: "${semanaInicio}"`);
    console.log(`   cartera_id: ${carteraId}`);
    console.log(`\n💡 Ahora puedes ejecutar: node test-copiar-programacion.js`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    process.exit(0);
  }
}

crearProgramacionEjemplo();
