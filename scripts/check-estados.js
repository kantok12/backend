const { query } = require('../config/postgresql');

/**
 * Script para verificar la tabla de estados y sus valores válidos
 */

async function checkEstados() {
  console.log('🔍 VERIFICANDO TABLA DE ESTADOS');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar si existe la tabla estados
    console.log('📋 1. Buscando tabla de estados...');
    
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento' 
      AND table_name LIKE '%estado%'
      ORDER BY table_name
    `;
    
    const tables = await query(tablesQuery);
    
    if (tables.rows.length === 0) {
      console.log('❌ No se encontraron tablas relacionadas con estados');
      return;
    }
    
    console.log('✅ Tablas encontradas:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // 2. Verificar estructura de personal_disponible para ver la FK
    console.log('\n📋 2. Verificando restricciones de personal_disponible...');
    
    const constraintsQuery = `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'mantenimiento'
        AND tc.table_name = 'personal_disponible'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'estado_id'
    `;
    
    const constraints = await query(constraintsQuery);
    
    if (constraints.rows.length > 0) {
      console.log('✅ Restricción de clave foránea encontrada:');
      constraints.rows.forEach(row => {
        console.log(`   - Campo: ${row.column_name}`);
        console.log(`   - Tabla referenciada: ${row.foreign_table_name}`);
        console.log(`   - Campo referenciado: ${row.foreign_column_name}`);
      });
      
      // 3. Consultar valores válidos en la tabla referenciada
      const foreignTable = constraints.rows[0].foreign_table_name;
      if (foreignTable) {
        console.log(`\n📋 3. Consultando valores válidos en ${foreignTable}...`);
        
        try {
          const validStatesQuery = `SELECT * FROM mantenimiento.${foreignTable} ORDER BY id`;
          const validStates = await query(validStatesQuery);
          
          if (validStates.rows.length > 0) {
            console.log('✅ Estados válidos encontrados:');
            validStates.rows.forEach(row => {
              console.log(`   - ID: ${row.id}, Nombre: ${row.nombre || row.descripcion || 'N/A'}`);
            });
          } else {
            console.log('❌ La tabla de estados está vacía');
            console.log('\n💡 Necesitas insertar estados primero. Ejemplo:');
            console.log(`INSERT INTO mantenimiento.${foreignTable} (nombre) VALUES ('Activo'), ('Inactivo');`);
          }
        } catch (error) {
          console.log(`❌ Error al consultar ${foreignTable}:`, error.message);
        }
      }
    } else {
      console.log('❌ No se encontró la restricción de clave foránea para estado_id');
    }
    
    // 4. Mostrar estructura completa de personal_disponible
    console.log('\n📋 4. Estructura completa de personal_disponible...');
    
    const structureQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'personal_disponible' 
      ORDER BY ordinal_position
    `;
    
    const structure = await query(structureQuery);
    
    console.log('📊 Campos de la tabla:');
    structure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEstados()
  .then(() => {
    console.log('\n✅ Verificación completada');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });