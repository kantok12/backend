const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function testProfileImageEndpoints() {
  try {
    console.log('🧪 Verificando funcionamiento de endpoints de imágenes de perfil...\n');

    // 1. Verificar que existe el directorio de perfiles
    console.log('📁 Verificando directorio de perfiles...');
    const profilesDir = path.join(__dirname, '../uploads/profiles');
    const dirExists = fs.existsSync(profilesDir);
    
    if (dirExists) {
      console.log(`✅ Directorio existe: ${profilesDir}`);
      const files = fs.readdirSync(profilesDir);
      console.log(`   - Archivos encontrados: ${files.length}`);
      if (files.length > 0) {
        console.log(`   - Ejemplos: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
      }
    } else {
      console.log(`⚠️  Directorio no existe: ${profilesDir}`);
      console.log(`   - Será creado automáticamente cuando se suba la primera imagen`);
    }

    // 2. Verificar usuarios con RUT en el sistema
    console.log('\n👤 Verificando usuarios con RUT...');
    const usersWithRut = await query(`
      SELECT 
        id,
        nombre,
        apellido,
        rut,
        email,
        rol
      FROM sistema.usuarios 
      WHERE rut IS NOT NULL AND rut != ''
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (usersWithRut.rows.length > 0) {
      console.log(`✅ Se encontraron ${usersWithRut.rows.length} usuarios con RUT:`);
      usersWithRut.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.nombre} ${user.apellido} - RUT: ${user.rut} (${user.rol})`);
      });
    } else {
      console.log('⚠️  No se encontraron usuarios con RUT asignado');
    }

    // 3. Verificar personal disponible que podría tener imágenes
    console.log('\n👥 Verificando personal disponible...');
    const personalResult = await query(`
      SELECT 
        rut,
        nombres,
        cargo
      FROM mantenimiento.personal_disponible 
      ORDER BY nombres
      LIMIT 5
    `);

    if (personalResult.rows.length > 0) {
      console.log(`✅ Se encontraron ${personalResult.rows.length} registros de personal disponible:`);
      personalResult.rows.forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.nombres} - RUT: ${person.rut}`);
      });

      // Verificar si alguno tiene imagen de perfil
      console.log('\n🖼️  Verificando imágenes de perfil existentes...');
      const rutConImagen = [];
      for (const person of personalResult.rows) {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        for (const ext of allowedExtensions) {
          const imagePath = path.join(profilesDir, `${person.rut}${ext}`);
          if (fs.existsSync(imagePath)) {
            rutConImagen.push({
              rut: person.rut,
              nombre: person.nombres,
              archivo: `${person.rut}${ext}`,
              ruta: imagePath
            });
            break;
        }
      }
    }

      if (rutConImagen.length > 0) {
        console.log(`✅ Se encontraron ${rutConImagen.length} imágenes de perfil:`);
        rutConImagen.forEach((img, index) => {
          const stats = fs.statSync(img.ruta);
          const sizeKB = (stats.size / 1024).toFixed(2);
          console.log(`   ${index + 1}. ${img.nombre} (${img.rut})`);
          console.log(`      - Archivo: ${img.archivo}`);
          console.log(`      - Tamaño: ${sizeKB} KB`);
          console.log(`      - URL esperada: /api/personal/${img.rut}/profile-image`);
        });
      } else {
        console.log('⚠️  No se encontraron imágenes de perfil existentes');
      }
    } else {
      console.log('⚠️  No se encontró personal disponible');
    }

    // 4. Verificar estructura de endpoints disponibles
    console.log('\n📋 ENDPOINTS DISPONIBLES PARA VERIFICAR:');
    console.log('\n   Para Personal Disponible (por RUT):');
    console.log('   ✅ POST   /api/personal/{rut}/profile-image');
    console.log('   ✅ GET    /api/personal/{rut}/profile-image');
    console.log('   ✅ GET    /api/personal/{rut}/profile-image/download');
    console.log('   ✅ DELETE /api/personal/{rut}/profile-image');
    
    console.log('\n   ⚠️  Para Usuarios del Sistema (por ID):');
    console.log('   ❌ POST   /api/users/{id}/profile-image - NO EXISTE');
    console.log('   ❌ GET    /api/users/{id}/profile-image - NO EXISTE');
    console.log('   ❌ DELETE /api/users/{id}/profile-image - NO EXISTE');

    // 5. Verificar si hay campo profile_image_url en usuarios
    console.log('\n🗄️  Verificando estructura de tabla usuarios...');
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'sistema' 
      AND table_name = 'usuarios'
      AND column_name = 'profile_image_url'
    `);

    if (tableInfo.rows.length > 0) {
      console.log('✅ Campo profile_image_url existe en tabla usuarios:');
      console.log(`   - Tipo: ${tableInfo.rows[0].data_type}`);
      console.log(`   - Nullable: ${tableInfo.rows[0].is_nullable}`);
    } else {
      console.log('❌ Campo profile_image_url NO existe en tabla usuarios');
      console.log('   - Necesario agregar para persistencia de imágenes');
    }

    // 6. Verificar ruta en server.js
    console.log('\n🔗 Verificando registro de rutas en server.js...');
    const serverContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
    
    if (serverContent.includes('profile-images')) {
      console.log('✅ Rutas de profile-images están registradas en server.js');
      if (serverContent.includes("/api/personal")) {
        console.log('   - Rutas registradas bajo /api/personal');
      }
    } else {
      console.log('⚠️  No se encontró registro de rutas profile-images');
    }

    // 7. Verificar que el endpoint /api/auth/me incluya imagen
    console.log('\n🔍 Verificando endpoint /api/auth/me...');
    const authMeContent = fs.readFileSync(path.join(__dirname, '../routes/auth.js'), 'utf8');
    
    if (authMeContent.includes('profile_image_url')) {
      console.log('✅ El endpoint /api/auth/me incluye profile_image_url');
    } else {
      console.log('❌ El endpoint /api/auth/me NO incluye profile_image_url');
      console.log('   - Necesario agregar para mostrar imagen en frontend');
    }

    // 8. Resumen y recomendaciones
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(60));
    
    const status = {
      directorio: dirExists ? '✅' : '⚠️ ',
      endpointsPersonal: '✅',
      endpointsUsuarios: '❌',
      campoBD: tableInfo.rows.length > 0 ? '✅' : '❌',
      authMe: authMeContent.includes('profile_image_url') ? '✅' : '❌',
      rutasRegistradas: serverContent.includes('profile-images') ? '✅' : '❌'
    };

    console.log(`\n   Directorio de perfiles:           ${status.directorio}`);
    console.log(`   Endpoints para personal:          ${status.endpointsPersonal}`);
    console.log(`   Endpoints para usuarios:          ${status.endpointsUsuarios}`);
    console.log(`   Campo en BD (usuarios):           ${status.campoBD}`);
    console.log(`   Integrado en /api/auth/me:        ${status.authMe}`);
    console.log(`   Rutas registradas en server.js:   ${status.rutasRegistradas}`);

    // 9. Próximos pasos recomendados
    console.log('\n' + '='.repeat(60));
    console.log('💡 PRÓXIMOS PASOS RECOMENDADOS');
    console.log('='.repeat(60));
    
    const pasos = [];
    
    if (!tableInfo.rows.length > 0) {
      pasos.push('1. Agregar campo profile_image_url a tabla sistema.usuarios');
    }
    
    if (!authMeContent.includes('profile_image_url')) {
      pasos.push('2. Actualizar endpoint /api/auth/me para incluir profile_image_url');
    }
    
    if (!serverContent.includes('/api/users') || !serverContent.includes('profile-images')) {
      pasos.push('3. Crear endpoints para usuarios del sistema (/api/users/{id}/profile-image)');
    }
    
    if (pasos.length === 0) {
      console.log('\n✅ ¡Todo está funcionando correctamente!');
      console.log('   Los endpoints están listos para usar.');
    } else {
      pasos.forEach((paso, index) => {
        console.log(`\n   ${paso}`);
      });
    }

    // 10. Ejemplo de uso
    if (usersWithRut.rows.length > 0 || personalResult.rows.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('📝 EJEMPLO DE USO');
      console.log('='.repeat(60));
      
      const ejemploRut = usersWithRut.rows[0]?.rut || personalResult.rows[0]?.rut;
      
      if (ejemploRut) {
        console.log(`\n   Para probar con RUT: ${ejemploRut}`);
        console.log(`   \n   POST   /api/personal/${ejemploRut}/profile-image`);
        console.log(`   GET    /api/personal/${ejemploRut}/profile-image`);
        console.log(`   DELETE /api/personal/${ejemploRut}/profile-image`);
        console.log(`\n   Headers necesarios:`);
        console.log(`   Content-Type: multipart/form-data`);
        console.log(`   Body: file (imagen)`);
      }
    }

    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testProfileImageEndpoints()
    .then(() => {
      console.log('✅ Script de verificación completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { testProfileImageEndpoints };
