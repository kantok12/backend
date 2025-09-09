const XLSX = require('xlsx');
const { query } = require('../config/postgresql');
const path = require('path');

/**
 * Script para extraer nombres del archivo Excel y preparar para inserción en tabla nombre
 */

class NombresExtractor {
  constructor() {
    this.workbook = null;
    this.data = {};
  }

  /**
   * Lee el archivo Excel y extrae los nombres
   */
  async readExcelFile(filePath) {
    try {
      console.log('📖 Leyendo archivo Excel:', filePath);
      this.workbook = XLSX.readFile(filePath);
      
      const sheetNames = this.workbook.SheetNames;
      console.log('📄 Hojas encontradas:', sheetNames);

      // Cargar datos de la primera hoja
      const sheetName = sheetNames[0];
      const worksheet = this.workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
      });
      
      this.data[sheetName] = jsonData;
      
      console.log(`📊 Hoja: ${sheetName} - Filas: ${jsonData.length}`);
      if (jsonData.length > 0) {
        console.log(`📋 Headers:`, jsonData[0]);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error al leer Excel:', error.message);
      return false;
    }
  }

  /**
   * Extrae y procesa los nombres del Excel
   */
  extractNombres() {
    console.log('\n⚙️  EXTRAYENDO NOMBRES DEL EXCEL');
    console.log('=' .repeat(50));
    
    const sheetName = Object.keys(this.data)[0];
    const data = this.data[sheetName];
    
    if (!data || data.length <= 1) {
      console.log('❌ No hay datos suficientes para procesar');
      return [];
    }

    const headers = data[0];
    const nombresData = [];
    
    // Buscar la columna de nombres
    const nombreColumnIndex = headers.findIndex(header => 
      header && header.toLowerCase().includes('nombre')
    );
    
    const rutColumnIndex = headers.findIndex(header => 
      header && header.toLowerCase().includes('rut')
    );
    
    if (nombreColumnIndex === -1) {
      console.log('❌ No se encontró la columna de nombres');
      console.log('📋 Columnas disponibles:', headers);
      return [];
    }
    
    console.log(`✅ Columna de nombres encontrada: "${headers[nombreColumnIndex]}" (índice ${nombreColumnIndex})`);
    if (rutColumnIndex !== -1) {
      console.log(`✅ Columna de RUT encontrada: "${headers[rutColumnIndex]}" (índice ${rutColumnIndex})`);
    }
    
    console.log(`\n📊 Procesando ${data.length - 1} filas de datos...`);
    
    // Procesar cada fila (saltando header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const nombreCompleto = row[nombreColumnIndex];
      const rut = rutColumnIndex !== -1 ? row[rutColumnIndex] : null;
      
      if (nombreCompleto && nombreCompleto.trim().length > 0) {
        // Separar nombre y apellidos
        const nombrePartes = nombreCompleto.trim().split(' ');
        const primerNombre = nombrePartes[0] || '';
        const apellidos = nombrePartes.slice(1).join(' ') || '';
        
        const nombreData = {
          nombre_completo: nombreCompleto.trim(),
          primer_nombre: primerNombre,
          apellidos: apellidos,
          rut: rut ? rut.toString() : null
        };
        
        nombresData.push(nombreData);
      }
    }
    
    console.log(`✅ Procesados ${nombresData.length} nombres válidos`);
    return nombresData;
  }

  /**
   * Muestra ejemplos de los nombres extraídos
   */
  showNombresExamples(nombresData, count = 5) {
    console.log('\n📋 EJEMPLOS DE NOMBRES EXTRAÍDOS:');
    console.log('=' .repeat(50));
    
    const examples = nombresData.slice(0, count);
    
    examples.forEach((item, index) => {
      console.log(`\n📝 Ejemplo ${index + 1}:`);
      console.log(`   Nombre completo: ${item.nombre_completo}`);
      console.log(`   Primer nombre: ${item.primer_nombre}`);
      console.log(`   Apellidos: ${item.apellidos}`);
      if (item.rut) {
        console.log(`   RUT: ${item.rut}`);
      }
    });
  }

  /**
   * Genera diferentes formatos de datos según la estructura de la tabla
   */
  generateInsertOptions(nombresData) {
    console.log('\n🗂️  OPCIONES DE INSERCIÓN SEGÚN ESTRUCTURA DE TABLA:');
    console.log('=' .repeat(60));
    
    // Opción 1: Solo nombres completos
    console.log('\n📋 OPCIÓN 1: Tabla con solo nombres completos');
    console.log('CREATE TABLE nombre (id SERIAL PRIMARY KEY, nombre_completo VARCHAR(255));');
    console.log('\nDatos para insertar:');
    nombresData.slice(0, 3).forEach((item, index) => {
      console.log(`   INSERT INTO nombre (nombre_completo) VALUES ('${item.nombre_completo}');`);
    });
    
    // Opción 2: Nombres separados
    console.log('\n📋 OPCIÓN 2: Tabla con nombres separados');
    console.log('CREATE TABLE nombre (id SERIAL PRIMARY KEY, primer_nombre VARCHAR(100), apellidos VARCHAR(155));');
    console.log('\nDatos para insertar:');
    nombresData.slice(0, 3).forEach((item, index) => {
      console.log(`   INSERT INTO nombre (primer_nombre, apellidos) VALUES ('${item.primer_nombre}', '${item.apellidos}');`);
    });
    
    // Opción 3: Con RUT de referencia
    console.log('\n📋 OPCIÓN 3: Tabla con RUT de referencia');
    console.log('CREATE TABLE nombre (id SERIAL PRIMARY KEY, rut VARCHAR(20), nombre_completo VARCHAR(255));');
    console.log('\nDatos para insertar:');
    nombresData.slice(0, 3).forEach((item, index) => {
      console.log(`   INSERT INTO nombre (rut, nombre_completo) VALUES ('${item.rut}', '${item.nombre_completo}');`);
    });
    
    // Opción 4: Completa
    console.log('\n📋 OPCIÓN 4: Tabla completa');
    console.log('CREATE TABLE nombre (id SERIAL PRIMARY KEY, rut VARCHAR(20), nombre_completo VARCHAR(255), primer_nombre VARCHAR(100), apellidos VARCHAR(155));');
    console.log('\nDatos para insertar:');
    nombresData.slice(0, 3).forEach((item, index) => {
      console.log(`   INSERT INTO nombre (rut, nombre_completo, primer_nombre, apellidos) VALUES ('${item.rut}', '${item.nombre_completo}', '${item.primer_nombre}', '${item.apellidos}');`);
    });
  }

  /**
   * Genera archivos JSON y CSV con los nombres
   */
  generateOutputFiles(nombresData) {
    console.log('\n📄 GENERANDO ARCHIVOS DE SALIDA');
    console.log('=' .repeat(40));
    
    try {
      const fs = require('fs');
      
      // Generar JSON
      const jsonPath = path.join(__dirname, '..', 'nombres_data.json');
      const jsonOutput = {
        metadata: {
          total_records: nombresData.length,
          generated_at: new Date().toISOString(),
          source_file: 'Personal Servicios.xlsx',
          target_table: 'nombre'
        },
        data: nombresData
      };
      
      fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf8');
      console.log(`✅ JSON generado: ${jsonPath}`);
      
      // Generar CSV
      const csvPath = path.join(__dirname, '..', 'nombres_data.csv');
      let csvContent = 'rut,nombre_completo,primer_nombre,apellidos\n';
      
      nombresData.forEach(item => {
        const rut = item.rut || '';
        const nombreCompleto = item.nombre_completo.replace(/"/g, '""');
        const primerNombre = item.primer_nombre.replace(/"/g, '""');
        const apellidos = item.apellidos.replace(/"/g, '""');
        
        csvContent += `"${rut}","${nombreCompleto}","${primerNombre}","${apellidos}"\n`;
      });
      
      fs.writeFileSync(csvPath, csvContent, 'utf8');
      console.log(`✅ CSV generado: ${csvPath}`);
      
    } catch (error) {
      console.error('❌ Error al generar archivos:', error.message);
    }
  }

  /**
   * Ejecuta el proceso completo de extracción
   */
  async extract(filePath) {
    console.log('🚀 INICIANDO EXTRACCIÓN DE NOMBRES');
    console.log('=' .repeat(50));
    
    try {
      // 1. Leer archivo Excel
      const readSuccess = await this.readExcelFile(filePath);
      if (!readSuccess) {
        throw new Error('No se pudo leer el archivo Excel');
      }
      
      // 2. Extraer nombres
      const nombresData = this.extractNombres();
      
      if (nombresData.length === 0) {
        throw new Error('No se encontraron nombres válidos');
      }
      
      // 3. Mostrar ejemplos
      this.showNombresExamples(nombresData);
      
      // 4. Generar opciones de inserción
      this.generateInsertOptions(nombresData);
      
      // 5. Generar archivos de salida
      this.generateOutputFiles(nombresData);
      
      console.log('\n🎉 EXTRACCIÓN COMPLETADA');
      console.log(`📊 Total de nombres extraídos: ${nombresData.length}`);
      
    } catch (error) {
      console.error('💥 Error durante la extracción:', error.message);
      throw error;
    }
  }
}

// Función principal
async function main() {
  const filePath = path.join(__dirname, '..', 'Personal Servicios.xlsx');
  const extractor = new NombresExtractor();
  
  try {
    await extractor.extract(filePath);
  } catch (error) {
    console.error('Error en la extracción:', error.message);
    process.exit(1);
  }
}

// Ejecutar si este archivo se llama directamente
if (require.main === module) {
  main();
}

module.exports = NombresExtractor;












