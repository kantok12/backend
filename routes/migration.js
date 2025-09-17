const express = require('express');
const { checkMigrationStatus } = require('../scripts/migrate-documentos-structure');
const { cleanupOldTables, checkCleanupStatus } = require('../scripts/cleanup-old-tables');
const { runEstadosUpdateSafe, checkCurrentEstados } = require('../scripts/update-estados-safe');

const router = express.Router();

// GET /api/migration/status - Verificar estado de la migración
router.get('/status', async (req, res) => {
  try {
    console.log('🔍 Verificando estado de migración...');
    await checkMigrationStatus();
    
    res.json({
      success: true,
      message: 'Estado de migración verificado',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error verificando migración:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando migración',
      error: error.message
    });
  }
});

// POST /api/migration/run - Ejecutar migración (DESHABILITADO - Ya completada)
router.post('/run', async (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Migración de documentos ya completada',
    info: 'La migración de documentos se ejecutó exitosamente y ya no es necesaria',
    timestamp: new Date().toISOString()
  });
});

// GET /api/migration/cleanup-status - Verificar estado de limpieza
router.get('/cleanup-status', async (req, res) => {
  try {
    console.log('🔍 Verificando estado de limpieza...');
    await checkCleanupStatus();
    
    res.json({
      success: true,
      message: 'Estado de limpieza verificado',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error verificando limpieza:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando limpieza',
      error: error.message
    });
  }
});

// POST /api/migration/cleanup - Ejecutar limpieza de tablas obsoletas
router.post('/cleanup', async (req, res) => {
  try {
    console.log('🧹 Ejecutando limpieza de tablas obsoletas...');
    
    await cleanupOldTables();
    
    res.json({
      success: true,
      message: 'Limpieza de tablas obsoletas completada exitosamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error ejecutando limpieza:', error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando limpieza',
      error: error.message
    });
  }
});

// GET /api/migration/estados-status - Verificar estado actual de estados
router.get('/estados-status', async (req, res) => {
  try {
    console.log('🔍 Verificando estado actual de estados...');
    const estados = await checkCurrentEstados();
    
    res.json({
      success: true,
      message: 'Estado de estados verificado',
      data: estados,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error verificando estados:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando estados',
      error: error.message
    });
  }
});

// POST /api/migration/update-estados - Actualizar estados del sistema
router.post('/update-estados', async (req, res) => {
  try {
    console.log('🔄 Ejecutando actualización de estados...');
    
    await runEstadosUpdateSafe();
    
    res.json({
      success: true,
      message: 'Actualización de estados completada exitosamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error actualizando estados:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando estados',
      error: error.message
    });
  }
});

module.exports = router;
