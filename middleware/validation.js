const { body, param, query, validationResult } = require('express-validator');

// Función para manejar errores de validación
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

// Validaciones para autenticación
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
];

const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('apellido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  handleValidationErrors
];

// Validaciones para personal
const validatePersonal = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('apellido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('rut')
    .matches(/^\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]{1}$/)
    .withMessage('El RUT debe tener el formato XX.XXX.XXX-X'),
  body('fecha_nacimiento')
    .isISO8601()
    .withMessage('La fecha de nacimiento debe ser válida'),
  body('cargo')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El cargo debe tener entre 2 y 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  body('telefono')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('El teléfono debe tener un formato válido'),
  handleValidationErrors
];

// Validaciones para empresas
const validateEmpresa = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('rut_empresa')
    .matches(/^\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]{1}$/)
    .withMessage('El RUT de la empresa debe tener el formato XX.XXX.XXX-X'),
  body('direccion')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('La dirección debe tener entre 5 y 200 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  body('telefono')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('El teléfono debe tener un formato válido'),
  handleValidationErrors
];

// Validaciones para servicios
const validateServicio = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('descripcion')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('La descripción debe tener entre 10 y 500 caracteres'),
  body('precio')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('duracion_horas')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La duración debe ser un número entero positivo'),
  handleValidationErrors
];

// Validaciones para parámetros de ruta
const validateId = [
  param('id')
    .isUUID()
    .withMessage('El ID debe ser un UUID válido'),
  handleValidationErrors
];

// Validaciones para consultas
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  handleValidationErrors
];

// Validaciones para filtros de búsqueda
const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres'),
  query('filtro')
    .optional()
    .isIn(['nombre', 'cargo', 'empresa', 'servicio'])
    .withMessage('El filtro debe ser uno de: nombre, cargo, empresa, servicio'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validatePersonal,
  validateEmpresa,
  validateServicio,
  validateId,
  validatePagination,
  validateSearch
};
