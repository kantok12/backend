const { query } = require('../config/postgresql');

/**
 * Script para encontrar la tabla real de nombres que viste en la imagen
 */

async function findTablaNombresReal() {
  console.log('🔍 BUSCANDO LA TABLA REAL DE NOMBRES');
  console.log('=' .repeat(60));
  
  try {
    // 1. Buscar en todos los esquemas tablas que tengan columnas rut y nombre
    console.log('📋 1. Buscando tablas con columnas RUT y NOMBRE...');
    
    const findTablesQuery = `
      SELECT DISTINCT
        t.table_schema,
        t.table_name,
        COUNT(CASE WHEN c.column_name = 'rut' THEN 1 END) as tiene_rut,
        COUNT(CASE WHEN c.column_name = 'nombre' THEN 1 END) as tiene_nombre,
        string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) as todas_columnas
      FROM information_schema.tables t
      JOIN information_schema.columns c ON 
        t.table_schema = c.table_schema AND 
        t.table_name = c.table_name
      WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      GROUP BY t.table_schema, t.table_name
      HAVING 
        COUNT(CASE WHEN c.column_name = 'rut' THEN 1 END) > 0 AND
        COUNT(CASE WHEN c.column_name = 'nombre' THEN 1 END) > 0
      ORDER BY t.table_schema, t.table_name
    `;
    
    const tables = await query(findTablesQuery);
    
    console.log(`✅ Encontradas ${tables.rows.length} tablas con RUT y NOMBRE:`);
    
    if (tables.rows.length === 0) {
      console.log('❌ No se encontraron tablas con RUT y NOMBRE');
      return;
    }
    
    // 2. Verificar cada tabla para encontrar la que tiene datos
    console.log('\n📋 2. Verificando datos en cada tabla...');
    
    let tablasConDatos = [];
    
    for (const table of tables.rows) {
      try {
        console.log(`\n🔍 Verificando ${table.table_schema}.${table.table_name}:`);
        console.log(`   Columnas: ${table.todas_columnas}`);
        
        // Contar registros
        const countQuery = `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN nombre IS NOT NULL THEN 1 END) as nombres_llenos,
            COUNT(CASE WHEN nombre IS NULL THEN 1 END) as nombres_vacios
          FROM ${table.table_schema}.${table.table_name}
        `;
        
        const countResult = await query(countQuery);
        const stats = countResult.rows[0];
        
        console.log(`   📊 Registros: ${stats.total}, Nombres llenos: ${stats.nombres_llenos}, Nombres NULL: ${stats.nombres_vacios}`);
        
        // Si tiene datos, mostrar algunos ejemplos
        if (parseInt(stats.total) > 0) {
          const sampleQuery = `
            SELECT rut, nombre, sexo, fecha_nacimiento, licencia_conducir 
            FROM ${table.table_schema}.${table.table_name} 
            ORDER BY rut 
            LIMIT 3
          `;
          
          const samples = await query(sampleQuery);
          
          console.log('   📝 Ejemplos de datos:');
          samples.rows.forEach((row, index) => {
            console.log(`      ${index + 1}. RUT: ${row.rut}, Nombre: ${row.nombre || 'NULL'}`);
          });
          
          tablasConDatos.push({
            ...table,
            stats: stats,
            samples: samples.rows
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // 3. Determinar cuál es la tabla correcta
    console.log('\n📋 3. TABLAS CANDIDATAS:');
    console.log('=' .repeat(40));
    
    if (tablasConDatos.length === 0) {
      console.log('❌ No se encontraron tablas con datos');
      return;
    }
    
    // Buscar la tabla con más registros o con nombres llenos
    let mejorCandidato = tablasConDatos[0];
    
    for (const tabla of tablasConDatos) {
      console.log(`\n✅ ${tabla.table_schema}.${tabla.table_name}:`);
      console.log(`   - Total registros: ${tabla.stats.total}`);
      console.log(`   - Nombres llenos: ${tabla.stats.nombres_llenos}`);
      console.log(`   - Nombres NULL: ${tabla.stats.nombres_vacios}`);
      console.log(`   - Columnas: ${tabla.todas_columnas}`);
      
      // Priorizar tablas con más nombres llenos
      if (parseInt(tabla.stats.nombres_llenos) > parseInt(mejorCandidato.stats.nombres_llenos)) {
        mejorCandidato = tabla;
      }
    }
    
    console.log('\n🎯 TABLA RECOMENDADA:');
    console.log('=' .repeat(30));
    console.log(`📋 Usar: ${mejorCandidato.table_schema}.${mejorCandidato.table_name}`);
    console.log(`📊 Registros: ${mejorCandidato.stats.total}`);
    console.log(`✅ Nombres llenos: ${mejorCandidato.stats.nombres_llenos}`);
    
    // 4. Generar archivo de configuración
    const configContent = `// CONFIGURACIÓN DE TABLA NOMBRES
// Archivo generado automáticamente

module.exports = {
  NOMBRE_TABLE: {
    schema: '${mejorCandidato.table_schema}',
    table: '${mejorCandidato.table_name}',
    fullName: '${mejorCandidato.table_schema}.${mejorCandidato.table_name}'
  }
};
`;
    
    const fs = require('fs');
    const path = require('path');
    
    fs.writeFileSync(
      path.join(__dirname, '..', 'config', 'tabla-nombres.js'),
      configContent
    );
    
    console.log('\n📁 Archivo de configuración creado: config/tabla-nombres.js');
    console.log('🔧 Actualiza routes/nombres.js para usar esta configuración');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    throw error;
  }
}

// Ejecutar
findTablaNombresReal()
  .then(() => {
    console.log('\n✅ Búsqueda completada');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });



