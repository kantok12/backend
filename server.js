const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Importar rutas del esquema mantenimiento
const estadosRoutes = require('./routes/estados');
const personalDisponibleRoutes = require('./routes/personal-disponible');
const nombresRoutes = require('./routes/nombres');
const cursosRoutes = require('./routes/cursos-new');
const documentosRoutes = require('./routes/documentos');
const migrationRoutes = require('./routes/migration');
const areaServicioRoutes = require('./routes/area-servicio');
const servicioRoutes = require('./routes/servicio');
const backupRoutes = require('./routes/backup');
const profileImagesRoutes = require('./routes/profile-images');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Configuración CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'http://192.168.10.194:3000',
  'http://192.168.10.194:3001',
  'http://192.168.10.194:3002'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS: Origin permitido - ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origin bloqueado - ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`🔍 CORS Origin check: ${req.headers.origin}`);
  next();
});

// Servir archivos estáticos desde uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/estados', estadosRoutes);
app.use('/api/personal-disponible', personalDisponibleRoutes);
app.use('/api/nombres', nombresRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/area-servicio', areaServicioRoutes);
app.use('/api/servicio', servicioRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/personal', profileImagesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API Backend - Sistema de Gestión de Personal',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      personal: '/api/personal-disponible',
      cursos: '/api/cursos',
      documentos: '/api/documentos',
      estados: '/api/estados'
    }
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error en middleware:', err);
  
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado por CORS',
      origin: req.headers.origin
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Función para probar conexión a PostgreSQL
async function testDatabaseConnection() {
  try {
    const { query } = require('./config/database');
    await query('SELECT 1');
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
  }
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
  console.log('🚀 Servidor ejecutándose en el puerto', PORT);
  console.log('📊 Ambiente:', process.env.NODE_ENV || 'development');
  console.log('🔗 URL Local: http://localhost:' + PORT);
  console.log('🌐 URL Red Local: http://192.168.10.194:' + PORT);
  console.log('🏥 Health check: http://192.168.10.194:' + PORT + '/api/health');
  console.log('📱 Para acceder desde otros dispositivos en la red, usa: http://192.168.10.194:' + PORT);
  
  console.log('🔍 Probando conexión a PostgreSQL...');
  await testDatabaseConnection();
  
  console.log('🕒 Timestamp del servidor:', new Date().toISOString());
});

module.exports = app;