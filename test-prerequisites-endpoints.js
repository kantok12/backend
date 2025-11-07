const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/prerrequisitos';
const CLIENTE_ID_PRUEBA = 1; // Usaremos el cliente con ID 1 para las pruebas
const TIPO_DOCUMENTO_PRUEBA = 'Certificado de Altura';

/**
 * Limpia los prerrequisitos de prueba que puedan haber quedado de una ejecución anterior.
 */
const limpiarPrerrequisitosDePrueba = async () => {
  console.log('🧹 Limpiando registros de prueba anteriores...');
  try {
    // Obtenemos los prerrequisitos del cliente de prueba
    const response = await axios.get(`${API_BASE_URL}/cliente/${CLIENTE_ID_PRUEBA}`);
    const prerrequisitos = response.data.data || [];
    
    // Buscamos el prerrequisito específico de la prueba
    const prerrequisitoDePrueba = prerrequisitos.find(p => p.tipo_documento === TIPO_DOCUMENTO_PRUEBA);

    if (prerrequisitoDePrueba) {
      console.log(`🗑️ Encontrado prerrequisito de prueba anterior (ID: ${prerrequisitoDePrueba.id}). Eliminando...`);
      await axios.delete(`${API_BASE_URL}/${prerrequisitoDePrueba.id}`);
      console.log('✅ Limpieza completada.');
    } else {
      console.log('👍 No se encontraron registros de prueba para limpiar.');
    }
  } catch (error) {
    // Si el cliente no tiene prerrequisitos, la API puede devolver un 404 o un array vacío, lo cual es normal.
    // Si hay otro error, lo mostramos, pero no detenemos la prueba.
    if (error.response && error.response.status !== 404) {
        console.warn('⚠️  Advertencia durante la limpieza:', error.response.data.message || error.message);
    } else if (!error.response) {
        console.warn('⚠️  Advertencia durante la limpieza:', error.message);
    }
  }
  console.log(''); // Línea en blanco para separar
};


const testPrerequisites = async () => {
  let prerrequisitoId;
  
  try {
    // Limpiar antes de empezar
    await limpiarPrerrequisitosDePrueba();

    console.log('🚀 INICIO DE PRUEBAS DE ENDPOINTS DE PRERREQUISITOS 🚀\n');

    // 1. Crear un nuevo prerrequisito
    console.log(`1. Creando un nuevo prerrequisito para el cliente ID: ${CLIENTE_ID_PRUEBA}...`);
    const nuevoPrerrequisito = {
      cliente_id: CLIENTE_ID_PRUEBA,
      tipo_documento: TIPO_DOCUMENTO_PRUEBA,
      descripcion: 'Curso obligatorio para trabajos sobre 1.80 metros.',
      dias_duracion: 365
    };
    const createResponse = await axios.post(API_BASE_URL, nuevoPrerrequisito);
    if (createResponse.status === 201 && createResponse.data.success) {
      prerrequisitoId = createResponse.data.data.id;
      console.log(`✅ Prerrequisito creado con éxito. ID: ${prerrequisitoId}`);
      if (createResponse.data.data.dias_duracion === 365) {
        console.log(`✅ Verificación de 'dias_duracion' en creación: ${createResponse.data.data.dias_duracion}\n`);
      } else {
        throw new Error(`La verificación de 'dias_duracion' en la creación falló. Se esperaba 365 pero se obtuvo ${createResponse.data.data.dias_duracion}`);
      }
    } else {
      throw new Error('La creación del prerrequisito falló.');
    }

    // 2. Listar prerrequisitos del cliente
    console.log(`2. Listando prerrequisitos del cliente ID: ${CLIENTE_ID_PRUEBA}...`);
    const listResponse = await axios.get(`${API_BASE_URL}/cliente/${CLIENTE_ID_PRUEBA}`);
    if (listResponse.data.success) {
      const prerrequisitos = listResponse.data.data;
      const encontrado = prerrequisitos.find(p => p.id === prerrequisitoId);
      if (encontrado) {
        console.log('✅ El prerrequisito recién creado se encontró en la lista.');
        console.log(JSON.stringify(encontrado, null, 2) + '\n');
      } else {
        throw new Error('No se encontró el prerrequisito en la lista.');
      }
    } else {
      throw new Error('La obtención de la lista de prerrequisitos falló.');
    }

    // 3. Actualizar el prerrequisito
    console.log(`3. Actualizando el prerrequisito ID: ${prerrequisitoId}...`);
    const datosActualizados = {
      tipo_documento: 'Certificado de Trabajo en Altura Física',
      descripcion: 'Curso actualizado y validado por Mutual.',
      dias_duracion: 730
    };
    const updateResponse = await axios.put(`${API_BASE_URL}/${prerrequisitoId}`, datosActualizados);
    if (updateResponse.data.success) {
      console.log('✅ Prerrequisito actualizado con éxito.');
      if (updateResponse.data.data.dias_duracion === 730) {
        console.log(`✅ Verificación de 'dias_duracion' en actualización: ${updateResponse.data.data.dias_duracion}`);
      } else {
        throw new Error(`La verificación de 'dias_duracion' en la actualización falló. Se esperaba 730 pero se obtuvo ${updateResponse.data.data.dias_duracion}`);
      }
      console.log(JSON.stringify(updateResponse.data.data, null, 2) + '\n');
    } else {
      throw new Error('La actualización del prerrequisito falló.');
    }

    // 4. Eliminar el prerrequisito
    console.log(`4. Eliminando el prerrequisito ID: ${prerrequisitoId}...`);
    const deleteResponse = await axios.delete(`${API_BASE_URL}/${prerrequisitoId}`);
    if (deleteResponse.data.success) {
      console.log(`✅ Prerrequisito eliminado con éxito.\n`);
    } else {
      throw new Error('La eliminación del prerrequisito falló.');
    }

    // 5. Verificar que el prerrequisito fue eliminado
    console.log(`5. Verificando que el prerrequisito ID: ${prerrequisitoId} ya no exista...`);
    const finalListResponse = await axios.get(`${API_BASE_URL}/cliente/${CLIENTE_ID_PRUEBA}`);
    if (finalListResponse.data.success) {
      const prerrequisitosFinales = finalListResponse.data.data;
      const noEncontrado = !prerrequisitosFinales.find(p => p.id === prerrequisitoId);
      if (noEncontrado) {
        console.log('✅ Verificación exitosa: El prerrequisito ya no está en la lista.\n');
      } else {
        throw new Error('El prerrequisito no fue eliminado correctamente.');
      }
    } else {
      throw new Error('La obtención de la lista final de prerrequisitos falló.');
    }

    console.log('🎉 FIN DE PRUEBAS: Todos los endpoints de prerrequisitos funcionan correctamente. 🎉');

  } catch (error) {
    console.error('🚨 ERROR DURANTE LAS PRUEBAS 🚨');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    // Asegurarse de que el proceso termine con un código de error si la prueba falla
    process.exit(1);
  }
};

testPrerequisites();
