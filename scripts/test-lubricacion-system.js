const http = require('http');
const fs = require('fs');
const path = require('path');

class LubricacionSystemTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  // Función para hacer peticiones HTTP
  async makeRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsedData
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  // Función para registrar resultados de pruebas
  logTest(testName, passed, details = '') {
    this.results.tests.push({
      name: testName,
      passed,
      details
    });
    
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${testName} - ${details}`);
    }
  }

  // Función para esperar
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Pruebas de endpoints básicos
  async testBasicEndpoints() {
    console.log('\n🔍 1. PROBANDO ENDPOINTS BÁSICOS');
    console.log('=================================');

    try {
      // Health check
      const health = await this.makeRequest('GET', '/api/health');
      this.logTest('Health Check', health.statusCode === 200, `Status: ${health.statusCode}`);

      // Estados
      const estados = await this.makeRequest('GET', '/api/estados');
      this.logTest('Estados', estados.statusCode === 200, `Status: ${estados.statusCode}`);

    } catch (error) {
      this.logTest('Endpoints Básicos', false, error.message);
    }
  }

  // Pruebas de lubricantes
  async testLubricantes() {
    console.log('\n🛢️ 2. PROBANDO ENDPOINTS DE LUBRICANTES');
    console.log('========================================');

    try {
      // GET lubricantes
      const getLubricantes = await this.makeRequest('GET', '/api/lubricantes');
      this.logTest('GET /api/lubricantes', getLubricantes.statusCode === 200, `Status: ${getLubricantes.statusCode}`);

      // GET tipos disponibles
      const tipos = await this.makeRequest('GET', '/api/lubricantes/tipos/disponibles');
      this.logTest('GET /api/lubricantes/tipos/disponibles', tipos.statusCode === 200, `Status: ${tipos.statusCode}`);

      // GET marcas disponibles
      const marcas = await this.makeRequest('GET', '/api/lubricantes/marcas/disponibles');
      this.logTest('GET /api/lubricantes/marcas/disponibles', marcas.statusCode === 200, `Status: ${marcas.statusCode}`);

      // POST nuevo lubricante
      const newLubricante = {
        marca: 'Test Lubricante',
        tipo: 'Aceite',
        especificaciones: 'Aceite de prueba para testing'
      };

      const postLubricante = await this.makeRequest('POST', '/api/lubricantes', newLubricante);
      this.logTest('POST /api/lubricantes', postLubricante.statusCode === 200 || postLubricante.statusCode === 201, `Status: ${postLubricante.statusCode}`);

      // Si se creó exitosamente, probar GET por ID
      if (postLubricante.statusCode === 200 || postLubricante.statusCode === 201) {
        const lubricanteId = postLubricante.data[0]?.id;
        if (lubricanteId) {
          const getById = await this.makeRequest('GET', `/api/lubricantes/${lubricanteId}`);
          this.logTest('GET /api/lubricantes/:id', getById.statusCode === 200, `Status: ${getById.statusCode}`);

          // PUT actualizar lubricante
          const updateData = { marca: 'Test Lubricante Actualizado' };
          const putLubricante = await this.makeRequest('PUT', `/api/lubricantes/${lubricanteId}`, updateData);
          this.logTest('PUT /api/lubricantes/:id', putLubricante.statusCode === 200, `Status: ${putLubricante.statusCode}`);

          // DELETE lubricante
          const deleteLubricante = await this.makeRequest('DELETE', `/api/lubricantes/${lubricanteId}`);
          this.logTest('DELETE /api/lubricantes/:id', deleteLubricante.statusCode === 200, `Status: ${deleteLubricante.statusCode}`);
        }
      }

    } catch (error) {
      this.logTest('Lubricantes', false, error.message);
    }
  }

  // Pruebas de punto de lubricación
  async testPuntoLubricacion() {
    console.log('\n🔧 3. PROBANDO ENDPOINTS DE PUNTO DE LUBRICACIÓN');
    console.log('===============================================');

    try {
      // GET punto lubricacion
      const getPuntos = await this.makeRequest('GET', '/api/punto-lubricacion');
      this.logTest('GET /api/punto-lubricacion', getPuntos.statusCode === 200, `Status: ${getPuntos.statusCode}`);

      // Si hay puntos, probar GET por ID
      if (getPuntos.statusCode === 200 && getPuntos.data.length > 0) {
        const puntoId = getPuntos.data[0].id;
        const getById = await this.makeRequest('GET', `/api/punto-lubricacion/${puntoId}`);
        this.logTest('GET /api/punto-lubricacion/:id', getById.statusCode === 200, `Status: ${getById.statusCode}`);
      }

    } catch (error) {
      this.logTest('Punto de Lubricación', false, error.message);
    }
  }

  // Pruebas de estructura jerárquica
  async testEstructuraJerarquica() {
    console.log('\n🌳 4. PROBANDO ESTRUCTURA JERÁRQUICA');
    console.log('===================================');

    try {
      // Probar endpoints de faenas
      const faenas = await this.makeRequest('GET', '/api/faenas');
      this.logTest('GET /api/faenas', faenas.statusCode === 200, `Status: ${faenas.statusCode}`);

      // Probar endpoints de plantas
      const plantas = await this.makeRequest('GET', '/api/plantas');
      this.logTest('GET /api/plantas', plantas.statusCode === 200, `Status: ${plantas.statusCode}`);

      // Probar endpoints de líneas
      const lineas = await this.makeRequest('GET', '/api/lineas');
      this.logTest('GET /api/lineas', lineas.statusCode === 200, `Status: ${lineas.statusCode}`);

      // Probar endpoints de equipos
      const equipos = await this.makeRequest('GET', '/api/equipos');
      this.logTest('GET /api/equipos', equipos.statusCode === 200, `Status: ${equipos.statusCode}`);

      // Probar endpoints de componentes
      const componentes = await this.makeRequest('GET', '/api/componentes');
      this.logTest('GET /api/componentes', componentes.statusCode === 200, `Status: ${componentes.statusCode}`);

    } catch (error) {
      this.logTest('Estructura Jerárquica', false, error.message);
    }
  }

  // Pruebas de tareas
  async testTareas() {
    console.log('\n📋 5. PROBANDO ENDPOINTS DE TAREAS');
    console.log('==================================');

    try {
      // Probar endpoints de tareas proyectadas
      const tareasProyectadas = await this.makeRequest('GET', '/api/tareas-proyectadas');
      this.logTest('GET /api/tareas-proyectadas', tareasProyectadas.statusCode === 200, `Status: ${tareasProyectadas.statusCode}`);

      // Probar endpoints de tareas programadas
      const tareasProgramadas = await this.makeRequest('GET', '/api/tareas-programadas');
      this.logTest('GET /api/tareas-programadas', tareasProgramadas.statusCode === 200, `Status: ${tareasProgramadas.statusCode}`);

      // Probar endpoints de tareas ejecutadas
      const tareasEjecutadas = await this.makeRequest('GET', '/api/tareas-ejecutadas');
      this.logTest('GET /api/tareas-ejecutadas', tareasEjecutadas.statusCode === 200, `Status: ${tareasEjecutadas.statusCode}`);

    } catch (error) {
      this.logTest('Tareas', false, error.message);
    }
  }

  // Pruebas de personal
  async testPersonal() {
    console.log('\n👥 6. PROBANDO ENDPOINTS DE PERSONAL');
    console.log('===================================');

    try {
      // GET personal disponible
      const personal = await this.makeRequest('GET', '/api/personal-disponible');
      this.logTest('GET /api/personal-disponible', personal.statusCode === 200, `Status: ${personal.statusCode}`);

      // Si hay personal, probar GET por RUT
      if (personal.statusCode === 200 && personal.data.length > 0) {
        const rut = personal.data[0].rut;
        const getByRut = await this.makeRequest('GET', `/api/personal-disponible/${rut}`);
        this.logTest('GET /api/personal-disponible/:rut', getByRut.statusCode === 200, `Status: ${getByRut.statusCode}`);
      }

    } catch (error) {
      this.logTest('Personal', false, error.message);
    }
  }

  // Pruebas de cursos
  async testCursos() {
    console.log('\n🎓 7. PROBANDO ENDPOINTS DE CURSOS');
    console.log('==================================');

    try {
      // GET cursos
      const cursos = await this.makeRequest('GET', '/api/cursos');
      this.logTest('GET /api/cursos', cursos.statusCode === 200, `Status: ${cursos.statusCode}`);

      // GET stats de cursos
      const stats = await this.makeRequest('GET', '/api/cursos/stats');
      this.logTest('GET /api/cursos/stats', stats.statusCode === 200, `Status: ${stats.statusCode}`);

    } catch (error) {
      this.logTest('Cursos', false, error.message);
    }
  }

  // Pruebas de documentos
  async testDocumentos() {
    console.log('\n📄 8. PROBANDO ENDPOINTS DE DOCUMENTOS');
    console.log('=====================================');

    try {
      // GET documentos
      const documentos = await this.makeRequest('GET', '/api/documentos');
      this.logTest('GET /api/documentos', documentos.statusCode === 200, `Status: ${documentos.statusCode}`);

    } catch (error) {
      this.logTest('Documentos', false, error.message);
    }
  }

  // Pruebas de rendimiento
  async testPerformance() {
    console.log('\n⚡ 9. PROBANDO RENDIMIENTO');
    console.log('=========================');

    try {
      const startTime = Date.now();
      
      // Hacer múltiples peticiones en paralelo
      const promises = [
        this.makeRequest('GET', '/api/lubricantes'),
        this.makeRequest('GET', '/api/punto-lubricacion'),
        this.makeRequest('GET', '/api/faenas'),
        this.makeRequest('GET', '/api/plantas'),
        this.makeRequest('GET', '/api/lineas')
      ];

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.logTest('Rendimiento (5 peticiones paralelas)', duration < 5000, `Tiempo: ${duration}ms`);

    } catch (error) {
      this.logTest('Rendimiento', false, error.message);
    }
  }

  // Generar reporte
  generateReport() {
    console.log('\n📊 REPORTE FINAL');
    console.log('================');
    console.log(`✅ Pruebas exitosas: ${this.results.passed}`);
    console.log(`❌ Pruebas fallidas: ${this.results.failed}`);
    console.log(`📈 Tasa de éxito: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ PRUEBAS FALLIDAS:');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.details}`);
        });
    }

    // Guardar reporte en archivo
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)
      },
      tests: this.results.tests
    };

    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
  }

  // Ejecutar todas las pruebas
  async runAllTests() {
    console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA DE LUBRICACIÓN');
    console.log('===============================================');
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    console.log(`⏰ Inicio: ${new Date().toLocaleString()}`);

    try {
      await this.testBasicEndpoints();
      await this.sleep(500);

      await this.testLubricantes();
      await this.sleep(500);

      await this.testPuntoLubricacion();
      await this.sleep(500);

      await this.testEstructuraJerarquica();
      await this.sleep(500);

      await this.testTareas();
      await this.sleep(500);

      await this.testPersonal();
      await this.sleep(500);

      await this.testCursos();
      await this.sleep(500);

      await this.testDocumentos();
      await this.sleep(500);

      await this.testPerformance();

    } catch (error) {
      console.error('❌ Error durante las pruebas:', error.message);
    }

    this.generateReport();
  }
}

// Ejecutar las pruebas
async function runTests() {
  const tester = new LubricacionSystemTester();
  await tester.runAllTests();
}

runTests().catch(console.error);

