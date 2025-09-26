const express = require('express');
// Scripts comentados temporalmente para despliegue en Cloud Run
// const { cleanupOldTables, checkCleanupStatus } = require('../scripts/cleanup-old-tables');
// const { runEstadosUpdateSafe, checkCurrentEstados } = require('../scripts/update-estados-safe');

const router = express.Router();

// GET /api/migration/status - Verificar estado de la migración (DESHABILITADO - Ya completada)
router.get('/status', async (req, res) => {
  res.json({
    success: true,
    message: 'Migración de documentos ya completada exitosamente',
    info: 'La migración de documentos se ejecutó y las tablas obsoletas fueron eliminadas',
    timestamp: new Date().toISOString(),
    status: 'completed'
  });
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

// GET /api/migration/cleanup-status - Verificar estado de limpieza (DESHABILITADO para Cloud Run)
router.get('/cleanup-status', async (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Funcionalidad de limpieza no disponible en Cloud Run',
    info: 'Esta funcionalidad requiere scripts locales que no están disponibles en el entorno de producción',
    timestamp: new Date().toISOString()
  });
});

// POST /api/migration/cleanup - Ejecutar limpieza de tablas obsoletas (DESHABILITADO para Cloud Run)
router.post('/cleanup', async (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Funcionalidad de limpieza no disponible en Cloud Run',
    info: 'Esta funcionalidad requiere scripts locales que no están disponibles en el entorno de producción',
    timestamp: new Date().toISOString()
  });
});

// GET /api/migration/estados-status - Verificar estado actual de estados (DESHABILITADO para Cloud Run)
router.get('/estados-status', async (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Funcionalidad de verificación de estados no disponible en Cloud Run',
    info: 'Esta funcionalidad requiere scripts locales que no están disponibles en el entorno de producción',
    timestamp: new Date().toISOString()
  });
});

// POST /api/migration/update-estados - Actualizar estados del sistema (DESHABILITADO para Cloud Run)
router.post('/update-estados', async (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Funcionalidad de actualización de estados no disponible en Cloud Run',
    info: 'Esta funcionalidad requiere scripts locales que no están disponibles en el entorno de producción',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
