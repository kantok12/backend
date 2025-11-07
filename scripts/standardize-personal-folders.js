const fs = require('fs');
const path = require('path');
const { query, pool } = require('../config/database');

const personalDir = 'G:\\Unidades compartidas\\Unidad de Apoyo\\Personal';

// Expresión regular para validar el formato de RUT chileno (con puntos y guion)
const rutRegex = /\d{1,2}\.\d{3}\.\d{3}-[\dkK]/;

// Expresión regular para validar el formato de carpeta esperado: {nombre} - {rut}
const folderFormatRegex = /.+ - \d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;

// Función para normalizar un RUT (si viene sin puntos o guion)
const normalizeRut = (rut) => {
  let r = rut.replace(/\./g, '').replace('-', '');
  if (r.length < 2) return rut;
  const body = r.slice(0, -1);
  const dv = r.slice(-1).toUpperCase();
  let formattedBody = '';
  for (let i = body.length - 1, j = 1; i >= 0; i--, j++) {
    formattedBody = body[i] + formattedBody;
    if (j % 3 === 0 && i > 0) {
      formattedBody = '.' + formattedBody;
    }
  }
  return `${formattedBody}-${dv}`;
};

const standardizeFolders = async () => {
  console.log('🚀 Iniciando estandarización de carpetas de personal...');
  console.log(`📂 Directorio a procesar: ${personalDir}\n`);

  try {
    const entries = fs.readdirSync(personalDir, { withFileTypes: true });
    const folders = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

    for (const folderName of folders) {
      // 1. Verificar si la carpeta ya tiene el formato correcto
      if (folderFormatRegex.test(folderName)) {
        console.log(`✅ La carpeta "${folderName}" ya está en el formato correcto.`);
        continue;
      }

      // 2. Extraer el RUT de la carpeta
      const rutMatch = folderName.match(/\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]/);
      if (!rutMatch) {
        console.log(`⚠️ No se pudo extraer un RUT válido de la carpeta "${folderName}". Se omite.`);
        continue;
      }

      const extractedRut = normalizeRut(rutMatch[0]);

      // 3. Consultar la base de datos para obtener el nombre completo
      let personData;
      try {
        // Buscar en la base de datos comparando los RUTs sin puntos ni guiones
        const result = await query(
          "SELECT nombres, rut FROM mantenimiento.personal_disponible WHERE REPLACE(REPLACE(rut, '.', ''), '-', '') = $1",
          [extractedRut.replace(/\./g, '').replace('-', '')]
        );
        if (result.rows.length === 0) {
          console.log(`❌ No se encontró a la persona con RUT "${extractedRut}" en la base de datos. Carpeta "${folderName}" omitida.`);
          continue;
        }
        personData = result.rows[0];
      } catch (dbError) {
        console.error(`🚨 Error al consultar la base de datos para el RUT "${extractedRut}":`, dbError.message);
        continue;
      }

      // 4. Construir el nuevo nombre y renombrar la carpeta
      const newFolderName = `${personData.nombres.trim()} - ${personData.rut.trim()}`;
      const oldPath = path.join(personalDir, folderName);
      const newPath = path.join(personalDir, newFolderName);

      if (oldPath === newPath) {
        console.log(`✅ La carpeta "${folderName}" ya tiene el nombre correcto.`);
        continue;
      }
      
      if (fs.existsSync(newPath)) {
        console.log(`⚠️ La carpeta destino "${newFolderName}" ya existe. Se omite el renombramiento de "${folderName}".`);
        continue;
      }

      try {
        fs.renameSync(oldPath, newPath);
        console.log(`🔄 Renombrada: "${folderName}" -> "${newFolderName}"`);
      } catch (renameError) {
        console.error(`🚨 Error al renombrar la carpeta "${folderName}":`, renameError.message);
      }
    }

    console.log('\n🎉 Estandarización de carpetas completada.');

  } catch (error) {
    console.error('🚨 Error fatal durante el proceso de estandarización:', error.message);
  } finally {
    await pool.end();
    console.log('🔌 Conexión a la base de datos cerrada.');
  }
};

standardizeFolders();
