const { query } = require('../config/postgresql');

/**
 * Script para migrar datos de cursos_certificaciones a las nuevas tablas
 * cursos y documentos
 */

async function migrateData() {
  console.log('🔄 INICIANDO MIGRACIÓN DE DATOS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar si existe la tabla antigua
    console.log('📋 1. Verificando tabla cursos_certificaciones...');
    
    const checkOldTableQuery = `
      SELECT COUNT(*) as total 
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'cursos_certificaciones'
    `;
    
    const oldTableExists = await query(checkOldTableQuery);
    
    if (oldTableExists.rows[0].total === '0') {
      console.log('❌ Tabla cursos_certificaciones no existe. No hay datos que migrar.');
      return;
    }
    
    // 2. Obtener datos de la tabla antigua
    console.log('📋 2. Obteniendo datos de cursos_certificaciones...');
    
    const getOldDataQuery = `
      SELECT id, rut_persona, nombre_curso, fecha_obtencion
      FROM mantenimiento.cursos_certificaciones
      ORDER BY id
    `;
    
    const oldData = await query(getOldDataQuery);
    
    if (oldData.rows.length === 0) {
      console.log('ℹ️ No hay datos en cursos_certificaciones para migrar.');
      return;
    }
    
    console.log(`📊 Encontrados ${oldData.rows.length} registros para migrar`);
    
    // 3. Migrar datos a la nueva tabla cursos
    console.log('📋 3. Migrando datos a tabla cursos...');
    
    let migratedCount = 0;
    
    for (const row of oldData.rows) {
      const insertQuery = `
        INSERT INTO mantenimiento.cursos (
          rut_persona, 
          nombre_curso, 
          fecha_inicio, 
          fecha_fin, 
          estado,
          descripcion
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const values = [
        row.rut_persona,
        row.nombre_curso,
        row.fecha_obtencion, // fecha_inicio
        row.fecha_obtencion, // fecha_fin (mismo día)
        'completado',
        `Migrado desde cursos_certificaciones (ID original: ${row.id})`
      ];
      
      try {
        const result = await query(insertQuery, values);
        console.log(`✅ Migrado: ${row.nombre_curso} para RUT ${row.rut_persona} (Nuevo ID: ${result.rows[0].id})`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrando registro ID ${row.id}:`, error.message);
      }
    }
    
    console.log(`📊 Migración completada: ${migratedCount}/${oldData.rows.length} registros migrados`);
    
    // 4. Verificar migración
    console.log('📋 4. Verificando migración...');
    
    const verifyQuery = `
      SELECT COUNT(*) as total FROM mantenimiento.cursos
    `;
    
    const verifyResult = await query(verifyQuery);
    console.log(`✅ Total de cursos en nueva tabla: ${verifyResult.rows[0].total}`);
    
    // 5. Mostrar resumen
    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log('=' .repeat(30));
    console.log(`📋 Registros originales: ${oldData.rows.length}`);
    console.log(`✅ Registros migrados: ${migratedCount}`);
    console.log(`📊 Total en nueva tabla: ${verifyResult.rows[0].total}`);
    
    if (migratedCount === oldData.rows.length) {
      console.log('\n🎉 MIGRACIÓN EXITOSA - Todos los datos fueron migrados correctamente');
    } else {
      console.log('\n⚠️ MIGRACIÓN PARCIAL - Algunos registros no pudieron ser migrados');
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('\n✅ Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en migración:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };
