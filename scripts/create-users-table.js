const { query } = require('../config/database');

async function createUsersTable() {
  try {
    console.log('🚀 Iniciando creación de tabla usuarios...');

    // 1. Crear esquema sistema si no existe
    console.log('📁 Verificando esquema sistema...');
    await query(`
      CREATE SCHEMA IF NOT EXISTS sistema;
    `);
    console.log('✅ Esquema sistema verificado');

    // 2. Crear tabla usuarios
    console.log('👥 Creando tabla usuarios...');
    await query(`
      CREATE TABLE IF NOT EXISTS sistema.usuarios (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'supervisor', 'usuario', 'operador')),
        activo BOOLEAN NOT NULL DEFAULT true,
        email_verificado BOOLEAN NOT NULL DEFAULT false,
        ultimo_login TIMESTAMPTZ,
        intentos_login_fallidos INTEGER DEFAULT 0,
        bloqueado_hasta TIMESTAMPTZ,
        token_reset_password VARCHAR(255),
        token_reset_expires TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla usuarios creada');

    // 3. Crear índices para optimizar consultas
    console.log('📊 Creando índices...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON sistema.usuarios(email);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON sistema.usuarios(rol);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON sistema.usuarios(activo);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_created_at ON sistema.usuarios(created_at);
    `);
    console.log('✅ Índices creados');

    // 4. Crear trigger para updated_at
    console.log('⚡ Creando trigger para updated_at...');
    await query(`
      CREATE OR REPLACE FUNCTION sistema.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_usuarios_updated_at ON sistema.usuarios;
      CREATE TRIGGER update_usuarios_updated_at
        BEFORE UPDATE ON sistema.usuarios
        FOR EACH ROW
        EXECUTE FUNCTION sistema.update_updated_at_column();
    `);
    console.log('✅ Trigger created');

    // 5. Crear usuario administrador por defecto
    console.log('👑 Creando usuario administrador por defecto...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await query(`
      INSERT INTO sistema.usuarios (email, password, nombre, apellido, rol, activo, email_verificado)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
    `, [
      'admin@sistema.com',
      hashedPassword,
      'Administrador',
      'Sistema',
      'admin',
      true,
      true
    ]);
    console.log('✅ Usuario administrador creado');

    // 6. Verificar la creación
    console.log('🔍 Verificando tabla usuarios...');
    const result = await query(`
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN rol = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN activo = true THEN 1 END) as usuarios_activos
      FROM sistema.usuarios
    `);

    console.log('📊 Estadísticas de usuarios:');
    console.log(`   - Total usuarios: ${result.rows[0].total_usuarios}`);
    console.log(`   - Administradores: ${result.rows[0].admins}`);
    console.log(`   - Usuarios activos: ${result.rows[0].usuarios_activos}`);

    console.log('🎉 ¡Tabla usuarios creada exitosamente!');
    console.log('');
    console.log('📋 Información del usuario administrador:');
    console.log('   - Email: admin@sistema.com');
    console.log('   - Contraseña: admin123');
    console.log('   - Rol: admin');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña del administrador después del primer login');

  } catch (error) {
    console.error('❌ Error al crear tabla usuarios:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createUsersTable()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { createUsersTable };
