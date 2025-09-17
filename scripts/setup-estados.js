const { query } = require('../config/database');

/**
 * Script para configurar los estados iniciales en la tabla estados
 */

async function setupEstados() {
  console.log('🔧 CONFIGURANDO ESTADOS INICIALES');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar estructura de la tabla estados
    console.log('📋 1. Verificando estructura de tabla estados...');
    
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'mantenimiento' 
      AND table_name = 'estados' 
      ORDER BY ordinal_position
    `;
    
    const structure = await query(structureQuery);
    
    if (structure.rows.length === 0) {
      throw new Error('Tabla estados no encontrada');
    }
    
    console.log('✅ Estructura de la tabla estados:');
    structure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // 2. Verificar si ya existen estados
    console.log('\n📋 2. Verificando estados existentes...');
    
    const existingStates = await query('SELECT * FROM mantenimiento.estados ORDER BY id');
    
    if (existingStates.rows.length > 0) {
      console.log('✅ Estados existentes encontrados:');
      existingStates.rows.forEach(row => {
        console.log(`   - ID: ${row.id}, Nombre: ${row.nombre || row.descripcion || JSON.stringify(row)}`);
      });
      
      console.log('\n💡 Los estados ya existen. Puedes usar estos IDs en personal_disponible.');
      return;
    }
    
    console.log('⚠️  No hay estados en la tabla. Creando estados básicos...');
    
    // 3. Determinar qué campos tiene la tabla para crear los estados
    const columns = structure.rows.map(row => row.column_name);
    console.log('📊 Columnas disponibles:', columns);
    
    // 4. Crear estados básicos
    console.log('\n📋 3. Creando estados básicos...');
    
    let insertQuery = '';
    let estadosData = [];
    
    // Determinar la estructura e insertar estados apropiados
    if (columns.includes('nombre')) {
      estadosData = [
        { nombre: 'Activo', descripcion: 'Personal activo y disponible' },
        { nombre: 'Inactivo', descripcion: 'Personal temporalmente inactivo' },
        { nombre: 'Vacaciones', descripcion: 'Personal en período de vacaciones' },
        { nombre: 'Licencia Médica', descripcion: 'Personal con licencia médica' }
      ];
      
      if (columns.includes('descripcion')) {
        insertQuery = `
          INSERT INTO mantenimiento.estados (nombre, descripcion) 
          VALUES 
            ('Activo', 'Personal activo y disponible'),
            ('Inactivo', 'Personal temporalmente inactivo'),
            ('Vacaciones', 'Personal en período de vacaciones'),
            ('Licencia Médica', 'Personal con licencia médica')
          RETURNING id, nombre, descripcion
        `;
      } else {
        insertQuery = `
          INSERT INTO mantenimiento.estados (nombre) 
          VALUES 
            ('Activo'),
            ('Inactivo'),
            ('Vacaciones'),
            ('Licencia Médica')
          RETURNING id, nombre
        `;
      }
    } else {
      // Si no tiene campo nombre, insertar registros genéricos
      insertQuery = `
        INSERT INTO mantenimiento.estados DEFAULT VALUES
        RETURNING *
      `;
    }
    
    console.log('💾 Ejecutando inserción de estados...');
    const result = await query(insertQuery);
    
    console.log('✅ Estados creados exitosamente:');
    result.rows.forEach(row => {
      console.log(`   - ID: ${row.id}${row.nombre ? `, Nombre: ${row.nombre}` : ''}${row.descripcion ? `, Descripción: ${row.descripcion}` : ''}`);
    });
    
    // 5. Mostrar cómo usar en personal_disponible
    console.log('\n💡 CÓMO USAR EN PERSONAL_DISPONIBLE:');
    console.log('=' .repeat(40));
    console.log('Ahora puedes usar estos estado_id en tus datos:');
    result.rows.forEach(row => {
      console.log(`   - estado_id: ${row.id} = ${row.nombre || 'Estado ' + row.id}`);
    });
    
    console.log('\n🔧 ACTUALIZAR TUS DATOS:');
    console.log('Recomendación: Usar estado_id = 1 (Activo) para todo el personal importado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

setupEstados()
  .then(() => {
    console.log('\n🎉 Configuración de estados completada');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });












