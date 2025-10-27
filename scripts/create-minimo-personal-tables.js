const { query } = require('../config/database');

async function createMinimoPersonalTables() {
  try {
    console.log('🏗️ Creando tablas para mínimo de personal y acuerdos...');

    // 1. Crear tabla minimo_personal
    console.log('📋 Creando tabla minimo_personal...');
    await query(`
      CREATE TABLE IF NOT EXISTS servicios.minimo_personal (
        id SERIAL PRIMARY KEY,
        cartera_id INTEGER NOT NULL,
        cliente_id INTEGER,
        nodo_id INTEGER,
        minimo_base INTEGER NOT NULL DEFAULT 1,
        descripcion TEXT,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'sistema',
        
        -- Constraints
        CONSTRAINT fk_minimo_cartera FOREIGN KEY (cartera_id) REFERENCES servicios.carteras(id) ON DELETE CASCADE,
        CONSTRAINT fk_minimo_cliente FOREIGN KEY (cliente_id) REFERENCES servicios.clientes(id) ON DELETE CASCADE,
        CONSTRAINT fk_minimo_nodo FOREIGN KEY (nodo_id) REFERENCES servicios.nodos(id) ON DELETE CASCADE,
        CONSTRAINT chk_minimo_base CHECK (minimo_base > 0),
        
        -- Índices únicos para evitar duplicados
        CONSTRAINT uk_minimo_cartera UNIQUE (cartera_id, cliente_id, nodo_id)
      )
    `);

    // 2. Crear tabla acuerdos
    console.log('📋 Creando tabla acuerdos...');
    await query(`
      CREATE TABLE IF NOT EXISTS servicios.acuerdos (
        id SERIAL PRIMARY KEY,
        minimo_personal_id INTEGER NOT NULL,
        tipo_acuerdo VARCHAR(50) NOT NULL, -- 'incremento', 'reduccion', 'temporal'
        valor_modificacion INTEGER NOT NULL, -- puede ser positivo o negativo
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE,
        motivo TEXT,
        aprobado_por VARCHAR(100),
        estado VARCHAR(20) DEFAULT 'activo', -- 'activo', 'inactivo', 'vencido'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'sistema',
        
        -- Constraints
        CONSTRAINT fk_acuerdo_minimo FOREIGN KEY (minimo_personal_id) REFERENCES servicios.minimo_personal(id) ON DELETE CASCADE,
        CONSTRAINT chk_tipo_acuerdo CHECK (tipo_acuerdo IN ('incremento', 'reduccion', 'temporal')),
        CONSTRAINT chk_estado_acuerdo CHECK (estado IN ('activo', 'inactivo', 'vencido')),
        CONSTRAINT chk_fechas_acuerdo CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
      )
    `);

    // 3. Crear índices para optimizar consultas
    console.log('🔍 Creando índices...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_minimo_personal_cartera ON servicios.minimo_personal(cartera_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_minimo_personal_cliente ON servicios.minimo_personal(cliente_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_minimo_personal_nodo ON servicios.minimo_personal(nodo_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_minimo_personal_activo ON servicios.minimo_personal(activo);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_acuerdos_minimo ON servicios.acuerdos(minimo_personal_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_acuerdos_fechas ON servicios.acuerdos(fecha_inicio, fecha_fin);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_acuerdos_estado ON servicios.acuerdos(estado);
    `);

    // 4. Crear función para calcular mínimo real
    console.log('⚙️ Creando función para calcular mínimo real...');
    await query(`
      CREATE OR REPLACE FUNCTION servicios.calcular_minimo_real(
        p_minimo_personal_id INTEGER,
        p_fecha_calculo DATE DEFAULT CURRENT_DATE
      ) RETURNS INTEGER AS $$
      DECLARE
        minimo_base INTEGER;
        modificacion_total INTEGER := 0;
        acuerdo RECORD;
      BEGIN
        -- Obtener mínimo base
        SELECT minimo_base INTO minimo_base
        FROM servicios.minimo_personal
        WHERE id = p_minimo_personal_id AND activo = true;
        
        IF minimo_base IS NULL THEN
          RETURN 0;
        END IF;
        
        -- Calcular modificaciones activas
        FOR acuerdo IN
          SELECT valor_modificacion
          FROM servicios.acuerdos
          WHERE minimo_personal_id = p_minimo_personal_id
            AND estado = 'activo'
            AND fecha_inicio <= p_fecha_calculo
            AND (fecha_fin IS NULL OR fecha_fin >= p_fecha_calculo)
        LOOP
          modificacion_total := modificacion_total + acuerdo.valor_modificacion;
        END LOOP;
        
        -- Retornar mínimo real (no puede ser menor a 0)
        RETURN GREATEST(minimo_base + modificacion_total, 0);
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 5. Crear trigger para actualizar updated_at
    console.log('🔄 Creando triggers para updated_at...');
    await query(`
      CREATE OR REPLACE FUNCTION servicios.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await query(`
      DROP TRIGGER IF EXISTS trigger_update_minimo_personal_updated_at ON servicios.minimo_personal;
      CREATE TRIGGER trigger_update_minimo_personal_updated_at
        BEFORE UPDATE ON servicios.minimo_personal
        FOR EACH ROW
        EXECUTE FUNCTION servicios.update_updated_at_column();
    `);

    await query(`
      DROP TRIGGER IF EXISTS trigger_update_acuerdos_updated_at ON servicios.acuerdos;
      CREATE TRIGGER trigger_update_acuerdos_updated_at
        BEFORE UPDATE ON servicios.acuerdos
        FOR EACH ROW
        EXECUTE FUNCTION servicios.update_updated_at_column();
    `);

    // 6. Insertar datos de ejemplo
    console.log('📝 Insertando datos de ejemplo...');
    
    // Obtener algunas carteras existentes
    const carteras = await query('SELECT id FROM servicios.carteras LIMIT 3');
    
    for (const cartera of carteras.rows) {
      // Crear mínimo base para cartera
      await query(`
        INSERT INTO servicios.minimo_personal (cartera_id, minimo_base, descripcion, created_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (cartera_id, cliente_id, nodo_id) DO NOTHING
      `, [cartera.id, 2, `Mínimo base para cartera ${cartera.id}`, 'sistema']);
      
      // Obtener algunos clientes de esta cartera
      const clientes = await query('SELECT id FROM servicios.clientes WHERE cartera_id = $1 LIMIT 2', [cartera.id]);
      
      for (const cliente of clientes.rows) {
        // Crear mínimo para cliente
        await query(`
          INSERT INTO servicios.minimo_personal (cartera_id, cliente_id, minimo_base, descripcion, created_by)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (cartera_id, cliente_id, nodo_id) DO NOTHING
        `, [cartera.id, cliente.id, 1, `Mínimo para cliente ${cliente.id}`, 'sistema']);
      }
    }

    console.log('✅ Tablas creadas exitosamente!');
    console.log('📊 Estructura creada:');
    console.log('   - servicios.minimo_personal');
    console.log('   - servicios.acuerdos');
    console.log('   - Función calcular_minimo_real()');
    console.log('   - Triggers y índices');

  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createMinimoPersonalTables()
    .then(() => {
      console.log('🎉 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en script:', error);
      process.exit(1);
    });
}

module.exports = { createMinimoPersonalTables };








