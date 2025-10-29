const { query } = require('../config/database');

async function showUserClaudioMunoz() {
  try {
    console.log('🔍 Buscando información del usuario Claudio Muñoz...');

    // 1. Buscar por nombre y apellido
    console.log('📋 Buscando por nombre "Claudio" y apellido "Muñoz"...');
    const userResult = await query(`
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
        u.updated_at,
        u.intentos_login_fallidos,
        u.bloqueado_hasta
      FROM sistema.usuarios u
      LEFT JOIN servicios.carteras c ON u.cartera_id = c.id
      WHERE (u.nombre ILIKE '%claudio%' AND u.apellido ILIKE '%muñoz%')
         OR (u.nombre ILIKE '%claudio%' AND u.apellido ILIKE '%munoz%')
         OR (u.nombre ILIKE '%claudio%' AND u.apellido ILIKE '%munoz%')
      ORDER BY u.created_at DESC
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ No se encontró usuario con nombre "Claudio Muñoz"');
      
      // Buscar variaciones
      console.log('\n🔍 Buscando variaciones del nombre...');
      const variationsResult = await query(`
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
          u.activo
        FROM sistema.usuarios u
        LEFT JOIN servicios.carteras c ON u.cartera_id = c.id
        WHERE u.nombre ILIKE '%claudio%' OR u.apellido ILIKE '%muñoz%' OR u.apellido ILIKE '%munoz%'
        ORDER BY u.created_at DESC
      `);

      if (variationsResult.rows.length > 0) {
        console.log('📋 Usuarios encontrados con nombres similares:');
        variationsResult.rows.forEach((user, index) => {
          console.log(`\n${index + 1}. Usuario ID: ${user.id}`);
          console.log(`   - Nombre: ${user.nombre} ${user.apellido}`);
          console.log(`   - Email: ${user.email}`);
          console.log(`   - RUT: ${user.rut || 'No asignado'}`);
          console.log(`   - Cargo: ${user.cargo || 'No asignado'}`);
          console.log(`   - Cartera: ${user.cartera_nombre || 'No asignada'}`);
          console.log(`   - Rol: ${user.rol}`);
          console.log(`   - Activo: ${user.activo ? 'Sí' : 'No'}`);
        });
      } else {
        console.log('❌ No se encontraron usuarios con nombres similares');
        
        // Mostrar todos los usuarios para referencia
        console.log('\n📋 Todos los usuarios en el sistema:');
        const allUsersResult = await query(`
          SELECT 
            u.id,
            u.email,
            u.nombre,
            u.apellido,
            u.rut,
            u.cargo,
            u.rol,
            u.activo
          FROM sistema.usuarios u
          ORDER BY u.created_at DESC
          LIMIT 10
        `);

        if (allUsersResult.rows.length > 0) {
          allUsersResult.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${user.nombre} ${user.apellido} (${user.email}) - Rol: ${user.rol}`);
          });
        } else {
          console.log('❌ No hay usuarios en el sistema');
        }
      }
      return;
    }

    // 2. Mostrar información del usuario encontrado
    const user = userResult.rows[0];
    console.log('✅ Usuario encontrado:');
    console.log('\n📋 INFORMACIÓN PERSONAL:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Nombre completo: ${user.nombre} ${user.apellido}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - RUT: ${user.rut || 'No asignado'}`);
    console.log(`   - Cargo: ${user.cargo || 'No asignado'}`);

    console.log('\n🏢 INFORMACIÓN LABORAL:');
    console.log(`   - Cartera ID: ${user.cartera_id || 'No asignada'}`);
    console.log(`   - Cartera: ${user.cartera_nombre || 'No asignada'}`);
    console.log(`   - Rol: ${user.rol}`);
    console.log(`   - Activo: ${user.activo ? 'Sí' : 'No'}`);

    console.log('\n🔐 INFORMACIÓN DE CUENTA:');
    console.log(`   - Email verificado: ${user.email_verificado ? 'Sí' : 'No'}`);
    console.log(`   - Último acceso: ${user.ultimo_login ? new Date(user.ultimo_login).toLocaleString('es-CL') : 'Nunca'}`);
    console.log(`   - Fecha de creación: ${new Date(user.created_at).toLocaleString('es-CL')}`);
    console.log(`   - Última actualización: ${new Date(user.updated_at).toLocaleString('es-CL')}`);

    console.log('\n🚨 ESTADO DE SEGURIDAD:');
    console.log(`   - Intentos de login fallidos: ${user.intentos_login_fallidos || 0}`);
    if (user.bloqueado_hasta) {
      const bloqueadoHasta = new Date(user.bloqueado_hasta);
      const ahora = new Date();
      if (ahora < bloqueadoHasta) {
        console.log(`   - Estado: BLOQUEADO hasta ${bloqueadoHasta.toLocaleString('es-CL')}`);
      } else {
        console.log(`   - Estado: Desbloqueado (estaba bloqueado hasta ${bloqueadoHasta.toLocaleString('es-CL')})`);
      }
    } else {
      console.log(`   - Estado: Normal (no bloqueado)`);
    }

    // 3. Mostrar permisos según el rol
    console.log('\n🔑 PERMISOS SEGÚN ROL:');
    const permisos = getPermisosPorRol(user.rol);
    permisos.forEach(permiso => {
      console.log(`   - ${permiso}`);
    });

    // 4. Mostrar información de programación si existe
    console.log('\n📅 INFORMACIÓN DE PROGRAMACIÓN:');
    try {
      if (user.rut) {
        const programacionResult = await query(`
          SELECT 
            COUNT(*) as total_programaciones,
            MAX(created_at) as ultima_programacion
          FROM mantenimiento.programacion_optimizada 
          WHERE rut = $1
        `, [user.rut]);

        const programacion = programacionResult.rows[0];
        console.log(`   - Total programaciones: ${programacion.total_programaciones}`);
        console.log(`   - Última programación: ${programacion.ultima_programacion ? new Date(programacion.ultima_programacion).toLocaleString('es-CL') : 'Nunca'}`);
      } else {
        console.log(`   - No se puede verificar programación (RUT no asignado)`);
      }
    } catch (error) {
      console.log(`   - Error al consultar programación: ${error.message}`);
    }

    console.log('\n🎉 ¡Información del usuario mostrada exitosamente!');

  } catch (error) {
    console.error('❌ Error al buscar usuario:', error);
    throw error;
  }
}

function getPermisosPorRol(rol) {
  const permisos = {
    'admin': [
      'Crear usuarios',
      'Eliminar usuarios',
      'Modificar cualquier usuario',
      'Cambiar roles de usuarios',
      'Activar/desactivar usuarios',
      'Ver todos los usuarios',
      'Acceso completo al sistema',
      'Gestionar carteras',
      'Ver auditoría completa'
    ],
    'supervisor': [
      'Ver usuarios',
      'Modificar usuarios (limitado)',
      'Ver programaciones',
      'Crear programaciones',
      'Modificar programaciones',
      'Ver reportes',
      'Gestionar personal'
    ],
    'usuario': [
      'Ver su propia información',
      'Modificar su perfil',
      'Ver programaciones asignadas',
      'Ver documentos propios'
    ],
    'operador': [
      'Ver información básica',
      'Operaciones limitadas',
      'Acceso de solo lectura'
    ]
  };

  return permisos[rol] || ['Rol no reconocido'];
}

// Ejecutar si se llama directamente
if (require.main === module) {
  showUserClaudioMunoz()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { showUserClaudioMunoz };
