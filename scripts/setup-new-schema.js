const fs = require('fs');
const path = require('path');
const { query, testConnection } = require('../config/database-new');

/**
 * Script para configurar el nuevo esquema de base de datos
 * Crea las tablas: carteras, clientes, ubicacion_geografica, nodos
 */
async function setupNewSchema() {
  try {
    console.log('🚀 Iniciando configuración del nuevo esquema de base de datos...');
    
    // Verificar conexión
    console.log('🔍 Verificando conexión a la base de datos...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    // Leer el script SQL
    const sqlPath = path.join(__dirname, 'create-new-schema.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Ejecutando script SQL...');
    
    // Ejecutar el script SQL
    await query(sqlScript);
    
    console.log('✅ Script SQL ejecutado exitosamente');
    
    // Verificar que las tablas fueron creadas
    console.log('🔍 Verificando creación de tablas...');
    const tablesResult = await query(`
      SELECT 
        table_name,
        'CREADA' as estado
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('carteras', 'clientes', 'ubicacion_geografica', 'nodos')
      ORDER BY table_name
    `);
    
    console.log('📊 Tablas creadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name} - ${row.estado}`);
    });
    
    // Verificar datos de ejemplo
    console.log('🔍 Verificando datos de ejemplo...');
    const dataResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM carteras) as carteras,
        (SELECT COUNT(*) FROM ubicacion_geografica) as regiones,
        (SELECT COUNT(*) FROM clientes) as clientes,
        (SELECT COUNT(*) FROM nodos) as nodos
    `);
    
    const data = dataResult.rows[0];
    console.log('📊 Datos insertados:');
    console.log(`  📁 Carteras: ${data.carteras}`);
    console.log(`  🌍 Regiones: ${data.regiones}`);
    console.log(`  👥 Clientes: ${data.clientes}`);
    console.log(`  🔧 Nodos: ${data.nodos}`);
    
    // Probar algunos endpoints básicos
    console.log('🧪 Probando consultas básicas...');
    
    // Probar estructura jerárquica
    const estructuraResult = await query(`
      SELECT 
        c.name as cartera,
        cl.nombre as cliente,
        ug.nombre as region,
        n.nombre as nodo
      FROM carteras c
      LEFT JOIN clientes cl ON c.id = cl.cartera_id
      LEFT JOIN ubicacion_geografica ug ON cl.region_id = ug.id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      ORDER BY c.name, cl.nombre, n.nombre
      LIMIT 5
    `);
    
    console.log('🏗️ Estructura jerárquica (primeros 5 registros):');
    estructuraResult.rows.forEach(row => {
      console.log(`  ${row.cartera} → ${row.cliente} (${row.region}) → ${row.nodo || 'Sin nodos'}`);
    });
    
    console.log('\n🎉 ¡Configuración del nuevo esquema completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('  ✅ Tablas creadas: carteras, clientes, ubicacion_geografica, nodos');
    console.log('  ✅ Índices creados para optimizar consultas');
    console.log('  ✅ Datos de ejemplo insertados');
    console.log('  ✅ Vistas útiles creadas');
    console.log('  ✅ Relaciones y restricciones configuradas');
    
    console.log('\n🌐 Endpoints disponibles:');
    console.log('  📁 /api/carteras - Gestión de carteras');
    console.log('  👥 /api/clientes - Gestión de clientes');
    console.log('  🌍 /api/ubicacion-geografica - Gestión de ubicaciones');
    console.log('  🔧 /api/nodos - Gestión de nodos');
    console.log('  🏗️ /api/estructura - Consultas de estructura jerárquica');
    
    return {
      success: true,
      message: 'Esquema configurado exitosamente',
      tables: tablesResult.rows,
      data: data,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error configurando el esquema:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupNewSchema()
    .then(result => {
      console.log('\n✅ Configuración completada:', result.message);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error en la configuración:', error.message);
      process.exit(1);
    });
}

module.exports = { setupNewSchema };
