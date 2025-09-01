const XLSX = require('xlsx');
const { query } = require('../config/postgresql');
const path = require('path');

/**
 * Script para actualizar la columna nombre en la tabla mantenimiento.nombre
 * usando los datos del archivo Excel
 */

async function updateNombresTable() {
  console.log('🔄 ACTUALIZANDO TABLA NOMBRE CON DATOS DEL EXCEL');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar tabla nombre
    console.log('📋 1. Verificando tabla nombre...');
    
    const checkTableQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'nombre' 
      ORDER BY ordinal_position
    `;
    
    const tableStructure = await query(checkTableQuery);
    
    if (tableStructure.rows.length === 0) {
      throw new Error('Tabla mantenimiento.nombre no encontrada');
    }
    
    console.log('✅ Tabla encontrada con estructura:');
    tableStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
    });
    
    // 2. Verificar registros existentes
    console.log('\n📋 2. Verificando registros existentes...');
    
    const existingDataQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN nombre IS NULL THEN 1 END) as nombres_null,
        COUNT(CASE WHEN nombre IS NOT NULL THEN 1 END) as nombres_filled
      FROM mantenimiento.nombre
    `;
    
    const stats = await query(existingDataQuery);
    const { total, nombres_null, nombres_filled } = stats.rows[0];
    
    console.log(`📊 Estadísticas actuales:`);
    console.log(`   - Total registros: ${total}`);
    console.log(`   - Nombres NULL: ${nombres_null}`);
    console.log(`   - Nombres llenos: ${nombres_filled}`);
    
    if (parseInt(nombres_null) === 0) {
      console.log('✅ Todos los nombres ya están llenos');
      return;
    }
    
    // 3. Leer archivo Excel
    console.log('\n📋 3. Leyendo archivo Excel...');
    
    const filePath = path.join(__dirname, '..', 'Personal Servicios.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    });
    
    console.log(`📊 Excel leído: ${jsonData.length} filas`);
    
    if (jsonData.length <= 1) {
      throw new Error('No hay datos en el Excel');
    }
    
    const headers = jsonData[0];
    console.log('📋 Headers encontrados:', headers);
    
    // 4. Encontrar columnas relevantes
    const rutColumnIndex = headers.findIndex(header => 
      header && header.toLowerCase().includes('rut')
    );
    
    const nombreColumnIndex = headers.findIndex(header => 
      header && header.toLowerCase().includes('nombre')
    );
    
    if (rutColumnIndex === -1 || nombreColumnIndex === -1) {
      throw new Error('No se encontraron las columnas RUT o Nombre en el Excel');
    }
    
    console.log(`✅ Columna RUT: "${headers[rutColumnIndex]}" (índice ${rutColumnIndex})`);
    console.log(`✅ Columna Nombre: "${headers[nombreColumnIndex]}" (índice ${nombreColumnIndex})`);
    
    // 5. Procesar datos y crear mapeo RUT -> Nombre
    console.log('\n📋 4. Procesando datos del Excel...');
    
    const rutNombreMap = new Map();
    let processedCount = 0;
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rut = row[rutColumnIndex];
      const nombreCompleto = row[nombreColumnIndex];
      
      if (rut && nombreCompleto && nombreCompleto.trim().length > 0) {
        rutNombreMap.set(rut.toString().trim(), nombreCompleto.trim());
        processedCount++;
      }
    }
    
    console.log(`✅ Procesados ${processedCount} registros del Excel`);
    console.log(`📊 RUTs únicos con nombre: ${rutNombreMap.size}`);
    
    // 6. Obtener RUTs que necesitan actualización
    console.log('\n📋 5. Obteniendo RUTs que necesitan actualización...');
    
    const needUpdateQuery = `
      SELECT rut 
      FROM mantenimiento.nombre 
      WHERE nombre IS NULL
    `;
    
    const needUpdate = await query(needUpdateQuery);
    console.log(`📊 Registros que necesitan actualización: ${needUpdate.rows.length}`);
    
    // 7. Actualizar nombres
    console.log('\n📋 6. Actualizando nombres...');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const row of needUpdate.rows) {
      const rut = row.rut;
      const nombre = rutNombreMap.get(rut);
      
      if (nombre) {
        try {
          const updateQuery = `
            UPDATE mantenimiento.nombre 
            SET nombre = $1 
            WHERE rut = $2
          `;
          
          await query(updateQuery, [nombre, rut]);
          updatedCount++;
          
          console.log(`✅ Actualizado ${rut}: ${nombre}`);
        } catch (error) {
          console.error(`❌ Error actualizando ${rut}:`, error.message);
        }
      } else {
        notFoundCount++;
        console.log(`⚠️  No se encontró nombre para RUT ${rut} en el Excel`);
      }
    }
    
    // 8. Verificar resultados
    console.log('\n📋 7. Verificando resultados...');
    
    const finalStats = await query(existingDataQuery);
    const { total: finalTotal, nombres_null: finalNull, nombres_filled: finalFilled } = finalStats.rows[0];
    
    console.log('\n📊 RESUMEN DE ACTUALIZACIÓN:');
    console.log('=' .repeat(40));
    console.log(`✅ Registros actualizados: ${updatedCount}`);
    console.log(`⚠️  RUTs no encontrados en Excel: ${notFoundCount}`);
    console.log(`📊 Estado final:`);
    console.log(`   - Total registros: ${finalTotal}`);
    console.log(`   - Nombres NULL: ${finalNull}`);
    console.log(`   - Nombres llenos: ${finalFilled}`);
    
    // 9. Mostrar algunos ejemplos
    if (updatedCount > 0) {
      console.log('\n📋 Ejemplos de registros actualizados:');
      const examplesQuery = `
        SELECT rut, nombre, sexo, fecha_nacimiento 
        FROM mantenimiento.nombre 
        WHERE nombre IS NOT NULL 
        LIMIT 5
      `;
      
      const examples = await query(examplesQuery);
      examples.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. RUT: ${row.rut}, Nombre: ${row.nombre}`);
      });
    }
    
    console.log('\n🎉 ACTUALIZACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('💥 Error durante la actualización:', error.message);
    throw error;
  }
}

// Ejecutar
updateNombresTable()
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });



