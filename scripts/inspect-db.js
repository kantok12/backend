const { query, testConnection } = require('../config/database');

async function inspectDatabase() {
  console.log('🔍 Inspeccionando base de datos PostgreSQL...\n');

  try {
    // Probar conexión
    await testConnection();
    console.log('');

    // 1. Listar todas las tablas en el esquema public
    console.log('📋 TABLAS EN EL ESQUEMA PUBLIC:');
    console.log('=' .repeat(50));
    
    const tablesQuery = `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const tablesResult = await query(tablesQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No se encontraron tablas en el esquema public');
    } else {
      tablesResult.rows.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name} (${table.table_type})`);
      });
    }

    console.log(`\n📊 Total de tablas: ${tablesResult.rows.length}\n`);

    // 2. Verificar tablas específicas que necesitamos
    console.log('🎯 VERIFICANDO TABLAS ESPECÍFICAS:');
    console.log('=' .repeat(50));
    
    const tablesToCheck = [
      'plantas', 'estados', 'faenas', 'equipos', 'componentes',
      'lubricantes', 'lineas', 'punto_lubricacion', 'personal_disponible',
      'tareas_proyectadas', 'tareas_programadas', 'tareas_ejecutadas'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const checkQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `;
        const checkResult = await query(checkQuery, [tableName]);
        const exists = checkResult.rows[0].exists;
        
        if (exists) {
          // Si existe, obtener número de registros
          const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
          const countResult = await query(countQuery);
          const count = countResult.rows[0].count;
          console.log(`✅ ${tableName} - ${count} registros`);
        } else {
          console.log(`❌ ${tableName} - NO EXISTE`);
        }
      } catch (error) {
        console.log(`⚠️  ${tableName} - ERROR: ${error.message}`);
      }
    }

    // 3. Listar esquemas disponibles
    console.log('\n🗂️  ESQUEMAS DISPONIBLES:');
    console.log('=' .repeat(50));
    
    const schemasQuery = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT LIKE 'pg_%' 
      AND schema_name != 'information_schema'
      ORDER BY schema_name;
    `;
    
    const schemasResult = await query(schemasQuery);
    schemasResult.rows.forEach((schema, index) => {
      console.log(`${index + 1}. ${schema.schema_name}`);
    });

    // 4. Si hay tablas en otros esquemas, mostrarlas
    console.log('\n🔍 BUSCANDO TABLAS EN OTROS ESQUEMAS:');
    console.log('=' .repeat(50));
    
    const allTablesQuery = `
      SELECT 
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema NOT LIKE 'pg_%' 
      AND table_schema != 'information_schema'
      AND table_name IN (${tablesToCheck.map((_, i) => `$${i + 1}`).join(',')})
      ORDER BY table_schema, table_name;
    `;
    
    const allTablesResult = await query(allTablesQuery, tablesToCheck);
    
    if (allTablesResult.rows.length === 0) {
      console.log('❌ No se encontraron nuestras tablas en ningún esquema');
    } else {
      allTablesResult.rows.forEach((table) => {
        console.log(`📁 ${table.table_schema}.${table.table_name} (${table.table_type})`);
      });
    }

    console.log('\n🎯 RESUMEN:');
    console.log('=' .repeat(50));
    console.log(`📊 Total de tablas en public: ${tablesResult.rows.length}`);
    console.log(`🎯 Tablas de nuestro sistema encontradas: ${allTablesResult.rows.length}`);
    
    if (allTablesResult.rows.length === 0) {
      console.log('\n💡 SUGERENCIA:');
      console.log('Las tablas no existen. Necesitas ejecutar el script de inicialización.');
      console.log('Ve a Supabase Dashboard → SQL Editor y ejecuta scripts/init-db.sql');
    }

  } catch (error) {
    console.error('❌ Error al inspeccionar base de datos:', error.message);
  }
}

// Ejecutar inspección
inspectDatabase()
  .then(() => {
    console.log('\n✅ Inspección completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });













