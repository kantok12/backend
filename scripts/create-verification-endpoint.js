const fs = require('fs');
const path = require('path');

/**
 * Script para agregar endpoint de verificación de importación a personal-disponible.js
 */

function addVerificationEndpoint() {
  console.log('🔧 AGREGANDO ENDPOINT DE VERIFICACIÓN');
  console.log('=' .repeat(50));
  
  try {
    const filePath = path.join(__dirname, '..', 'routes', 'personal-disponible.js');
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Archivo personal-disponible.js no encontrado');
    }
    
    // Leer archivo actual
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si ya existe el endpoint
    if (content.includes('/verify-import')) {
      console.log('✅ El endpoint de verificación ya existe');
      return;
    }
    
    // Endpoint de verificación a agregar
    const verificationEndpoint = `
// GET /personal-disponible/verify-import - verificar importación reciente
router.get('/verify-import', async (req, res) => {
  try {
    console.log('🔍 Verificando importación de personal disponible...');
    
    // Obtener estadísticas generales
    const statsQuery = \`
      SELECT 
        COUNT(*) as total_registros,
        COUNT(CASE WHEN estado_id = 1 THEN 1 END) as activos,
        COUNT(DISTINCT cargo) as cargos_diferentes,
        COUNT(DISTINCT zona_geografica) as zonas_diferentes,
        MIN(fecha_nacimiento) as persona_mayor,
        MAX(fecha_nacimiento) as persona_menor
      FROM mantenimiento.personal_disponible
    \`;
    
    const statsResult = await query(statsQuery);
    const stats = statsResult.rows[0];
    
    // Obtener últimos registros importados (asumiendo que tienen comentario_estado con 'Importado:')
    const recentImportsQuery = \`
      SELECT 
        rut,
        sexo,
        fecha_nacimiento,
        cargo,
        zona_geografica,
        comentario_estado
      FROM mantenimiento.personal_disponible 
      WHERE comentario_estado LIKE 'Importado:%'
      ORDER BY rut
      LIMIT 10
    \`;
    
    const recentImports = await query(recentImportsQuery);
    
    // Obtener distribución por cargos
    const cargoDistQuery = \`
      SELECT 
        cargo,
        COUNT(*) as cantidad
      FROM mantenimiento.personal_disponible
      GROUP BY cargo
      ORDER BY cantidad DESC
    \`;
    
    const cargoDistribution = await query(cargoDistQuery);
    
    // Obtener distribución por zonas
    const zonaDistQuery = \`
      SELECT 
        zona_geografica,
        COUNT(*) as cantidad
      FROM mantenimiento.personal_disponible
      WHERE zona_geografica IS NOT NULL
      GROUP BY zona_geografica
      ORDER BY cantidad DESC
    \`;
    
    const zonaDistribution = await query(zonaDistQuery);
    
    // Obtener estados disponibles
    const estadosQuery = \`
      SELECT 
        e.id,
        e.nombre,
        e.descripcion,
        COUNT(pd.estado_id) as personal_count
      FROM mantenimiento.estados e
      LEFT JOIN mantenimiento.personal_disponible pd ON e.id = pd.estado_id
      GROUP BY e.id, e.nombre, e.descripcion
      ORDER BY e.id
    \`;
    
    const estados = await query(estadosQuery);
    
    res.json({
      success: true,
      message: 'Verificación de importación completada',
      timestamp: new Date().toISOString(),
      data: {
        estadisticas_generales: {
          total_registros: parseInt(stats.total_registros),
          registros_activos: parseInt(stats.activos),
          cargos_diferentes: parseInt(stats.cargos_diferentes),
          zonas_diferentes: parseInt(stats.zonas_diferentes),
          persona_mayor_nacimiento: stats.persona_mayor,
          persona_menor_nacimiento: stats.persona_menor
        },
        ultimos_importados: recentImports.rows,
        distribucion_por_cargo: cargoDistribution.rows,
        distribucion_por_zona: zonaDistribution.rows,
        estados_disponibles: estados.rows
      }
    });
    
  } catch (error) {
    console.error('Error en verificación de importación:', error);
    res.status(500).json({
      success: false,
      error: 'Error en verificación de importación',
      message: error.message
    });
  }
});

`;
    
    // Buscar donde insertar el endpoint (antes del último router.delete)
    const insertPosition = content.lastIndexOf('router.delete');
    
    if (insertPosition === -1) {
      // Si no hay router.delete, agregar antes del module.exports
      const moduleExportPosition = content.lastIndexOf('module.exports');
      if (moduleExportPosition === -1) {
        // Agregar al final del archivo
        content += verificationEndpoint + '\nmodule.exports = router;\n';
      } else {
        content = content.slice(0, moduleExportPosition) + verificationEndpoint + '\n' + content.slice(moduleExportPosition);
      }
    } else {
      // Insertar antes del router.delete
      content = content.slice(0, insertPosition) + verificationEndpoint + '\n' + content.slice(insertPosition);
    }
    
    // Escribir archivo actualizado
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log('✅ Endpoint de verificación agregado exitosamente');
    console.log('📍 Ubicación: routes/personal-disponible.js');
    console.log('🔗 URL: GET /api/personal-disponible/verify-import');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

addVerificationEndpoint();












