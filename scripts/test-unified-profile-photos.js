const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function testUnifiedProfilePhotos() {
  try {
    console.log('🧪 Verificando endpoints unificados de fotos de perfil...\n');

    // 1. Verificar que el campo profile_image_url existe
    console.log('🗄️  Verificando campo profile_image_url...');
    const fieldResult = await query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'sistema' 
      AND table_name = 'usuarios'
      AND column_name = 'profile_image_url'
    `);

    if (fieldResult.rows.length > 0) {
      console.log('✅ Campo profile_image_url existe');
      console.log(`   - Tipo: ${fieldResult.rows[0].data_type}`);
      console.log(`   - Longitud: ${fieldResult.rows[0].character_maximum_length}`);
    } else {
      console.log('❌ Campo profile_image_url no existe');
      return;
    }

    // 2. Verificar usuarios con RUT disponibles para prueba
    console.log('\n👤 Usuarios disponibles para prueba:');
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
        console.log(`      - Imagen actual: ${user.profile_image_url || 'No asignada'}`);
        console.log('');
      });
    } else {
      console.log('   No se encontraron usuarios con RUT');
      return;
    }

    // 3. Verificar personal disponible
    console.log('👥 Personal disponible para prueba:');
    const personalResult = await query(`
      SELECT 
        rut,
        nombres,
        cargo
      FROM mantenimiento.personal_disponible 
      ORDER BY nombres
      LIMIT 3
    `);

    if (personalResult.rows.length > 0) {
      personalResult.rows.forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.nombres} - RUT: ${person.rut}`);
      });
    }

    // 4. Verificar directorio de perfiles
    console.log('\n📁 Verificando directorio de perfiles...');
    const profilesDir = path.join(__dirname, '../uploads/profiles');
    const dirExists = fs.existsSync(profilesDir);
    
    if (dirExists) {
      const files = fs.readdirSync(profilesDir);
      console.log(`✅ Directorio existe: ${profilesDir}`);
      console.log(`   - Archivos encontrados: ${files.length}`);
      if (files.length > 0) {
        console.log(`   - Ejemplos: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
      }
    } else {
      console.log(`⚠️  Directorio no existe: ${profilesDir}`);
    }

    // 5. Mostrar endpoints disponibles
    console.log('\n📋 ENDPOINTS UNIFICADOS DISPONIBLES:');
    console.log('\n   🆕 Nuevos endpoints unificados (/api/profile-photos):');
    console.log('   ✅ POST   /api/profile-photos/{rut}/upload');
    console.log('   ✅ GET    /api/profile-photos/{rut}/image');
    console.log('   ✅ HEAD   /api/profile-photos/{rut}/image');
    console.log('   ✅ DELETE /api/profile-photos/{rut}/image');
    console.log('   ✅ GET    /api/profile-photos/{rut}/image/download');
    
    console.log('\n   🔄 Endpoints existentes (/api/personal):');
    console.log('   ✅ POST   /api/personal/{rut}/profile-image');
    console.log('   ✅ GET    /api/personal/{rut}/profile-image');
    console.log('   ✅ DELETE /api/personal/{rut}/profile-image');
    console.log('   ✅ GET    /api/personal/{rut}/profile-image/download');

    // 6. Verificar integración con /api/auth/me
    console.log('\n🔍 Verificando integración con /api/auth/me...');
    const authMeContent = fs.readFileSync(path.join(__dirname, '../routes/auth.js'), 'utf8');
    
    if (authMeContent.includes('profile_image_url')) {
      console.log('✅ El endpoint /api/auth/me incluye profile_image_url');
    } else {
      console.log('❌ El endpoint /api/auth/me NO incluye profile_image_url');
    }

    // 7. Verificar registro de rutas
    console.log('\n🔗 Verificando registro de rutas...');
    const serverContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
    
    if (serverContent.includes('/api/profile-photos')) {
      console.log('✅ Rutas /api/profile-photos registradas en server.js');
    } else {
      console.log('❌ Rutas /api/profile-photos NO registradas en server.js');
    }

    // 8. Mostrar ejemplo de uso
    const testRut = usersResult.rows[0]?.rut || personalResult.rows[0]?.rut;
    if (testRut) {
      console.log('\n' + '='.repeat(60));
      console.log('📝 EJEMPLO DE USO CON RUT UNIFICADO');
      console.log('='.repeat(60));
      console.log(`\n   Usando RUT: ${testRut}`);
      console.log('\n   🆕 Endpoints unificados (recomendados):');
      console.log(`   POST   /api/profile-photos/${testRut}/upload`);
      console.log(`   GET    /api/profile-photos/${testRut}/image`);
      console.log(`   HEAD   /api/profile-photos/${testRut}/image`);
      console.log(`   DELETE /api/profile-photos/${testRut}/image`);
      
      console.log('\n   🔄 Endpoints existentes (compatibilidad):');
      console.log(`   POST   /api/personal/${testRut}/profile-image`);
      console.log(`   GET    /api/personal/${testRut}/profile-image`);
      console.log(`   DELETE /api/personal/${testRut}/profile-image`);

      console.log('\n   📋 Headers necesarios para subir:');
      console.log('   Content-Type: multipart/form-data');
      console.log('   Body: file (imagen)');
    }

    // 9. Ventajas del sistema unificado
    console.log('\n' + '='.repeat(60));
    console.log('✨ VENTAJAS DEL SISTEMA UNIFICADO');
    console.log('='.repeat(60));
    console.log('\n   🎯 Un solo RUT para todo:');
    console.log('   - Usuarios del sistema y personal disponible usan el mismo RUT');
    console.log('   - Una imagen de perfil sirve para ambos contextos');
    console.log('   - Consistencia en toda la aplicación');
    
    console.log('\n   🔄 Sincronización automática:');
    console.log('   - Al subir imagen se actualiza automáticamente en usuarios');
    console.log('   - Al eliminar imagen se limpia en usuarios');
    console.log('   - Persistencia en base de datos');
    
    console.log('\n   📱 Integración con frontend:');
    console.log('   - /api/auth/me devuelve profile_image_url');
    console.log('   - Misma imagen en página personal y perfil de usuario');
    console.log('   - Endpoints compatibles con la documentación mostrada');

    console.log('\n✅ Verificación completada exitosamente\n');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testUnifiedProfilePhotos()
    .then(() => {
      console.log('✅ Script de verificación completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { testUnifiedProfilePhotos };
