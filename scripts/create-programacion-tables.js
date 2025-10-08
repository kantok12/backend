const { query } = require('../config/database');

async function createProgramacionTables() {
  try {
    console.log('🔧 Creando tabla de programación semanal...');

    // Crear tabla de programación semanal
    await query(`
      CREATE TABLE IF NOT EXISTS mantenimiento.programacion_semanal (
        id SERIAL PRIMARY KEY,
        rut VARCHAR(20) NOT NULL,
        cartera_id BIGINT NOT NULL,
        cliente_id BIGINT,
        nodo_id BIGINT,
        semana_inicio DATE NOT NULL,
        semana_fin DATE NOT NULL,
        lunes BOOLEAN DEFAULT false,
        martes BOOLEAN DEFAULT false,
        miercoles BOOLEAN DEFAULT false,
        jueves BOOLEAN DEFAULT false,
        viernes BOOLEAN DEFAULT false,
        sabado BOOLEAN DEFAULT false,
        domingo BOOLEAN DEFAULT false,
        horas_estimadas INTEGER DEFAULT 8,
        observaciones TEXT,
        estado VARCHAR(20) DEFAULT 'programado',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(50) DEFAULT 'sistema',
        UNIQUE (rut, cartera_id, semana_inicio)
      )
    `);

    // Crear índices para optimizar consultas
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_rut ON mantenimiento.programacion_semanal (rut)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_cartera ON mantenimiento.programacion_semanal (cartera_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_semana ON mantenimiento.programacion_semanal (semana_inicio, semana_fin)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_estado ON mantenimiento.programacion_semanal (estado)`);

    // Crear tabla de historial de programación (opcional, para auditoría)
    await query(`
      CREATE TABLE IF NOT EXISTS mantenimiento.programacion_historial (
        id SERIAL PRIMARY KEY,
        programacion_id INTEGER NOT NULL,
        rut VARCHAR(20) NOT NULL,
        cartera_id BIGINT NOT NULL,
        accion VARCHAR(20) NOT NULL, -- 'creado', 'actualizado', 'eliminado'
        cambios JSONB,
        fecha_accion TIMESTAMP DEFAULT NOW(),
        usuario VARCHAR(50) DEFAULT 'sistema'
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_historial_programacion ON mantenimiento.programacion_historial (programacion_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_programacion_historial_fecha ON mantenimiento.programacion_historial (fecha_accion)`);

    console.log('✅ Tabla de programación semanal creada exitosamente');
    
    // Insertar datos de ejemplo para testing
    console.log('📝 Insertando datos de ejemplo...');
    
    const fechaActual = new Date();
    const lunes = new Date(fechaActual);
    lunes.setDate(fechaActual.getDate() - fechaActual.getDay() + 1); // Lunes de esta semana
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6); // Domingo de esta semana

    // Obtener algunos RUTs y carteras existentes
    const personas = await query('SELECT rut FROM mantenimiento.personal_disponible LIMIT 3');
    const carteras = await query('SELECT id FROM servicios.carteras LIMIT 2');

    if (personas.rows.length > 0 && carteras.rows.length > 0) {
      for (let i = 0; i < Math.min(3, personas.rows.length); i++) {
        const rut = personas.rows[i].rut;
        const carteraId = carteras.rows[i % carteras.rows.length].id;
        
        await query(`
          INSERT INTO mantenimiento.programacion_semanal 
          (rut, cartera_id, semana_inicio, semana_fin, lunes, martes, miercoles, jueves, viernes, observaciones, estado)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (rut, cartera_id, semana_inicio) DO NOTHING
        `, [
          rut,
          carteraId,
          lunes.toISOString().split('T')[0],
          domingo.toISOString().split('T')[0],
          true,  // lunes
          true,  // martes
          false, // miércoles
          true,  // jueves
          true,  // viernes
          `Programación de ejemplo para ${rut}`,
          'programado'
        ]);
      }
      console.log('✅ Datos de ejemplo insertados');
    }

  } catch (err) {
    console.error('❌ Error creando tabla de programación:', err.message);
    process.exitCode = 1;
  }
}

createProgramacionTables();
