const { supabase } = require('../config/database');

/**
 * Script para inspeccionar la estructura real de la base de datos
 */

async function inspectDatabase() {
  console.log('🔍 INSPECCIONANDO ESTRUCTURA DE LA BASE DE DATOS');
  console.log('=' .repeat(60));

  try {
    // 1. Intentar obtener información de esquemas
    console.log('\n📋 1. VERIFICANDO ESQUEMAS DISPONIBLES...');
    
    // Intentar consulta directa a information_schema
    try {
      const { data: schemas, error: schemaError } = await supabase
        .rpc('get_schemas');
      
      if (schemaError) {
        console.log('⚠️  No se puede acceder a información de esquemas via RPC');
      } else {
        console.log('✅ Esquemas encontrados:', schemas);
      }
    } catch (e) {
      console.log('⚠️  RPC get_schemas no disponible');
    }

    // 2. Intentar consultas directas a tablas conocidas
    console.log('\n📋 2. PROBANDO CONSULTAS DIRECTAS...');
    
    const tablesToTest = [
      'personal_servicio',
      'mantenimiento.personal_servicio',
      'empresas',
      'mantenimiento.empresas',
      'servicios',
      'mantenimiento.servicios'
    ];

    for (const tableName of tablesToTest) {
      try {
        console.log(`\n🔍 Probando tabla: ${tableName}`);
        
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Tabla encontrada - Registros: ${count || 'N/A'}`);
          
          // Si encontramos la tabla, intentar obtener su estructura
          try {
            const { data: sample } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (sample && sample.length > 0) {
              console.log('   📊 Columnas encontradas:', Object.keys(sample[0]));
            }
          } catch (structureError) {
            console.log('   ⚠️  No se pudo obtener estructura');
          }
        }
      } catch (e) {
        console.log(`   ❌ Error de conexión: ${e.message}`);
      }
    }

    // 3. Intentar listar todas las tablas disponibles
    console.log('\n📋 3. INTENTANDO LISTAR TODAS LAS TABLAS...');
    
    try {
      // Intentar con una consulta que liste tablas
      const { data: tables, error } = await supabase
        .rpc('list_tables'); // Esto probablemente fallará, pero es una prueba
      
      if (error) {
        console.log('⚠️  No se puede listar tablas via RPC');
      } else {
        console.log('✅ Tablas encontradas:', tables);
      }
    } catch (e) {
      console.log('⚠️  RPC list_tables no disponible');
    }

    // 4. Verificar si hay alguna tabla personal disponible
    console.log('\n📋 4. BUSCANDO TABLAS DE PERSONAL...');
    
    const personalTableVariants = [
      'personal',
      'personal_disponible',
      'personal_servicio',
      'empleados',
      'trabajadores'
    ];

    for (const variant of personalTableVariants) {
      try {
        const { data, error } = await supabase
          .from(variant)
          .select('*')
          .limit(1);
        
        if (!error && data) {
          console.log(`✅ Tabla encontrada: ${variant}`);
          console.log(`   Estructura:`, Object.keys(data[0] || {}));
        }
      } catch (e) {
        // Silenciar errores esperados
      }
    }

    // 5. Probar acceso con diferentes patrones
    console.log('\n📋 5. PROBANDO DIFERENTES PATRONES DE ACCESO...');
    
    const patterns = [
      { name: 'Sin esquema', table: 'personal_servicio' },
      { name: 'Esquema public', table: 'public.personal_servicio' },
      { name: 'Esquema mantenimiento', table: 'mantenimiento.personal_servicio' },
    ];

    for (const pattern of patterns) {
      try {
        console.log(`\n🔍 Probando: ${pattern.name} (${pattern.table})`);
        
        const { data, error } = await supabase
          .from(pattern.table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${error.message}`);
        } else {
          console.log(`   ✅ Funciona!`);
        }
      } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar inspección
inspectDatabase()
  .then(() => {
    console.log('\n🎉 Inspección completada');
  })
  .catch((error) => {
    console.error('💥 Error en inspección:', error.message);
  });



