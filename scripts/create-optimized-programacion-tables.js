const { query } = require('../config/database');

async function createOptimizedProgramacionTables() {
  try {
    console.log('🔧 Creando tablas optimizadas de programación...');

    // 1. Crear tabla principal optimizada
    await query(`
      CREATE TABLE IF NOT EXISTS mantenimiento.programacion_optimizada (
        id SERIAL PRIMARY KEY,
        rut VARCHAR(20) NOT NULL,
        cartera_id BIGINT NOT NULL,
        cliente_id BIGINT,
        nodo_id BIGINT,
        fecha_trabajo DATE NOT NULL,
        dia_semana VARCHAR(10) NOT NULL, -- 'lunes', 'martes', etc.
        horas_estimadas INTEGER DEFAULT 8,
        horas_reales INTEGER,
        observaciones TEXT,
        estado VARCHAR(20) DEFAULT 'programado',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(50) DEFAULT 'sistema',
        UNIQUE (rut, cartera_id, fecha_trabajo)
      )
    `);

    // 2. Crear tabla de semanas para referencia
    await query(`
      CREATE TABLE IF NOT EXISTS mantenimiento.semanas_trabajo (
        id SERIAL PRIMARY KEY,
        semana_inicio DATE NOT NULL,
        semana_fin DATE NOT NULL,
        año INTEGER NOT NULL,
        semana_numero INTEGER NOT NULL,
        activa BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (semana_inicio, semana_fin)
      )
    `);

    // 3. Crear tabla de historial optimizada
    await query(`
      CREATE TABLE IF NOT EXISTS mantenimiento.programacion_historial_optimizado (
        id SERIAL PRIMARY KEY,
        programacion_id INTEGER NOT NULL,
        rut VARCHAR(20) NOT NULL,
        cartera_id BIGINT NOT NULL,
        fecha_trabajo DATE NOT NULL,
        accion VARCHAR(20) NOT NULL, -- 'creado', 'actualizado', 'eliminado'
        cambios JSONB,
        fecha_accion TIMESTAMP DEFAULT NOW(),
        usuario VARCHAR(50) DEFAULT 'sistema'
      )
    `);

    // 4. Crear índices optimizados
    console.log('📊 Creando índices optimizados...');
    
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_opt_rut ON mantenimiento.programacion_optimizada (rut)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_opt_cartera ON mantenimiento.programacion_optimizada (cartera_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_opt_fecha ON mantenimiento.programacion_optimizada (fecha_trabajo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_opt_dia ON mantenimiento.programacion_optimizada (dia_semana)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_opt_estado ON mantenimiento.programacion_optimizada (estado)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_opt_rut_fecha ON mantenimiento.programacion_optimizada (rut, fecha_trabajo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_opt_cartera_fecha ON mantenimiento.programacion_optimizada (cartera_id, fecha_trabajo)`);
    
    // Índices para semanas
    await query(`CREATE INDEX IF NOT EXISTS idx_semanas_inicio ON mantenimiento.semanas_trabajo (semana_inicio)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_semanas_fin ON mantenimiento.semanas_trabajo (semana_fin)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_semanas_año ON mantenimiento.semanas_trabajo (año)`);

    // 5. Crear función para obtener días de la semana
    await query(`
      CREATE OR REPLACE FUNCTION get_week_dates(input_date DATE)
      RETURNS TABLE(
        lunes DATE,
        martes DATE,
        miercoles DATE,
        jueves DATE,
        viernes DATE,
        sabado DATE,
        domingo DATE
      ) AS $$
      DECLARE
        start_date DATE;
      BEGIN
        -- Calcular el lunes de la semana
        start_date := input_date - (EXTRACT(DOW FROM input_date)::INTEGER - 1);
        IF EXTRACT(DOW FROM input_date) = 0 THEN -- Si es domingo
          start_date := input_date - 6;
        END IF;
        
        RETURN QUERY SELECT
          start_date::DATE,
          (start_date + INTERVAL '1 day')::DATE,
          (start_date + INTERVAL '2 days')::DATE,
          (start_date + INTERVAL '3 days')::DATE,
          (start_date + INTERVAL '4 days')::DATE,
          (start_date + INTERVAL '5 days')::DATE,
          (start_date + INTERVAL '6 days')::DATE;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 6. Crear función para obtener nombre del día
    await query(`
      CREATE OR REPLACE FUNCTION get_day_name(input_date DATE)
      RETURNS VARCHAR(10) AS $$
      BEGIN
        RETURN CASE EXTRACT(DOW FROM input_date)
          WHEN 1 THEN 'lunes'
          WHEN 2 THEN 'martes'
          WHEN 3 THEN 'miercoles'
          WHEN 4 THEN 'jueves'
          WHEN 5 THEN 'viernes'
          WHEN 6 THEN 'sabado'
          WHEN 0 THEN 'domingo'
        END;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 7. Crear trigger para actualizar updated_at
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Crear trigger si no existe
    await query(`
      DROP TRIGGER IF EXISTS update_programacion_optimizada_updated_at ON mantenimiento.programacion_optimizada;
      CREATE TRIGGER update_programacion_optimizada_updated_at
        BEFORE UPDATE ON mantenimiento.programacion_optimizada
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // 8. Crear vista para programación semanal (compatibilidad)
    await query(`
      CREATE OR REPLACE VIEW mantenimiento.programacion_semanal_vista AS
      SELECT 
        p.id,
        p.rut,
        p.cartera_id,
        p.cliente_id,
        p.nodo_id,
        s.semana_inicio,
        s.semana_fin,
        BOOL_OR(p.dia_semana = 'lunes') as lunes,
        BOOL_OR(p.dia_semana = 'martes') as martes,
        BOOL_OR(p.dia_semana = 'miercoles') as miercoles,
        BOOL_OR(p.dia_semana = 'jueves') as jueves,
        BOOL_OR(p.dia_semana = 'viernes') as viernes,
        BOOL_OR(p.dia_semana = 'sabado') as sabado,
        BOOL_OR(p.dia_semana = 'domingo') as domingo,
        SUM(p.horas_estimadas) as horas_estimadas,
        STRING_AGG(p.observaciones, '; ') as observaciones,
        p.estado,
        p.created_at,
        p.updated_at,
        p.created_by
      FROM mantenimiento.programacion_optimizada p
      JOIN mantenimiento.semanas_trabajo s ON p.fecha_trabajo BETWEEN s.semana_inicio AND s.semana_fin
      GROUP BY p.id, p.rut, p.cartera_id, p.cliente_id, p.nodo_id, s.semana_inicio, s.semana_fin, p.estado, p.created_at, p.updated_at, p.created_by;
    `);

    console.log('✅ Tablas optimizadas creadas exitosamente');
    console.log('📋 Tablas creadas:');
    console.log('   - mantenimiento.programacion_optimizada');
    console.log('   - mantenimiento.semanas_trabajo');
    console.log('   - mantenimiento.programacion_historial_optimizado');
    console.log('   - Vista: mantenimiento.programacion_semanal_vista');
    console.log('🔧 Funciones creadas:');
    console.log('   - get_week_dates()');
    console.log('   - get_day_name()');
    console.log('   - update_updated_at_column()');

  } catch (error) {
    console.error('❌ Error al crear tablas optimizadas:', error);
    throw error;
  }
}

// Función para poblar semanas de trabajo
async function populateWorkWeeks() {
  try {
    console.log('📅 Poblando semanas de trabajo...');
    
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // 1 de enero
    const endDate = new Date(currentYear + 1, 0, 1); // 1 de enero del año siguiente
    
    let currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      // Encontrar el lunes de la semana
      const dayOfWeek = currentDate.getDay();
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const year = monday.getFullYear();
      const weekNumber = Math.ceil((monday - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
      
      // Insertar semana si no existe
      await query(`
        INSERT INTO mantenimiento.semanas_trabajo (semana_inicio, semana_fin, año, semana_numero)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (semana_inicio, semana_fin) DO NOTHING
      `, [
        monday.toISOString().split('T')[0],
        sunday.toISOString().split('T')[0],
        year,
        weekNumber
      ]);
      
      // Avanzar a la siguiente semana
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    console.log('✅ Semanas de trabajo pobladas exitosamente');
    
  } catch (error) {
    console.error('❌ Error al poblar semanas de trabajo:', error);
    throw error;
  }
}

// Función para migrar datos existentes
async function migrateExistingData() {
  try {
    console.log('🔄 Migrando datos existentes...');
    
    // Verificar si existe la tabla antigua
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = 'programacion_semanal'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('ℹ️ No hay datos existentes para migrar');
      return;
    }
    
    // Migrar datos de la tabla antigua
    const existingData = await query(`
      SELECT * FROM mantenimiento.programacion_semanal
    `);
    
    console.log(`📊 Encontrados ${existingData.rows.length} registros para migrar`);
    
    for (const row of existingData.rows) {
      const weekDates = await query(`SELECT * FROM get_week_dates($1)`, [row.semana_inicio]);
      const dates = weekDates.rows[0];
      
      // Migrar cada día que esté marcado como true
      const days = [
        { day: 'lunes', date: dates.lunes, value: row.lunes },
        { day: 'martes', date: dates.martes, value: row.martes },
        { day: 'miercoles', date: dates.miercoles, value: row.miercoles },
        { day: 'jueves', date: dates.jueves, value: row.jueves },
        { day: 'viernes', date: dates.viernes, value: row.viernes },
        { day: 'sabado', date: dates.sabado, value: row.sabado },
        { day: 'domingo', date: dates.domingo, value: row.domingo }
      ];
      
      for (const dayData of days) {
        if (dayData.value) {
          await query(`
            INSERT INTO mantenimiento.programacion_optimizada 
            (rut, cartera_id, cliente_id, nodo_id, fecha_trabajo, dia_semana, 
             horas_estimadas, observaciones, estado, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (rut, cartera_id, fecha_trabajo) DO NOTHING
          `, [
            row.rut,
            row.cartera_id,
            row.cliente_id,
            row.nodo_id,
            dayData.date,
            dayData.day,
            row.horas_estimadas,
            row.observaciones,
            row.estado,
            row.created_by || 'migracion'
          ]);
        }
      }
    }
    
    console.log('✅ Migración de datos completada');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  }
}

// Ejecutar todo
async function setupOptimizedProgramacion() {
  try {
    await createOptimizedProgramacionTables();
    await populateWorkWeeks();
    await migrateExistingData();
    
    console.log('🎉 Sistema de programación optimizado configurado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la configuración:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupOptimizedProgramacion();
}

module.exports = {
  createOptimizedProgramacionTables,
  populateWorkWeeks,
  migrateExistingData,
  setupOptimizedProgramacion
};
