const { query } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Ruta base para documentos de Belray
const BELRAY_DOCS_PATH = 'G:\\Unidades compartidas\\Unidad de Apoyo\\Belray\\Documentacion_Empresa';

async function crearCarpetasDocumentacionBelray() {
  try {
    console.log('🚀 Iniciando creación de carpetas de documentación para empresas Belray...');

    // 1. Obtener todas las empresas Belray
    const empresasResult = await query(`
      SELECT id, nombre, giro, numero_telefono, direccion
      FROM mantenimiento.belray
      ORDER BY id
    `);

    console.log(`📋 Empresas Belray encontradas: ${empresasResult.rows.length}`);

    if (empresasResult.rows.length === 0) {
      console.log('⚠️ No se encontraron empresas Belray en la base de datos');
      return;
    }

    // 2. Crear carpeta base si no existe
    try {
      await fs.mkdir(BELRAY_DOCS_PATH, { recursive: true });
      console.log(`✅ Carpeta base creada: ${BELRAY_DOCS_PATH}`);
    } catch (error) {
      console.log(`📁 Carpeta base ya existe: ${BELRAY_DOCS_PATH}`);
    }

    const resultados = [];

    // 3. Crear carpeta para cada empresa
    for (const empresa of empresasResult.rows) {
      const carpetaEmpresa = path.join(BELRAY_DOCS_PATH, `Belray_${empresa.id}`);
      
      try {
        // Verificar si la carpeta ya existe
        await fs.access(carpetaEmpresa);
        console.log(`📁 Carpeta ya existe para ${empresa.nombre} (ID: ${empresa.id})`);
        
        resultados.push({
          empresa: empresa,
          resultado: { 
            success: true, 
            message: 'Carpeta ya existe', 
            path: carpetaEmpresa 
          }
        });
      } catch (error) {
        // La carpeta no existe, crearla
        try {
          await fs.mkdir(carpetaEmpresa, { recursive: true });
          console.log(`✅ Carpeta creada para ${empresa.nombre} (ID: ${empresa.id}) en: ${carpetaEmpresa}`);
          
          resultados.push({
            empresa: empresa,
            resultado: { 
              success: true, 
              message: 'Carpeta creada exitosamente', 
              path: carpetaEmpresa 
            }
          });
        } catch (createError) {
          console.error(`❌ Error creando carpeta para ${empresa.nombre} (ID: ${empresa.id}):`, createError);
          
          resultados.push({
            empresa: empresa,
            resultado: { 
              success: false, 
              message: 'Error creando carpeta', 
              error: createError.message 
            }
          });
        }
      }
    }

    // 4. Mostrar resumen
    const exitosos = resultados.filter(r => r.resultado.success).length;
    const fallidos = resultados.filter(r => !r.resultado.success).length;

    console.log('\n📊 Resumen de creación de carpetas:');
    console.log(`   ✅ Exitosos: ${exitosos}`);
    console.log(`   ❌ Fallidos: ${fallidos}`);
    console.log(`   📁 Total empresas: ${empresasResult.rows.length}`);

    console.log('\n📋 Detalles por empresa:');
    resultados.forEach(resultado => {
      const { empresa, resultado: res } = resultado;
      const status = res.success ? '✅' : '❌';
      console.log(`   ${status} ${empresa.nombre} (ID: ${empresa.id}) - ${res.message}`);
      if (res.path) {
        console.log(`      📁 Ruta: ${res.path}`);
      }
      if (res.error) {
        console.log(`      ⚠️ Error: ${res.error}`);
      }
    });

    // 5. Mostrar estructura final
    console.log('\n🏗️ Estructura de carpetas creada:');
    console.log(`${BELRAY_DOCS_PATH}\\`);
    resultados.forEach(resultado => {
      if (resultado.resultado.success) {
        const carpetaNombre = `Belray_${resultado.empresa.id}`;
        console.log(`├── ${carpetaNombre}\\    # ${resultado.empresa.nombre}`);
      }
    });

    console.log('\n🎉 ¡Proceso de creación de carpetas completado!');

  } catch (error) {
    console.error('❌ Error general en la creación de carpetas:', error);
    throw error;
  }
}

if (require.main === module) {
  crearCarpetasDocumentacionBelray()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la ejecución del script:', error);
      process.exit(1);
    });
}

module.exports = { crearCarpetasDocumentacionBelray };
