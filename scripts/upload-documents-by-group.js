const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function uploadDocumentsByGroup() {
  console.log('📁 HERRAMIENTA DE SUBIDA DE DOCUMENTOS POR GRUPO');
  console.log('=================================================');
  
  try {
    // 1. Obtener grupos disponibles por cargo
    console.log('\n🔍 Obteniendo grupos por cargo...');
    const cargosResult = await pool.query(`
      SELECT cargo, COUNT(*) as cantidad_personas
      FROM mantenimiento.personal_disponible 
      WHERE cargo IS NOT NULL AND cargo != ''
      GROUP BY cargo
      ORDER BY cantidad_personas DESC
    `);
    
    if (cargosResult.rows.length === 0) {
      console.log('❌ No se encontraron cargos en la base de datos');
      return;
    }
    
    console.log('\n👔 CARGOS DISPONIBLES:');
    console.log('======================');
    cargosResult.rows.forEach((cargo, index) => {
      console.log(`${index + 1}. ${cargo.cargo} (${cargo.cantidad_personas} personas)`);
    });
    
    // 2. Buscar personas con cargo relacionado a "servicio"
    const cargoServicio = cargosResult.rows.find(c => 
      c.cargo.toLowerCase().includes('servicio') || 
      c.cargo.toLowerCase().includes('servicios')
    );
    
    if (!cargoServicio) {
      console.log('\n⚠️ No se encontró cargo específico de "servicio"');
      console.log('🎯 Usando el primer cargo disponible...');
      var cargoSeleccionado = cargosResult.rows[0].cargo;
    } else {
      var cargoSeleccionado = cargoServicio.cargo;
    }
    
    console.log(`\n🎯 Cargo seleccionado: "${cargoSeleccionado}"`);
    
    // 3. Obtener personas del cargo seleccionado
    const personasResult = await pool.query(`
      SELECT rut, nombres, cargo, centro_costo, sede
      FROM mantenimiento.personal_disponible 
      WHERE cargo = $1
      ORDER BY nombres
    `, [cargoSeleccionado]);
    
    if (personasResult.rows.length === 0) {
      console.log(`❌ No se encontraron personas para el cargo "${cargoSeleccionado}"`);
      return;
    }
    
    console.log(`\n👥 PERSONAS ENCONTRADAS (${personasResult.rows.length}):`);
    console.log('==========================================');
    personasResult.rows.forEach((persona, index) => {
      console.log(`${index + 1}. ${persona.rut} - ${persona.nombres || 'Sin nombre'} (${persona.centro_costo || 'Sin centro'})`);
    });
    
    // 4. Crear documento de ejemplo para el grupo
    const documentContent = `CERTIFICADO DE CAPACITACIÓN - ${cargoSeleccionado.toUpperCase()}
=====================================================

Fecha: ${new Date().toLocaleDateString('es-CL')}
Cargo: ${cargoSeleccionado}
Institución: Centro de Capacitación y Desarrollo
Duración: 40 horas
Modalidad: Presencial

CONTENIDOS DE LA CAPACITACIÓN:
- Módulo 1: Fundamentos del cargo
- Módulo 2: Procedimientos operativos
- Módulo 3: Seguridad y prevención de riesgos
- Módulo 4: Herramientas y equipos
- Módulo 5: Atención al cliente y comunicación

EVALUACIÓN:
- Examen teórico: Aprobado
- Evaluación práctica: Aprobado
- Proyecto final: Aprobado
- Nota final: 6.8

COMPETENCIAS DESARROLLADAS:
✓ Conocimiento técnico del cargo
✓ Manejo de herramientas especializadas
✓ Protocolos de seguridad
✓ Trabajo en equipo
✓ Comunicación efectiva

Este certificado acredita que el participante ha completado 
satisfactoriamente la capacitación para el cargo de "${cargoSeleccionado}".

Firma digital: [SISTEMA DE MANTENIMIENTO]
Fecha de emisión: ${new Date().toISOString()}
Código de verificación: CERT-${Date.now()}
`;
    
    // 5. Crear archivo temporal
    const tempFileName = `certificado_${cargoSeleccionado.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${Date.now()}.txt`;
    const tempFilePath = path.join(__dirname, tempFileName);
    fs.writeFileSync(tempFilePath, documentContent);
    
    console.log(`\n📄 Documento creado: ${tempFileName}`);
    
    // 6. Subir documento para cada persona del grupo
    console.log('\n📤 Subiendo documentos para cada persona...');
    
    let documentosSubidos = 0;
    let errores = 0;
    
    for (const persona of personasResult.rows) {
      try {
        // Leer el archivo
        const fileBuffer = fs.readFileSync(tempFilePath);
        const fileName = `certificado_${persona.rut.replace(/-/g, '_')}_${Date.now()}.txt`;
        const uploadPath = path.join(__dirname, '../uploads/documentos', fileName);
        
        // Crear directorio si no existe
        const uploadDir = path.dirname(uploadPath);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Guardar archivo
        fs.writeFileSync(uploadPath, fileBuffer);
        
        // Insertar en base de datos
        const insertResult = await pool.query(`
          INSERT INTO mantenimiento.documentos (
            rut_persona, 
            nombre_documento, 
            tipo_documento, 
            nombre_archivo, 
            nombre_original, 
            tipo_mime, 
            tamaño_bytes, 
            ruta_archivo, 
            descripcion, 
            fecha_subida, 
            subido_por, 
            activo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `, [
          persona.rut,
          `Certificado - ${cargoSeleccionado}`,
          'certificado_curso',
          fileName,
          tempFileName,
          'text/plain',
          fileBuffer.length,
          uploadPath,
          `Certificado de capacitación para el cargo "${cargoSeleccionado}" - ${persona.nombres || persona.rut}`,
          new Date(),
          'SISTEMA_SERVIDOR',
          true
        ]);
        
        console.log(`   ✅ ${persona.rut}: Documento subido (ID: ${insertResult.rows[0].id})`);
        documentosSubidos++;
        
      } catch (error) {
        console.log(`   ❌ ${persona.rut}: Error - ${error.message}`);
        errores++;
      }
    }
    
    // 7. Limpiar archivo temporal
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    // 8. Resumen final
    console.log('\n📊 RESUMEN DE SUBIDA:');
    console.log('=====================');
    console.log(`✅ Documentos subidos exitosamente: ${documentosSubidos}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`👔 Cargo: ${cargoSeleccionado}`);
    console.log(`👥 Total personas: ${personasResult.rows.length}`);
    
    if (documentosSubidos > 0) {
      console.log('\n🎉 ¡DOCUMENTOS DISPONIBLES PARA DESCARGA!');
      console.log('=========================================');
      console.log(`Ahora puedes descargar documentos para el cargo "${cargoSeleccionado}"`);
      console.log('\n🔗 Endpoints disponibles:');
      console.log('   - GET /api/documentos (listar todos)');
      console.log('   - GET /api/documentos/persona/{RUT} (por persona)');
      console.log('   - GET /api/documentos/{ID}/descargar (descargar archivo)');
      
      // Mostrar algunos RUTs para probar
      console.log('\n🧪 RUTs para probar descarga:');
      personasResult.rows.slice(0, 3).forEach(persona => {
        console.log(`   - ${persona.rut} (${persona.nombres || 'Sin nombre'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la función
uploadDocumentsByGroup();
