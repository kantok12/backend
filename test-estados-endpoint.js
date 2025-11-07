const axios = require('axios');
const { server, shutdown } = require('./server');

const API_URL = 'http://localhost:3000/api';

const EXPECTED_ESTADOS_COUNT = 10;
const MISSING_ESTADOS_NOMBRES = ['Activo', 'Inactivo', 'En Proceso', 'Suspendido'];

async function runTest() {
    console.log('🚀 Ejecutando prueba de verificación para el endpoint GET /api/estados...');

    let serverInstance;
    try {
        // 1. Iniciar servidor
        serverInstance = await server;
        console.log('   - Servidor iniciado.');

        // 2. Realizar la petición GET
        console.log(`   - Realizando petición a ${API_URL}/estados?limit=100`);
        const response = await axios.get(`${API_URL}/estados?limit=100`);
        const { data, pagination, success } = response.data;

        console.log(`   - Respuesta recibida. Total de estados: ${pagination.total}`);

        // 3. Realizar aserciones (verificaciones)
        if (!success) {
            throw new Error('La propiedad "success" en la respuesta fue false.');
        }

        if (pagination.total < EXPECTED_ESTADOS_COUNT) {
            throw new Error(`Error de aserción: Se esperaban al menos ${EXPECTED_ESTADOS_COUNT} estados, pero se recibieron ${pagination.total}.`);
        }
        console.log(`   ✔️  OK: El número de estados (${pagination.total}) es correcto.`);

        const returnedNombres = data.map(e => e.nombre);
        const notFound = MISSING_ESTADOS_NOMBRES.filter(nombre => !returnedNombres.includes(nombre));

        if (notFound.length > 0) {
            throw new Error(`Error de aserción: No se encontraron los siguientes estados esperados: ${notFound.join(', ')}`);
        }
        console.log(`   ✔️  OK: Todos los estados previamente faltantes (${MISSING_ESTADOS_NOMBRES.join(', ')}) fueron encontrados.`);

        // 4. Conclusión
        console.log('\n🎉 ¡Prueba exitosa! El endpoint /api/estados ahora devuelve todos los registros correctamente.');

    } catch (error) {
        console.error('\n🔥 Error durante la prueba:', error.response ? error.response.data : error.message);
        process.exit(1); // Salir con código de error para indicar que la prueba falló
    } finally {
        // 5. Apagar el servidor
        if (serverInstance) {
            await shutdown();
            console.log('   - Servidor detenido.');
        }
    }
}

runTest();
