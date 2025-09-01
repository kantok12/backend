const PersonalDisponibleImporter = require('./import-personal-disponible');
const path = require('path');

/**
 * Script ejecutor para la importación a personal_disponible
 * 
 * Uso:
 * - node scripts/run-import-personal.js --dry-run    (modo simulación)
 * - node scripts/run-import-personal.js --real       (inserción real)
 */

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--real');
  
  console.log('🚀 EJECUTOR DE IMPORTACIÓN A PERSONAL_DISPONIBLE');
  console.log('=' .repeat(60));
  console.log(`Modo: ${isDryRun ? '🔍 SIMULACIÓN' : '💾 INSERCIÓN REAL'}`);
  console.log('=' .repeat(60));
  
  const filePath = path.join(__dirname, '..', 'Personal Servicios.xlsx');
  const importer = new PersonalDisponibleImporter();
  
  try {
    await importer.import(filePath, {
      dryRun: isDryRun
    });
    
    if (isDryRun) {
      console.log('\n💡 Para ejecutar la importación real, usa:');
      console.log('   node scripts/run-import-personal.js --real');
    }
    
  } catch (error) {
    console.error('💥 Error en la importación:', error.message);
    process.exit(1);
  }
}

main();



