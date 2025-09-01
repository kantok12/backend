const XLSX = require('xlsx');
const { supabase } = require('../config/database');
const path = require('path');

/**
 * Script para importar datos del archivo Excel 'Personal Servicios.xlsx' a la base de datos
 * 
 * Este script:
 * 1. Lee el archivo Excel
 * 2. Analiza la estructura de los datos
 * 3. Procesa y normaliza los datos
 * 4. Inserta los datos en las tablas correspondientes de Supabase
 */

class ExcelImporter {
  constructor() {
    this.workbook = null;
    this.worksheets = {};
    this.data = {};
  }

  /**
   * Lee el archivo Excel y carga las hojas de trabajo
   */
  async readExcelFile(filePath) {
    try {
      console.log('📖 Leyendo archivo Excel:', filePath);
      this.workbook = XLSX.readFile(filePath);
      
      // Obtener todas las hojas
      const sheetNames = this.workbook.SheetNames;
      console.log('📄 Hojas encontradas:', sheetNames);

      // Cargar datos de cada hoja
      for (const sheetName of sheetNames) {
        const worksheet = this.workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Usar índices numéricos como headers
          defval: '', // Valor por defecto para celdas vacías
        });
        
        this.worksheets[sheetName] = worksheet;
        this.data[sheetName] = jsonData;
        
        console.log(`\n📊 Hoja: ${sheetName}`);
        console.log(`   Filas: ${jsonData.length}`);
        
        if (jsonData.length > 0) {
          console.log(`   Columnas: ${jsonData[0].length}`);
          console.log(`   Headers (fila 1): `, jsonData[0]);
          
          // Mostrar las primeras 3 filas de datos
          if (jsonData.length > 1) {
            console.log(`   Ejemplo de datos:`);
            for (let i = 1; i <= Math.min(3, jsonData.length - 1); i++) {
              console.log(`     Fila ${i + 1}:`, jsonData[i]);
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error al leer el archivo Excel:', error.message);
      return false;
    }
  }

  /**
   * Analiza la estructura de los datos para identificar las columnas
   */
  analyzeDataStructure() {
    console.log('\n🔍 ANÁLISIS DE ESTRUCTURA DE DATOS');
    console.log('=' .repeat(50));
    
    for (const [sheetName, data] of Object.entries(this.data)) {
      if (data.length === 0) continue;
      
      console.log(`\n📋 Hoja: ${sheetName}`);
      console.log('-' .repeat(30));
      
      const headers = data[0];
      headers.forEach((header, index) => {
        console.log(`  ${index + 1}. ${header || '[Columna vacía]'}`);
      });
      
      // Analizar tipos de datos en las primeras filas
      if (data.length > 1) {
        console.log(`\n📋 Análisis de tipos de datos (primeras 5 filas):`);
        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
          const columnName = headers[colIndex] || `Columna_${colIndex + 1}`;
          const sampleValues = [];
          
          for (let rowIndex = 1; rowIndex <= Math.min(5, data.length - 1); rowIndex++) {
            const value = data[rowIndex][colIndex];
            if (value !== undefined && value !== '') {
              sampleValues.push(value);
            }
          }
          
          if (sampleValues.length > 0) {
            console.log(`    ${columnName}: [${sampleValues.join(', ')}]`);
          }
        }
      }
    }
  }

  /**
   * Mapea las columnas del Excel a los campos exactos de la base de datos
   */
  createColumnMapping() {
    // Mapeo exacto entre columnas del Excel y campos de la base de datos
    return {
      // Tabla: personal_servicio
      'personal_servicio': {
        'nombre': 'Nombre',        // Se extraerá el primer nombre del campo completo
        'apellido': 'Nombre',      // Se extraerán los apellidos del campo completo
        'rut': 'Rut',
        'fecha_nacimiento': 'Fecha Nacimiento',
        'cargo': 'Cargo Interno'
      },
      
      // Tabla: empresas
      'empresas': {
        'nombre': 'Centro Costo',
        'rut_empresa': null,       // Se generará automáticamente
        'direccion': 'Sede',
        'email': null,
        'telefono': null
      },
      
      // Tabla: servicios
      'servicios': {
        'nombre': 'Cargo Interno',
        'descripcion': null,       // Se generará automáticamente
        'precio': null,            // Se establecerá como 0
        'duracion_horas': null,
        'activo': null             // Se establecerá como true
      },
      
      // Tabla: ubicacion
      'ubicacion': {
        'region': 'Región',
        'comuna': 'Comuna',
        'direccion': 'Ciudad'
      },
      
      // Tabla: contacto
      'contacto': {
        'email': 'Correo personal',     // Prioridad al correo personal
        'telefono': 'Teléfono',
        'celular': null
      },
      
      // Tabla: contacto_emergencia
      'contacto_emergencia': {
        'nombre': 'Contacto Emergencia',
        'relacion': null,
        'telefono': null,
        'email': null
      },
      
      // Tabla: licencias
      'licencias': {
        'tipo_licencia': 'Licencia de conducir',
        'numero_licencia': null,    // Se establecerá como 'Sin especificar'
        'fecha_emision': null,
        'fecha_vencimiento': null,
        'estado': null              // Se establecerá como 'vigente'
      },
      
      // Tabla: disponibilidad
      'disponibilidad': {
        'disponible': null,         // Se establecerá como true
        'horario_inicio': null,     // Se establecerá como '08:00'
        'horario_fin': null,        // Se establecerá como '17:00'
        'dias_semana': null         // Se establecerá como 'Lunes a Viernes'
      }
    };
  }

  /**
   * Procesa los datos y los prepara para inserción
   */
  async processDataForInsertion(sheetName = null) {
    console.log('\n⚙️  PROCESANDO DATOS PARA INSERCIÓN');
    console.log('=' .repeat(50));
    
    // Si no se especifica hoja, usar la primera con datos
    const targetSheet = sheetName || Object.keys(this.data)[0];
    const data = this.data[targetSheet];
    
    if (!data || data.length <= 1) {
      console.log('❌ No hay datos suficientes para procesar');
      return [];
    }
    
    const headers = data[0];
    const processedData = [];
    
    console.log(`📊 Procesando ${data.length - 1} filas de datos...`);
    
    // Procesar cada fila de datos (saltando el header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const processedRow = {};
      
      // Mapear cada columna
      headers.forEach((header, index) => {
        const value = row[index];
        if (value !== undefined && value !== '') {
          processedRow[header || `columna_${index}`] = value;
        }
      });
      
      // Solo agregar filas que tengan al menos algunos datos
      if (Object.keys(processedRow).length > 0) {
        processedData.push(processedRow);
      }
    }
    
    console.log(`✅ Procesadas ${processedData.length} filas válidas`);
    return processedData;
  }

  /**
   * Convierte fecha de Excel a formato Date
   */
  excelDateToJSDate(excelDate) {
    if (!excelDate) return null;
    
    // Si ya es una fecha string, intentar parsearla
    if (typeof excelDate === 'string') {
      const parsed = new Date(excelDate);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      return null;
    }
    
    // Si es un número (fecha de Excel)
    if (typeof excelDate === 'number' && !isNaN(excelDate)) {
      // Excel guarda las fechas como días desde 1900-01-01
      // Pero Excel tiene un error: cuenta 1900 como año bisiesto cuando no lo es
      // Por eso restamos 2 días adicionales
      const excelEpoch = new Date(1900, 0, 1);
      const jsDate = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
      return jsDate.toISOString().split('T')[0]; // Solo la fecha YYYY-MM-DD
    }
    
    return null;
  }

  /**
   * Busca o crea una empresa
   */
  async findOrCreateEmpresa(centroCosto) {
    if (!centroCosto) return null;
    
    const nombreEmpresa = centroCosto;
    const rutEmpresa = `${Math.random().toString().substr(2, 8)}-${Math.floor(Math.random() * 10)}`;
    
    try {
      // Buscar empresa existente
      const { data: existingEmpresa, error: searchError } = await supabase
        .from('mantenimiento.empresas')
        .select('id')
        .eq('nombre', nombreEmpresa)
        .single();
      
      if (existingEmpresa) {
        return existingEmpresa.id;
      }
      
      // Crear nueva empresa
      const { data: newEmpresa, error: insertError } = await supabase
        .from('mantenimiento.empresas')
        .insert({
          nombre: nombreEmpresa,
          rut_empresa: rutEmpresa,
          direccion: 'Sin especificar'
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      return newEmpresa.id;
      
    } catch (error) {
      console.warn(`⚠️  Error al crear empresa: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca o crea un servicio
   */
  async findOrCreateServicio(cargoInterno) {
    if (!cargoInterno) return null;
    
    try {
      // Buscar servicio existente
      const { data: existingServicio, error: searchError } = await supabase
        .from('mantenimiento.servicios')
        .select('id')
        .eq('nombre', cargoInterno)
        .single();
      
      if (existingServicio) {
        return existingServicio.id;
      }
      
      // Crear nuevo servicio
      const { data: newServicio, error: insertError } = await supabase
        .from('mantenimiento.servicios')
        .insert({
          nombre: cargoInterno,
          descripcion: `Servicio de ${cargoInterno}`,
          precio: 0
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      return newServicio.id;
      
    } catch (error) {
      console.warn(`⚠️  Error al crear servicio: ${error.message}`);
      return null;
    }
  }

  /**
   * Crea un registro de ubicación
   */
  async createUbicacion(region, comuna, ciudad) {
    if (!region && !comuna && !ciudad) return null;
    
    try {
      const { data: ubicacion, error } = await supabase
        .from('mantenimiento.ubicacion')
        .insert({
          region: region || null,
          comuna: comuna || null,
          direccion: ciudad || null
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return ubicacion.id;
      
    } catch (error) {
      console.warn(`⚠️  Error al crear ubicación: ${error.message}`);
      return null;
    }
  }

  /**
   * Crea un registro de contacto
   */
  async createContacto(telefono, email) {
    if (!telefono && !email) return null;
    
    try {
      const { data: contacto, error } = await supabase
        .from('mantenimiento.contacto')
        .insert({
          telefono: telefono ? telefono.toString() : null,
          email: email || null
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return contacto.id;
      
    } catch (error) {
      console.warn(`⚠️  Error al crear contacto: ${error.message}`);
      return null;
    }
  }

  /**
   * Crea un registro de licencias si aplica
   */
  async createLicencia(tipoLicencia) {
    if (!tipoLicencia || tipoLicencia === 'N') return null;
    
    try {
      const { data: licencia, error } = await supabase
        .from('mantenimiento.licencias')
        .insert({
          tipo_licencia: tipoLicencia,
          numero_licencia: 'Sin especificar',
          estado: 'vigente'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return licencia.id;
      
    } catch (error) {
      console.warn(`⚠️  Error al crear licencia: ${error.message}`);
      return null;
    }
  }

  /**
   * Crea un registro de disponibilidad
   */
  async createDisponibilidad() {
    try {
      const { data: disponibilidad, error } = await supabase
        .from('mantenimiento.disponibilidad')
        .insert({
          disponible: true,
          horario_inicio: '08:00',
          horario_fin: '17:00',
          dias_semana: 'Lunes a Viernes'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return disponibilidad.id;
      
    } catch (error) {
      console.warn(`⚠️  Error al crear disponibilidad: ${error.message}`);
      return null;
    }
  }

  /**
   * Inserta un registro completo de personal
   */
  async insertPersonalRecord(row) {
    const {
      'Rut': rut,
      'Nombre': nombreCompleto,
      'Sexo': sexo,
      'Fecha Nacimiento': fechaNacimiento,
      'Estado civil': estadoCivil,
      'Región': region,
      'Comuna': comuna,
      'Ciudad': ciudad,
      'Teléfono': telefono,
      'Correo electrónico': correoElectronico,
      'Correo personal': correoPersonal,
      'Licencia de conducir': licenciaConducir,
      'Centro Costo': centroCosto,
      'Sede': sede,
      'Cargo Interno': cargoInterno
    } = row;

    // Separar nombre y apellido
    const nombrePartes = nombreCompleto ? nombreCompleto.split(' ') : ['', ''];
    const nombre = nombrePartes[0] || '';
    const apellido = nombrePartes.slice(1).join(' ') || '';

    // Convertir fecha
    const fechaNac = this.excelDateToJSDate(fechaNacimiento);

    // Crear registros relacionados
    const empresaId = await this.findOrCreateEmpresa(centroCosto);
    const servicioId = await this.findOrCreateServicio(cargoInterno);
    const ubicacionId = await this.createUbicacion(region, comuna, ciudad);
    const contactoId = await this.createContacto(telefono, correoPersonal || correoElectronico);
    const licenciaId = await this.createLicencia(licenciaConducir);
    const disponibilidadId = await this.createDisponibilidad();

    // Insertar el personal
    const { data: personal, error } = await supabase
      .from('mantenimiento.personal_servicio')
      .insert({
        nombre: nombre,
        apellido: apellido,
        rut: rut,
        fecha_nacimiento: fechaNac,
        cargo: cargoInterno,
        empresa_id: empresaId,
        servicio_id: servicioId,
        ubicacion_id: ubicacionId,
        contacto_id: contactoId,
        licencias_id: licenciaId,
        disponibilidad_id: disponibilidadId,
        activo: true
      })
      .select('id')
      .single();

    if (error) throw error;
    return personal.id;
  }

  /**
   * Inserta los datos procesados en la base de datos
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
    
    for (const [index, row] of processedData.entries()) {
      try {
        console.log(`\n📝 Procesando registro ${index + 1}/${processedData.length}`);
        console.log(`   RUT: ${row['Rut']}`);
        console.log(`   Nombre: ${row['Nombre']}`);
        console.log(`   Cargo: ${row['Cargo Interno']}`);
        
        if (!dryRun) {
          const personalId = await this.insertPersonalRecord(row);
          console.log(`   ✅ Insertado con ID: ${personalId}`);
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
    console.log('🚀 INICIANDO IMPORTACIÓN DE EXCEL');
    console.log('=' .repeat(50));
    
    try {
      // 1. Leer archivo Excel
      const readSuccess = await this.readExcelFile(filePath);
      if (!readSuccess) {
        throw new Error('No se pudo leer el archivo Excel');
      }
      
      // 2. Analizar estructura
      this.analyzeDataStructure();
      
      // 3. Procesar datos
      const processedData = await this.processDataForInsertion(options.sheetName);
      
      // 4. Mostrar mapeo de columnas
      console.log('\n🗺️  MAPEO DE COLUMNAS (Base de Datos ← Excel):');
      console.log('-' .repeat(50));
      const mappings = this.createColumnMapping();
      
      for (const [tableName, tableMapping] of Object.entries(mappings)) {
        console.log(`\n📋 Tabla: ${tableName}`);
        for (const [dbField, excelColumn] of Object.entries(tableMapping)) {
          if (excelColumn) {
            console.log(`   ${dbField} ← "${excelColumn}"`);
          } else {
            console.log(`   ${dbField} ← [generado automáticamente]`);
          }
        }
      }
      
      // 5. Insertar datos
      const dryRun = options.dryRun !== false; // Por defecto es true (simulación)
      
      await this.insertDataToDatabase(processedData, dryRun);
      
      console.log('\n🎉 IMPORTACIÓN COMPLETADA');
      
    } catch (error) {
      console.error('💥 Error durante la importación:', error.message);
      throw error;
    }
  }
}

// Función principal para ejecutar la importación
async function main() {
  const filePath = path.join(__dirname, '..', 'Personal Servicios.xlsx');
  const importer = new ExcelImporter();
  
  try {
    await importer.import(filePath, {
      dryRun: true, // Cambiar a false para insertar datos reales
      sheetName: null // null para auto-detectar la primera hoja con datos
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

module.exports = ExcelImporter;
