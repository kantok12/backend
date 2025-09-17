#!/usr/bin/env node

/**
 * Script para ejecutar la actualización de estados
 * Configura los 4 estados con "activo" dividido en 2 versiones
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
const { runEstadosUpdate, checkCurrentEstados } = require('./update-estados');

console.log('🔄 EJECUTANDO ACTUALIZACIÓN DE ESTADOS');
console.log('📁 Directorio de trabajo:', process.cwd());
console.log('⏰ Fecha:', new Date().toISOString());
console.log('=' .repeat(60));

const command = process.argv[2];

if (command === 'check') {
  console.log('🔍 Verificando estado actual de estados...');
  checkCurrentEstados()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error en verificación:', error.message);
      process.exit(1);
    });
} else {
  console.log('📋 Objetivo: Configurar 4 estados con "activo" dividido en 2 versiones');
  console.log('   1. Proceso de Activo');
  console.log('   2. De Acreditación');
  console.log('   3. Inactivo');
  console.log('   4. Vacaciones');
  console.log('\n🚀 Iniciando actualización...');
  
  runEstadosUpdate()
    .then(() => {
      console.log('\n✅ ACTUALIZACIÓN DE ESTADOS COMPLETADA EXITOSAMENTE');
      console.log('🎯 Próximos pasos:');
      console.log('   1. Verificar que los endpoints de estados funcionan');
      console.log('   2. Actualizar personal que tenga estados obsoletos');
      console.log('   3. Probar la funcionalidad completa');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ ERROR EN LA ACTUALIZACIÓN:');
      console.error(error.message);
      console.error('\n🔧 Soluciones posibles:');
      console.error('   1. Verificar conexión a la base de datos');
      console.error('   2. Verificar permisos de usuario');
      console.error('   3. Verificar que la tabla estados existe');
      process.exit(1);
    });
}





