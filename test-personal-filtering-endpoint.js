const axios = require('axios');
const { query } = require('./config/database');
const { server, shutdown } = require('./server'); // Import server and shutdown function

const API_URL = 'http://localhost:3000/api';

// Datos de prueba
const testData = {
    cliente: { id: 9999, nombre: 'Cliente de Prueba Filtrado' },
    personal: [
        { rut: '1-1', nombres: 'Cumple Todo', estado_id: 1, cargo: 'Tester' }, // Cumple todo
        { rut: '2-2', nombres: 'Falta Doc Específico', estado_id: 1, cargo: 'Tester' }, // Le falta un doc específico
        { rut: '3-3', nombres: 'Falta Doc Global', estado_id: 1, cargo: 'Tester' }, // Le falta un doc global
        { rut: '4-4', nombres: 'Doc Expirado', estado_id: 1, cargo: 'Tester' }, // Tiene un doc expirado
        { rut: '5-5', nombres: 'No Disponible', estado_id: 2, cargo: 'Tester' }, // No está disponible pero tiene todo
        { rut: '6-6', nombres: 'Cumple Todo También', estado_id: 1, cargo: 'Developer' }, // Otro que cumple
    ],
    prerrequisitos: [
        { tipo_documento: 'CERT-GLOBAL-TEST', dias_duracion: 365, cliente_id: null }, // Global
        { tipo_documento: 'CERT-ESPECIFICO-TEST', dias_duracion: 180, cliente_id: 9999 }, // Específico
        { tipo_documento: 'CERT-NO-EXPIRA-TEST', dias_duracion: null, cliente_id: 9999 }, // Específico sin expiración
    ],
    documentos: [
        // Persona 1-1 (Cumple todo)
        { rut_persona: '1-1', tipo_documento: 'CERT-GLOBAL-TEST', fecha_emision: new Date() },
        { rut_persona: '1-1', tipo_documento: 'CERT-ESPECIFICO-TEST', fecha_emision: new Date() },
        { rut_persona: '1-1', tipo_documento: 'CERT-NO-EXPIRA-TEST', fecha_emision: new Date() },
        // Persona 2-2 (Falta específico)
        { rut_persona: '2-2', tipo_documento: 'CERT-GLOBAL-TEST', fecha_emision: new Date() },
        // Persona 3-3 (Falta global)
        { rut_persona: '3-3', tipo_documento: 'CERT-ESPECIFICO-TEST', fecha_emision: new Date() },
        // Persona 4-4 (Doc expirado)
        { rut_persona: '4-4', tipo_documento: 'CERT-GLOBAL-TEST', fecha_emision: new Date() },
        { rut_persona: '4-4', tipo_documento: 'CERT-ESPECIFICO-TEST', fecha_emision: new Date('2020-01-01') }, // Expirado
        { rut_persona: '4-4', tipo_documento: 'CERT-NO-EXPIRA-TEST', fecha_emision: new Date() },
        // Persona 5-5 (No disponible, pero con docs)
        { rut_persona: '5-5', tipo_documento: 'CERT-GLOBAL-TEST', fecha_emision: new Date() },
        { rut_persona: '5-5', tipo_documento: 'CERT-ESPECIFICO-TEST', fecha_emision: new Date() },
        { rut_persona: '5-5', tipo_documento: 'CERT-NO-EXPIRA-TEST', fecha_emision: new Date() },
        // Persona 6-6 (Cumple todo)
        { rut_persona: '6-6', tipo_documento: 'CERT-GLOBAL-TEST', fecha_emision: new Date() },
        { rut_persona: '6-6', tipo_documento: 'CERT-ESPECIFICO-TEST', fecha_emision: new Date() },
        { rut_persona: '6-6', tipo_documento: 'CERT-NO-EXPIRA-TEST', fecha_emision: new Date('2000-01-01') }, // Fecha vieja pero no expira
    ]
};

async function setup() {
    console.log('🛠️  Configurando datos de prueba...');
    // Cliente
    await query('INSERT INTO servicios.clientes (id, nombre) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING;', [testData.cliente.id, testData.cliente.nombre]);
    // Personal
    for (const p of testData.personal) {
        await query('INSERT INTO mantenimiento.personal_disponible (rut, nombres, estado_id, cargo) VALUES ($1, $2, $3, $4) ON CONFLICT (rut) DO NOTHING;', [p.rut, p.nombres, p.estado_id, p.cargo]);
    }
    // Prerrequisitos
    for (const pr of testData.prerrequisitos) {
        await query('INSERT INTO mantenimiento.cliente_prerrequisitos (tipo_documento, dias_duracion, cliente_id) VALUES ($1, $2, $3);', [pr.tipo_documento, pr.dias_duracion, pr.cliente_id]);
    }
    // Documentos
    for (const d of testData.documentos) {
        await query('INSERT INTO mantenimiento.documentos (rut_persona, tipo_documento, fecha_emision) VALUES ($1, $2, $3);', [d.rut_persona, d.tipo_documento, d.fecha_emision]);
    }
    console.log('✅ Datos de prueba configurados.');
}

async function cleanup() {
    console.log('🧹 Limpiando datos de prueba...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM mantenimiento.documentos WHERE tipo_documento LIKE \'CERT-%-TEST\';');
        await client.query('DELETE FROM mantenimiento.cliente_prerrequisitos WHERE tipo_documento LIKE \'CERT-%-TEST\';');
        await client.query('DELETE FROM mantenimiento.personal_disponible WHERE rut IN ($1, $2, $3, $4, $5, $6);', testData.personal.map(p => p.rut));
        await client.query('DELETE FROM servicios.clientes WHERE id = $1;', [testData.cliente.id]);
        await client.query('COMMIT');
        console.log('✅ Limpieza completada.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error durante la limpieza, se revirtieron los cambios', e);
        throw e;
    } finally {
        client.release();
    }
}

async function runTest() {
    console.log(`🚀 Ejecutando prueba: GET /personal-disponible/por-cliente/${testData.cliente.id}`);
    
    try {
        const response = await axios.get(`${API_URL}/personal-disponible/por-cliente/${testData.cliente.id}`);
        const { data, count, success } = response.data;

        console.log('📝 Respuesta recibida:', { count, data: data.map(p => p.rut) });

        // --- Aserciones ---
        if (!success) {
            throw new Error('La solicitud a la API no fue exitosa.');
        }

        if (count !== 2) {
            throw new Error(`Error de aserción: Se esperaban 2 personas, pero se recibieron ${count}.`);
        }

        const ruts = data.map(p => p.rut);
        if (!ruts.includes('1-1') || !ruts.includes('6-6')) {
            throw new Error(`Error de aserción: Los RUTs esperados (1-1, 6-6) no coinciden con los recibidos (${ruts.join(', ')}).`);
        }

        console.log('✔️  Aserciones correctas: Se devolvieron las 2 personas que cumplen todos los requisitos.');
        console.log('🎉 ¡Prueba exitosa!');

    } catch (error) {
        console.error('🔥 Error durante la prueba:', error.response ? error.response.data : error.message);
        throw new Error('La prueba falló.');
    }
}


async function main() {
    let serverInstance;
    try {
        serverInstance = await server; // Ensure server is started
        await cleanup(); // Clean up any previous failed runs
        await setup();
        await runTest();
    } catch (error) {
        console.error('Ha ocurrido un error en la ejecución principal:', error.message);
        process.exit(1); // Salir con código de error
    } finally {
        await cleanup();
        if (serverInstance) {
            await shutdown(); // Close server connection
        }
    }
}

main();
