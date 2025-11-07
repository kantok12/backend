const { pool } = require('../config/database');

const createPrerequisitesTable = async () => {
  const client = await pool.connect();
  try {
    console.log('🚀 Creando la tabla "cliente_prerrequisitos"...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS mantenimiento.cliente_prerrequisitos (
        id SERIAL PRIMARY KEY,
        cliente_id INT NOT NULL,
        tipo_documento VARCHAR(100) NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_cliente
          FOREIGN KEY(cliente_id) 
          REFERENCES servicios.clientes(id)
          ON DELETE CASCADE,
          
        UNIQUE (cliente_id, tipo_documento)
      );
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_cliente_prerrequisitos_updated_at ON mantenimiento.cliente_prerrequisitos;
      CREATE TRIGGER update_cliente_prerrequisitos_updated_at
      BEFORE UPDATE ON mantenimiento.cliente_prerrequisitos
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Tabla "cliente_prerrequisitos" y trigger creados exitosamente.');

  } catch (error) {
    console.error('🚨 Error al crear la tabla de prerrequisitos:', error);
  } finally {
    client.release();
  }
};

const runMigration = async () => {
  await createPrerequisitesTable();
  await pool.end();
};

runMigration();
