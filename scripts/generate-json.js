const PersonalDisponibleImporter = require('./import-personal-disponible');
const fs = require('fs');
const path = require('path');

/**
 * Script para generar un archivo JSON con los datos del Excel
 * transformados al formato de personal_disponible
 */

async function generateJSON() {
  console.log('📄 GENERANDO ARCHIVO JSON');
  console.log('=' .repeat(40));
  
  try {
    const filePath = path.join(__dirname, '..', 'Personal Servicios.xlsx');
    const importer = new PersonalDisponibleImporter();
    
    // Leer y procesar el Excel
    console.log('📖 Leyendo archivo Excel...');
    const readSuccess = await importer.readExcelFile(filePath);
    
    if (!readSuccess) {
      throw new Error('No se pudo leer el archivo Excel');
    }
    
    console.log('⚙️  Procesando datos...');
    const processedData = importer.processExcelData();
    
    if (processedData.length === 0) {
      throw new Error('No se encontraron datos válidos para procesar');
    }
    
    // Generar archivo JSON
    const outputPath = path.join(__dirname, '..', 'personal_disponible_data.json');
    
    const jsonOutput = {
      metadata: {
        total_records: processedData.length,
        generated_at: new Date().toISOString(),
        source_file: 'Personal Servicios.xlsx',
        target_table: 'mantenimiento.personal_disponible'
      },
      data: processedData
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2), 'utf8');
    
    console.log(`✅ Archivo JSON generado: ${outputPath}`);
    console.log(`📊 Total de registros: ${processedData.length}`);
    
    // Mostrar algunos ejemplos
    console.log('\n📋 EJEMPLOS DE REGISTROS:');
    console.log('=' .repeat(40));
    
    processedData.slice(0, 3).forEach((record, index) => {
      console.log(`\n📝 Registro ${index + 1}:`);
      console.log(JSON.stringify(record, null, 2));
    });
    
    console.log('\n🎉 ¡Archivo JSON listo para importación!');
    console.log(`📁 Ubicación: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateJSON();



