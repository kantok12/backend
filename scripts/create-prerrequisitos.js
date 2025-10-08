const { query } = require('../config/database');

async function createPrerequisitos() {
  try {
    console.log('🔧 Creando tabla mantenimiento.prerrequisitos_clientes (si no existe)...');

    await query(`
      CREATE TABLE IF NOT EXISTS mantenimiento.prerrequisitos_clientes (
        id SERIAL PRIMARY KEY,
        cliente_id BIGINT NOT NULL,
        tipo_documento VARCHAR(100) NOT NULL,
        obligatorio BOOLEAN NOT NULL DEFAULT true,
        dias_validez INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (cliente_id, tipo_documento)
      )
    `);

    console.log('✅ Tabla lista. Sembrando datos mock si está vacía...');

    const count = await query('SELECT COUNT(*)::int AS c FROM mantenimiento.prerrequisitos_clientes');
    if (count.rows[0].c === 0) {
      // Tomar algunos clientes existentes (hasta 3)
      const clientes = await query('SELECT id FROM servicios.clientes ORDER BY id ASC LIMIT 3');
      const tipos = [
        { tipo_documento: 'licencia_conducir', obligatorio: true, dias_validez: 365 },
        { tipo_documento: 'certificado_seguridad', obligatorio: true, dias_validez: 365 },
        { tipo_documento: 'certificado_medico', obligatorio: false, dias_validez: 365 }
      ];

      for (const row of clientes.rows) {
        for (const t of tipos) {
          await query(
            `INSERT INTO mantenimiento.prerrequisitos_clientes (cliente_id, tipo_documento, obligatorio, dias_validez)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (cliente_id, tipo_documento) DO NOTHING`,
            [row.id, t.tipo_documento, t.obligatorio, t.dias_validez]
          );
        }
      }
      console.log(`🌱 Seed completado para ${clientes.rows.length} clientes.`);
    } else {
      console.log('ℹ️ Ya existen prerrequisitos, no se insertaron mocks.');
    }

    console.log('🎉 Prerrequisitos listos.');
  } catch (err) {
    console.error('❌ Error creando prerrequisitos:', err);
    process.exitCode = 1;
  }
}

createPrerequisitos();


