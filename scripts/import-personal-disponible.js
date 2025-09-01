const XLSX = require('xlsx');
const { query } = require('../config/postgresql');
const path = require('path');

/**
 * Script para importar datos del Excel a la tabla mantenimiento.personal_disponible
 * 
 * Estructura objetivo:
 * - rut: text (NOT NULL)
 * - sexo: character varying (NOT NULL)  
 * - fecha_nacimiento: date (NOT NULL)
 * - licencia_conducir: character varying (NOT NULL)
 * - talla_zapatos: character varying (NOT NULL)
 * - talla_pantalones: character varying (NOT NULL)  
 * - talla_poleras: character varying (NOT NULL)
 * - cargo: character varying (NOT NULL)
 * - estado_id: integer (NOT NULL)
 * - comentario_estado: text (NULLABLE)
 * - zona_geografica: text (NULLABLE)
 */

class PersonalDisponibleImporter {
  constructor() {
    this.workbook = null;
    this.data = {};
  }

  /**
   * Lee el archivo Excel
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
   * Convierte fecha de Excel a formato YYYY-MM-DD
   */
  excelDateToJSDate(excelDate) {
    if (!excelDate) return null;
    
    if (typeof excelDate === 'string') {
      const parsed = new Date(excelDate);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      return null;
    }
    
    if (typeof excelDate === 'number' && !isNaN(excelDate)) {
      const excelEpoch = new Date(1900, 0, 1);
      const jsDate = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
      return jsDate.toISOString().split('T')[0];
    }
    
    return null;
  }

  /**
   * Mapea una fila del Excel al formato de personal_disponible
   */
  mapExcelRowToPersonalDisponible(row, headers) {
    // Crear objeto con índices de columnas
    const getColumnValue = (columnName) => {
      const index = headers.indexOf(columnName);
      return index >= 0 ? row[index] : null;
    };

    // Mapear datos según las columnas del Excel
    const rut = getColumnValue('Rut');
    const nombreCompleto = getColumnValue('Nombre');
    const sexo = getColumnValue('Sexo');
    const fechaNacimiento = getColumnValue('Fecha Nacimiento');
    const licenciaConducir = getColumnValue('Licencia de conducir');
    const tallaZapato = getColumnValue('Talla Zapato');
    const tallaPantalon = getColumnValue('Talla Pantalón');
    const tallaRopa = getColumnValue('Talla Ropa');
    const cargoInterno = getColumnValue('Cargo Interno');
    const region = getColumnValue('Región');
    const sede = getColumnValue('Sede');

    // Validar campos obligatorios
    if (!rut || !sexo || !fechaNacimiento || !cargoInterno) {
      return null;
    }

    // Crear objeto en formato de personal_disponible
    return {
      rut: rut.toString(),
      sexo: sexo.toString(),
      fecha_nacimiento: this.excelDateToJSDate(fechaNacimiento),
      licencia_conducir: licenciaConducir ? licenciaConducir.toString() : 'N',
      talla_zapatos: tallaZapato ? tallaZapato.toString() : 'S/I',
      talla_pantalones: tallaPantalon ? tallaPantalon.toString() : 'S/I',
      talla_poleras: tallaRopa ? tallaRopa.toString() : 'S/I',
      cargo: cargoInterno.toString(),
      estado_id: 1, // Estado activo por defecto
      comentario_estado: nombreCompleto ? `Importado: ${nombreCompleto}` : null,
      zona_geografica: region || sede || null
    };
  }

  /**
   * Procesa los datos del Excel
   */
  processExcelData() {
    console.log('\n⚙️  PROCESANDO DATOS DEL EXCEL');
    console.log('=' .repeat(50));
    
    const sheetName = Object.keys(this.data)[0];
    const data = this.data[sheetName];
    
    if (!data || data.length <= 1) {
      console.log('❌ No hay datos suficientes para procesar');
      return [];
    }

    const headers = data[0];
    const processedData = [];
    
    console.log('📋 Mapeo de columnas Excel → personal_disponible:');
    console.log('   Rut → rut');
    console.log('   Sexo → sexo');
    console.log('   Fecha Nacimiento → fecha_nacimiento');
    console.log('   Licencia de conducir → licencia_conducir');
    console.log('   Talla Zapato → talla_zapatos');
    console.log('   Talla Pantalón → talla_pantalones');
    console.log('   Talla Ropa → talla_poleras');
    console.log('   Cargo Interno → cargo');
    console.log('   [fijo] → estado_id (1)');
    console.log('   Nombre → comentario_estado');
    console.log('   Región/Sede → zona_geografica');

    console.log(`\n📊 Procesando ${data.length - 1} filas de datos...`);
    
    // Procesar cada fila (saltando header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const mappedData = this.mapExcelRowToPersonalDisponible(row, headers);
      
      if (mappedData) {
        // Validar que los campos obligatorios no estén vacíos
        if (mappedData.rut && mappedData.sexo && mappedData.fecha_nacimiento && mappedData.cargo) {
          processedData.push(mappedData);
        }
      }
    }
    
    console.log(`✅ Procesadas ${processedData.length} filas válidas`);
    return processedData;
  }

  /**
   * Muestra ejemplos de los datos procesados
   */
  showDataExamples(processedData, count = 3) {
    console.log('\n📋 EJEMPLOS DE DATOS PROCESADOS:');
    console.log('=' .repeat(50));
    
    const examples = processedData.slice(0, count);
    
    examples.forEach((item, index) => {
      console.log(`\n📝 Ejemplo ${index + 1}:`);
      console.log(JSON.stringify(item, null, 2));
    });
  }

  /**
   * Inserta los datos en la base de datos
   */
  async insertDataToDatabase(processedData, dryRun = true) {
    console.log('\n💾 INSERTANDO DATOS EN LA BASE DE DATOS');
    console.log('=' .repeat(50));
    
    if (dryRun) {
      console.log('⚠️  MODO SIMULACIÓN - Los datos NO se insertarán realmente');
      console.log('Para insertar datos reales, ejecuta con dryRun: false\n');
    }
    
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const [index, record] of processedData.entries()) {
      try {
        console.log(`\n📝 Procesando registro ${index + 1}/${processedData.length}`);
        console.log(`   RUT: ${record.rut}`);
        console.log(`   Cargo: ${record.cargo}`);
        console.log(`   Fecha Nacimiento: ${record.fecha_nacimiento}`);
        
        if (!dryRun) {
          // Insertar en la base de datos usando conexión PostgreSQL directa
          const insertQuery = `
            INSERT INTO mantenimiento.personal_disponible 
            (rut, sexo, fecha_nacimiento, licencia_conducir, talla_zapatos, 
             talla_pantalones, talla_poleras, cargo, estado_id, comentario_estado, zona_geografica)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING rut
          `;
          
          const values = [
            record.rut,
            record.sexo,
            record.fecha_nacimiento,
            record.licencia_conducir,
            record.talla_zapatos,
            record.talla_pantalones,
            record.talla_poleras,
            record.cargo,
            record.estado_id,
            record.comentario_estado,
            record.zona_geografica
          ];
          
          const result = await query(insertQuery, values);
          console.log(`   ✅ Insertado con RUT: ${result.rows[0].rut}`);
        } else {
          console.log(`   🔍 Simulación - Datos válidos para inserción`);
        }
        
        insertedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error en registro ${index + 1}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 RESUMEN DE IMPORTACIÓN:`);
    console.log(`   ✅ Registros ${dryRun ? 'simulados' : 'insertados'}: ${insertedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📋 Total procesados: ${processedData.length}`);
    
    if (dryRun && errorCount === 0) {
      console.log('\n🎯 Todos los datos están listos para inserción real');
      console.log('💡 Ejecuta el script con dryRun: false para insertar los datos');
    }
  }

  /**
   * Ejecuta el proceso completo de importación
   */
  async import(filePath, options = {}) {
    console.log('🚀 INICIANDO IMPORTACIÓN A personal_disponible');
    console.log('=' .repeat(60));
    
    try {
      // 1. Leer archivo Excel
      const readSuccess = await this.readExcelFile(filePath);
      if (!readSuccess) {
        throw new Error('No se pudo leer el archivo Excel');
      }
      
      // 2. Procesar datos
      const processedData = this.processExcelData();
      
      if (processedData.length === 0) {
        throw new Error('No se encontraron datos válidos para procesar');
      }
      
      // 3. Mostrar ejemplos
      this.showDataExamples(processedData);
      
      // 4. Insertar datos
      const dryRun = options.dryRun !== false;
      await this.insertDataToDatabase(processedData, dryRun);
      
      console.log('\n🎉 IMPORTACIÓN COMPLETADA');
      
    } catch (error) {
      console.error('💥 Error durante la importación:', error.message);
      throw error;
    }
  }
}

// Función principal
async function main() {
  const filePath = path.join(__dirname, '..', 'Personal Servicios.xlsx');
  const importer = new PersonalDisponibleImporter();
  
  try {
    await importer.import(filePath, {
      dryRun: true // Cambiar a false para insertar datos reales
    });
  } catch (error) {
    console.error('Error en la importación:', error.message);
    process.exit(1);
  }
}

// Ejecutar si este archivo se llama directamente
if (require.main === module) {
  main();
}

module.exports = PersonalDisponibleImporter;



