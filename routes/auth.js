const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSupabaseClient } = require('../config/database');
const { validateLogin, validateRegister } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/auth/test - Endpoint simple para verificar que las rutas funcionan
router.get('/test', (req, res) => {
  res.json({
    message: 'Las rutas de auth están funcionando',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /api/auth/test',
      'POST /api/auth/debug-register',
      'POST /api/auth/register-simple',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/check-users'
    ]
  });
});

// POST /api/auth/register-simple - Registrar usuario sin validaciones (temporal para debug)
router.post('/register-simple', asyncHandler(async (req, res) => {
  console.log('=== REGISTER SIMPLE ===');
  console.log('Body recibido:', req.body);
  
  const { email, password, nombre, apellido } = req.body;

  // Validaciones manuales para debug
  if (!email || !email.includes('@')) {
    return res.status(400).json({
      error: 'Email inválido',
      message: 'El email debe ser válido',
      received: { email }
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      error: 'Password inválido',
      message: 'La contraseña debe tener al menos 6 caracteres',
      received: { password: password ? `${password.length} caracteres` : 'undefined' }
    });
  }

  if (!nombre || nombre.trim().length < 2) {
    return res.status(400).json({
      error: 'Nombre inválido',
      message: 'El nombre debe tener al menos 2 caracteres',
      received: { nombre, trimmed: nombre ? nombre.trim() : 'undefined' }
    });
  }

  if (!apellido || apellido.trim().length < 2) {
    return res.status(400).json({
      error: 'Apellido inválido',
      message: 'El apellido debe tener al menos 2 caracteres',
      received: { apellido, trimmed: apellido ? apellido.trim() : 'undefined' }
    });
  }

  const supabase = getSupabaseClient();

  // Verificar si el usuario ya existe
  const { data: existingUser, error: checkError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return res.status(400).json({
      error: 'Usuario ya existe',
      message: 'Ya existe un usuario con este email'
    });
  }

  // Encriptar contraseña
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Crear nuevo usuario
  const { data: newUser, error: createError } = await supabase
    .from('usuarios')
    .insert([
      {
        email,
        password: hashedPassword,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        rol: 'usuario',
        activo: true
      }
    ])
    .select('id, email, nombre, apellido, rol')
    .single();

  if (createError) {
    console.error('Error al crear usuario:', createError);
    return res.status(500).json({
      error: 'Error al crear usuario',
      message: 'No se pudo crear el usuario',
      details: createError.message
    });
  }

  // Generar token JWT
  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(201).json({
    message: 'Usuario creado exitosamente',
    user: {
      id: newUser.id,
      email: newUser.email,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      rol: newUser.rol
    },
    token
  });
}));

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', validateRegister, asyncHandler(async (req, res) => {
  const { email, password, nombre, apellido } = req.body;

  const supabase = getSupabaseClient();

  // Verificar si el usuario ya existe
  const { data: existingUser, error: checkError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return res.status(400).json({
      error: 'Usuario ya existe',
      message: 'Ya existe un usuario con este email'
    });
  }

  // Encriptar contraseña
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Crear nuevo usuario
  const { data: newUser, error: createError } = await supabase
    .from('usuarios')
    .insert([
      {
        email,
        password: hashedPassword,
        nombre,
        apellido,
        rol: 'usuario',
        activo: true
      }
    ])
    .select('id, email, nombre, apellido, rol')
    .single();

  if (createError) {
    console.error('Error al crear usuario:', createError);
    return res.status(500).json({
      error: 'Error al crear usuario',
      message: 'No se pudo crear el usuario'
    });
  }

  // Generar token JWT
  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(201).json({
    message: 'Usuario creado exitosamente',
    user: {
      id: newUser.id,
      email: newUser.email,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      rol: newUser.rol
    },
    token
  });
}));

// POST /api/auth/login - Iniciar sesión
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const supabase = getSupabaseClient();

  // Buscar usuario por email
  const { data: user, error: findError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .eq('activo', true)
    .single();

  if (findError || !user) {
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
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    message: 'Inicio de sesión exitoso',
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      rol: user.rol
    },
    token
  });
}));

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', (req, res) => {
  // En una implementación real, podrías invalidar el token
  // Por ahora, solo devolvemos un mensaje de éxito
  res.json({
    message: 'Sesión cerrada exitosamente'
  });
});

// GET /api/auth/me - Obtener información del usuario actual
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token requerido',
      message: 'Debe proporcionar un token de autenticación'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const supabase = getSupabaseClient();

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, rol, activo')
      .eq('id', decoded.userId)
      .single();

    if (error || !user || !user.activo) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe o está inactivo'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol
      }
    });
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'El token proporcionado no es válido'
    });
  }
}));

// POST /api/auth/debug-register - Debug para verificar qué datos llegan al servidor
router.post('/debug-register', (req, res) => {
  console.log('=== DEBUG REGISTER ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body || {}));
  
  res.json({
    message: 'Debug información',
    receivedBody: req.body,
    contentType: req.get('Content-Type'),
    bodyType: typeof req.body,
    bodyKeys: Object.keys(req.body || {})
  });
});

// GET /api/auth/check-users - Verificar si existen usuarios (endpoint público para debug)
router.get('/check-users', asyncHandler(async (req, res) => {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true });

  if (error) {
    return res.status(500).json({
      error: 'Error al verificar usuarios',
      details: error.message
    });
  }

  res.json({
    message: 'Información de usuarios',
    totalUsuarios: count,
    hayUsuarios: count > 0,
    sugerencia: count === 0 ? 'Registra el primer usuario usando POST /api/auth/register' : 'Puedes hacer login con usuarios existentes'
  });
}));

// POST /api/auth/refresh - Renovar token
router.post('/refresh', asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token requerido',
      message: 'Debe proporcionar un token de autenticación'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const supabase = getSupabaseClient();

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, rol, activo')
      .eq('id', decoded.userId)
      .single();

    if (error || !user || !user.activo) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe o está inactivo'
      });
    }

    // Generar nuevo token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Token renovado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol
      },
      token: newToken
    });
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'El token proporcionado no es válido'
    });
  }
}));

module.exports = router;
