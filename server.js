const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ path: './config.env' });

// Importar rutas
// Nota: personal, empresas, servicios removidos - no existen tablas correspondientes
const authRoutes = require('./routes/auth');
const authSimpleRoutes = require('./routes/auth-simple');
const authTempRoutes = require('./routes/auth-temp');

// Importar rutas del esquema mantenimiento
const estadosRoutes = require('./routes/estados');
const faenasRoutes = require('./routes/faenas');
const plantasRoutes = require('./routes/plantas');
const lineasRoutes = require('./routes/lineas');
const equiposRoutes = require('./routes/equipos');
const componentesRoutes = require('./routes/componentes');
const lubricantesRoutes = require('./routes/lubricantes');
const puntoLubricacionRoutes = require('./routes/punto-lubricacion');
const tareasProyectadasRoutes = require('./routes/tareas-proyectadas');
const tareasProgramadasRoutes = require('./routes/tareas-programadas');
const tareasEjecutadasRoutes = require('./routes/tareas-ejecutadas');
const personalDisponibleRoutes = require('./routes/personal-disponible');
const nombresRoutes = require('./routes/nombres');
const cursosRoutes = require('./routes/cursos-new');
const documentosRoutes = require('./routes/documentos');

// Importar middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Importar configuración de PostgreSQL
const { testConnection } = require('./config/postgresql');

const app = express();
const PORT = process.env.PORT || 3000;

// Obtener IP local de la máquina
const os = require('os');
const networkInterfaces = os.networkInterfaces();
const getLocalIP = () => {
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      // Buscar IPv4 no interna (no localhost)
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

// Middleware de seguridad
app.use(helmet());

// Middleware de logging
app.use(morgan('combined'));

// Middleware CORS - Permitir acceso desde la red local
app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS Origin check:', origin);
    
    // Permitir requests sin origin (aplicaciones móviles, postman, etc.)
    if (!origin) {
      console.log('✅ CORS: Permitiendo request sin origin');
      return callback(null, true);
    }
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      `http://${getLocalIP()}:3000`,
      `http://${getLocalIP()}:3001`,
      `http://${getLocalIP()}:3002`,
    ];
    
    // Verificar si es una IP de red local (más amplio)
    const isLocalNetwork = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.)/.test(origin);
    
    if (allowedOrigins.includes(origin) || isLocalNetwork) {
      console.log('✅ CORS: Origin permitido -', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin bloqueado -', origin);
      console.log('🔍 Orígenes permitidos:', allowedOrigins);
      console.log('🔍 ¿Es red local?', isLocalNetwork);
      callback(null, true); // Temporalmente permitir todo para desarrollo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas de autenticación (sin middleware de auth)
app.use('/api/auth', authRoutes);
app.use('/api/auth-simple', authSimpleRoutes);
app.use('/api/auth-temp', authTempRoutes);

// Rutas abiertas (sin middleware de auth - temporalmente para desarrollo)
// Nota: Endpoints personal, empresas, servicios removidos - no existen tablas correspondientes

// Rutas del esquema mantenimiento (sin autenticación)
app.use('/api/estados', estadosRoutes);
app.use('/api/faenas', faenasRoutes);
app.use('/api/plantas', plantasRoutes);
app.use('/api/lineas', lineasRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/componentes', componentesRoutes);
app.use('/api/lubricantes', lubricantesRoutes);
app.use('/api/punto-lubricacion', puntoLubricacionRoutes);
app.use('/api/tareas-proyectadas', tareasProyectadasRoutes);
app.use('/api/tareas-programadas', tareasProgramadasRoutes);
app.use('/api/tareas-ejecutadas', tareasEjecutadasRoutes);
app.use('/api/personal-disponible', personalDisponibleRoutes);
app.use('/api/nombres', nombresRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/documentos', documentosRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Sistema de Mantenimiento',
    version: '1.0.0',
    status: 'Endpoints sin autenticación (desarrollo)',
    endpoints: {
      auth: {
        temp: '/api/auth-temp',
        main: '/api/auth'
      },
      mantenimiento: {
        estados: '/api/estados',
        faenas: '/api/faenas',
        plantas: '/api/plantas',
        lineas: '/api/lineas',
        equipos: '/api/equipos',
        componentes: '/api/componentes',
        lubricantes: '/api/lubricantes',
        puntoLubricacion: '/api/punto-lubricacion',
        tareasProyectadas: '/api/tareas-proyectadas',
        tareasProgramadas: '/api/tareas-programadas',
        tareasEjecutadas: '/api/tareas-ejecutadas',
        personalDisponible: '/api/personal-disponible',
        nombres: '/api/nombres',
        cursos: '/api/cursos',
        documentos: '/api/documentos'
      },
      health: '/api/health'
    }
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

const localIP = getLocalIP();
const HOST = process.env.HOST || '0.0.0.0'; // Escuchar en todas las interfaces

// Iniciar servidor
app.listen(PORT, HOST, async () => {
  console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL Local: http://localhost:${PORT}`);
  console.log(`🌐 URL Red Local: http://${localIP}:${PORT}`);
  console.log(`🏥 Health check: http://${localIP}:${PORT}/api/health`);
  console.log(`\n📱 Para acceder desde otros dispositivos en la red, usa: http://${localIP}:${PORT}`);
  
  // Probar conexión a PostgreSQL
  console.log(`\n🔍 Probando conexión a PostgreSQL...`);
  await testConnection();
});

module.exports = app;
