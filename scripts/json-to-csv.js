const fs = require('fs');
const path = require('path');

/**
 * Script para convertir el JSON de personal_disponible a formato CSV
 */

function jsonToCSV() {
  console.log('📄 CONVIRTIENDO JSON A CSV');
  console.log('=' .repeat(40));
  
  try {
    // Leer el archivo JSON
    const jsonPath = path.join(__dirname, '..', 'personal_disponible_data.json');
    console.log('📖 Leyendo archivo JSON...');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error('Archivo JSON no encontrado. Ejecuta primero: node scripts/generate-json.js');
    }
    
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const data = jsonData.data;
    
    if (!data || data.length === 0) {
      throw new Error('No hay datos en el archivo JSON');
    }
    
    console.log(`📊 Registros encontrados: ${data.length}`);
    
    // Obtener headers (campos) del primer registro
    const headers = Object.keys(data[0]);
    console.log('📋 Campos detectados:', headers);
    
    // Crear contenido CSV
    let csvContent = '';
    
    // Agregar headers
    csvContent += headers.join(',') + '\n';
    
    // Agregar datos
    data.forEach((record, index) => {
      const row = headers.map(header => {
        let value = record[header];
        
        // Manejar valores null/undefined
        if (value === null || value === undefined) {
          return '';
        }
        
        // Convertir a string
        value = String(value);
        
        // Escapar comillas y agregar comillas si contiene comas, saltos de línea o comillas
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
        
        return value;
      });
      
      csvContent += row.join(',') + '\n';
      
      // Mostrar progreso cada 10 registros
      if ((index + 1) % 10 === 0) {
        console.log(`   ⚙️  Procesados ${index + 1}/${data.length} registros`);
      }
    });
    
    // Guardar archivo CSV
    const csvPath = path.join(__dirname, '..', 'personal_disponible_data.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    
    console.log(`✅ Archivo CSV generado: ${csvPath}`);
    console.log(`📊 Total de registros: ${data.length}`);
    console.log(`📋 Columnas: ${headers.length}`);
    
    // Mostrar las primeras líneas como muestra
    console.log('\n📋 PRIMERAS LÍNEAS DEL CSV:');
    console.log('=' .repeat(50));
    const lines = csvContent.split('\n');
    lines.slice(0, 4).forEach((line, index) => {
      if (line.trim()) {
        console.log(`${index === 0 ? 'HEADER' : `FILA ${index}`}: ${line}`);
      }
    });
    
    console.log('\n🎉 ¡Archivo CSV listo para importación!');
    console.log(`📁 Ubicación: ${csvPath}`);
    console.log('\n💡 Puedes importar este CSV directamente en:');
    console.log('   - PostgreSQL (COPY command)');
    console.log('   - pgAdmin (Import tool)');
    console.log('   - Excel/Google Sheets');
    console.log('   - Cualquier herramienta de base de datos');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

jsonToCSV();












