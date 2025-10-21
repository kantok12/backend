const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const router = express.Router();

// Middleware para manejar errores de validación
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

// =====================================================
// ENDPOINTS PARA ACUERDOS
// =====================================================

// GET /api/servicios/acuerdos - Listar acuerdos
router.get('/acuerdos', async (req, res) => {
  try {
    const { 
      minimo_personal_id,
      tipo_acuerdo,
      estado = 'activo',
      fecha_desde,
      fecha_hasta,
      limit = 50, 
      offset = 0 
    } = req.query;

    console.log('📋 GET /api/servicios/acuerdos - Listando acuerdos');

    let whereConditions = ['a.estado = $1'];
    let queryParams = [estado];
    let paramCount = 1;

    if (minimo_personal_id) {
      paramCount++;
      whereConditions.push(`a.minimo_personal_id = $${paramCount}`);
      queryParams.push(minimo_personal_id);
    }

    if (tipo_acuerdo) {
      paramCount++;
      whereConditions.push(`a.tipo_acuerdo = $${paramCount}`);
      queryParams.push(tipo_acuerdo);
    }

    if (fecha_desde) {
      paramCount++;
      whereConditions.push(`a.fecha_inicio >= $${paramCount}`);
      queryParams.push(fecha_desde);
    }

    if (fecha_hasta) {
      paramCount++;
      whereConditions.push(`(a.fecha_fin IS NULL OR a.fecha_fin <= $${paramCount})`);
      queryParams.push(fecha_hasta);
    }

    const queryText = `
      SELECT 
        a.id,
        a.minimo_personal_id,
        a.tipo_acuerdo,
        a.valor_modificacion,
        a.fecha_inicio,
        a.fecha_fin,
        a.motivo,
        a.aprobado_por,
        a.estado,
        a.created_at,
        a.updated_at,
        a.created_by,
        mp.cartera_id,
        c.name as nombre_cartera,
        mp.cliente_id,
        cl.nombre as nombre_cliente,
        mp.nodo_id,
        n.nombre as nombre_nodo,
        mp.minimo_base,
        servicios.calcular_minimo_real(mp.id) as minimo_real_actual
      FROM servicios.acuerdos a
      JOIN servicios.minimo_personal mp ON a.minimo_personal_id = mp.id
      LEFT JOIN servicios.carteras c ON mp.cartera_id = c.id
      LEFT JOIN servicios.clientes cl ON mp.cliente_id = cl.id
      LEFT JOIN servicios.nodos n ON mp.nodo_id = n.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY a.fecha_inicio DESC, a.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, queryParams);

    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM servicios.acuerdos a
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countResult = await query(countQuery, queryParams.slice(0, -2));

    res.json({
      success: true,
      message: 'Acuerdos obtenidos exitosamente',
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < parseInt(countResult.rows[0].total)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo acuerdos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/servicios/acuerdos/:id - Obtener acuerdo específico
router.get('/acuerdos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📋 GET /api/servicios/acuerdos/${id} - Obteniendo acuerdo específico`);

    const result = await query(`
      SELECT 
        a.id,
        a.minimo_personal_id,
        a.tipo_acuerdo,
        a.valor_modificacion,
        a.fecha_inicio,
        a.fecha_fin,
        a.motivo,
        a.aprobado_por,
        a.estado,
        a.created_at,
        a.updated_at,
        a.created_by,
        mp.cartera_id,
        c.name as nombre_cartera,
        mp.cliente_id,
        cl.nombre as nombre_cliente,
        mp.nodo_id,
        n.nombre as nombre_nodo,
        mp.minimo_base,
        servicios.calcular_minimo_real(mp.id) as minimo_real_actual
      FROM servicios.acuerdos a
      JOIN servicios.minimo_personal mp ON a.minimo_personal_id = mp.id
      LEFT JOIN servicios.carteras c ON mp.cartera_id = c.id
      LEFT JOIN servicios.clientes cl ON mp.cliente_id = cl.id
      LEFT JOIN servicios.nodos n ON mp.nodo_id = n.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Acuerdo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Acuerdo obtenido exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo acuerdo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/servicios/acuerdos - Crear nuevo acuerdo
router.post('/acuerdos', [
  body('minimo_personal_id')
    .isInt({ min: 1 })
    .withMessage('El ID de mínimo personal debe ser un número entero positivo'),
  body('tipo_acuerdo')
    .isIn(['incremento', 'reduccion', 'temporal'])
    .withMessage('El tipo de acuerdo debe ser: incremento, reduccion o temporal'),
  body('valor_modificacion')
    .isInt()
    .withMessage('El valor de modificación debe ser un número entero'),
  body('fecha_inicio')
    .isISO8601()
    .withMessage('La fecha de inicio debe ser una fecha válida'),
  body('fecha_fin')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe ser una fecha válida'),
  body('motivo')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('El motivo no puede exceder 1000 caracteres'),
  body('aprobado_por')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El campo aprobado_por no puede exceder 100 caracteres'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { 
      minimo_personal_id, 
      tipo_acuerdo, 
      valor_modificacion, 
      fecha_inicio, 
      fecha_fin, 
      motivo, 
      aprobado_por 
    } = req.body;

    console.log('➕ POST /api/servicios/acuerdos - Creando nuevo acuerdo');

    // Verificar que el mínimo de personal existe
    const minimoCheck = await query('SELECT id FROM servicios.minimo_personal WHERE id = $1', [minimo_personal_id]);
    if (minimoCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El mínimo de personal especificado no existe'
      });
    }

    // Validar fechas
    if (fecha_fin && new Date(fecha_fin) < new Date(fecha_inicio)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin no puede ser anterior a la fecha de inicio'
      });
    }

    // Validar que no haya conflictos de fechas con acuerdos activos del mismo tipo
    const conflictCheck = await query(`
      SELECT id FROM servicios.acuerdos 
      WHERE minimo_personal_id = $1 
        AND estado = 'activo'
        AND tipo_acuerdo = $2
        AND (
          (fecha_inicio <= $3 AND (fecha_fin IS NULL OR fecha_fin >= $3)) OR
          (fecha_inicio <= $4 AND (fecha_fin IS NULL OR fecha_fin >= $4)) OR
          (fecha_inicio >= $3 AND (fecha_fin IS NULL OR fecha_fin <= $4))
        )
    `, [minimo_personal_id, tipo_acuerdo, fecha_inicio, fecha_fin || fecha_inicio]);

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un acuerdo activo del mismo tipo en el rango de fechas especificado'
      });
    }

    const result = await query(`
      INSERT INTO servicios.acuerdos 
      (minimo_personal_id, tipo_acuerdo, valor_modificacion, fecha_inicio, fecha_fin, motivo, aprobado_por, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      minimo_personal_id, 
      tipo_acuerdo, 
      valor_modificacion, 
      fecha_inicio, 
      fecha_fin || null, 
      motivo || null, 
      aprobado_por || null,
      req.user?.username || 'sistema'
    ]);

    res.status(201).json({
      success: true,
      message: 'Acuerdo creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error creando acuerdo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/servicios/acuerdos/:id - Actualizar acuerdo
router.put('/acuerdos/:id', [
  body('tipo_acuerdo')
    .optional()
    .isIn(['incremento', 'reduccion', 'temporal'])
    .withMessage('El tipo de acuerdo debe ser: incremento, reduccion o temporal'),
  body('valor_modificacion')
    .optional()
    .isInt()
    .withMessage('El valor de modificación debe ser un número entero'),
  body('fecha_inicio')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser una fecha válida'),
  body('fecha_fin')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe ser una fecha válida'),
  body('motivo')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('El motivo no puede exceder 1000 caracteres'),
  body('aprobado_por')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El campo aprobado_por no puede exceder 100 caracteres'),
  body('estado')
    .optional()
    .isIn(['activo', 'inactivo', 'vencido'])
    .withMessage('El estado debe ser: activo, inactivo o vencido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tipo_acuerdo, 
      valor_modificacion, 
      fecha_inicio, 
      fecha_fin, 
      motivo, 
      aprobado_por, 
      estado 
    } = req.body;

    console.log(`📝 PUT /api/servicios/acuerdos/${id} - Actualizando acuerdo`);

    // Verificar que existe
    const existingCheck = await query('SELECT id FROM servicios.acuerdos WHERE id = $1', [id]);
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Acuerdo no encontrado'
      });
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (tipo_acuerdo !== undefined) {
      updates.push(`tipo_acuerdo = $${paramCount++}`);
      values.push(tipo_acuerdo);
    }

    if (valor_modificacion !== undefined) {
      updates.push(`valor_modificacion = $${paramCount++}`);
      values.push(valor_modificacion);
    }

    if (fecha_inicio !== undefined) {
      updates.push(`fecha_inicio = $${paramCount++}`);
      values.push(fecha_inicio);
    }

    if (fecha_fin !== undefined) {
      updates.push(`fecha_fin = $${paramCount++}`);
      values.push(fecha_fin);
    }

    if (motivo !== undefined) {
      updates.push(`motivo = $${paramCount++}`);
      values.push(motivo);
    }

    if (aprobado_por !== undefined) {
      updates.push(`aprobado_por = $${paramCount++}`);
      values.push(aprobado_por);
    }

    if (estado !== undefined) {
      updates.push(`estado = $${paramCount++}`);
      values.push(estado);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(`
      UPDATE servicios.acuerdos 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    res.json({
      success: true,
      message: 'Acuerdo actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error actualizando acuerdo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/servicios/acuerdos/:id - Eliminar acuerdo
router.delete('/acuerdos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ DELETE /api/servicios/acuerdos/${id} - Eliminando acuerdo`);

    // Verificar que existe
    const existingCheck = await query('SELECT id FROM servicios.acuerdos WHERE id = $1', [id]);
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Acuerdo no encontrado'
      });
    }

    // Eliminar
    await query('DELETE FROM servicios.acuerdos WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Acuerdo eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando acuerdo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/servicios/acuerdos/vencer - Obtener acuerdos próximos a vencer
router.get('/acuerdos/vencer', async (req, res) => {
  try {
    const { dias = 30, limit = 50, offset = 0 } = req.query;

    console.log(`📅 GET /api/servicios/acuerdos/vencer - Acuerdos próximos a vencer en ${dias} días`);

    const result = await query(`
      SELECT 
        a.id,
        a.minimo_personal_id,
        a.tipo_acuerdo,
        a.valor_modificacion,
        a.fecha_inicio,
        a.fecha_fin,
        a.motivo,
        a.estado,
        mp.cartera_id,
        c.name as nombre_cartera,
        mp.cliente_id,
        cl.nombre as nombre_cliente,
        mp.nodo_id,
        n.nombre as nombre_nodo,
        (a.fecha_fin - CURRENT_DATE) as dias_restantes
      FROM servicios.acuerdos a
      JOIN servicios.minimo_personal mp ON a.minimo_personal_id = mp.id
      LEFT JOIN servicios.carteras c ON mp.cartera_id = c.id
      LEFT JOIN servicios.clientes cl ON mp.cliente_id = cl.id
      LEFT JOIN servicios.nodos n ON mp.nodo_id = n.id
      WHERE a.estado = 'activo'
        AND a.fecha_fin IS NOT NULL
        AND a.fecha_fin <= CURRENT_DATE + INTERVAL '${parseInt(dias)} days'
        AND a.fecha_fin >= CURRENT_DATE
      ORDER BY a.fecha_fin ASC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    // Contar total
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM servicios.acuerdos a
      WHERE a.estado = 'activo'
        AND a.fecha_fin IS NOT NULL
        AND a.fecha_fin <= CURRENT_DATE + INTERVAL '${parseInt(dias)} days'
        AND a.fecha_fin >= CURRENT_DATE
    `);

    res.json({
      success: true,
      message: `Acuerdos próximos a vencer en ${dias} días obtenidos exitosamente`,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < parseInt(countResult.rows[0].total)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo acuerdos próximos a vencer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/servicios/acuerdos/:id/activar - Activar acuerdo
router.post('/acuerdos/:id/activar', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`✅ POST /api/servicios/acuerdos/${id}/activar - Activando acuerdo`);

    const result = await query(`
      UPDATE servicios.acuerdos 
      SET estado = 'activo', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Acuerdo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Acuerdo activado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error activando acuerdo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/servicios/acuerdos/:id/desactivar - Desactivar acuerdo
router.post('/acuerdos/:id/desactivar', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`❌ POST /api/servicios/acuerdos/${id}/desactivar - Desactivando acuerdo`);

    const result = await query(`
      UPDATE servicios.acuerdos 
      SET estado = 'inactivo', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Acuerdo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Acuerdo desactivado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error desactivando acuerdo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;





