const { query } = require('../config/database');

async function addDocumentosDurationColumns() {
  try {
    console.log('🔧 Agregando columnas de duración y validación a tabla documentos...\n');

    // 1. Agregar fecha_emision
    console.log('1️⃣ Agregando columna fecha_emision...');
    await query(`
      ALTER TABLE mantenimiento.documentos 
      ADD COLUMN IF NOT EXISTS fecha_emision DATE
    `);
    console.log('   ✅ Columna fecha_emision agregada');

    // 2. Agregar fecha_vencimiento
    console.log('2️⃣ Agregando columna fecha_vencimiento...');
    await query(`
      ALTER TABLE mantenimiento.documentos 
      ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE
    `);
    console.log('   ✅ Columna fecha_vencimiento agregada');

    // 3. Agregar dias_validez
    console.log('3️⃣ Agregando columna dias_validez...');
    await query(`
      ALTER TABLE mantenimiento.documentos 
      ADD COLUMN IF NOT EXISTS dias_validez INTEGER
    `);
    console.log('   ✅ Columna dias_validez agregada');

    // 4. Agregar estado_documento
    console.log('4️⃣ Agregando columna estado_documento...');
    await query(`
      ALTER TABLE mantenimiento.documentos 
      ADD COLUMN IF NOT EXISTS estado_documento VARCHAR(20) DEFAULT 'vigente'
    `);
    console.log('   ✅ Columna estado_documento agregada');

    // 5. Agregar institucion_emisora
    console.log('5️⃣ Agregando columna institucion_emisora...');
    await query(`
      ALTER TABLE mantenimiento.documentos 
      ADD COLUMN IF NOT EXISTS institucion_emisora VARCHAR(255)
    `);
    console.log('   ✅ Columna institucion_emisora agregada');

    // 6. Crear índices para optimizar consultas
    console.log('\n6️⃣ Creando índices para optimizar consultas...');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_documentos_fecha_vencimiento 
      ON mantenimiento.documentos (fecha_vencimiento)
    `);
    console.log('   ✅ Índice en fecha_vencimiento creado');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_documentos_estado_documento 
      ON mantenimiento.documentos (estado_documento)
    `);
    console.log('   ✅ Índice en estado_documento creado');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_documentos_tipo_documento 
      ON mantenimiento.documentos (tipo_documento)
    `);
    console.log('   ✅ Índice en tipo_documento creado');

    // 7. Verificar la nueva estructura
    console.log('\n7️⃣ Verificando nueva estructura de la tabla...');
    const columns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'documentos' AND table_schema = 'mantenimiento' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Nueva estructura de mantenimiento.documentos:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}) ${col.column_default ? `default: ${col.column_default}` : ''}`);
    });

    // 8. Actualizar algunos documentos existentes con datos de ejemplo
    console.log('\n8️⃣ Actualizando documentos existentes con datos de ejemplo...');
    
    const updateResult = await query(`
      UPDATE mantenimiento.documentos 
      SET 
        fecha_emision = CURRENT_DATE - INTERVAL '30 days',
        fecha_vencimiento = CURRENT_DATE + INTERVAL '365 days',
        dias_validez = 365,
        estado_documento = CASE 
          WHEN CURRENT_DATE + INTERVAL '365 days' < CURRENT_DATE THEN 'vencido'
          WHEN CURRENT_DATE + INTERVAL '365 days' <= CURRENT_DATE + INTERVAL '30 days' THEN 'por_vencer'
          ELSE 'vigente'
        END,
        institucion_emisora = CASE tipo_documento
          WHEN 'certificado_curso' THEN 'Instituto de Capacitación'
          WHEN 'licencia_conducir' THEN 'Municipalidad'
          WHEN 'certificado_medico' THEN 'Centro Médico'
          WHEN 'certificado_seguridad' THEN 'Instituto de Seguridad'
          ELSE 'Institución Emisora'
        END
      WHERE activo = true 
        AND fecha_emision IS NULL
      RETURNING id, nombre_documento, tipo_documento, fecha_emision, fecha_vencimiento, dias_validez, estado_documento
    `);

    console.log(`   ✅ ${updateResult.rowCount} documentos actualizados con datos de ejemplo`);

    // Mostrar algunos ejemplos
    if (updateResult.rows.length > 0) {
      console.log('\n📄 Ejemplos de documentos actualizados:');
      updateResult.rows.slice(0, 3).forEach(doc => {
        console.log(`   - ${doc.nombre_documento} (${doc.tipo_documento}): ${doc.estado_documento}, vence ${doc.fecha_vencimiento}`);
      });
    }

    console.log('\n🎉 Columnas de duración y validación agregadas exitosamente a documentos!');

  } catch (err) {
    console.error('❌ Error agregando columnas de duración:', err.message);
    process.exitCode = 1;
  }
}

addDocumentosDurationColumns();
