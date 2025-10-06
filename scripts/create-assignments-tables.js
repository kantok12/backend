const { query } = require('../config/database');

async function createAssignmentTables() {
  try {
    console.log('🔧 Creando tablas de asignaciones (si no existen)...');

    await query(`
      CREATE TABLE IF NOT EXISTS mantenimiento.personal_carteras (
        id SERIAL PRIMARY KEY,
        rut VARCHAR(20) NOT NULL,
        cartera_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (rut, cartera_id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS mantenimiento.personal_clientes (
        id SERIAL PRIMARY KEY,
        rut VARCHAR(20) NOT NULL,
        cliente_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (rut, cliente_id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS mantenimiento.personal_nodos (
        id SERIAL PRIMARY KEY,
        rut VARCHAR(20) NOT NULL,
        nodo_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (rut, nodo_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_personal_carteras_rut ON mantenimiento.personal_carteras (rut)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_personal_clientes_rut ON mantenimiento.personal_clientes (rut)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_personal_nodos_rut ON mantenimiento.personal_nodos (rut)`);

    console.log('✅ Tablas de asignaciones listas');
  } catch (err) {
    console.error('❌ Error creando tablas de asignaciones:', err.message);
    process.exitCode = 1;
  }
}

createAssignmentTables();


