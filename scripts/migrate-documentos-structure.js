const { query } = require('../config/postgresql');
const fs = require('fs');
const path = require('path');

/**
 * Script de migración para separar documentos de cursos
 * Permite que documentos se relacione directamente con personal_disponible
 */

async function migrateDocumentosStructure() {
  console.log('🔄 INICIANDO MIGRACIÓN DE ESTRUCTURA DE DOCUMENTOS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar estado actual
    console.log('📊 1. Verificando estado actual...');
    
    const checkCurrentState = `
      SELECT 
        'cursos_documentos' as tabla,
        COUNT(*) as registros
      FROM mantenimiento.cursos_documentos
      WHERE activo = true
      UNION ALL
      SELECT 
        'cursos_certificaciones' as tabla,
        COUNT(*) as registros
      FROM mantenimiento.cursos_certificaciones
      UNION ALL
      SELECT 
        'personal_disponible' as tabla,
        COUNT(*) as registros
      FROM mantenimiento.personal_disponible
    `;
    
    const currentState = await query(checkCurrentState);
    console.log('📈 Estado actual:');
    currentState.rows.forEach(row => {
      console.log(`   ${row.tabla}: ${row.registros} registros`);
    });
    
    // 2. Crear nueva tabla documentos
    console.log('\n🏗️ 2. Creando nueva tabla documentos...');
    
    const createDocumentosTable = `
      CREATE TABLE IF NOT EXISTS mantenimiento.documentos (
        id SERIAL PRIMARY KEY,
        rut_persona TEXT NOT NULL,
        nombre_documento VARCHAR(255) NOT NULL,
        tipo_documento VARCHAR(100) NOT NULL,
        nombre_archivo VARCHAR(255) NOT NULL,
        nombre_original VARCHAR(255) NOT NULL,
        tipo_mime VARCHAR(100) NOT NULL,
        tamaño_bytes BIGINT NOT NULL,
        ruta_archivo TEXT NOT NULL,
        descripcion TEXT,
        fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        subido_por VARCHAR(100),
        activo BOOLEAN DEFAULT TRUE,
        
        CONSTRAINT chk_tipo_documento CHECK (tipo_documento IN (
          'certificado_curso', 'diploma', 'certificado_laboral', 
          'certificado_medico', 'licencia_conducir', 'certificado_seguridad',
          'certificado_vencimiento', 'otro'
        )),
        
        CONSTRAINT fk_documento_persona FOREIGN KEY (rut_persona) 
          REFERENCES mantenimiento.personal_disponible(rut) ON DELETE CASCADE
      )
    `;
    
    await query(createDocumentosTable);
    console.log('✅ Tabla documentos creada');
    
    // 3. Crear índices
    console.log('\n📋 3. Creando índices...');
    
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_documentos_rut_persona ON mantenimiento.documentos(rut_persona)',
      'CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON mantenimiento.documentos(tipo_documento)',
      'CREATE INDEX IF NOT EXISTS idx_documentos_fecha_subida ON mantenimiento.documentos(fecha_subida)',
      'CREATE INDEX IF NOT EXISTS idx_documentos_activo ON mantenimiento.documentos(activo)',
      'CREATE INDEX IF NOT EXISTS idx_documentos_nombre ON mantenimiento.documentos(nombre_documento)'
    ];
    
    for (const indexQuery of createIndexes) {
      await query(indexQuery);
    }
    console.log('✅ Índices creados');
    
    // 4. Migrar datos existentes
    console.log('\n🔄 4. Migrando datos existentes...');
    
    const migrateData = `
      INSERT INTO mantenimiento.documentos (
        rut_persona,
        nombre_documento,
        tipo_documento,
        nombre_archivo,
        nombre_original,
        tipo_mime,
        tamaño_bytes,
        ruta_archivo,
        descripcion,
        fecha_subida,
        subido_por,
        activo
      )
      SELECT 
        cc.rut_persona,
        cc.nombre_curso || ' - Documento' as nombre_documento,
        'certificado_curso' as tipo_documento,
        cd.nombre_archivo,
        cd.nombre_original,
        cd.tipo_mime,
        cd.tamaño_bytes,
        cd.ruta_archivo,
        cd.descripcion,
        cd.fecha_subida,
        cd.subido_por,
        cd.activo
      FROM mantenimiento.cursos_documentos cd
      JOIN mantenimiento.cursos_certificaciones cc ON cd.curso_id = cc.id
      WHERE cd.activo = true
      ON CONFLICT DO NOTHING
    `;
    
    const migrateResult = await query(migrateData);
    console.log('✅ Datos migrados');
    
    // 5. Verificar migración
    console.log('\n📊 5. Verificando migración...');
    
    const verifyMigration = `
      SELECT 
        'Documentos migrados' as descripcion,
        COUNT(*) as cantidad
      FROM mantenimiento.documentos
      UNION ALL
      SELECT 
        'Documentos originales' as descripcion,
        COUNT(*) as cantidad
      FROM mantenimiento.cursos_documentos
      WHERE activo = true
    `;
    
    const verification = await query(verifyMigration);
    console.log('📈 Resultados de la migración:');
    verification.rows.forEach(row => {
      console.log(`   ${row.descripcion}: ${row.cantidad} registros`);
    });
    
    // 6. Agregar comentarios
    console.log('\n📝 6. Agregando comentarios...');
    
    const addComments = [
      "COMMENT ON TABLE mantenimiento.documentos IS 'Tabla para almacenar documentos del personal de forma independiente'",
      "COMMENT ON COLUMN mantenimiento.documentos.rut_persona IS 'RUT de la persona propietaria del documento'",
      "COMMENT ON COLUMN mantenimiento.documentos.nombre_documento IS 'Nombre descriptivo del documento'",
      "COMMENT ON COLUMN mantenimiento.documentos.tipo_documento IS 'Tipo de documento: certificado_curso, diploma, certificado_laboral, etc.'"
    ];
    
    for (const commentQuery of addComments) {
      await query(commentQuery);
    }
    console.log('✅ Comentarios agregados');
    
    // 7. Mostrar resumen final
    console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('=' .repeat(60));
    console.log('📋 Resumen de cambios:');
    console.log('   ✅ Nueva tabla "documentos" creada');
    console.log('   ✅ Documentos migrados desde "cursos_documentos"');
    console.log('   ✅ Relación directa con "personal_disponible"');
    console.log('   ✅ Índices y comentarios agregados');
    console.log('\n⚠️  PRÓXIMOS PASOS:');
    console.log('   1. Actualizar endpoints y controladores');
    console.log('   2. Probar la nueva funcionalidad');
    console.log('   3. Eliminar tabla "cursos_documentos" (opcional)');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Función para verificar el estado de la migración
async function checkMigrationStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE LA MIGRACIÓN');
  console.log('=' .repeat(50));
  
  try {
    // Verificar si existe la nueva tabla
    const checkTable = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = 'documentos'
      ) as tabla_existe
    `;
    
    const tableExists = await query(checkTable);
    console.log(`📋 Tabla documentos existe: ${tableExists.rows[0].tabla_existe ? '✅ SÍ' : '❌ NO'}`);
    
    if (tableExists.rows[0].tabla_existe) {
      // Contar registros en ambas tablas
      const countRecords = `
        SELECT 
          'documentos' as tabla,
          COUNT(*) as registros
        FROM mantenimiento.documentos
        UNION ALL
        SELECT 
          'cursos_documentos' as tabla,
          COUNT(*) as registros
        FROM mantenimiento.cursos_documentos
        WHERE activo = true
      `;
      
      const counts = await query(countRecords);
      console.log('\n📊 Registros por tabla:');
      counts.rows.forEach(row => {
        console.log(`   ${row.tabla}: ${row.registros} registros`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando migración:', error);
    throw error;
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'check') {
    checkMigrationStatus()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else {
    migrateDocumentosStructure()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  migrateDocumentosStructure,
  checkMigrationStatus
};



