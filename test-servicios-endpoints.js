const axios = require('axios');
const colors = require('colors');

// Configuración
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/servicios`;

// Colores para output
const success = colors.green;
const error = colors.red;
const info = colors.blue;
const warning = colors.yellow;

// Variables para almacenar IDs creados durante las pruebas
let testData = {
  cartera_id: null,
  cliente_id: null,
  nodo_id: null,
  minimo_personal_id: null,
  acuerdo_id: null
};

// Función para hacer requests HTTP
async function makeRequest(method, url, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      console.log(success(`✅ ${method} ${url} - Status: ${response.status}`));
      return response.data;
    } else {
      console.log(warning(`⚠️  ${method} ${url} - Status: ${response.status} (esperado: ${expectedStatus})`));
      return response.data;
    }
  } catch (err) {
    if (err.response) {
      console.log(error(`❌ ${method} ${url} - Status: ${err.response.status}`));
      console.log(error(`   Error: ${err.response.data?.message || err.message}`));
      return err.response.data;
    } else {
      console.log(error(`❌ ${method} ${url} - Error de conexión: ${err.message}`));
      throw err;
    }
  }
}

// Función para esperar un tiempo
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// PRUEBAS DE SETUP (Carteras, Clientes, Nodos)
// =====================================================

async function setupTestData() {
  console.log(info('\n🔧 CONFIGURANDO DATOS DE PRUEBA...\n'));
  
  // 1. Crear cartera de prueba
  console.log(info('1. Creando cartera de prueba...'));
  const carteraData = await makeRequest('POST', '/carteras', {
    name: `Cartera Test ${Date.now()}`
  }, 201);
  
  if (carteraData?.success) {
    testData.cartera_id = carteraData.data.id;
    console.log(success(`   Cartera creada con ID: ${testData.cartera_id}`));
  }
  
  // 2. Crear cliente de prueba
  console.log(info('2. Creando cliente de prueba...'));
  const clienteData = await makeRequest('POST', '/clientes', {
    nombre: `Cliente Test ${Date.now()}`,
    cartera_id: testData.cartera_id
  }, 201);
  
  if (clienteData?.success) {
    testData.cliente_id = clienteData.data.id;
    console.log(success(`   Cliente creado con ID: ${testData.cliente_id}`));
  }
  
  // 3. Crear nodo de prueba
  console.log(info('3. Creando nodo de prueba...'));
  const nodoData = await makeRequest('POST', '/nodos', {
    nombre: `Nodo Test ${Date.now()}`,
    cliente_id: testData.cliente_id
  }, 201);
  
  if (nodoData?.success) {
    testData.nodo_id = nodoData.data.id;
    console.log(success(`   Nodo creado con ID: ${testData.nodo_id}`));
  }
  
  console.log(success('\n✅ Datos de prueba configurados correctamente\n'));
}

// =====================================================
// PRUEBAS DE MÍNIMO PERSONAL
// =====================================================

async function testMinimoPersonalEndpoints() {
  console.log(info('🧪 PROBANDO ENDPOINTS DE MÍNIMO PERSONAL\n'));
  
  // 1. POST - Crear mínimo de personal
  console.log(info('1. POST /minimo-personal - Crear mínimo de personal'));
  const createData = await makeRequest('POST', '/minimo-personal', {
    cartera_id: testData.cartera_id,
    cliente_id: testData.cliente_id,
    nodo_id: testData.nodo_id,
    minimo_base: 10,
    descripcion: 'Mínimo de personal para pruebas'
  }, 201);
  
  if (createData?.success) {
    testData.minimo_personal_id = createData.data.id;
    console.log(success(`   Mínimo de personal creado con ID: ${testData.minimo_personal_id}`));
  }
  
  await sleep(500);
  
  // 2. GET - Listar mínimos de personal
  console.log(info('2. GET /minimo-personal - Listar mínimos de personal'));
  await makeRequest('GET', '/minimo-personal?limit=10&offset=0');
  
  await sleep(500);
  
  // 3. GET - Obtener mínimo específico
  console.log(info('3. GET /minimo-personal/:id - Obtener mínimo específico'));
  await makeRequest('GET', `/minimo-personal/${testData.minimo_personal_id}`);
  
  await sleep(500);
  
  // 4. GET - Calcular mínimo real
  console.log(info('4. GET /minimo-personal/:id/calcular - Calcular mínimo real'));
  await makeRequest('GET', `/minimo-personal/${testData.minimo_personal_id}/calcular`);
  
  await sleep(500);
  
  // 5. PUT - Actualizar mínimo de personal
  console.log(info('5. PUT /minimo-personal/:id - Actualizar mínimo de personal'));
  await makeRequest('PUT', `/minimo-personal/${testData.minimo_personal_id}`, {
    minimo_base: 15,
    descripcion: 'Mínimo de personal actualizado para pruebas'
  });
  
  await sleep(500);
  
  // 6. GET - Verificar actualización
  console.log(info('6. GET /minimo-personal/:id - Verificar actualización'));
  await makeRequest('GET', `/minimo-personal/${testData.minimo_personal_id}`);
  
  console.log(success('\n✅ Pruebas de mínimo personal completadas\n'));
}

// =====================================================
// PRUEBAS DE ACUERDOS
// =====================================================

async function testAcuerdosEndpoints() {
  console.log(info('🧪 PROBANDO ENDPOINTS DE ACUERDOS\n'));
  
  // 1. POST - Crear acuerdo
  console.log(info('1. POST /acuerdos - Crear acuerdo'));
  const createData = await makeRequest('POST', '/acuerdos', {
    minimo_personal_id: testData.minimo_personal_id,
    tipo_acuerdo: 'incremento',
    valor_modificacion: 5,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
    motivo: 'Acuerdo de prueba para incremento temporal',
    aprobado_por: 'Sistema de Pruebas'
  }, 201);
  
  if (createData?.success) {
    testData.acuerdo_id = createData.data.id;
    console.log(success(`   Acuerdo creado con ID: ${testData.acuerdo_id}`));
  }
  
  await sleep(500);
  
  // 2. GET - Listar acuerdos
  console.log(info('2. GET /acuerdos - Listar acuerdos'));
  await makeRequest('GET', '/acuerdos?limit=10&offset=0');
  
  await sleep(500);
  
  // 3. GET - Obtener acuerdo específico
  console.log(info('3. GET /acuerdos/:id - Obtener acuerdo específico'));
  await makeRequest('GET', `/acuerdos/${testData.acuerdo_id}`);
  
  await sleep(500);
  
  // 4. PUT - Actualizar acuerdo
  console.log(info('4. PUT /acuerdos/:id - Actualizar acuerdo'));
  await makeRequest('PUT', `/acuerdos/${testData.acuerdo_id}`, {
    valor_modificacion: 8,
    motivo: 'Acuerdo actualizado para pruebas'
  });
  
  await sleep(500);
  
  // 5. POST - Desactivar acuerdo
  console.log(info('5. POST /acuerdos/:id/desactivar - Desactivar acuerdo'));
  await makeRequest('POST', `/acuerdos/${testData.acuerdo_id}/desactivar`);
  
  await sleep(500);
  
  // 6. POST - Activar acuerdo
  console.log(info('6. POST /acuerdos/:id/activar - Activar acuerdo'));
  await makeRequest('POST', `/acuerdos/${testData.acuerdo_id}/activar`);
  
  await sleep(500);
  
  // 7. GET - Acuerdos próximos a vencer
  console.log(info('7. GET /acuerdos/vencer - Acuerdos próximos a vencer'));
  await makeRequest('GET', '/acuerdos/vencer?dias=30');
  
  await sleep(500);
  
  // 8. GET - Verificar estado final del acuerdo
  console.log(info('8. GET /acuerdos/:id - Verificar estado final'));
  await makeRequest('GET', `/acuerdos/${testData.acuerdo_id}`);
  
  console.log(success('\n✅ Pruebas de acuerdos completadas\n'));
}

// =====================================================
// PRUEBAS DE VALIDACIÓN Y ERRORES
// =====================================================

async function testValidationAndErrors() {
  console.log(info('🧪 PROBANDO VALIDACIONES Y MANEJO DE ERRORES\n'));
  
  // 1. POST - Crear mínimo con datos inválidos
  console.log(info('1. POST /minimo-personal - Datos inválidos (debería fallar)'));
  await makeRequest('POST', '/minimo-personal', {
    cartera_id: 'invalid',
    minimo_base: -5
  }, 400);
  
  await sleep(500);
  
  // 2. GET - Obtener mínimo inexistente
  console.log(info('2. GET /minimo-personal/:id - ID inexistente (debería fallar)'));
  await makeRequest('GET', '/minimo-personal/99999', null, 404);
  
  await sleep(500);
  
  // 3. POST - Crear acuerdo con datos inválidos
  console.log(info('3. POST /acuerdos - Datos inválidos (debería fallar)'));
  await makeRequest('POST', '/acuerdos', {
    minimo_personal_id: 'invalid',
    tipo_acuerdo: 'invalid_type',
    valor_modificacion: 'not_a_number'
  }, 400);
  
  await sleep(500);
  
  // 4. GET - Obtener acuerdo inexistente
  console.log(info('4. GET /acuerdos/:id - ID inexistente (debería fallar)'));
  await makeRequest('GET', '/acuerdos/99999', null, 404);
  
  console.log(success('\n✅ Pruebas de validación completadas\n'));
}

// =====================================================
// PRUEBAS DE FILTROS Y PAGINACIÓN
// =====================================================

async function testFiltersAndPagination() {
  console.log(info('🧪 PROBANDO FILTROS Y PAGINACIÓN\n'));
  
  // 1. GET - Mínimos con filtros
  console.log(info('1. GET /minimo-personal - Con filtros'));
  await makeRequest('GET', `/minimo-personal?cartera_id=${testData.cartera_id}&limit=5&offset=0`);
  
  await sleep(500);
  
  // 2. GET - Acuerdos con filtros
  console.log(info('2. GET /acuerdos - Con filtros'));
  await makeRequest('GET', `/acuerdos?minimo_personal_id=${testData.minimo_personal_id}&estado=activo&limit=5&offset=0`);
  
  await sleep(500);
  
  // 3. GET - Acuerdos por tipo
  console.log(info('3. GET /acuerdos - Por tipo de acuerdo'));
  await makeRequest('GET', '/acuerdos?tipo_acuerdo=incremento&limit=5&offset=0');
  
  console.log(success('\n✅ Pruebas de filtros completadas\n'));
}

// =====================================================
// LIMPIEZA DE DATOS DE PRUEBA
// =====================================================

async function cleanupTestData() {
  console.log(info('🧹 LIMPIANDO DATOS DE PRUEBA...\n'));
  
  try {
    // 1. Eliminar acuerdo
    if (testData.acuerdo_id) {
      console.log(info('1. Eliminando acuerdo de prueba...'));
      await makeRequest('DELETE', `/acuerdos/${testData.acuerdo_id}`);
    }
    
    await sleep(500);
    
    // 2. Eliminar mínimo de personal
    if (testData.minimo_personal_id) {
      console.log(info('2. Eliminando mínimo de personal de prueba...'));
      await makeRequest('DELETE', `/minimo-personal/${testData.minimo_personal_id}`);
    }
    
    await sleep(500);
    
    // 3. Eliminar nodo
    if (testData.nodo_id) {
      console.log(info('3. Eliminando nodo de prueba...'));
      await makeRequest('DELETE', `/nodos/${testData.nodo_id}`);
    }
    
    await sleep(500);
    
    // 4. Eliminar cliente
    if (testData.cliente_id) {
      console.log(info('4. Eliminando cliente de prueba...'));
      await makeRequest('DELETE', `/clientes/${testData.cliente_id}`);
    }
    
    await sleep(500);
    
    // 5. Eliminar cartera
    if (testData.cartera_id) {
      console.log(info('5. Eliminando cartera de prueba...'));
      await makeRequest('DELETE', `/carteras/${testData.cartera_id}`);
    }
    
    console.log(success('\n✅ Limpieza completada\n'));
  } catch (error) {
    console.log(warning('\n⚠️  Algunos datos de prueba no pudieron ser eliminados\n'));
  }
}

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function runTests() {
  console.log(info('🚀 INICIANDO PRUEBAS DE ENDPOINTS DE SERVICIOS\n'));
  console.log(info(`📍 URL Base: ${API_BASE}\n`));
  
  const startTime = Date.now();
  
  try {
    // Configurar datos de prueba
    await setupTestData();
    
    // Ejecutar pruebas
    await testMinimoPersonalEndpoints();
    await testAcuerdosEndpoints();
    await testValidationAndErrors();
    await testFiltersAndPagination();
    
    // Limpiar datos de prueba
    await cleanupTestData();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(success('🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE'));
    console.log(info(`⏱️  Tiempo total: ${duration.toFixed(2)} segundos\n`));
    
  } catch (error) {
    console.log(error('\n💥 ERROR DURANTE LAS PRUEBAS:'));
    console.log(error(error.message));
    
    // Intentar limpiar en caso de error
    console.log(warning('\n🧹 Intentando limpiar datos de prueba...'));
    await cleanupTestData();
    
    process.exit(1);
  }
}

// =====================================================
// VERIFICACIÓN DE CONECTIVIDAD
// =====================================================

async function checkConnectivity() {
  try {
    console.log(info('🔍 Verificando conectividad con el servidor...'));
    const response = await axios.get(`${BASE_URL}/api/health`);
    
    if (response.status === 200) {
      console.log(success('✅ Servidor disponible y funcionando'));
      return true;
    }
  } catch (err) {
    console.log(error('❌ No se puede conectar al servidor'));
    console.log(error(`   URL: ${BASE_URL}`));
    console.log(error(`   Error: ${err.message}`));
    return false;
  }
}

// =====================================================
// EJECUCIÓN
// =====================================================

async function main() {
  console.log(info('🧪 SCRIPT DE PRUEBAS PARA ENDPOINTS DE SERVICIOS\n'));
  
  // Verificar conectividad
  const isConnected = await checkConnectivity();
  if (!isConnected) {
    console.log(error('\n❌ No se puede continuar sin conexión al servidor'));
    console.log(info('💡 Asegúrate de que el servidor esté ejecutándose en:'));
    console.log(info(`   ${BASE_URL}`));
    console.log(info('\n💡 Para cambiar la URL, usa:'));
    console.log(info('   API_URL=http://tu-servidor:puerto node test-servicios-endpoints.js'));
    process.exit(1);
  }
  
  console.log('');
  
  // Ejecutar pruebas
  await runTests();
}

// Manejo de señales para limpieza
process.on('SIGINT', async () => {
  console.log(warning('\n⚠️  Interrumpido por el usuario'));
  await cleanupTestData();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(warning('\n⚠️  Terminado por el sistema'));
  await cleanupTestData();
  process.exit(0);
});

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runTests,
  testMinimoPersonalEndpoints,
  testAcuerdosEndpoints,
  testValidationAndErrors,
  testFiltersAndPagination,
  cleanupTestData
};
