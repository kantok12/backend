const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        message: 'Debe proporcionar un token de autenticación'
      });
    }

    // Verificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario existe en PostgreSQL
    const userResult = await query(`
      SELECT * FROM sistema.usuarios 
      WHERE id = $1 AND activo = true
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El usuario no existe o el token es inválido'
      });
    }

    const user = userResult.rows[0];

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      apellido: user.apellido
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'El token ha expirado, debe iniciar sesión nuevamente'
      });
    }

    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al verificar la autenticación'
    });
  }
};

// Middleware para verificar roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debe estar autenticado para acceder a este recurso'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tiene permisos para acceder a este recurso'
      });
    }

    next();
  };
};

// Middleware para verificar si es el propietario del recurso
const requireOwnership = (resourceTable, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      const userId = req.user.id;

      const resourceResult = await query(`
        SELECT * FROM ${resourceTable} 
        WHERE ${resourceIdField} = $1
      `, [resourceId]);

      if (resourceResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Recurso no encontrado',
          message: 'El recurso solicitado no existe'
        });
      }

      const resource = resourceResult.rows[0];

      // Permitir acceso si es administrador o propietario del recurso
      if (req.user.rol === 'admin' || resource.usuario_id === userId) {
        req.resource = resource;
        return next();
      }

      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tiene permisos para acceder a este recurso'
      });
    } catch (error) {
      console.error('Error en middleware de propiedad:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al verificar permisos'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership
};
