const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { body, param, query: queryValidator, validationResult } = require('express-validator');

const router = express.Router();

// Middleware de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Error de validación',
      message: 'Los datos proporcionados no son válidos',
      details: errors.array()
    });
  }
  next();
};

// Validaciones para usuarios
const validateUserCreate = [
  body('email')
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('apellido')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener entre 2 y 100 caracteres'),
  body('rol')
    .optional()
    .isIn(['admin', 'supervisor', 'usuario', 'operador'])
    .withMessage('El rol debe ser uno de: admin, supervisor, usuario, operador'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('apellido')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener entre 2 y 100 caracteres'),
  body('rol')
    .optional()
    .isIn(['admin', 'supervisor', 'usuario', 'operador'])
    .withMessage('El rol debe ser uno de: admin, supervisor, usuario, operador'),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser un booleano'),
  handleValidationErrors
];

const validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),
  handleValidationErrors
];

const validatePagination = [
  queryValidator('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),
  queryValidator('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  handleValidationErrors
];

// GET /api/users - Listar usuarios (solo admin y supervisor)
router.get('/', authenticateToken, requireRole(['admin', 'supervisor']), validatePagination, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let whereClause = '';
  let queryParams = [];
  let paramCount = 0;

  if (search) {
    paramCount++;
    whereClause = `WHERE (nombre ILIKE $${paramCount} OR apellido ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
    queryParams.push(`%${search}%`);
  }

  // Obtener usuarios
  const usersQuery = `
    SELECT 
      id, email, nombre, apellido, rol, activo, 
      email_verificado, ultimo_login, created_at, updated_at
    FROM sistema.usuarios 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;
  
  queryParams.push(limit, offset);
  
  const usersResult = await query(usersQuery, queryParams);

  // Obtener total de usuarios
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM sistema.usuarios 
    ${whereClause}
  `;
  
  const countResult = await query(countQuery, queryParams.slice(0, paramCount));
  const total = parseInt(countResult.rows[0].total);

  res.json({
    message: 'Usuarios obtenidos exitosamente',
    users: usersResult.rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  });
}));

// GET /api/users/stats - Estadísticas de usuarios (solo admin y supervisor)
router.get('/stats', authenticateToken, requireRole(['admin', 'supervisor']), asyncHandler(async (req, res) => {
  const statsResult = await query(`
    SELECT 
      COUNT(*) as total_usuarios,
      COUNT(CASE WHEN rol = 'admin' THEN 1 END) as admins,
      COUNT(CASE WHEN rol = 'supervisor' THEN 1 END) as supervisors,
      COUNT(CASE WHEN rol = 'usuario' THEN 1 END) as usuarios,
      COUNT(CASE WHEN rol = 'operador' THEN 1 END) as operadores,
      COUNT(CASE WHEN activo = true THEN 1 END) as usuarios_activos,
      COUNT(CASE WHEN activo = false THEN 1 END) as usuarios_inactivos,
      COUNT(CASE WHEN email_verificado = true THEN 1 END) as emails_verificados,
      COUNT(CASE WHEN ultimo_login > NOW() - INTERVAL '30 days' THEN 1 END) as usuarios_activos_30_dias
    FROM sistema.usuarios
  `);

  const stats = statsResult.rows[0];

  res.json({
    message: 'Estadísticas de usuarios obtenidas exitosamente',
    stats: {
      total: parseInt(stats.total_usuarios),
      porRol: {
        admins: parseInt(stats.admins),
        supervisors: parseInt(stats.supervisors),
        usuarios: parseInt(stats.usuarios),
        operadores: parseInt(stats.operadores)
      },
      porEstado: {
        activos: parseInt(stats.usuarios_activos),
        inactivos: parseInt(stats.usuarios_inactivos)
      },
      verificacion: {
        emailsVerificados: parseInt(stats.emails_verificados),
        emailsSinVerificar: parseInt(stats.total_usuarios) - parseInt(stats.emails_verificados)
      },
      actividad: {
        activosUltimos30Dias: parseInt(stats.usuarios_activos_30_dias)
      }
    }
  });
}));

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', authenticateToken, validateUserId, asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Verificar permisos: admin/supervisor pueden ver cualquier usuario, otros solo pueden verse a sí mismos
  if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor' && req.user.id != userId) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'No tiene permisos para ver este usuario'
    });
  }

  const userResult = await query(`
    SELECT 
      id, email, nombre, apellido, rol, activo, 
      email_verificado, ultimo_login, created_at, updated_at
    FROM sistema.usuarios 
    WHERE id = $1
  `, [userId]);

  if (userResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Usuario no encontrado',
      message: 'El usuario solicitado no existe'
    });
  }

  res.json({
    message: 'Usuario obtenido exitosamente',
    user: userResult.rows[0]
  });
}));

// POST /api/users - Crear nuevo usuario (solo admin)
router.post('/', authenticateToken, requireRole(['admin']), validateUserCreate, asyncHandler(async (req, res) => {
  const { email, password, nombre, apellido, rol = 'usuario' } = req.body;

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
    RETURNING id, email, nombre, apellido, rol, activo, email_verificado, created_at
  `, [email, hashedPassword, nombre, apellido, rol, true, false]);

  const newUser = newUserResult.rows[0];

  res.status(201).json({
    message: 'Usuario creado exitosamente',
    user: newUser
  });
}));

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', authenticateToken, validateUserId, validateUserUpdate, asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { email, nombre, apellido, rol, activo } = req.body;

  // Verificar permisos: admin puede actualizar cualquier usuario, otros solo pueden actualizarse a sí mismos
  if (req.user.rol !== 'admin' && req.user.id != userId) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'No tiene permisos para actualizar este usuario'
    });
  }

  // Verificar que el usuario existe
  const existingUserResult = await query(
    'SELECT * FROM sistema.usuarios WHERE id = $1',
    [userId]
  );

  if (existingUserResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Usuario no encontrado',
      message: 'El usuario solicitado no existe'
    });
  }

  // Si se está cambiando el email, verificar que no exista otro usuario con ese email
  if (email && email !== existingUserResult.rows[0].email) {
    const emailCheckResult = await query(
      'SELECT id FROM sistema.usuarios WHERE email = $1 AND id != $2',
      [email, userId]
    );

    if (emailCheckResult.rows.length > 0) {
      return res.status(400).json({
        error: 'Email ya existe',
        message: 'Ya existe otro usuario con este email'
      });
    }
  }

  // Construir query de actualización dinámicamente
  const updateFields = [];
  const updateValues = [];
  let paramCount = 0;

  if (email) {
    paramCount++;
    updateFields.push(`email = $${paramCount}`);
    updateValues.push(email);
  }

  if (nombre) {
    paramCount++;
    updateFields.push(`nombre = $${paramCount}`);
    updateValues.push(nombre);
  }

  if (apellido) {
    paramCount++;
    updateFields.push(`apellido = $${paramCount}`);
    updateValues.push(apellido);
  }

  if (rol && req.user.rol === 'admin') { // Solo admin puede cambiar roles
    paramCount++;
    updateFields.push(`rol = $${paramCount}`);
    updateValues.push(rol);
  }

  if (activo !== undefined && req.user.rol === 'admin') { // Solo admin puede activar/desactivar
    paramCount++;
    updateFields.push(`activo = $${paramCount}`);
    updateValues.push(activo);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({
      error: 'Sin cambios',
      message: 'No se proporcionaron campos para actualizar'
    });
  }

  paramCount++;
  updateValues.push(userId);

  const updateQuery = `
    UPDATE sistema.usuarios 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
    RETURNING id, email, nombre, apellido, rol, activo, email_verificado, updated_at
  `;

  const updateResult = await query(updateQuery, updateValues);

  res.json({
    message: 'Usuario actualizado exitosamente',
    user: updateResult.rows[0]
  });
}));

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete('/:id', authenticateToken, requireRole(['admin']), validateUserId, asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // No permitir eliminar el propio usuario
  if (req.user.id == userId) {
    return res.status(400).json({
      error: 'Operación no permitida',
      message: 'No puede eliminar su propio usuario'
    });
  }

  // Verificar que el usuario existe
  const existingUserResult = await query(
    'SELECT id, email FROM sistema.usuarios WHERE id = $1',
    [userId]
  );

  if (existingUserResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Usuario no encontrado',
      message: 'El usuario solicitado no existe'
    });
  }

  // Eliminar usuario
  await query('DELETE FROM sistema.usuarios WHERE id = $1', [userId]);

  res.json({
    message: 'Usuario eliminado exitosamente',
    deletedUser: {
      id: existingUserResult.rows[0].id,
      email: existingUserResult.rows[0].email
    }
  });
}));

// POST /api/users/:id/reset-password - Resetear contraseña (solo admin)
router.post('/:id/reset-password', authenticateToken, requireRole(['admin']), validateUserId, asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      error: 'Contraseña inválida',
      message: 'La nueva contraseña debe tener al menos 6 caracteres'
    });
  }

  // Verificar que el usuario existe
  const existingUserResult = await query(
    'SELECT id, email FROM sistema.usuarios WHERE id = $1',
    [userId]
  );

  if (existingUserResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Usuario no encontrado',
      message: 'El usuario solicitado no existe'
    });
  }

  // Encriptar nueva contraseña
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Actualizar contraseña
  await query(`
    UPDATE sistema.usuarios 
    SET password = $1, updated_at = NOW()
    WHERE id = $2
  `, [hashedPassword, userId]);

  res.json({
    message: 'Contraseña reseteada exitosamente',
    user: {
      id: existingUserResult.rows[0].id,
      email: existingUserResult.rows[0].email
    }
  });
}));

module.exports = router;
