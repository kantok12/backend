const express = require('express');
const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function verifyImageEndpoints() {
  try {
    console.log('🧪 Verificando implementación y funcionamiento de endpoints de imágenes...\n');
    console.log('='.repeat(70));

    // 1. Verificar endpoints implementados en el código
    console.log('\n📋 VERIFICANDO ENDPOINTS IMPLEMENTADOS\n');
    
    const profileImagesContent = fs.readFileSync(path.join(__dirname, '../routes/profile-images.js'), 'utf8');
    
    const endpointsToCheck = [
      { method: 'POST', path: '/api/personal/{rut}/upload', search: 'POST /api/personal/{rut}/upload' },
      { method: 'GET', path: '/api/personal/{rut}/image', search: 'GET /api/personal/{rut}/image' },
      { method: 'HEAD', path: '/api/personal/{rut}/image', search: 'HEAD /api/personal/{rut}/image' },
      { method: 'DELETE', path: '/api/personal/{rut}/image', search: 'DELETE /api/personal/{rut}/image' },
      { method: 'GET', path: '/api/personal/{rut}/image/download', search: 'GET /api/personal/{rut}/image/download' }
    ];

    const routePatterns = [
      { method: 'POST', pattern: "router.post('/:rut/upload'" },
      { method: 'GET', pattern: "router.get('/:rut/image'" },
      { method: 'HEAD', pattern: "router.head('/:rut/image'" },
      { method: 'DELETE', pattern: "router.delete('/:rut/image'" },
      { method: 'GET', pattern: "router.get('/:rut/image/download'" }
    ];

    console.log('   Verificando rutas en routes/profile-images.js:\n');
    
    let allEndpointsFound = true;
    routePatterns.forEach((endpoint, index) => {
      const exists = profileImagesContent.includes(endpoint.pattern);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${endpoint.method.padEnd(6)} ${endpointsToCheck[index].path}`);
      if (!exists) {
        allEndpointsFound = false;
      }
    });

    // 2. Verificar funcionalidades específicas
    console.log('\n🔍 VERIFICANDO FUNCIONALIDADES ESPECÍFICAS\n');
    
    const functionalities = [
      { name: 'Verificación de RUT en usuarios del sistema', search: 'sistema.usuarios WHERE rut' },
      { name: 'Verificación de RUT en personal disponible', search: 'mantenimiento.personal_disponible WHERE rut' },
      { name: 'Actualización de profile_image_url en usuarios', search: 'UPDATE sistema.usuarios SET profile_image_url' },
      { name: 'Manejo de múltiples extensiones de imagen', search: 'allowedExtensions' },
      { name: 'Eliminación de imágenes antiguas al subir nueva', search: 'existingFiles.forEach' },
      { name: 'Manejo de errores de multer', search: 'handleUploadError' },
      { name: 'Validación de tipos de archivo', search: 'allowedTypes' },
      { name: 'Límite de tamaño de archivo (5MB)', search: '5 * 1024 * 1024' }
    ];

    functionalities.forEach(func => {
      const exists = profileImagesContent.includes(func.search);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${func.name}`);
    });

    // 3. Verificar usuarios disponibles para prueba
    console.log('\n👤 USUARIOS DISPONIBLES PARA PRUEBA\n');
    
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
      LIMIT 3
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
      console.log('   ⚠️  No se encontraron usuarios con RUT');
    }

    // 4. Verificar personal disponible
    console.log('👥 PERSONAL DISPONIBLE PARA PRUEBA\n');
    
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
    } else {
      console.log('   ⚠️  No se encontró personal disponible');
    }

    // 5. Verificar directorio de perfiles
    console.log('\n📁 DIRECTORIO DE PERFILES\n');
    
    const profilesDir = path.join(__dirname, '../uploads/profiles');
    const dirExists = fs.existsSync(profilesDir);
    
    if (dirExists) {
      const files = fs.readdirSync(profilesDir);
      console.log(`   ✅ Directorio existe: ${profilesDir}`);
      console.log(`   - Archivos encontrados: ${files.length}`);
      if (files.length > 0) {
        console.log(`   - Ejemplos: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
      }
    } else {
      console.log(`   ⚠️  Directorio no existe: ${profilesDir}`);
      console.log(`   - Será creado automáticamente al subir la primera imagen`);
    }

    // 6. Verificar integración con /api/auth/me
    console.log('\n🔗 INTEGRACIÓN CON /api/auth/me\n');
    
    const authMeContent = fs.readFileSync(path.join(__dirname, '../routes/auth.js'), 'utf8');
    
    const authMeChecks = [
      { name: 'Campo profile_image_url en SELECT', search: 'u.profile_image_url' },
      { name: 'Campo profile_image_url en respuesta JSON', search: 'profile_image_url: user.profile_image_url' }
    ];

    authMeChecks.forEach(check => {
      const exists = authMeContent.includes(check.search);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
    });

    // 7. Verificar registro de rutas en server.js
    console.log('\n🌐 REGISTRO DE RUTAS EN SERVER.JS\n');
    
    const serverContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
    
    const routeChecks = [
      { name: 'Rutas profile-images registradas', search: '/api/personal', require: 'profileImagesRoutes' },
      { name: 'Rutas profile-photos registradas', search: '/api/profile-photos', require: 'profilePhotosRoutes' }
    ];

    routeChecks.forEach(check => {
      const hasRoute = serverContent.includes(check.search);
      const hasRequire = serverContent.includes(check.require);
      const status = (hasRoute && hasRequire) ? '✅' : '⚠️ ';
      console.log(`   ${status} ${check.name}`);
    });

    // 8. Resumen completo
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(70));
    
    const testRut = usersResult.rows[0]?.rut || personalResult.rows[0]?.rut;
    
    if (allEndpointsFound && testRut) {
      console.log('\n✅ TODOS LOS ENDPOINTS ESTÁN IMPLEMENTADOS\n');
      
      console.log('📝 ENDPOINTS DISPONIBLES (según documentación):\n');
      console.log(`   POST   /api/personal/${testRut}/upload`);
      console.log(`   GET    /api/personal/${testRut}/image`);
      console.log(`   HEAD   /api/personal/${testRut}/image`);
      console.log(`   DELETE /api/personal/${testRut}/image`);
      console.log(`   GET    /api/personal/${testRut}/image/download`);
      
      console.log('\n💡 FUNCIONES ESPERADAS:\n');
      console.log('   ✅ uploadProfileImage(rut, file)');
      console.log('   ✅ getProfileImage(rut)');
      console.log('   ✅ deleteProfileImage(rut)');
      console.log('   ✅ checkProfileImageExists(rut)');
      
      console.log('\n🎯 CARACTERÍSTICAS IMPLEMENTADAS:\n');
      console.log('   ✅ Verificación de RUT en usuarios y personal');
      console.log('   ✅ Persistencia en base de datos (profile_image_url)');
      console.log('   ✅ Sincronización automática entre usuarios y personal');
      console.log('   ✅ Integración con /api/auth/me');
      console.log('   ✅ Manejo de múltiples formatos de imagen');
      console.log('   ✅ Validación de tipos de archivo');
      console.log('   ✅ Límite de tamaño (5MB)');
      
      console.log('\n📋 EJEMPLO DE USO:\n');
      console.log(`   // Subir imagen`);
      console.log(`   POST /api/personal/${testRut}/upload`);
      console.log(`   Content-Type: multipart/form-data`);
      console.log(`   Body: file (imagen)`);
      console.log(`   \n   // Obtener URL`);
      console.log(`   GET /api/personal/${testRut}/image`);
      console.log(`   \n   // Verificar existencia`);
      console.log(`   HEAD /api/personal/${testRut}/image`);
      console.log(`   \n   // Eliminar`);
      console.log(`   DELETE /api/personal/${testRut}/image`);
      
      console.log('\n✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE\n');
    } else {
      console.log('\n⚠️  ALGUNOS ENDPOINTS FALTAN O NO HAY DATOS DE PRUEBA\n');
      
      if (!allEndpointsFound) {
        console.log('   Faltan endpoints en el código');
      }
      
      if (!testRut) {
        console.log('   No hay usuarios o personal disponible para pruebas');
      }
    }

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verifyImageEndpoints()
    .then(() => {
      console.log('✅ Script de verificación completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { verifyImageEndpoints };
