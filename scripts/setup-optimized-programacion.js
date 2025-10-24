#!/usr/bin/env node

const { setupOptimizedProgramacion } = require('./create-optimized-programacion-tables');

async function main() {
  console.log('🚀 Iniciando configuración del sistema de programación optimizado...');
  console.log('');
  
  try {
    await setupOptimizedProgramacion();
    
    console.log('');
    console.log('🎉 ¡Configuración completada exitosamente!');
    console.log('');
    console.log('📋 Nuevas funcionalidades disponibles:');
    console.log('   ✅ Programación por fechas específicas');
    console.log('   ✅ Identificación clara de días de la semana');
    console.log('   ✅ Mejor administración y consultas');
    console.log('   ✅ Vista de calendario mensual');
    console.log('   ✅ Historial optimizado');
    console.log('   ✅ Compatibilidad con sistema anterior');
    console.log('');
    console.log('🔗 Nuevos endpoints disponibles:');
    console.log('   - GET /api/programacion-optimizada');
    console.log('   - POST /api/programacion-optimizada');
    console.log('   - POST /api/programacion-optimizada/semana');
    console.log('   - GET /api/programacion-optimizada/calendario');
    console.log('   - PUT /api/programacion-optimizada/:id');
    console.log('   - DELETE /api/programacion-optimizada/:id');
    console.log('');
    console.log('📊 Endpoints existentes (compatibilidad):');
    console.log('   - GET /api/programacion (sistema anterior)');
    console.log('   - Vista: mantenimiento.programacion_semanal_vista');
    console.log('');
    console.log('🎯 Próximos pasos:');
    console.log('   1. Probar los nuevos endpoints');
    console.log('   2. Actualizar el frontend para usar el nuevo sistema');
    console.log('   3. Migrar gradualmente del sistema anterior');
    console.log('   4. Considerar eliminar el sistema anterior en el futuro');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { main };
