const { query } = require('../config/postgresql');

/**
 * Buscar la tabla de nombres en el esquema mantenimiento
 */

async function buscarTablaNombres() {
  console.log('🔍 BUSCANDO TABLA DE NOMBRES EN ESQUEMA MANTENIMIENTO');
  console.log('=' .repeat(60));
  
  try {
    // 1. Listar todas las tablas en mantenimiento
    console.log('📋 1. Tablas en esquema mantenimiento:');
    
    const tablasQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento' 
      ORDER BY table_name
    `;
    
    const tablas = await query(tablasQuery);
    
    console.log(`✅ Encontradas ${tablas.rows.length} tablas:`);
    tablas.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // 2. Buscar tablas que tengan columnas rut y nombre
    console.log('\n📋 2. Buscando tablas con columnas RUT y NOMBRE...');
    
    const tablasConNombreQuery = `
      SELECT DISTINCT
        t.table_name,
        COUNT(CASE WHEN c.column_name = 'rut' THEN 1 END) as tiene_rut,
        COUNT(CASE WHEN c.column_name = 'nombre' THEN 1 END) as tiene_nombre,
        string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) as todas_columnas
      FROM information_schema.tables t
      JOIN information_schema.columns c ON 
        t.table_schema = c.table_schema AND 
        t.table_name = c.table_name
      WHERE t.table_schema = 'mantenimiento'
      GROUP BY t.table_name
      HAVING 
        COUNT(CASE WHEN c.column_name = 'rut' THEN 1 END) > 0 AND
        COUNT(CASE WHEN c.column_name = 'nombre' THEN 1 END) > 0
      ORDER BY t.table_name
    `;
    
    const tablasConNombre = await query(tablasConNombreQuery);
    
    if (tablasConNombre.rows.length === 0) {
      console.log('❌ No se encontraron tablas con columnas RUT y NOMBRE');
      
      // Buscar tablas que solo tengan RUT
      console.log('\n📋 3. Buscando tablas que solo tengan columna RUT...');
      
      const soloRutQuery = `
        SELECT DISTINCT
          t.table_name,
          string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) as todas_columnas
        FROM information_schema.tables t
        JOIN information_schema.columns c ON 
          t.table_schema = c.table_schema AND 
          t.table_name = c.table_name
        WHERE t.table_schema = 'mantenimiento'
        GROUP BY t.table_name
        HAVING COUNT(CASE WHEN c.column_name = 'rut' THEN 1 END) > 0
        ORDER BY t.table_name
      `;
      
      const soloRut = await query(soloRutQuery);
      
      console.log(`✅ Tablas con columna RUT (${soloRut.rows.length}):`);
      soloRut.rows.forEach(row => {
        console.log(`   - ${row.table_name}: ${row.todas_columnas}`);
      });
      
      return;
    }
    
    console.log(`✅ Encontradas ${tablasConNombre.rows.length} tablas con RUT y NOMBRE:`);
    
    // 3. Verificar datos en cada tabla
    for (const tabla of tablasConNombre.rows) {
      console.log(`\n🔍 Verificando mantenimiento.${tabla.table_name}:`);
      console.log(`   Columnas: ${tabla.todas_columnas}`);
      
      try {
        // Contar registros
        const countQuery = `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN nombre IS NOT NULL AND nombre != '' THEN 1 END) as nombres_llenos,
            COUNT(CASE WHEN nombre IS NULL OR nombre = '' THEN 1 END) as nombres_vacios
          FROM mantenimiento.${tabla.table_name}
        `;
        
        const countResult = await query(countQuery);
        const stats = countResult.rows[0];
        
        console.log(`   📊 Total: ${stats.total}, Nombres llenos: ${stats.nombres_llenos}, Nombres NULL/vacíos: ${stats.nombres_vacios}`);
        
        // Mostrar algunos ejemplos
        if (parseInt(stats.total) > 0) {
          const sampleQuery = `
            SELECT rut, nombre, sexo, fecha_nacimiento, licencia_conducir 
            FROM mantenimiento.${tabla.table_name} 
            ORDER BY rut 
            LIMIT 5
          `;
          
          const samples = await query(sampleQuery);
          
          console.log('   📝 Ejemplos:');
          samples.rows.forEach((row, index) => {
            console.log(`      ${index + 1}. RUT: ${row.rut || 'NULL'}, Nombre: ${row.nombre || 'NULL'}`);
          });
          
          // Esta es probablemente la tabla correcta
          console.log(`\n🎯 TABLA ENCONTRADA: mantenimiento.${tabla.table_name}`);
          
          // Actualizar configuración
          return `mantenimiento.${tabla.table_name}`;
        }
        
      } catch (error) {
        console.log(`   ❌ Error al verificar datos: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    throw error;
  }
}

// Ejecutar
buscarTablaNombres()
  .then((tablaEncontrada) => {
    if (tablaEncontrada) {
      console.log(`\n✅ Usar esta tabla: ${tablaEncontrada}`);
    }
    console.log('\n✅ Búsqueda completada');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });












