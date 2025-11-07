const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const testUploadProfileImage = async () => {
  const rut = '20.011.078-1'; // Cambiar por un RUT válido para pruebas
  const filePath = path.join(__dirname, 'test-image.jpg'); // Ruta de la imagen de prueba

  // Verificar que el archivo de prueba existe
  if (!fs.existsSync(filePath)) {
    console.error('❌ Archivo de prueba no encontrado:', filePath);
    return;
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  let imageUrl = null;

  try {
    const response = await axios.post(
      `http://localhost:3000/api/personal/${rut}/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 10000,
      }
    );

    console.log('✅ Respuesta del servidor:', response.data);
    imageUrl = response.data.data.profile_image_url;
  } catch (error) {
    if (error.response) {
      console.error('❌ Error en la respuesta del servidor:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('❌ Error al realizar la solicitud:', error.message);
      if (error.code) console.error('Código de error:', error.code);
      if (error.stack) console.error('Stack:', error.stack);
    }
    return;
  }

  // Verificar descarga de la imagen si la URL existe
  if (imageUrl) {
    try {
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      if (imageResponse.status === 200) {
        console.log('✅ Imagen descargada correctamente:', imageUrl);
        console.log('Tamaño:', imageResponse.data.length, 'bytes');
      } else {
        console.error('❌ Error al descargar la imagen. Status:', imageResponse.status);
      }
    } catch (imgErr) {
      if (imgErr.response) {
        console.error('❌ Error al descargar la imagen:', imgErr.response.data);
        console.error('Status:', imgErr.response.status);
      } else {
        console.error('❌ Error al realizar la solicitud de imagen:', imgErr.message);
      }
    }
  }
};

testUploadProfileImage();