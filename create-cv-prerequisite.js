const { query } = require('./config/database');

async function createGlobalCVPrerequisite() {
  try {
    console.log('🚀 Creando prerrequisito global CV...');

    const result = await query(`
      INSERT INTO mantenimiento.cliente_prerrequisitos
      (cliente_id, tipo_documento, descripcion, dias_duracion)
      VALUES (NULL, 'cv', 'Currículum Vitae', 365)
      ON CONFLICT (tipo_documento) WHERE cliente_id IS NULL
      DO NOTHING
      RETURNING *
    `);

    if (result.rows.length > 0) {
      console.log('✅ Prerrequisito global CV creado exitosamente');
      console.log('📋 Detalles:', result.rows[0]);
    } else {
      console.log('ℹ️ El prerrequisito global CV ya existe');
    }

  } catch (error) {
    console.error('❌ Error creando prerrequisito:', error);
  }
}

createGlobalCVPrerequisite();