const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('🔧 Creando usuario administrador...');

    const email = 'admin@admin.com';
    const password = 'admin123';
    const nombre = 'Administrador';
    const apellido = 'Sistema';
    const rol = 'admin';

    // Verificar si el usuario ya existe
    const existingUser = await query(
      'SELECT id FROM sistema.usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  El usuario admin ya existe');
      
      // Actualizar el rol a admin si no lo es
      const updateResult = await query(
        'UPDATE sistema.usuarios SET rol = $1 WHERE email = $2 RETURNING *',
        [rol, email]
      );
      
      console.log('✅ Usuario admin actualizado:', updateResult.rows[0]);
      return;
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario admin
    const result = await query(`
      INSERT INTO sistema.usuarios (email, password, nombre, apellido, rol, activo, email_verificado)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, nombre, apellido, rol
    `, [email, hashedPassword, nombre, apellido, rol, true, true]);

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('   Email:', result.rows[0].email);
    console.log('   Nombre:', result.rows[0].nombre, result.rows[0].apellido);
    console.log('   Rol:', result.rows[0].rol);
    console.log('   ID:', result.rows[0].id);
    console.log('');
    console.log('🔑 Credenciales de acceso:');
    console.log('   Email: admin@admin.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error creando usuario admin:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };
