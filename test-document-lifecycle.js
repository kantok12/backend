const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { server } = require('./server'); // Importar para controlar el ciclo de vida
const { query } = require('./config/database'); // Importar para queries directas

const API_BASE_URL = 'http://localhost:3000/api/documentos';
const TEST_RUT = '1-9'; // Un RUT de prueba
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'documentos');

const testDocumentLifecycle = async () => {
  let testDocumentId;
  let testFilePath;
  const testFileName = `test_cv_${Date.now()}.txt`;
  const dummyFilePath = path.join(UPLOADS_DIR, testFileName);

  try {
    console.log('🚀 INICIO DE PRUEBAS DE CICLO DE VIDA DE DOCUMENTOS 🚀\n');

    // --- Preparación ---
    console.log('1. Preparando entorno de prueba...');
    // Crear persona de prueba para asegurar que exista
    console.log(`   - Asegurando la existencia de la persona de prueba con RUT: ${TEST_RUT}...`);
    await query(
      "INSERT INTO mantenimiento.personal_disponible (rut, nombres, cargo, activo) VALUES ($1, $2, $3, true) ON CONFLICT (rut) DO UPDATE SET nombres = $2, cargo = $3, activo = true",
      [TEST_RUT, 'Persona de Prueba', 'Tester']
    );
    console.log('   - Persona de prueba creada/actualizada.');

    // Crear un archivo dummy para subir
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    fs.writeFileSync(dummyFilePath, 'Este es un archivo de prueba para el CV.');
    console.log(`   - Archivo dummy creado: ${dummyFilePath}`);

    // --- Prueba de Subida ---
    console.log('\n2. Probando la subida de un documento con tipo "cv"...');
    const form = new FormData();
    form.append('rut_persona', TEST_RUT);
    form.append('nombre_documento', 'CV de Prueba');
    form.append('tipo_documento', 'cv'); // El tipo que antes fallaba
    form.append('descripcion', 'Prueba de subida y borrado.');
    form.append('archivo', fs.createReadStream(dummyFilePath));

    const createResponse = await axios.post(API_BASE_URL, form, {
      headers: form.getHeaders(),
    });

    if (createResponse.status !== 201 || !createResponse.data.success) {
      throw new Error('La subida del documento falló inesperadamente.');
    }

    const newDocument = createResponse.data.data.documentos[0];
    testDocumentId = newDocument.id;
    
    // La ruta del archivo se guarda en la BD, la buscamos para verificar
    const getDoc = await axios.get(`${API_BASE_URL}/${testDocumentId}`);
    testFilePath = getDoc.data.data.ruta_archivo;

    if (!fs.existsSync(testFilePath)) {
        throw new Error('El archivo se registró en la BD pero no se encontró en el disco.');
    }
    console.log(`✅ Subida exitosa. Documento ID: ${testDocumentId}, Archivo: ${testFilePath}\n`);


    // --- Prueba de Eliminación ---
    console.log(`3. Probando la eliminación (Hard Delete) del documento ID: ${testDocumentId}...`);
    const deleteResponse = await axios.delete(`${API_BASE_URL}/${testDocumentId}`);

    if (deleteResponse.status !== 200 || !deleteResponse.data.success) {
      throw new Error('La llamada a la API de eliminación falló.');
    }
    console.log('✅ API de eliminación respondió correctamente.');

    // Verificar que el archivo físico fue eliminado
    if (fs.existsSync(testFilePath)) {
      throw new Error('El archivo físico no fue eliminado del disco.');
    }
    console.log('✅ Verificación exitosa: El archivo físico fue eliminado.');

    // Verificar que el registro en la BD fue eliminado
    try {
      await axios.get(`${API_BASE_URL}/${testDocumentId}`);
      // Si la llamada tiene éxito, es un error porque debería dar 404
      throw new Error('El registro del documento no fue eliminado de la base de datos.');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Verificación exitosa: El registro ya no existe en la base de datos (recibido 404).\n');
      } else {
        throw error; // Otro tipo de error
      }
    }

    console.log('🎉 FIN DE PRUEBAS: El ciclo de vida de los documentos funciona correctamente. 🎉');

  } catch (error) {
    console.error('🚨 ERROR DURANTE LAS PRUEBAS 🚨');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  } finally {
    // --- Limpieza Final ---
    console.log('\n🧹 Limpiando datos y archivos de prueba...');
    // Eliminar persona de prueba
    try {
      await query("DELETE FROM mantenimiento.personal_disponible WHERE rut = $1", [TEST_RUT]);
      console.log('   - Persona de prueba eliminada.');
    } catch (dbError) {
      console.error('   - ⚠️ Error limpiando la persona de prueba:', dbError.message);
    }

    // Eliminar archivo dummy
    if (fs.existsSync(dummyFilePath)) {
      fs.unlinkSync(dummyFilePath);
      console.log('   - Archivo dummy local eliminado.');
    }
    // Asegurarse de que el servidor se cierre
    server.close(() => {
      console.log('🔌 Servidor de pruebas cerrado.');
    });
  }
};

testDocumentLifecycle();
