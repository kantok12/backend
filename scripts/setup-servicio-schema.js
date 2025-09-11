const { query } = require('../config/postgresql');
const fs = require('fs');
const path = require('path');

async function setupServicioSchema() {
  try {
    console.log('🏢 Iniciando configuración del esquema de servicio...');
    console.log('=====================================================');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'create-servicio-schema.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Archivo SQL leído exitosamente');
    console.log('🔍 Ejecutando script de creación...');

    // Ejecutar el script SQL
    await query(sqlContent);

    console.log('✅ Esquema de servicio creado exitosamente');
    console.log('=====================================================');

    // Verificar la creación
    console.log('🔍 Verificando tablas creadas...');
    
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'servicio' 
      ORDER BY table_name
    `);

    console.log('📊 Tablas creadas:');
    tables.rows.forEach(table => {
      console.log(`   - servicio.${table.table_name}`);
    });

    // Verificar vistas
    const views = await query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'servicio' 
      ORDER BY table_name
    `);

    console.log('📊 Vistas creadas:');
    views.rows.forEach(view => {
      console.log(`   - servicio.${view.table_name}`);
    });

    // Verificar datos de ejemplo
    console.log('🔍 Verificando datos de ejemplo...');
    
    const carteras = await query('SELECT COUNT(*) as total FROM servicio.carteras');
    const ingenieros = await query('SELECT COUNT(*) as total FROM servicio.ingenieria_servicios');
    const nodos = await query('SELECT COUNT(*) as total FROM servicio.nodos');
    const servicios = await query('SELECT COUNT(*) as total FROM servicio.servicios_programados');

    console.log('📊 Datos de ejemplo insertados:');
    console.log(`   - Carteras: ${carteras.rows[0].total}`);
    console.log(`   - Ingenieros: ${ingenieros.rows[0].total}`);
    console.log(`   - Nodos: ${nodos.rows[0].total}`);
    console.log(`   - Servicios programados: ${servicios.rows[0].total}`);

    // Probar la vista de estructura completa
    console.log('🔍 Probando vista de estructura completa...');
    const estructura = await query('SELECT COUNT(*) as total FROM servicio.vista_estructura_completa');
    console.log(`   - Registros en vista estructura: ${estructura.rows[0].total}`);

    // Probar la vista de servicios próximos a vencer
    console.log('🔍 Probando vista de servicios próximos a vencer...');
    const serviciosVencer = await query('SELECT COUNT(*) as total FROM servicio.vista_servicios_vencer');
    console.log(`   - Servicios próximos a vencer: ${serviciosVencer.rows[0].total}`);

    console.log('=====================================================');
    console.log('🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE');
    console.log('=====================================================');
    console.log('✅ Esquema de servicio listo para usar');
    console.log('✅ Endpoints disponibles en /api/servicio');
    console.log('✅ Datos de ejemplo cargados');
    console.log('✅ Vistas funcionando correctamente');
    console.log('=====================================================');

    return {
      success: true,
      message: 'Esquema de servicio configurado exitosamente',
      data: {
        tables: tables.rows.length,
        views: views.rows.length,
        carteras: parseInt(carteras.rows[0].total),
        ingenieros: parseInt(ingenieros.rows[0].total),
        nodos: parseInt(nodos.rows[0].total),
        servicios: parseInt(servicios.rows[0].total)
      }
    };

  } catch (error) {
    console.error('❌ Error al configurar esquema de servicio:', error);
    console.log('=====================================================');
    console.log('🔧 Posibles soluciones:');
    console.log('   1. Verificar conexión a la base de datos');
    console.log('   2. Verificar permisos de usuario');
    console.log('   3. Verificar que el archivo SQL existe');
    console.log('   4. Revisar logs de PostgreSQL');
    console.log('=====================================================');
    
    return {
      success: false,
      error: 'Error al configurar esquema de servicio',
      message: error.message
    };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupServicioSchema()
    .then(result => {
      if (result.success) {
        console.log('✅ Proceso completado exitosamente');
        process.exit(0);
      } else {
        console.log('❌ Proceso falló');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { setupServicioSchema };
