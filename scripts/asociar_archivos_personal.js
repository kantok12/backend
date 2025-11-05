const fs = require('fs');
const path = 'G:/Unidades compartidas/Unidad de Apoyo/Personal';

/**
 * Extrae el RUT de un nombre de archivo con formato "Nombre Apellido - RUT"
 * Ejemplo: "Aguirre Bobadilla Jesus Andres - 19838046-6"
 */
function extractRut(filename) {
  const match = filename.match(/-\s*([\dKk\.-]+)/);
  return match ? match[1].replace(/\./g, '').toUpperCase() : null;
}

/**
 * Asocia archivos a usuarios por RUT
 * @param {Array} usuarios - Array de objetos usuario con propiedad rut
 * @returns {Object} - { rut: [archivos] }
 */
function asociarArchivosPorRut(usuarios) {
  const files = fs.readdirSync(path);
  const rutToFiles = {};
  files.forEach(file => {
    const rut = extractRut(file);
    if (rut) {
      // Normaliza el rut para comparación
      const usuario = usuarios.find(u => u.rut.replace(/\./g, '').toUpperCase() === rut);
      if (usuario) {
        if (!rutToFiles[rut]) rutToFiles[rut] = [];
        rutToFiles[rut].push(file);
      }
    }
  });
  return rutToFiles;
}

// Ejemplo de uso:
// const usuarios = [ { rut: '19838046-6', nombre: 'Aguirre Bobadilla Jesus Andres' }, ... ];
// const resultado = asociarArchivosPorRut(usuarios);
// console.log(resultado);

module.exports = { extractRut, asociarArchivosPorRut };
