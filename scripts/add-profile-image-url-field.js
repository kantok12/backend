const { query } = require('../config/database');

async function addProfileImageUrlField() {
  try {
    console.log('🚀 Agregando campo profile_image_url a tabla usuarios...');

    // 1. Agregar campo profile_image_url a la tabla usuarios
    console.log('📝 Agregando campo profile_image_url...');
    await query(`
      ALTER TABLE sistema.usuarios 
      ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500);
    `);
    console.log('✅ Campo profile_image_url agregado');

    // 2. Agregar índice para optimizar consultas
    console.log('📊 Creando índice...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_profile_image_url 
      ON sistema.usuarios(profile_image_url) 
      WHERE profile_image_url IS NOT NULL;
    `);
    console.log('✅ Índice creado');

    // 3. Verificar la actualización
    console.log('🔍 Verificando actualización...');
    const result = await query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'sistema' 
      AND table_name = 'usuarios'
      AND column_name = 'profile_image_url'
    `);

    if (result.rows.length > 0) {
      const column = result.rows[0];
      console.log('✅ Campo profile_image_url verificado:');
      console.log(`   - Tipo: ${column.data_type}`);
      console.log(`   - Longitud máxima: ${column.character_maximum_length}`);
      console.log(`   - Nullable: ${column.is_nullable}`);
    } else {
      console.log('❌ Error: Campo no encontrado');
      return;
    }

    // 4. Mostrar usuarios existentes con sus RUTs
    console.log('\n👤 Usuarios existentes con RUT:');
    const usersResult = await query(`
      SELECT 
        id,
        nombre,
        apellido,
        rut,
        email,
        rol,
        profile_image_url
      FROM sistema.usuarios 
      WHERE rut IS NOT NULL AND rut != ''
      ORDER BY created_at DESC
    `);

    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.nombre} ${user.apellido}`);
        console.log(`      - RUT: ${user.rut}`);
        console.log(`      - Email: ${user.email}`);
        console.log(`      - Rol: ${user.rol}`);
        console.log(`      - Imagen: ${user.profile_image_url || 'No asignada'}`);
        console.log('');
      });
    } else {
      console.log('   No se encontraron usuarios con RUT');
    }

    console.log('🎉 ¡Campo profile_image_url agregado exitosamente!');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Registrar las rutas en server.js');
    console.log('   2. Actualizar endpoint /api/auth/me');
    console.log('   3. Probar los nuevos endpoints de profile-photos');

  } catch (error) {
    console.error('❌ Error al agregar campo:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addProfileImageUrlField()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { addProfileImageUrlField };
