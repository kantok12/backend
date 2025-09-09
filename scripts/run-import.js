const ExcelImporter = require('./import-excel');
const path = require('path');

/**
 * Script ejecutor para la importación de Excel
 * 
 * Uso:
 * - node scripts/run-import.js --dry-run    (modo simulación)
 * - node scripts/run-import.js --real       (inserción real)
 */

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--real');
  
  console.log('🚀 EJECUTOR DE IMPORTACIÓN DE EXCEL');
  console.log('=' .repeat(50));
  console.log(`Modo: ${isDryRun ? '🔍 SIMULACIÓN' : '💾 INSERCIÓN REAL'}`);
  console.log('=' .repeat(50));
  
  const filePath = path.join(__dirname, '..', 'Personal Servicios.xlsx');
  const importer = new ExcelImporter();
  
  try {
    await importer.import(filePath, {
      dryRun: isDryRun,
      sheetName: null
    });
    
    if (isDryRun) {
      console.log('\n💡 Para ejecutar la importación real, usa:');
      console.log('   node scripts/run-import.js --real');
    }
    
  } catch (error) {
    console.error('💥 Error en la importación:', error.message);
    process.exit(1);
  }
}

main();












