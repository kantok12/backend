const express = require('express');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const { matchForCliente } = require('../services/prerrequisitosService');
const { getPersonasQueCumplen } = require('../services/prerrequisitosService');

// Middleware para validar errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/prerrequisitos/cliente/:cliente_id - Listar prerrequisitos globales Y los de un cliente específico
router.get('/cliente/:cliente_id', async (req, res) => {
  try {
    const { cliente_id } = req.params;
    
    const result = await query(`
      SELECT 
        id, 
        cliente_id, 
        tipo_documento, 
        descripcion, 
        dias_duracion, 
        created_at, 
        updated_at,
        CASE 
          WHEN cliente_id IS NULL THEN true
          ELSE false
        END as es_global
      FROM mantenimiento.cliente_prerrequisitos
      WHERE cliente_id = $1 OR cliente_id IS NULL
      ORDER BY es_global DESC, tipo_documento ASC
    `, [cliente_id]);

    res.json({
      success: true,
      message: 'Prerrequisitos obtenidos exitosamente',
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Error obteniendo prerrequisitos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/prerrequisitos/globales - Listar solo los prerrequisitos globales
router.get('/globales', async (req, res) => {
    try {
      const result = await query(`
        SELECT id, cliente_id, tipo_documento, descripcion, dias_duracion, created_at, updated_at
        FROM mantenimiento.cliente_prerrequisitos
        WHERE cliente_id IS NULL
        ORDER BY tipo_documento
      `);
  
      res.json({
        success: true,
        message: 'Prerrequisitos globales obtenidos exitosamente',
        data: result.rows
      });
  
    } catch (error) {
      console.error('❌ Error obteniendo prerrequisitos globales:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  });

// POST /api/prerrequisitos - Crear un nuevo prerrequisito (global o específico)
router.post('/', [
  body('cliente_id').optional().isInt({ min: 1 }).withMessage('El ID de cliente debe ser un número entero válido.'),
  body('tipo_documento').notEmpty().withMessage('El tipo de documento es requerido.'),
  body('dias_duracion').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Los días de duración deben ser un número entero no negativo.'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { cliente_id, tipo_documento, descripcion, dias_duracion } = req.body;
    const finalClienteId = cliente_id || null; // Si no viene cliente_id, es global (NULL)
    const finalDiasDuracion = dias_duracion || null;

    const result = await query(`
      INSERT INTO mantenimiento.cliente_prerrequisitos (cliente_id, tipo_documento, descripcion, dias_duracion)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [finalClienteId, tipo_documento, descripcion, finalDiasDuracion]);

    res.status(201).json({
      success: true,
      message: `Prerrequisito ${finalClienteId ? 'específico' : 'global'} creado exitosamente.`,
      data: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') { // unique_violation
      return res.status(409).json({
        success: false,
        message: 'Error de unicidad: Este tipo de documento ya existe para este cliente o como prerrequisito global.'
      });
    }
    if (error.code === '23503') { // foreign_key_violation
        return res.status(400).json({
          success: false,
          message: 'El cliente especificado no existe.'
        });
      }
    console.error('❌ Error creando prerrequisito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/prerrequisitos/:id - Actualizar un prerrequisito
router.put('/:id', [
  body('tipo_documento').notEmpty().withMessage('El tipo de documento es requerido.'),
  body('dias_duracion').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Los días de duración deben ser un número entero no negativo.'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_documento, descripcion, dias_duracion } = req.body;
    const finalDiasDuracion = dias_duracion || null;

    const result = await query(`
      UPDATE mantenimiento.cliente_prerrequisitos
      SET tipo_documento = $1, descripcion = $2, dias_duracion = $3
      WHERE id = $4
      RETURNING *
    `, [tipo_documento, descripcion, finalDiasDuracion, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prerrequisito no encontrado.'
      });
    }

    res.json({
      success: true,
      message: 'Prerrequisito actualizado exitosamente.',
      data: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Error de unicidad: Este tipo de documento ya existe para este cliente o como prerrequisito global.'
        });
      }
    console.error('❌ Error actualizando prerrequisito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/prerrequisitos/:id - Eliminar un prerrequisito
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM mantenimiento.cliente_prerrequisitos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prerrequisito no encontrado.'
      });
    }

    res.json({
      success: true,
      message: 'Prerrequisito eliminado exitosamente.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error eliminando prerrequisito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/prerrequisitos/clientes/:clienteId/match - Realizar matching de prerrequisitos para un conjunto de RUTs
router.post('/clientes/:clienteId/match', [
  body('ruts').isArray({ min: 1 }).withMessage('El campo ruts debe ser un array con al menos un RUT.'),
  body('requireAll').optional().isBoolean(),
  body('includeGlobal').optional().isBoolean(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { ruts, requireAll = true, includeGlobal = true } = req.body;

    // Llamar al servicio
    const results = await matchForCliente(parseInt(clienteId, 10), ruts, { requireAll, includeGlobal });

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ Error en matching de prerrequisitos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/prerrequisitos/clientes/:clienteId/cumplen - Obtener personas que cumplen TODOS los prerrequisitos
router.get('/clientes/:clienteId/cumplen', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const includeGlobal = req.query.includeGlobal !== 'false';
    const limit = parseInt(req.query.limit) || 1000;
    const offset = parseInt(req.query.offset) || 0;

    const result = await getPersonasQueCumplen(parseInt(clienteId, 10), { includeGlobal, limit, offset });

    if (!result || !result.data) {
      return res.json({ success: true, message: result.message || 'No data', data: [] });
    }

    res.json({ success: true, message: result.message || 'OK', data: result.data });
  } catch (error) {
    console.error('❌ Error en GET /api/prerrequisitos/clientes/:clienteId/cumplen:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

module.exports = router;




