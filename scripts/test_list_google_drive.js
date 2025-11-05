const fs = require('fs');
const path = 'G:/Unidades compartidas/Unidad de Apoyo/Personal';

try {
  const files = fs.readdirSync(path);
  if (files.length === 0) {
    console.log('No se encontraron archivos en la carpeta.');
  } else {
    console.log('Archivos encontrados:');
    files.forEach((file, i) => {
      console.log(`${i + 1}. ${file}`);
    });
  }
} catch (err) {
  console.error('Error al acceder a la carpeta:', err.message);
}
