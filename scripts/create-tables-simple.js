const { query } = require('../config/postgresql');

/**
 * Script simple para crear las nuevas tablas cursos y documentos
 */

async function createTables() {
  console.log('🏗️ CREANDO NUEVAS TABLAS');
  console.log('=' .repeat(40));
  
  try {
    // 1. Crear tabla cursos
    console.log('📋 1. Creando tabla cursos...');
    
    const createCursosTable = `
      CREATE TABLE IF NOT EXISTS mantenimiento.cursos (
        id SERIAL PRIMARY KEY,
        rut_persona TEXT NOT NULL,
        nombre_curso VARCHAR(255) NOT NULL,
        fecha_inicio DATE,
        fecha_fin DATE,
        estado VARCHAR(50) DEFAULT 'completado',
        institucion VARCHAR(255),
        descripcion TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE,
        
        CONSTRAINT chk_estado_curso CHECK (estado IN ('pendiente', 'en_progreso', 'completado', 'cancelado')),
        
        CONSTRAINT fk_curso_persona FOREIGN KEY (rut_persona) 
          REFERENCES mantenimiento.personal_disponible(rut) ON DELETE CASCADE
      )
    `;
    
    await query(createCursosTable);
    console.log('✅ Tabla cursos creada');
    
    // 2. Crear tabla documentos
    console.log('📋 2. Creando tabla documentos...');
    
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
          'otro'
        )),
        
        CONSTRAINT fk_documento_persona FOREIGN KEY (rut_persona) 
          REFERENCES mantenimiento.personal_disponible(rut) ON DELETE CASCADE
      )
    `;
    
    await query(createDocumentosTable);
    console.log('✅ Tabla documentos creada');
    
    // 3. Crear índices para cursos
    console.log('📋 3. Creando índices para cursos...');
    
    const cursosIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_cursos_rut_persona ON mantenimiento.cursos(rut_persona)',
      'CREATE INDEX IF NOT EXISTS idx_cursos_estado ON mantenimiento.cursos(estado)',
      'CREATE INDEX IF NOT EXISTS idx_cursos_fecha_inicio ON mantenimiento.cursos(fecha_inicio)',
      'CREATE INDEX IF NOT EXISTS idx_cursos_activo ON mantenimiento.cursos(activo)'
    ];
    
    for (const indexQuery of cursosIndexes) {
      await query(indexQuery);
    }
    console.log('✅ Índices de cursos creados');
    
    // 4. Crear índices para documentos
    console.log('📋 4. Creando índices para documentos...');
    
    const documentosIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_documentos_rut_persona ON mantenimiento.documentos(rut_persona)',
      'CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON mantenimiento.documentos(tipo_documento)',
      'CREATE INDEX IF NOT EXISTS idx_documentos_fecha_subida ON mantenimiento.documentos(fecha_subida)',
      'CREATE INDEX IF NOT EXISTS idx_documentos_activo ON mantenimiento.documentos(activo)'
    ];
    
    for (const indexQuery of documentosIndexes) {
      await query(indexQuery);
    }
    console.log('✅ Índices de documentos creados');
    
    // 5. Verificar tablas creadas
    console.log('📋 5. Verificando tablas creadas...');
    
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento' 
      AND table_name IN ('cursos', 'documentos')
      ORDER BY table_name
    `;
    
    const tables = await query(verifyQuery);
    
    console.log('\n📊 TABLAS CREADAS:');
    console.log('=' .repeat(20));
    tables.rows.forEach(row => {
      console.log(`✅ ${row.table_name}`);
    });
    
    // 6. Mostrar estructura
    console.log('\n📊 ESTRUCTURA DE TABLAS:');
    console.log('=' .repeat(30));
    
    const showStructure = async (tableName) => {
      const structureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = $1
        ORDER BY ordinal_position
      `;
      
      const structure = await query(structureQuery, [tableName]);
      
      console.log(`\n📋 Tabla: ${tableName}`);
      console.log('-'.repeat(25));
      structure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}`);
      });
    };
    
    await showStructure('cursos');
    await showStructure('documentos');
    
    console.log('\n🎉 TABLAS CREADAS EXITOSAMENTE');
    console.log('=' .repeat(40));
    
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('\n✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { createTables };
