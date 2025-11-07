const fs = require('fs');
const path = require('path');
const axios = require('axios');

const rut = '20.011.078-1';
const nombreCompleto = 'Claudio Nicolas Muñoz Herrera';
const folderName = `${nombreCompleto} - ${rut}`;
const folderPath = path.join('G:/Unidades compartidas/Unidad de Apoyo/Personal', folderName);
const imagePath = path.join(folderPath, 'foto.jpg');
const uploadUrl = `http://localhost:3000/api/personal/${rut}/upload`;
const downloadUrl = `http://localhost:3000/api/personal/${rut}/image/download`;

async function testProfileImageFolder() {
  // 1. Subir imagen de prueba
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream(path.join(__dirname, 'test-profile.jpg')));

  try {
    const uploadRes = await axios.post(uploadUrl, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    console.log('✅ Respuesta del servidor:', uploadRes.data);
  } catch (err) {
    console.error('❌ Error al subir imagen:', err.response ? err.response.data : err.message);
    return;
  }

  // 2. Verificar que la imagen existe en la carpeta correcta
  if (fs.existsSync(imagePath)) {
    const stats = fs.statSync(imagePath);
    console.log(`✅ Imagen guardada en carpeta correcta: ${imagePath}`);
    console.log(`Tamaño: ${stats.size} bytes`);
  } else {
    console.error(`❌ La imagen NO se encuentra en la carpeta esperada: ${imagePath}`);
    return;
  }

  // 3. Descargar la imagen desde el endpoint y verificar tamaño
  try {
    const res = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    console.log(`✅ Imagen descargada correctamente: ${downloadUrl}`);
    console.log(`Tamaño descargado: ${res.data.length} bytes`);
  } catch (err) {
    console.error('❌ Error al descargar imagen:', err.response ? err.response.data : err.message);
  }
}

testProfileImageFolder();
