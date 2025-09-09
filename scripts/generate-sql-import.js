const fs = require('fs');
const path = require('path');

/**
 * Script para generar comandos SQL de importación desde el CSV
 */

function generateSQLImport() {
  console.log('📄 GENERANDO SCRIPT SQL DE IMPORTACIÓN');
  console.log('=' .repeat(50));
  
  try {
    const csvPath = path.join(__dirname, '..', 'personal_disponible_data.csv');
    const sqlPath = path.join(__dirname, '..', 'import_personal_disponible.sql');
    
    // Verificar que existe el CSV
    if (!fs.existsSync(csvPath)) {
      throw new Error('Archivo CSV no encontrado. Ejecuta primero: node scripts/json-to-csv.js');
    }
    
    console.log('📖 Leyendo archivo CSV...');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('El archivo CSV no tiene datos suficientes');
    }
    
    const headers = lines[0].split(',');
    console.log('📋 Columnas detectadas:', headers);
    console.log(`📊 Registros encontrados: ${lines.length - 1}`);
    
    // Generar SQL
    let sqlContent = '';
    
    // Comentarios del archivo
    sqlContent += '-- Script de importación para personal_disponible\n';
    sqlContent += `-- Generado automáticamente el: ${new Date().toISOString()}\n`;
    sqlContent += `-- Registros a importar: ${lines.length - 1}\n`;
    sqlContent += '-- Tabla destino: mantenimiento.personal_disponible\n\n';
    
    // Opción 1: COPY desde archivo (más eficiente)
    sqlContent += '-- OPCIÓN 1: Importación desde archivo CSV (recomendado)\n';
    sqlContent += '-- Ejecutar este comando en psql o pgAdmin:\n\n';
    sqlContent += `COPY mantenimiento.personal_disponible (${headers.join(', ')})\n`;
    sqlContent += `FROM '${csvPath.replace(/\\/g, '/')}'  -- Ajustar ruta según tu sistema\n`;
    sqlContent += `WITH (FORMAT csv, HEADER true, DELIMITER ',');\n\n`;
    
    // Opción 2: INSERT statements individuales
    sqlContent += '-- OPCIÓN 2: INSERT statements individuales\n';
    sqlContent += '-- (usar si COPY no está disponible)\n\n';
    sqlContent += 'BEGIN;\n\n';
    
    // Generar INSERT para cada fila
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        console.warn(`⚠️  Advertencia: Fila ${i} tiene ${values.length} valores, esperados ${headers.length}`);
        continue;
      }
      
      // Escapar y formatear valores
      const formattedValues = values.map((value, index) => {
        if (value === '' || value === null) {
          return 'NULL';
        }
        
        const header = headers[index];
        
        // Si es estado_id, no poner comillas
        if (header === 'estado_id') {
          return value;
        }
        
        // Para otros campos, escapar comillas y agregar comillas simples
        return "'" + value.replace(/'/g, "''") + "'";
      });
      
      sqlContent += `INSERT INTO mantenimiento.personal_disponible (${headers.join(', ')}) VALUES (${formattedValues.join(', ')});\n`;
      
      // Mostrar progreso
      if (i % 10 === 0) {
        console.log(`   ⚙️  Procesados ${i}/${lines.length - 1} registros`);
      }
    }
    
    sqlContent += '\nCOMMIT;\n\n';
    
    // Agregar validación
    sqlContent += '-- Validar importación\n';
    sqlContent += 'SELECT COUNT(*) as registros_importados FROM mantenimiento.personal_disponible;\n';
    sqlContent += 'SELECT * FROM mantenimiento.personal_disponible LIMIT 5;\n';
    
    // Guardar archivo SQL
    fs.writeFileSync(sqlPath, sqlContent, 'utf8');
    
    console.log(`✅ Script SQL generado: ${sqlPath}`);
    console.log(`📊 Total de INSERT statements: ${lines.length - 1}`);
    
    console.log('\n📋 OPCIONES DE IMPORTACIÓN:');
    console.log('=' .repeat(40));
    console.log('1. 🚀 COPY (Más rápido):');
    console.log('   psql -h host -d database -U user -f import_personal_disponible.sql');
    console.log('\n2. 📝 INSERT statements:');
    console.log('   Ejecutar todo el contenido del archivo SQL');
    console.log('\n3. 🖥️  pgAdmin:');
    console.log('   Query Tool → Abrir archivo → Ejecutar');
    
    console.log('\n🎉 ¡Script SQL listo para importación!');
    console.log(`📁 Ubicación: ${sqlPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Función para parsear línea CSV correctamente
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Comilla escapada
        current += '"';
        i++; // Saltar la siguiente comilla
      } else {
        // Inicio o fin de comillas
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Separador de campo
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Agregar el último valor
  values.push(current);
  
  return values;
}

generateSQLImport();












