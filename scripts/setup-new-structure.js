const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { migrateData } = require('./migrate-data');

/**
 * Script completo para configurar la nueva estructura de tablas
 * cursos y documentos
 */

async function setupNewStructure() {
  console.log('🏗️ CONFIGURANDO NUEVA ESTRUCTURA DE TABLAS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Leer y ejecutar script SQL
    console.log('📋 1. Creando nuevas tablas...');
    
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'create-new-tables.sql'), 
      'utf8'
    );
    
    // Dividir el script en comandos individuales
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await query(command);
          console.log(`✅ Comando ejecutado: ${command.substring(0, 50)}...`);
        } catch (error) {
          // Ignorar errores de "ya existe" para tablas e índices
          if (!error.message.includes('already exists')) {
            console.error(`❌ Error ejecutando comando: ${error.message}`);
          }
        }
      }
    }
    
    // 2. Crear directorios de almacenamiento
    console.log('📋 2. Creando directorios de almacenamiento...');
    
    const uploadDirs = [
      path.join(__dirname, '../uploads/cursos'),
      path.join(__dirname, '../uploads/documentos')
    ];
    
    for (const dir of uploadDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Directorio creado: ${dir}`);
      } else {
        console.log(`ℹ️ Directorio ya existe: ${dir}`);
      }
    }
    
    // 3. Migrar datos existentes
    console.log('📋 3. Migrando datos existentes...');
    await migrateData();
    
    // 4. Verificar estructura final
    console.log('📋 4. Verificando estructura final...');
    
    const verifyTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'mantenimiento' 
      AND table_name IN ('cursos', 'documentos', 'cursos_certificaciones')
      ORDER BY table_name
    `;
    
    const tables = await query(verifyTablesQuery);
    
    console.log('\n📊 TABLAS EN EL ESQUEMA MANTENIMIENTO:');
    console.log('=' .repeat(40));
    tables.rows.forEach(row => {
      const status = row.table_name === 'cursos_certificaciones' ? '⚠️ (ANTIGUA)' : '✅ (NUEVA)';
      console.log(`${status} ${row.table_name}`);
    });
    
    // 5. Mostrar estructura de las nuevas tablas
    console.log('\n📊 ESTRUCTURA DE NUEVAS TABLAS:');
    console.log('=' .repeat(40));
    
    const showStructure = async (tableName) => {
      const structureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = $1
        ORDER BY ordinal_position
      `;
      
      const structure = await query(structureQuery, [tableName]);
      
      console.log(`\n📋 Tabla: ${tableName}`);
      console.log('-'.repeat(30));
      structure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    };
    
    await showStructure('cursos');
    await showStructure('documentos');
    
    console.log('\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE');
    console.log('=' .repeat(50));
    console.log('✅ Nuevas tablas creadas: cursos, documentos');
    console.log('✅ Directorios de almacenamiento creados');
    console.log('✅ Datos migrados desde cursos_certificaciones');
    console.log('✅ Estructura verificada');
    
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Actualizar endpoints en routes/cursos.js');
    console.log('2. Actualizar middleware de upload');
    console.log('3. Actualizar documentación');
    console.log('4. Probar nuevos endpoints');
    
  } catch (error) {
    console.error('❌ Error configurando nueva estructura:', error);
    throw error;
  }
}

// Ejecutar setup si se llama directamente
if (require.main === module) {
  setupNewStructure()
    .then(() => {
      console.log('\n✅ Setup completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en setup:', error);
      process.exit(1);
    });
}

module.exports = { setupNewStructure };
