const { pool } = require('../config/database');

const addDurationColumn = async () => {
  const client = await pool.connect();
  try {
    console.log('🚀 Alterando la tabla "cliente_prerrequisitos" para añadir "dias_duracion"...');

    // Añade la columna si no existe. La hacemos de tipo INTEGER y puede ser nula.
    await client.query(`
      ALTER TABLE mantenimiento.cliente_prerrequisitos
      ADD COLUMN IF NOT EXISTS dias_duracion INT;
    `);

    console.log('✅ Columna "dias_duracion" añadida exitosamente a la tabla "cliente_prerrequisitos".');

  } catch (error) {
    console.error('🚨 Error al alterar la tabla de prerrequisitos:', error);
  } finally {
    client.release();
  }
};

const runMigration = async () => {
  await addDurationColumn();
  await pool.end();
  console.log('🔌 Conexión a la base de datos cerrada.');
};

runMigration();
