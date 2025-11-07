const axios = require('axios');
const { server } = require('./server'); // Importar el servidor

const API_BASE_URL = 'http://localhost:3000/api/prerrequisitos';
const CLIENTE_ID_PRUEBA = 1; // Cliente para prerrequisitos específicos

const limpiarRegistros = async () => {
  console.log('🧹 Limpiando registros de prueba anteriores...');
  try {
    // Limpiar globales
    const globales = await axios.get(`${API_BASE_URL}/globales`);
    for (const p of globales.data.data) {
      if (p.tipo_documento.startsWith('PRUEBA_')) {
        await axios.delete(`${API_BASE_URL}/${p.id}`);
        console.log(`  🗑️ Global de prueba eliminado: ${p.tipo_documento}`);
      }
    }

    // Limpiar específicos del cliente
    const especificos = await axios.get(`${API_BASE_URL}/cliente/${CLIENTE_ID_PRUEBA}`);
    for (const p of especificos.data.data) {
      if (p.tipo_documento.startsWith('PRUEBA_')) {
        await axios.delete(`${API_BASE_URL}/${p.id}`);
        console.log(`  🗑️ Específico de prueba eliminado: ${p.tipo_documento}`);
      }
    }
    console.log('✅ Limpieza completada.\n');
  } catch (error) {
    console.warn('⚠️  Advertencia durante la limpieza, puede que no hubiera nada que limpiar.');
  }
};

const testGlobalPrerequisites = async () => {
  try {
    await limpiarRegistros();

    console.log('🚀 INICIO DE PRUEBAS CON PRERREQUISITOS GLOBALES 🚀\n');

    // 1. Crear un prerrequisito GLOBAL
    console.log('1. Creando prerrequisito GLOBAL...');
    const globalPrereq = {
      tipo_documento: 'PRUEBA_GLOBAL_Contrato de Trabajo',
      descripcion: 'Contrato firmado y vigente.',
      dias_duracion: null
    };
    const createGlobalResponse = await axios.post(API_BASE_URL, globalPrereq);
    if (createGlobalResponse.status !== 201) throw new Error('Fallo al crear prerrequisito global');
    const globalId = createGlobalResponse.data.data.id;
    console.log(`✅ Prerrequisito GLOBAL creado con éxito. ID: ${globalId}\n`);

    // 2. Crear un prerrequisito ESPECÍFICO para el cliente
    console.log(`2. Creando prerrequisito ESPECÍFICO para el cliente ID: ${CLIENTE_ID_PRUEBA}...`);
    const specificPrereq = {
      cliente_id: CLIENTE_ID_PRUEBA,
      tipo_documento: 'PRUEBA_ESPECIFICO_Examen Médico Ocupacional',
      descripcion: 'Examen específico para faena minera.',
      dias_duracion: 365
    };
    const createSpecificResponse = await axios.post(API_BASE_URL, specificPrereq);
    if (createSpecificResponse.status !== 201) throw new Error('Fallo al crear prerrequisito específico');
    const specificId = createSpecificResponse.data.data.id;
    console.log(`✅ Prerrequisito ESPECÍFICO creado con éxito. ID: ${specificId}\n`);

    // 3. Verificar el endpoint de solo GLOBALES
    console.log('3. Verificando endpoint de prerrequisitos GLOBALES...');
    const globalListResponse = await axios.get(`${API_BASE_URL}/globales`);
    const foundGlobal = globalListResponse.data.data.find(p => p.id === globalId);
    if (!foundGlobal) throw new Error('El prerrequisito global no se encontró en la lista de globales.');
    console.log('✅ Endpoint de globales funciona correctamente.\n');

    // 4. Verificar el endpoint COMBINADO (globales + específicos)
    console.log(`4. Verificando endpoint COMBINADO para el cliente ID: ${CLIENTE_ID_PRUEBA}...`);
    const combinedListResponse = await axios.get(`${API_BASE_URL}/cliente/${CLIENTE_ID_PRUEBA}`);
    const combinedData = combinedListResponse.data.data;

    const foundGlobalInCombined = combinedData.find(p => p.id === globalId && p.es_global === true);
    const foundSpecificInCombined = combinedData.find(p => p.id === specificId && p.es_global === false);

    if (!foundGlobalInCombined) throw new Error('El prerrequisito GLOBAL no se encontró en la lista combinada.');
    if (!foundSpecificInCombined) throw new Error('El prerrequisito ESPECÍFICO no se encontró en la lista combinada.');
    
    console.log('✅ Endpoint combinado funciona correctamente. Se encontraron ambos prerrequisitos.');
    console.log('   - Global:', JSON.stringify(foundGlobalInCombined, null, 2));
    console.log('   - Específico:', JSON.stringify(foundSpecificInCombined, null, 2));
    console.log('');

    // 5. Intentar crear un global duplicado (debe fallar)
    console.log('5. Intentando crear un prerrequisito GLOBAL duplicado (debe fallar)...');
    try {
      await axios.post(API_BASE_URL, globalPrereq);
      throw new Error('Se permitió la creación de un prerrequisito global duplicado.');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('✅ Falló como se esperaba (Error 409 - Conflicto).\n');
      } else {
        throw error;
      }
    }

    // 6. Limpieza final
    console.log('6. Limpiando los registros de prueba creados...');
    await axios.delete(`${API_BASE_URL}/${globalId}`);
    await axios.delete(`${API_BASE_URL}/${specificId}`);
    console.log('✅ Registros eliminados.\n');

    console.log('🎉 FIN DE PRUEBAS: Toda la lógica de prerrequisitos globales y específicos funciona correctamente. 🎉');

  } catch (error) {
    console.error('🚨 ERROR DURANTE LAS PRUEBAS 🚨');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  } finally {
    // Cerrar el servidor al final de las pruebas
    server.close();
    console.log('\n🔌 Servidor de pruebas cerrado.');
  }
};

testGlobalPrerequisites();
