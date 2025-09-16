#!/usr/bin/env node

/**
 * Script para ejecutar la limpieza de tablas obsoletas
 * Elimina: cursos_documentos y cursos_certificaciones
 */

const path = require('path');
const fs = require('fs');

// Cambiar al directorio del proyecto
process.chdir(__dirname + '/..');

// Verificar que existe el archivo de configuración
if (!fs.existsSync('./config/postgresql.js')) {
  console.error('❌ No se encontró el archivo de configuración PostgreSQL');
  console.error('   Asegúrate de estar en el directorio correcto del proyecto');
  process.exit(1);
}

// Importar después de cambiar el directorio
const { cleanupOldTables, checkCleanupStatus } = require('./cleanup-old-tables');

console.log('🧹 EJECUTANDO LIMPIEZA DE TABLAS OBSOLETAS');
console.log('📁 Directorio de trabajo:', process.cwd());
console.log('⏰ Fecha:', new Date().toISOString());
console.log('=' .repeat(60));

const command = process.argv[2];

if (command === 'check') {
  console.log('🔍 Verificando estado de limpieza...');
  checkCleanupStatus()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error en verificación:', error.message);
      process.exit(1);
    });
} else {
  console.log('⚠️ ADVERTENCIA: Se eliminarán las siguientes tablas:');
  console.log('   - cursos_documentos');
  console.log('   - cursos_certificaciones');
  console.log('\n📋 Asegúrate de que:');
  console.log('   1. Los datos fueron migrados a la tabla documentos');
  console.log('   2. Todos los endpoints funcionan correctamente');
  console.log('   3. No hay aplicaciones que dependan de estas tablas');
  console.log('\n🚀 Iniciando limpieza...');
  
  cleanupOldTables()
    .then(() => {
      console.log('\n✅ LIMPIEZA COMPLETADA EXITOSAMENTE');
      console.log('🎯 Próximos pasos:');
      console.log('   1. Verificar que todos los endpoints funcionan');
      console.log('   2. Probar la funcionalidad de documentos');
      console.log('   3. Actualizar documentación si es necesario');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ ERROR EN LA LIMPIEZA:');
      console.error(error.message);
      console.error('\n🔧 Soluciones posibles:');
      console.error('   1. Verificar que la migración fue exitosa');
      console.error('   2. Verificar permisos de usuario');
      console.error('   3. Verificar que no hay dependencias activas');
      process.exit(1);
    });
}



