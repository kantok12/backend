#!/usr/bin/env node

/**
 * Script para ejecutar la migración de documentos
 * Este script se puede ejecutar independientemente del servidor
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
const { runMigration } = require('./simple-migration');

console.log('🔧 EJECUTANDO MIGRACIÓN DE DOCUMENTOS');
console.log('📁 Directorio de trabajo:', process.cwd());
console.log('⏰ Fecha:', new Date().toISOString());
console.log('=' .repeat(60));

runMigration()
  .then(() => {
    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('🎯 Próximos pasos:');
    console.log('   1. Reiniciar el servidor');
    console.log('   2. Probar los nuevos endpoints de documentos');
    console.log('   3. Verificar que todo funciona correctamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ ERROR EN LA MIGRACIÓN:');
    console.error(error.message);
    console.error('\n🔧 Soluciones posibles:');
    console.error('   1. Verificar conexión a la base de datos');
    console.error('   2. Verificar permisos de usuario');
    console.error('   3. Verificar que el esquema mantenimiento existe');
    process.exit(1);
  });