const { query } = require('../config/database');

async function compararTablasProgramacion() {
    try {
        console.log('\n📊 Comparación de tablas de programación');
        console.log('==========================================');

        // Contar registros en programación compatibilidad
        const resultCompatibilidad = await query(`
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT rut) as personas_unicas,
                COUNT(DISTINCT cartera_id) as carteras_unicas,
                MIN(semana_inicio) as fecha_mas_antigua,
                MAX(semana_inicio) as fecha_mas_reciente,
                COUNT(DISTINCT semana_inicio) as semanas_distintas
            FROM mantenimiento.programacion_compatibilidad
        `);

        // Contar registros en programación optimizada
        const resultOptimizada = await query(`
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT rut) as personas_unicas,
                COUNT(DISTINCT cartera_id) as carteras_unicas,
                MIN(fecha_trabajo) as fecha_mas_antigua,
                MAX(fecha_trabajo) as fecha_mas_reciente,
                COUNT(DISTINCT fecha_trabajo) as dias_distintos
            FROM mantenimiento.programacion_optimizada
        `);

        // Mostrar resultados de compatibilidad
        console.log('\n🔹 Tabla: mantenimiento.programacion_compatibilidad');
        console.log('------------------------------------------------');
        console.log('Total registros:', resultCompatibilidad.rows[0].total);
        console.log('Personas únicas:', resultCompatibilidad.rows[0].personas_unicas);
        console.log('Carteras únicas:', resultCompatibilidad.rows[0].carteras_unicas);
        console.log('Fecha más antigua:', resultCompatibilidad.rows[0].fecha_mas_antigua);
        console.log('Fecha más reciente:', resultCompatibilidad.rows[0].fecha_mas_reciente);
        console.log('Semanas distintas:', resultCompatibilidad.rows[0].semanas_distintas);

        // Mostrar resultados de optimizada
        console.log('\n🔹 Tabla: mantenimiento.programacion_optimizada');
        console.log('------------------------------------------------');
        console.log('Total registros:', resultOptimizada.rows[0].total);
        console.log('Personas únicas:', resultOptimizada.rows[0].personas_unicas);
        console.log('Carteras únicas:', resultOptimizada.rows[0].carteras_unicas);
        console.log('Fecha más antigua:', resultOptimizada.rows[0].fecha_mas_antigua);
        console.log('Fecha más reciente:', resultOptimizada.rows[0].fecha_mas_reciente);
        console.log('Días distintos:', resultOptimizada.rows[0].dias_distintos);

        // Obtener últimos 5 registros de cada tabla para ver ejemplos
        console.log('\n📝 Últimos 5 registros de cada tabla');
        console.log('=====================================');

        const ultimosCompatibilidad = await query(`
            SELECT 
                id, rut, cartera_id, semana_inicio, dia_semana,
                created_at, updated_at
            FROM mantenimiento.programacion_compatibilidad
            ORDER BY created_at DESC
            LIMIT 5
        `);

        const ultimosOptimizada = await query(`
            SELECT 
                id, rut, cartera_id, fecha_trabajo, dia_semana,
                created_at, updated_at
            FROM mantenimiento.programacion_optimizada
            ORDER BY created_at DESC
            LIMIT 5
        `);

        console.log('\n🔹 Últimos registros - programacion_compatibilidad:');
        console.log(ultimosCompatibilidad.rows);

        console.log('\n🔹 Últimos registros - programacion_optimizada:');
        console.log(ultimosOptimizada.rows);

        // Verificar actividad reciente (últimos 30 días)
        const fechaHace30Dias = new Date();
        fechaHace30Dias.setDate(fechaHace30Dias.getDate() - 30);

        const actividadRecienteCompatibilidad = await query(`
            SELECT COUNT(*) as registros_recientes
            FROM mantenimiento.programacion_compatibilidad
            WHERE created_at >= $1
        `, [fechaHace30Dias.toISOString()]);

        const actividadRecienteOptimizada = await query(`
            SELECT COUNT(*) as registros_recientes
            FROM mantenimiento.programacion_optimizada
            WHERE created_at >= $1
        `, [fechaHace30Dias.toISOString()]);

        console.log('\n📅 Actividad en últimos 30 días');
        console.log('==============================');
        console.log('Registros nuevos en compatibilidad:', actividadRecienteCompatibilidad.rows[0].registros_recientes);
        console.log('Registros nuevos en optimizada:', actividadRecienteOptimizada.rows[0].registros_recientes);

        // Sugerencia basada en los datos
        console.log('\n📋 Conclusión');
        console.log('============');
        if (resultOptimizada.rows[0].total > resultCompatibilidad.rows[0].total) {
            console.log('✅ Se recomienda usar programacion_optimizada - tiene más datos y actividad');
        } else if (actividadRecienteOptimizada.rows[0].registros_recientes > actividadRecienteCompatibilidad.rows[0].registros_recientes) {
            console.log('✅ Se recomienda usar programacion_optimizada - tiene más actividad reciente');
        } else {
            console.log('⚠️ Revisar situación - ambas tablas tienen actividad similar');
        }

    } catch (err) {
        console.error('Error al comparar tablas:', err);
    } finally {
        process.exit();
    }
}

compararTablasProgramacion();