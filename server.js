const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Importar rutas del esquema mantenimiento
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const estadosRoutes = require('./routes/estados');
const personalDisponibleRoutes = require('./routes/personal-disponible');
const nombresRoutes = require('./routes/nombres');
const cursosRoutes = require('./routes/cursos-new');
const documentosRoutes = require('./routes/documentos');
const migrationRoutes = require('./routes/migration');
const areaServicioRoutes = require('./routes/area-servicio');
const servicioRoutes = require('./routes/servicio');
const serviciosSchemaRoutes = require('./routes/servicios-schema');
const backupRoutes = require('./routes/backup');
const asignacionesRoutes = require('./routes/asignaciones');
const profileImagesRoutes = require('./routes/profile-images');
const prerrequisitosRoutes = require('./routes/prerrequisitos');
const programacionRoutes = require('./routes/programacion');
const programacionOptimizadaRoutes = require('./routes/programacion-optimizada');
const carpetasPersonalRoutes = require('./routes/carpetas-personal');
const belrayRoutes = require('./routes/belray');
const auditoriaRoutes = require('./routes/auditoria');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Configuración CORS
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    // Permitir localhost en cualquier puerto
    if (origin.startsWith('http://localhost:')) {
      console.log(`✅ CORS: Localhost permitido - ${origin}`);
      return callback(null, true);
    }
    
    // Permitir cualquier IP de la red local (192.168.x.x)
    if (origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/)) {
      console.log(`✅ CORS: Red local permitida - ${origin}`);
      return callback(null, true);
    }
    
    // Permitir 127.0.0.1 (localhost alternativo)
    if (origin.startsWith('http://127.0.0.1:')) {
      console.log(`✅ CORS: 127.0.0.1 permitido - ${origin}`);
      return callback(null, true);
    }
    
    // Permitir rangos de IP de AWS VPN (10.x.x.x, 172.16-31.x.x)
    if (origin.match(/^http:\/\/10\.\d+\.\d+\.\d+:\d+$/)) {
      console.log(`✅ CORS: AWS VPN (10.x.x.x) permitido - ${origin}`);
      return callback(null, true);
    }
    
    if (origin.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/)) {
      console.log(`✅ CORS: AWS VPN (172.16-31.x.x) permitido - ${origin}`);
      return callback(null, true);
    }
    
    // Permitir HTTPS para producción
    if (origin.startsWith('https://')) {
      console.log(`✅ CORS: HTTPS permitido - ${origin}`);
      return callback(null, true);
    }
    
    console.log(`❌ CORS: Origin bloqueado - ${origin}`);
    callback(new Error('No permitido por CORS'));
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
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/estados', estadosRoutes);
app.use('/api/personal-disponible', personalDisponibleRoutes);
app.use('/api/nombres', nombresRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/area-servicio', areaServicioRoutes);
app.use('/api/servicio', servicioRoutes);
app.use('/api/servicios', serviciosSchemaRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/personal', profileImagesRoutes);
app.use('/api/prerrequisitos', prerrequisitosRoutes);
// Alias para compatibilidad con frontend (ortografía alternativa)
app.use('/api/prerequisitos', prerrequisitosRoutes);
app.use('/api/asignaciones', asignacionesRoutes);
app.use('/api/programacion', programacionRoutes);
app.use('/api/programacion-optimizada', programacionOptimizadaRoutes);
app.use('/api/carpetas-personal', carpetasPersonalRoutes);
app.use('/api/belray', belrayRoutes);
app.use('/api/auditoria', auditoriaRoutes);

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
      auth: '/api/auth',
      users: '/api/users',
      health: '/api/health',
      personal: '/api/personal-disponible',
      cursos: '/api/cursos',
      documentos: '/api/documentos',
      estados: '/api/estados',
      servicios: '/api/servicios',
      asignaciones: '/api/asignaciones',
      programacion: '/api/programacion',
      programacionOptimizada: '/api/programacion-optimizada'
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