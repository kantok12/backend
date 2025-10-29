const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
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
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/auth/refresh',
      'POST /api/auth/logout',
      'GET /api/auth/check-users'
    ]
  });
});

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', validateRegister, asyncHandler(async (req, res) => {
  const { email, password, nombre, apellido } = req.body;

  // Verificar si el usuario ya existe
  const existingUserResult = await query(
    'SELECT id FROM sistema.usuarios WHERE email = $1',
    [email]
  );

  if (existingUserResult.rows.length > 0) {
    return res.status(400).json({
      error: 'Usuario ya existe',
      message: 'Ya existe un usuario con este email'
    });
  }

  // Encriptar contraseña
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Crear nuevo usuario
  const newUserResult = await query(`
    INSERT INTO sistema.usuarios (email, password, nombre, apellido, rol, activo, email_verificado)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, email, nombre, apellido, rol
  `, [email, hashedPassword, nombre, apellido, 'usuario', true, false]);

  const newUser = newUserResult.rows[0];

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

  // Buscar usuario por email
  const userResult = await query(`
    SELECT * FROM sistema.usuarios 
    WHERE email = $1 AND activo = true
  `, [email]);

  if (userResult.rows.length === 0) {
    return res.status(401).json({
      error: 'Credenciales inválidas',
      message: 'Email o contraseña incorrectos'
    });
  }

  const user = userResult.rows[0];

  // Verificar si el usuario está bloqueado
  if (user.bloqueado_hasta && new Date() < new Date(user.bloqueado_hasta)) {
    return res.status(423).json({
      error: 'Usuario bloqueado',
      message: 'Su cuenta está temporalmente bloqueada. Intente más tarde.'
    });
  }

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Incrementar intentos fallidos
    await query(`
      UPDATE sistema.usuarios 
      SET intentos_login_fallidos = intentos_login_fallidos + 1,
          bloqueado_hasta = CASE 
            WHEN intentos_login_fallidos >= 4 THEN NOW() + INTERVAL '15 minutes'
            ELSE bloqueado_hasta
          END
      WHERE id = $1
    `, [user.id]);

    return res.status(401).json({
      error: 'Credenciales inválidas',
      message: 'Email o contraseña incorrectos'
    });
  }

  // Resetear intentos fallidos y actualizar último login
  await query(`
    UPDATE sistema.usuarios 
    SET intentos_login_fallidos = 0,
        bloqueado_hasta = NULL,
        ultimo_login = NOW()
    WHERE id = $1
  `, [user.id]);

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
      success: false,
      error: 'Token requerido',
      message: 'Debe proporcionar un token de autenticación'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await query(`
      SELECT 
        u.id,
        u.email,
        u.nombre,
        u.apellido,
        u.rut,
        u.cargo,
        u.cartera_id,
        c.name as cartera_nombre,
        u.rol,
        u.activo,
        u.email_verificado,
        u.ultimo_login,
        u.created_at as fecha_creacion,
        u.profile_image_url
      FROM sistema.usuarios u
      LEFT JOIN servicios.carteras c ON u.cartera_id = c.id
      WHERE u.id = $1 AND u.activo = true
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado',
        message: 'El usuario no existe o está inactivo'
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        rut: user.rut,
        nombres: user.nombre,
        apellidos: user.apellido,
        email: user.email,
        cargo: user.cargo,
        cartera_id: user.cartera_id,
        cartera_nombre: user.cartera_nombre,
        activo: user.activo,
        fecha_creacion: user.fecha_creacion,
        ultimo_acceso: user.ultimo_login,
        profile_image_url: user.profile_image_url
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido',
      message: 'El token proporcionado no es válido'
    });
  }
}));

// GET /api/auth/check-users - Verificar si existen usuarios (endpoint público para debug)
router.get('/check-users', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT 
      COUNT(*) as total_usuarios,
      COUNT(CASE WHEN rol = 'admin' THEN 1 END) as admins,
      COUNT(CASE WHEN activo = true THEN 1 END) as usuarios_activos
    FROM sistema.usuarios
  `);

  const stats = result.rows[0];

  res.json({
    message: 'Información de usuarios',
    totalUsuarios: parseInt(stats.total_usuarios),
    hayUsuarios: parseInt(stats.total_usuarios) > 0,
    admins: parseInt(stats.admins),
    usuariosActivos: parseInt(stats.usuarios_activos),
    sugerencia: parseInt(stats.total_usuarios) === 0 ? 
      'Registra el primer usuario usando POST /api/auth/register' : 
      'Puedes hacer login con usuarios existentes'
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
    
    const userResult = await query(`
      SELECT id, email, nombre, apellido, rol, activo
      FROM sistema.usuarios 
      WHERE id = $1 AND activo = true
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe o está inactivo'
      });
    }

    const user = userResult.rows[0];

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

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const { currentPassword, newPassword } = req.body;

  if (!token) {
    return res.status(401).json({
      error: 'Token requerido',
      message: 'Debe estar autenticado para cambiar la contraseña'
    });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'Datos faltantes',
      message: 'Contraseña actual y nueva contraseña son requeridas'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: 'Contraseña inválida',
      message: 'La nueva contraseña debe tener al menos 6 caracteres'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener usuario actual
    const userResult = await query(`
      SELECT id, password FROM sistema.usuarios 
      WHERE id = $1 AND activo = true
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe o está inactivo'
      });
    }

    const user = userResult.rows[0];

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Contraseña actual incorrecta',
        message: 'La contraseña actual no es correcta'
      });
    }

    // Encriptar nueva contraseña
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await query(`
      UPDATE sistema.usuarios 
      SET password = $1, updated_at = NOW()
      WHERE id = $2
    `, [hashedNewPassword, user.id]);

    res.json({
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'El token proporcionado no es válido'
    });
  }
}));

module.exports = router;