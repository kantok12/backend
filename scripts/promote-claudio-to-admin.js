const { query } = require('../config/database');

async function promoteClaudioToAdmin() {
  try {
    console.log('🚀 Promoviendo usuario Claudio Muñoz a administrador...');

    // 1. Verificar que el usuario existe
    console.log('🔍 Verificando usuario Claudio Muñoz...');
    const userResult = await query(`
      SELECT 
        u.id,
        u.email,
        u.nombre,
        u.apellido,
        u.rol,
        u.activo
      FROM sistema.usuarios u
      WHERE (u.nombre ILIKE '%claudio%' AND u.apellido ILIKE '%muñoz%')
         OR (u.nombre ILIKE '%claudio%' AND u.apellido ILIKE '%munoz%')
         OR (u.nombre ILIKE '%claudio%' AND u.apellido ILIKE '%munoz%')
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ No se encontró usuario Claudio Muñoz');
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Usuario encontrado: ${user.nombre} ${user.apellido} (ID: ${user.id})`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Rol actual: ${user.rol}`);
    console.log(`   - Estado: ${user.activo ? 'Activo' : 'Inactivo'}`);

    // 2. Verificar si ya es administrador
    if (user.rol === 'admin') {
      console.log('⚠️  El usuario ya es administrador');
      
      // Mostrar información actual
      const currentInfo = await query(`
        SELECT 
          u.id,
          u.email,
          u.nombre,
          u.apellido,
          u.rut,
          u.cargo,
          u.cartera_id,
          c.name as cartera_nombre,
          u.rol,
          u.activo,
          u.email_verificado,
          u.ultimo_login,
          u.created_at,
          u.updated_at
        FROM sistema.usuarios u
        LEFT JOIN servicios.carteras c ON u.cartera_id = c.id
        WHERE u.id = $1
      `, [user.id]);

      const currentUser = currentInfo.rows[0];
      console.log('\n📋 INFORMACIÓN ACTUAL DEL ADMINISTRADOR:');
      console.log(`   - RUT: ${currentUser.rut || 'No asignado'}`);
      console.log(`   - Cargo: ${currentUser.cargo || 'No asignado'}`);
      console.log(`   - Cartera: ${currentUser.cartera_nombre || 'No asignada'}`);
      console.log(`   - Email verificado: ${currentUser.email_verificado ? 'Sí' : 'No'}`);
      
      return;
    }

    // 3. Obtener información de carteras disponibles
    console.log('\n🏢 Obteniendo carteras disponibles...');
    const carterasResult = await query(`
      SELECT id, name 
      FROM servicios.carteras 
      ORDER BY name
    `);

    console.log('📋 Carteras disponibles:');
    carterasResult.rows.forEach((cartera, index) => {
      console.log(`   ${index + 1}. ID: ${cartera.id} - ${cartera.name}`);
    });

    // 4. Actualizar usuario a administrador con información completa
    console.log('\n👑 Promoviendo a administrador...');
    
    // Usar la primera cartera disponible o la cartera 6 (BAKERY - CARNES) si existe
    const carteraId = carterasResult.rows.find(c => c.id === 6) ? 6 : carterasResult.rows[0]?.id || null;
    const carteraNombre = carterasResult.rows.find(c => c.id === carteraId)?.name || 'No asignada';

    // Usar el RUT correcto de Claudio Muñoz
    const rutClaudio = '20.011.078-1';

    const updateResult = await query(`
      UPDATE sistema.usuarios 
      SET 
        rol = 'admin',
        rut = $1,
        cargo = 'Administrador',
        cartera_id = $2,
        email_verificado = true,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [rutClaudio, carteraId, user.id]);

    if (updateResult.rows.length === 0) {
      console.log('❌ Error al actualizar usuario');
      return;
    }

    const updatedUser = updateResult.rows[0];
    console.log('✅ Usuario promovido a administrador exitosamente');

    // 5. Mostrar información actualizada
    console.log('\n📋 INFORMACIÓN ACTUALIZADA:');
    console.log(`   - ID: ${updatedUser.id}`);
    console.log(`   - Nombre: ${updatedUser.nombre} ${updatedUser.apellido}`);
    console.log(`   - Email: ${updatedUser.email}`);
    console.log(`   - RUT: ${updatedUser.rut}`);
    console.log(`   - Cargo: ${updatedUser.cargo}`);
    console.log(`   - Cartera ID: ${updatedUser.cartera_id}`);
    console.log(`   - Cartera: ${carteraNombre}`);
    console.log(`   - Rol: ${updatedUser.rol}`);
    console.log(`   - Activo: ${updatedUser.activo ? 'Sí' : 'No'}`);
    console.log(`   - Email verificado: ${updatedUser.email_verificado ? 'Sí' : 'No'}`);

    // 6. Mostrar permisos de administrador
    console.log('\n🔑 NUEVOS PERMISOS DE ADMINISTRADOR:');
    const permisosAdmin = [
      'Crear usuarios',
      'Eliminar usuarios', 
      'Modificar cualquier usuario',
      'Cambiar roles de usuarios',
      'Activar/desactivar usuarios',
      'Ver todos los usuarios',
      'Acceso completo al sistema',
      'Gestionar carteras',
      'Ver auditoría completa',
      'Gestionar programaciones',
      'Acceso a todos los módulos'
    ];
    
    permisosAdmin.forEach(permiso => {
      console.log(`   ✅ ${permiso}`);
    });

    // 7. Verificar que el usuario puede hacer login como admin
    console.log('\n🔐 VERIFICACIÓN DE ACCESO:');
    console.log(`   - Email para login: ${updatedUser.email}`);
    console.log(`   - Rol: ${updatedUser.rol}`);
    console.log(`   - Estado: ${updatedUser.activo ? 'Activo' : 'Inactivo'}`);
    console.log(`   - Puede usar endpoint /api/auth/me para verificar su información`);

    // 8. Mostrar estadísticas de administradores
    console.log('\n📊 ESTADÍSTICAS DE ADMINISTRADORES:');
    const adminStats = await query(`
      SELECT 
        COUNT(*) as total_admins,
        COUNT(CASE WHEN activo = true THEN 1 END) as admins_activos
      FROM sistema.usuarios 
      WHERE rol = 'admin'
    `);

    const stats = adminStats.rows[0];
    console.log(`   - Total administradores: ${stats.total_admins}`);
    console.log(`   - Administradores activos: ${stats.admins_activos}`);

    console.log('\n🎉 ¡Usuario promovido a administrador exitosamente!');
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. El usuario puede hacer login con su email actual');
    console.log('   2. Usar GET /api/auth/me para verificar su nueva información');
    console.log('   3. Ahora tiene acceso completo a todos los módulos del sistema');

  } catch (error) {
    console.error('❌ Error al promover usuario:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  promoteClaudioToAdmin()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { promoteClaudioToAdmin };
