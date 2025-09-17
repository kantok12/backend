const XLSX = require('xlsx');
const { query } = require('../config/database');
const path = require('path');

/**
 * Script para encontrar la tabla nombre y actualizar con datos del Excel
 */

async function findAndUpdateNombres() {
  console.log('🔍 BUSCANDO Y ACTUALIZANDO TABLA NOMBRE');
  console.log('=' .repeat(60));
  
  try {
    // 1. Buscar tablas que contengan 'nombre' o con RUT
    console.log('📋 1. Buscando tablas relacionadas...');
    
    const findTablesQuery = `
      SELECT DISTINCT
        t.table_schema,
        t.table_name,
        string_agg(c.column_name, ', ') as columns
      FROM information_schema.tables t
      JOIN information_schema.columns c ON 
        t.table_schema = c.table_schema AND 
        t.table_name = c.table_name
      WHERE (
        t.table_name ILIKE '%nombre%' OR
        c.column_name ILIKE '%rut%' OR
        c.column_name ILIKE '%nombre%'
      )
      AND t.table_schema NOT IN ('information_schema', 'pg_catalog')
      GROUP BY t.table_schema, t.table_name
      ORDER BY t.table_schema, t.table_name
    `;
    
    const tables = await query(findTablesQuery);
    
    console.log('✅ Tablas encontradas:');
    tables.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_schema}.${row.table_name}`);
      console.log(`      Columnas: ${row.columns}`);
    });
    
    // 2. Buscar específicamente tabla con RUT y nombre NULL
    console.log('\n📋 2. Buscando tabla con RUT y nombres NULL...');
    
    let targetTable = null;
    
    for (const table of tables.rows) {
      try {
        const testQuery = `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN nombre IS NULL THEN 1 END) as nombres_null
          FROM ${table.table_schema}.${table.table_name}
          WHERE rut IS NOT NULL
          LIMIT 1
        `;
        
        const testResult = await query(testQuery);
        const { total, nombres_null } = testResult.rows[0];
        
        if (parseInt(total) > 0 && parseInt(nombres_null) > 0) {
          targetTable = table;
          console.log(`✅ Tabla objetivo encontrada: ${table.table_schema}.${table.table_name}`);
          console.log(`   - Total registros: ${total}`);
          console.log(`   - Nombres NULL: ${nombres_null}`);
          break;
        }
      } catch (error) {
        // Ignorar errores en tablas que no tienen la estructura esperada
        continue;
      }
    }
    
    if (!targetTable) {
      console.log('❌ No se encontró tabla con la estructura esperada');
      
      // Mostrar estructura detallada de las tablas encontradas
      console.log('\n📋 Estructuras detalladas:');
      for (const table of tables.rows.slice(0, 3)) {
        try {
          console.log(`\n🔍 ${table.table_schema}.${table.table_name}:`);
          
          const structureQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = $1 AND table_name = $2
            ORDER BY ordinal_position
          `;
          
          const structure = await query(structureQuery, [table.table_schema, table.table_name]);
          structure.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
          });
          
          // Mostrar algunos datos
          const sampleQuery = `SELECT * FROM ${table.table_schema}.${table.table_name} LIMIT 2`;
          const sample = await query(sampleQuery);
          if (sample.rows.length > 0) {
            console.log('   Ejemplo de datos:', JSON.stringify(sample.rows[0]));
          }
        } catch (error) {
          console.log(`   Error accediendo a la tabla: ${error.message}`);
        }
      }
      return;
    }
    
    // 3. Leer Excel
    console.log('\n📋 3. Leyendo archivo Excel...');
    
    const filePath = path.join(__dirname, '..', 'Personal Servicios.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    });
    
    const headers = jsonData[0];
    const rutColumnIndex = headers.findIndex(header => 
      header && header.toLowerCase().includes('rut')
    );
    const nombreColumnIndex = headers.findIndex(header => 
      header && header.toLowerCase().includes('nombre')
    );
    
    console.log(`✅ Columnas encontradas - RUT: ${rutColumnIndex}, Nombre: ${nombreColumnIndex}`);
    
    // 4. Crear mapeo RUT -> Nombre
    const rutNombreMap = new Map();
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rut = row[rutColumnIndex];
      const nombreCompleto = row[nombreColumnIndex];
      
      if (rut && nombreCompleto && nombreCompleto.trim().length > 0) {
        rutNombreMap.set(rut.toString().trim(), nombreCompleto.trim());
      }
    }
    
    console.log(`✅ Mapeo creado: ${rutNombreMap.size} RUTs con nombres`);
    
    // 5. Actualizar registros
    console.log('\n📋 4. Actualizando registros...');
    
    const needUpdateQuery = `
      SELECT rut 
      FROM ${targetTable.table_schema}.${targetTable.table_name}
      WHERE nombre IS NULL AND rut IS NOT NULL
    `;
    
    const needUpdate = await query(needUpdateQuery);
    console.log(`📊 Registros a actualizar: ${needUpdate.rows.length}`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const row of needUpdate.rows) {
      const rut = row.rut;
      const nombre = rutNombreMap.get(rut);
      
      if (nombre) {
        try {
          const updateQuery = `
            UPDATE ${targetTable.table_schema}.${targetTable.table_name}
            SET nombre = $1 
            WHERE rut = $2
          `;
          
          await query(updateQuery, [nombre, rut]);
          updatedCount++;
          
          if (updatedCount <= 5) {
            console.log(`✅ ${updatedCount}. Actualizado ${rut}: ${nombre.substring(0, 30)}...`);
          }
        } catch (error) {
          console.error(`❌ Error actualizando ${rut}:`, error.message);
        }
      } else {
        notFoundCount++;
      }
    }
    
    // 6. Mostrar resultados
    console.log('\n📊 RESUMEN FINAL:');
    console.log('=' .repeat(40));
    console.log(`✅ Registros actualizados: ${updatedCount}`);
    console.log(`⚠️  RUTs no encontrados: ${notFoundCount}`);
    
    // Verificar estado final
    const finalStatsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN nombre IS NULL THEN 1 END) as nombres_null,
        COUNT(CASE WHEN nombre IS NOT NULL THEN 1 END) as nombres_filled
      FROM ${targetTable.table_schema}.${targetTable.table_name}
    `;
    
    const finalStats = await query(finalStatsQuery);
    const stats = finalStats.rows[0];
    
    console.log(`📊 Estado final:`);
    console.log(`   - Total: ${stats.total}`);
    console.log(`   - Nombres NULL: ${stats.nombres_null}`);
    console.log(`   - Nombres llenos: ${stats.nombres_filled}`);
    
    console.log('\n🎉 ACTUALIZACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    throw error;
  }
}

// Ejecutar
findAndUpdateNombres()
  .then(() => {
    console.log('\n✅ Proceso completado');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });












