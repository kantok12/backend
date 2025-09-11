const { query } = require('../config/postgresql');

/**
 * Script para eliminar tablas obsoletas después de la migración
 * Elimina: cursos_documentos y cursos_certificaciones
 */

async function verifyDataBeforeCleanup() {
  console.log('🔍 Verificando datos antes de la limpieza...');
  
  try {
    // Verificar cursos_documentos
    const cursosDocsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN activo = true THEN 1 END) as activos
      FROM mantenimiento.cursos_documentos
    `);
    
    console.log('📚 cursos_documentos:');
    console.log(`   Total: ${cursosDocsResult.rows[0].total}`);
    console.log(`   Activos: ${cursosDocsResult.rows[0].activos}`);
    
    // Verificar cursos_certificaciones
    const cursosCertResult = await query(`
      SELECT COUNT(*) as total
      FROM mantenimiento.cursos_certificaciones
    `);
    
    console.log('🎓 cursos_certificaciones:');
    console.log(`   Total: ${cursosCertResult.rows[0].total}`);
    
    // Verificar documentos migrados
    const documentosResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN activo = true THEN 1 END) as activos
      FROM mantenimiento.documentos
    `);
    
    console.log('📄 documentos (nueva tabla):');
    console.log(`   Total: ${documentosResult.rows[0].total}`);
    console.log(`   Activos: ${documentosResult.rows[0].activos}`);
    
    return {
      cursosDocs: cursosDocsResult.rows[0],
      cursosCert: cursosCertResult.rows[0],
      documentos: documentosResult.rows[0]
    };
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    throw error;
  }
}

async function dropCursosDocumentos() {
  console.log('\n🗑️ Eliminando tabla cursos_documentos...');
  
  try {
    // Eliminar índices
    const indexes = [
      'DROP INDEX IF EXISTS mantenimiento.idx_cursos_documentos_curso_id',
      'DROP INDEX IF EXISTS mantenimiento.idx_cursos_documentos_activo',
      'DROP INDEX IF EXISTS mantenimiento.idx_cursos_documentos_fecha'
    ];
    
    for (const indexQuery of indexes) {
      await query(indexQuery);
    }
    console.log('✅ Índices eliminados');
    
    // Eliminar tabla
    await query('DROP TABLE IF EXISTS mantenimiento.cursos_documentos');
    console.log('✅ Tabla cursos_documentos eliminada');
    
  } catch (error) {
    console.error('❌ Error eliminando cursos_documentos:', error);
    throw error;
  }
}

async function dropCursosCertificaciones() {
  console.log('\n🗑️ Eliminando tabla cursos_certificaciones...');
  
  try {
    // Eliminar índices
    await query('DROP INDEX IF EXISTS mantenimiento.idx_cursos_rut');
    console.log('✅ Índices eliminados');
    
    // Eliminar tabla
    await query('DROP TABLE IF EXISTS mantenimiento.cursos_certificaciones');
    console.log('✅ Tabla cursos_certificaciones eliminada');
    
  } catch (error) {
    console.error('❌ Error eliminando cursos_certificaciones:', error);
    throw error;
  }
}

async function verifyCleanup() {
  console.log('\n🔍 Verificando limpieza...');
  
  try {
    // Verificar que las tablas fueron eliminadas
    const deletedTables = await query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento' 
      AND table_name IN ('cursos_documentos', 'cursos_certificaciones')
    `);
    
    if (deletedTables.rows.length === 0) {
      console.log('✅ Tablas eliminadas correctamente');
    } else {
      console.log('⚠️ Algunas tablas no fueron eliminadas:', deletedTables.rows);
    }
    
    // Mostrar tablas restantes
    const remainingTables = await query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tablas restantes en esquema mantenimiento:');
    remainingTables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando limpieza:', error);
    throw error;
  }
}

async function cleanupOldTables() {
  try {
    console.log('🧹 INICIANDO LIMPIEZA DE TABLAS OBSOLETAS');
    console.log('=' .repeat(60));
    
    // Verificar datos antes de eliminar
    const dataStats = await verifyDataBeforeCleanup();
    
    // Confirmar eliminación
    console.log('\n⚠️ ADVERTENCIA: Se eliminarán las siguientes tablas:');
    console.log('   - cursos_documentos');
    console.log('   - cursos_certificaciones');
    console.log('\n📊 Datos que serán eliminados:');
    console.log(`   - ${dataStats.cursosDocs.total} registros en cursos_documentos`);
    console.log(`   - ${dataStats.cursosCert.total} registros en cursos_certificaciones`);
    console.log(`   - ${dataStats.documentos.total} registros migrados a documentos`);
    
    // Eliminar tablas
    await dropCursosDocumentos();
    await dropCursosCertificaciones();
    
    // Verificar limpieza
    await verifyCleanup();
    
    console.log('\n🎉 LIMPIEZA COMPLETADA EXITOSAMENTE');
    console.log('=' .repeat(60));
    console.log('✅ Tablas obsoletas eliminadas');
    console.log('✅ Índices eliminados');
    console.log('✅ Estructura simplificada');
    console.log('✅ Solo tabla documentos activa');
    
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Verificar que todos los endpoints funcionan');
    console.log('   2. Probar la funcionalidad de documentos');
    console.log('   3. Actualizar documentación si es necesario');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA LIMPIEZA:', error);
    console.error('\n🔧 Posibles soluciones:');
    console.error('   1. Verificar que la migración fue exitosa');
    console.error('   2. Verificar permisos de usuario');
    console.error('   3. Verificar que no hay dependencias activas');
    throw error;
  }
}

// Función para verificar estado sin eliminar
async function checkCleanupStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE LIMPIEZA');
  console.log('=' .repeat(50));
  
  try {
    // Verificar tablas existentes
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento'
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas en esquema mantenimiento:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Verificar si las tablas obsoletas existen
    const obsoleteTables = tablesResult.rows.filter(row => 
      ['cursos_documentos', 'cursos_certificaciones'].includes(row.table_name)
    );
    
    if (obsoleteTables.length === 0) {
      console.log('\n✅ Limpieza completada - No hay tablas obsoletas');
    } else {
      console.log('\n⚠️ Tablas obsoletas encontradas:');
      obsoleteTables.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'check') {
    checkCleanupStatus()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else {
    cleanupOldTables()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  cleanupOldTables,
  checkCleanupStatus
};
