const http = require('http');
const fs = require('fs');
const path = require('path');

class FileOperationsTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  // Función para hacer peticiones HTTP
  async makeRequest(method, endpoint, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Accept': 'application/json',
          ...headers
        }
      };

      if (data && typeof data === 'string') {
        options.headers['Content-Length'] = Buffer.byteLength(data);
      } else if (data) {
        options.headers['Content-Type'] = 'application/json';
        data = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(data);
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
              data: parsedData,
              rawData: responseData
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData,
              rawData: responseData
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      if (data) {
        req.write(data);
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

  // Crear archivo de prueba
  createTestFile() {
    const testContent = `Este es un archivo de prueba para el sistema de lubricación.
Fecha de creación: ${new Date().toISOString()}
Contenido: Documento de prueba para verificar la funcionalidad de subida y descarga de archivos.
Sistema: Backend de Gestión de Personal - Módulo de Lubricación`;

    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, testContent);
    return testFilePath;
  }

  // Probar subida de archivos
  async testFileUpload() {
    console.log('\n📤 1. PROBANDO SUBIDA DE ARCHIVOS');
    console.log('==================================');

    try {
      // Crear archivo de prueba
      const testFilePath = this.createTestFile();
      const testContent = fs.readFileSync(testFilePath, 'utf8');

      // Probar subida a cursos
      const cursoId = 1; // Usar ID existente
      const uploadData = `------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="archivo"; filename="test-file.txt"\r\nContent-Type: text/plain\r\n\r\n${testContent}\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--`;

      const uploadResponse = await this.makeRequest(
        'POST', 
        `/api/cursos/${cursoId}/documentos`, 
        uploadData,
        {
          'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
        }
      );

      this.logTest('Subida de archivo a curso', uploadResponse.statusCode === 200 || uploadResponse.statusCode === 201, `Status: ${uploadResponse.statusCode}`);

      // Limpiar archivo de prueba
      fs.unlinkSync(testFilePath);

    } catch (error) {
      this.logTest('Subida de archivos', false, error.message);
    }
  }

  // Probar descarga de archivos
  async testFileDownload() {
    console.log('\n📥 2. PROBANDO DESCARGA DE ARCHIVOS');
    console.log('===================================');

    try {
      // Probar descarga de documentos de cursos
      const cursoId = 1;
      const downloadResponse = await this.makeRequest('GET', `/api/cursos/${cursoId}/documentos`);
      
      this.logTest('GET documentos de curso', downloadResponse.statusCode === 200, `Status: ${downloadResponse.statusCode}`);

      // Si hay documentos, probar descarga individual
      if (downloadResponse.statusCode === 200 && downloadResponse.data.length > 0) {
        const documentoId = downloadResponse.data[0].id;
        const individualDownload = await this.makeRequest('GET', `/api/cursos/${cursoId}/documentos/${documentoId}`);
        
        this.logTest('Descarga individual de documento', individualDownload.statusCode === 200, `Status: ${individualDownload.statusCode}`);
      }

    } catch (error) {
      this.logTest('Descarga de archivos', false, error.message);
    }
  }

  // Probar endpoints de documentos generales
  async testDocumentosGenerales() {
    console.log('\n📄 3. PROBANDO DOCUMENTOS GENERALES');
    console.log('===================================');

    try {
      // GET documentos generales
      const documentos = await this.makeRequest('GET', '/api/documentos');
      this.logTest('GET /api/documentos', documentos.statusCode === 200, `Status: ${documentos.statusCode}`);

      // Si hay documentos, probar GET por ID
      if (documentos.statusCode === 200 && documentos.data.length > 0) {
        const documentoId = documentos.data[0].id;
        const getById = await this.makeRequest('GET', `/api/documentos/${documentoId}`);
        this.logTest('GET /api/documentos/:id', getById.statusCode === 200, `Status: ${getById.statusCode}`);
      }

    } catch (error) {
      this.logTest('Documentos generales', false, error.message);
    }
  }

  // Probar endpoints de cursos con documentos
  async testCursosConDocumentos() {
    console.log('\n🎓 4. PROBANDO CURSOS CON DOCUMENTOS');
    console.log('====================================');

    try {
      // GET cursos
      const cursos = await this.makeRequest('GET', '/api/cursos');
      this.logTest('GET /api/cursos', cursos.statusCode === 200, `Status: ${cursos.statusCode}`);

      // Si hay cursos, probar GET por ID
      if (cursos.statusCode === 200 && cursos.data.length > 0) {
        const cursoId = cursos.data[0].id;
        const getById = await this.makeRequest('GET', `/api/cursos/${cursoId}`);
        this.logTest('GET /api/cursos/:id', getById.statusCode === 200, `Status: ${getById.statusCode}`);

        // Probar GET documentos del curso
        const documentos = await this.makeRequest('GET', `/api/cursos/${cursoId}/documentos`);
        this.logTest('GET /api/cursos/:id/documentos', documentos.statusCode === 200, `Status: ${documentos.statusCode}`);
      }

    } catch (error) {
      this.logTest('Cursos con documentos', false, error.message);
    }
  }

  // Probar endpoints de personal con documentos
  async testPersonalConDocumentos() {
    console.log('\n👥 5. PROBANDO PERSONAL CON DOCUMENTOS');
    console.log('=====================================');

    try {
      // GET personal disponible
      const personal = await this.makeRequest('GET', '/api/personal-disponible');
      this.logTest('GET /api/personal-disponible', personal.statusCode === 200, `Status: ${personal.statusCode}`);

      // Si hay personal, probar GET por RUT
      if (personal.statusCode === 200 && personal.data.length > 0) {
        const rut = personal.data[0].rut;
        const getByRut = await this.makeRequest('GET', `/api/personal-disponible/${rut}`);
        this.logTest('GET /api/personal-disponible/:rut', getByRut.statusCode === 200, `Status: ${getByRut.statusCode}`);

        // Probar GET cursos del personal
        const cursos = await this.makeRequest('GET', `/api/cursos/persona/${rut}`);
        this.logTest('GET /api/cursos/persona/:rut', cursos.statusCode === 200, `Status: ${cursos.statusCode}`);
      }

    } catch (error) {
      this.logTest('Personal con documentos', false, error.message);
    }
  }

  // Probar endpoints de lubricación con archivos
  async testLubricacionConArchivos() {
    console.log('\n🛢️ 6. PROBANDO LUBRICACIÓN CON ARCHIVOS');
    console.log('======================================');

    try {
      // GET lubricantes
      const lubricantes = await this.makeRequest('GET', '/api/lubricantes');
      this.logTest('GET /api/lubricantes', lubricantes.statusCode === 200, `Status: ${lubricantes.statusCode}`);

      // GET punto lubricacion
      const puntos = await this.makeRequest('GET', '/api/punto-lubricacion');
      this.logTest('GET /api/punto-lubricacion', puntos.statusCode === 200, `Status: ${puntos.statusCode}`);

      // Si hay lubricantes, probar GET por ID con puntos
      if (lubricantes.statusCode === 200 && lubricantes.data.length > 0) {
        const lubricanteId = lubricantes.data[0].id;
        const puntosLubricante = await this.makeRequest('GET', `/api/lubricantes/${lubricanteId}/puntos`);
        this.logTest('GET /api/lubricantes/:id/puntos', puntosLubricante.statusCode === 200, `Status: ${puntosLubricante.statusCode}`);
      }

    } catch (error) {
      this.logTest('Lubricación con archivos', false, error.message);
    }
  }

  // Probar endpoints de tareas con archivos
  async testTareasConArchivos() {
    console.log('\n📋 7. PROBANDO TAREAS CON ARCHIVOS');
    console.log('==================================');

    try {
      // GET tareas proyectadas
      const tareasProyectadas = await this.makeRequest('GET', '/api/tareas-proyectadas');
      this.logTest('GET /api/tareas-proyectadas', tareasProyectadas.statusCode === 200, `Status: ${tareasProyectadas.statusCode}`);

      // GET tareas programadas
      const tareasProgramadas = await this.makeRequest('GET', '/api/tareas-programadas');
      this.logTest('GET /api/tareas-programadas', tareasProgramadas.statusCode === 200, `Status: ${tareasProgramadas.statusCode}`);

      // GET tareas ejecutadas
      const tareasEjecutadas = await this.makeRequest('GET', '/api/tareas-ejecutadas');
      this.logTest('GET /api/tareas-ejecutadas', tareasEjecutadas.statusCode === 200, `Status: ${tareasEjecutadas.statusCode}`);

    } catch (error) {
      this.logTest('Tareas con archivos', false, error.message);
    }
  }

  // Probar endpoints de estructura jerárquica
  async testEstructuraJerarquica() {
    console.log('\n🌳 8. PROBANDO ESTRUCTURA JERÁRQUICA');
    console.log('===================================');

    try {
      // GET faenas
      const faenas = await this.makeRequest('GET', '/api/faenas');
      this.logTest('GET /api/faenas', faenas.statusCode === 200, `Status: ${faenas.statusCode}`);

      // GET plantas
      const plantas = await this.makeRequest('GET', '/api/plantas');
      this.logTest('GET /api/plantas', plantas.statusCode === 200, `Status: ${plantas.statusCode}`);

      // GET lineas
      const lineas = await this.makeRequest('GET', '/api/lineas');
      this.logTest('GET /api/lineas', lineas.statusCode === 200, `Status: ${lineas.statusCode}`);

      // GET equipos
      const equipos = await this.makeRequest('GET', '/api/equipos');
      this.logTest('GET /api/equipos', equipos.statusCode === 200, `Status: ${equipos.statusCode}`);

      // GET componentes
      const componentes = await this.makeRequest('GET', '/api/componentes');
      this.logTest('GET /api/componentes', componentes.statusCode === 200, `Status: ${componentes.statusCode}`);

    } catch (error) {
      this.logTest('Estructura jerárquica', false, error.message);
    }
  }

  // Generar reporte
  generateReport() {
    console.log('\n📊 REPORTE FINAL DE OPERACIONES DE ARCHIVOS');
    console.log('==========================================');
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

    const reportPath = path.join(__dirname, 'file-operations-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
  }

  // Ejecutar todas las pruebas
  async runAllTests() {
    console.log('🧪 INICIANDO PRUEBAS DE OPERACIONES DE ARCHIVOS');
    console.log('==============================================');
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    console.log(`⏰ Inicio: ${new Date().toLocaleString()}`);

    try {
      await this.testFileUpload();
      await this.testFileDownload();
      await this.testDocumentosGenerales();
      await this.testCursosConDocumentos();
      await this.testPersonalConDocumentos();
      await this.testLubricacionConArchivos();
      await this.testTareasConArchivos();
      await this.testEstructuraJerarquica();

    } catch (error) {
      console.error('❌ Error durante las pruebas:', error.message);
    }

    this.generateReport();
  }
}

// Ejecutar las pruebas
async function runFileTests() {
  const tester = new FileOperationsTester();
  await tester.runAllTests();
}

runFileTests().catch(console.error);
