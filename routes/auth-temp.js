const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Usuarios temporales en memoria (solo para testing)
let tempUsers = [];

// GET /api/auth-temp/test - Verificar que las rutas funcionan
router.get('/test', (req, res) => {
  res.json({
    message: 'Rutas auth-temp funcionando correctamente',
    timestamp: new Date().toISOString(),
    tempUsers: tempUsers.length
  });
});

// POST /api/auth-temp/register - Registro temporal
router.post('/register', async (req, res) => {
  try {
    console.log('=== REGISTER TEMP ===');
    console.log('Body recibido:', req.body);
    
    const { email, password, nombre, apellido } = req.body;

    // Validaciones básicas
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        error: 'Email inválido',
        message: 'Proporciona un email válido'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Contraseña inválida',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    if (!nombre || nombre.length < 2) {
      return res.status(400).json({
        error: 'Nombre inválido',
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    if (!apellido || apellido.length < 2) {
      return res.status(400).json({
        error: 'Apellido inválido',
        message: 'El apellido debe tener al menos 2 caracteres'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = tempUsers.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'Ya existe un usuario con este email'
      });
    }

    // Crear usuario temporal
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      nombre,
      apellido,
      rol: 'usuario',
      createdAt: new Date()
    };

    tempUsers.push(newUser);

    // Generar token JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente (temporal)',
      user: {
        id: newUser.id,
        email: newUser.email,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        rol: newUser.rol
      },
      token
    });

  } catch (error) {
    console.error('Error en register temp:', error);
    res.status(500).json({
      error: 'Error interno',
      message: error.message
    });
  }
});

// POST /api/auth-temp/login - Login temporal
router.post('/login', async (req, res) => {
  try {
    console.log('=== LOGIN TEMP ===');
    console.log('Body recibido:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Datos faltantes',
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const user = tempUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso (temporal)',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol
      },
      token
    });

  } catch (error) {
    console.error('Error en login temp:', error);
    res.status(500).json({
      error: 'Error interno',
      message: error.message
    });
  }
});

// GET /api/auth-temp/users - Listar usuarios temporales
router.get('/users', (req, res) => {
  res.json({
    message: 'Usuarios temporales',
    users: tempUsers.map(u => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      apellido: u.apellido,
      createdAt: u.createdAt
    })),
    total: tempUsers.length
  });
});

module.exports = router;

