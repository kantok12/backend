const { query } = require('../config/postgresql');

/**
 * Script para agregar campo fecha_vencimiento a la tabla cursos
 */

async function addFechaVencimiento() {
  console.log('📅 AGREGANDO CAMPO FECHA_VENCIMIENTO A CURSOS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Agregar columna fecha_vencimiento
    console.log('📋 1. Agregando columna fecha_vencimiento...');
    
    const addColumnQuery = `
      ALTER TABLE mantenimiento.cursos 
      ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE
    `;
    
    await query(addColumnQuery);
    console.log('✅ Columna fecha_vencimiento agregada');
    
    // 2. Agregar comentario a la columna
    console.log('📋 2. Agregando comentario a la columna...');
    
    const addCommentQuery = `
      COMMENT ON COLUMN mantenimiento.cursos.fecha_vencimiento IS 'Fecha de vencimiento del curso (para control de renovación)'
    `;
    
    await query(addCommentQuery);
    console.log('✅ Comentario agregado');
    
    // 3. Crear índice para optimizar consultas por fecha de vencimiento
    console.log('📋 3. Creando índice para fecha_vencimiento...');
    
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_cursos_fecha_vencimiento 
      ON mantenimiento.cursos(fecha_vencimiento)
    `;
    
    await query(createIndexQuery);
    console.log('✅ Índice creado');
    
    // 4. Verificar estructura actualizada
    console.log('📋 4. Verificando estructura actualizada...');
    
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'cursos'
      AND column_name = 'fecha_vencimiento'
    `;
    
    const result = await query(verifyQuery);
    
    if (result.rows.length > 0) {
      console.log('✅ Campo fecha_vencimiento verificado:');
      console.log(`   - Tipo: ${result.rows[0].data_type}`);
      console.log(`   - Nullable: ${result.rows[0].is_nullable}`);
      console.log(`   - Default: ${result.rows[0].column_default || 'NULL'}`);
    }
    
    // 5. Mostrar estructura completa de la tabla
    console.log('\n📊 ESTRUCTURA COMPLETA DE LA TABLA CURSOS:');
    console.log('=' .repeat(45));
    
    const fullStructureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'cursos'
      ORDER BY ordinal_position
    `;
    
    const fullStructure = await query(fullStructureQuery);
    
    fullStructure.rows.forEach((col, index) => {
      const marker = col.column_name === 'fecha_vencimiento' ? '🆕' : '  ';
      console.log(`${marker} ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    console.log('\n🎉 CAMPO FECHA_VENCIMIENTO AGREGADO EXITOSAMENTE');
    console.log('=' .repeat(50));
    console.log('✅ Columna fecha_vencimiento agregada');
    console.log('✅ Comentario agregado');
    console.log('✅ Índice creado para optimización');
    console.log('✅ Estructura verificada');
    
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Actualizar endpoints para manejar fecha_vencimiento');
    console.log('2. Agregar lógica de verificación de vencimiento');
    console.log('3. Crear endpoints para alertas de cursos vencidos');
    
  } catch (error) {
    console.error('❌ Error agregando campo fecha_vencimiento:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addFechaVencimiento()
    .then(() => {
      console.log('\n✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { addFechaVencimiento };
