const { query } = require('../config/postgresql');

async function createDocumentosTable() {
  console.log('🏗️ Creando tabla documentos...');
  
  const createTable = `
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
  
  await query(createTable);
  console.log('✅ Tabla documentos creada');
}

async function createIndexes() {
  console.log('📋 Creando índices...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_documentos_rut_persona ON mantenimiento.documentos(rut_persona)',
    'CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON mantenimiento.documentos(tipo_documento)',
    'CREATE INDEX IF NOT EXISTS idx_documentos_fecha_subida ON mantenimiento.documentos(fecha_subida)',
    'CREATE INDEX IF NOT EXISTS idx_documentos_activo ON mantenimiento.documentos(activo)',
    'CREATE INDEX IF NOT EXISTS idx_documentos_nombre ON mantenimiento.documentos(nombre_documento)'
  ];
  
  for (const indexQuery of indexes) {
    await query(indexQuery);
  }
  console.log('✅ Índices creados');
}

async function migrateData() {
  console.log('🔄 Migrando datos existentes...');
  
  // Verificar si existe la tabla cursos_documentos
  const checkTable = await query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'cursos_documentos'
    ) as tabla_existe
  `);
  
  if (!checkTable.rows[0].tabla_existe) {
    console.log('⚠️ Tabla cursos_documentos no existe, saltando migración de datos');
    return;
  }
  
  // Migrar datos
  const migrateQuery = `
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
  
  const result = await query(migrateQuery);
  console.log('✅ Datos migrados');
}

async function verifyMigration() {
  console.log('📊 Verificando migración...');
  
  const verification = await query(`
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
  `);
  
  console.log('📈 Resultados:');
  verification.rows.forEach(row => {
    console.log(`   ${row.tabla}: ${row.registros} registros`);
  });
}

async function runMigration() {
  try {
    console.log('🚀 INICIANDO MIGRACIÓN DE DOCUMENTOS');
    console.log('=' .repeat(50));
    
    await createDocumentosTable();
    await createIndexes();
    await migrateData();
    await verifyMigration();
    
    console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('=' .repeat(50));
    console.log('✅ Nueva tabla documentos creada');
    console.log('✅ Datos migrados desde cursos_documentos');
    console.log('✅ Índices creados');
    console.log('✅ Relación directa con personal_disponible');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };




