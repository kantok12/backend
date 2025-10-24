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
// ENDPOINTS PARA MÍNIMO DE PERSONAL
// =====================================================

// GET /api/servicios/minimo-personal - Listar mínimos de personal
router.get('/minimo-personal', async (req, res) => {
  try {
    const { 
      cartera_id, 
      cliente_id, 
      nodo_id, 
      activo = true,
      limit = 50, 
      offset = 0 
    } = req.query;

    console.log('📋 GET /api/servicios/minimo-personal - Listando mínimos de personal');

    let whereConditions = ['mp.activo = $1'];
    let queryParams = [activo === 'true'];
    let paramCount = 1;

    if (cartera_id) {
      paramCount++;
      whereConditions.push(`mp.cartera_id = $${paramCount}`);
      queryParams.push(cartera_id);
    }

    if (cliente_id) {
      paramCount++;
      whereConditions.push(`mp.cliente_id = $${paramCount}`);
      queryParams.push(cliente_id);
    }

    if (nodo_id) {
      paramCount++;
      whereConditions.push(`mp.nodo_id = $${paramCount}`);
      queryParams.push(nodo_id);
    }

    const queryText = `
      SELECT 
        mp.id,
        mp.cartera_id,
        c.name as nombre_cartera,
        mp.cliente_id,
        cl.nombre as nombre_cliente,
        mp.nodo_id,
        n.nombre as nombre_nodo,
        mp.minimo_base,
        mp.descripcion,
        mp.activo,
        mp.created_at,
        mp.updated_at,
        mp.created_by,
        servicios.calcular_minimo_real(mp.id) as minimo_real,
        COALESCE(acuerdos_count.total_acuerdos, 0) as total_acuerdos,
        COALESCE(acuerdos_count.acuerdos_activos, 0) as acuerdos_activos
      FROM servicios.minimo_personal mp
      LEFT JOIN servicios.carteras c ON mp.cartera_id = c.id
      LEFT JOIN servicios.clientes cl ON mp.cliente_id = cl.id
      LEFT JOIN servicios.nodos n ON mp.nodo_id = n.id
      LEFT JOIN (
        SELECT 
          minimo_personal_id,
          COUNT(*) as total_acuerdos,
          COUNT(CASE WHEN estado = 'activo' THEN 1 END) as acuerdos_activos
        FROM servicios.acuerdos
        GROUP BY minimo_personal_id
      ) acuerdos_count ON mp.id = acuerdos_count.minimo_personal_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY mp.cartera_id, mp.cliente_id, mp.nodo_id
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, queryParams);

    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM servicios.minimo_personal mp
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countResult = await query(countQuery, queryParams.slice(0, -2));

    res.json({
      success: true,
      message: 'Mínimos de personal obtenidos exitosamente',
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < parseInt(countResult.rows[0].total)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo mínimos de personal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/servicios/minimo-personal/:id - Obtener mínimo específico
router.get('/minimo-personal/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📋 GET /api/servicios/minimo-personal/${id} - Obteniendo mínimo específico`);

    const result = await query(`
      SELECT 
        mp.id,
        mp.cartera_id,
        c.name as nombre_cartera,
        mp.cliente_id,
        cl.nombre as nombre_cliente,
        mp.nodo_id,
        n.nombre as nombre_nodo,
        mp.minimo_base,
        mp.descripcion,
        mp.activo,
        mp.created_at,
        mp.updated_at,
        mp.created_by,
        servicios.calcular_minimo_real(mp.id) as minimo_real
      FROM servicios.minimo_personal mp
      LEFT JOIN servicios.carteras c ON mp.cartera_id = c.id
      LEFT JOIN servicios.clientes cl ON mp.cliente_id = cl.id
      LEFT JOIN servicios.nodos n ON mp.nodo_id = n.id
      WHERE mp.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mínimo de personal no encontrado'
      });
    }

    // Obtener acuerdos relacionados
    const acuerdosResult = await query(`
      SELECT 
        id,
        tipo_acuerdo,
        valor_modificacion,
        fecha_inicio,
        fecha_fin,
        motivo,
        aprobado_por,
        estado,
        created_at,
        created_by
      FROM servicios.acuerdos
      WHERE minimo_personal_id = $1
      ORDER BY fecha_inicio DESC
    `, [id]);

    res.json({
      success: true,
      message: 'Mínimo de personal obtenido exitosamente',
      data: {
        ...result.rows[0],
        acuerdos: acuerdosResult.rows
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo mínimo de personal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/servicios/minimo-personal - Crear nuevo mínimo de personal
router.post('/minimo-personal', [
  body('cartera_id')
    .isInt({ min: 1 })
    .withMessage('El ID de cartera debe ser un número entero positivo'),
  body('minimo_base')
    .isInt({ min: 1 })
    .withMessage('El mínimo base debe ser un número entero positivo'),
  body('cliente_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de cliente debe ser un número entero positivo'),
  body('nodo_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de nodo debe ser un número entero positivo'),
  body('descripcion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { cartera_id, cliente_id, nodo_id, minimo_base, descripcion } = req.body;

    console.log('➕ POST /api/servicios/minimo-personal - Creando nuevo mínimo de personal');

    // Verificar que la cartera existe
    const carteraCheck = await query('SELECT id FROM servicios.carteras WHERE id = $1', [cartera_id]);
    if (carteraCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La cartera especificada no existe'
      });
    }

    // Verificar que el cliente existe (si se proporciona)
    if (cliente_id) {
      const clienteCheck = await query('SELECT id FROM servicios.clientes WHERE id = $1', [cliente_id]);
      if (clienteCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El cliente especificado no existe'
        });
      }
    }

    // Verificar que el nodo existe (si se proporciona)
    if (nodo_id) {
      const nodoCheck = await query('SELECT id FROM servicios.nodos WHERE id = $1', [nodo_id]);
      if (nodoCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El nodo especificado no existe'
        });
      }
    }

    const result = await query(`
      INSERT INTO servicios.minimo_personal 
      (cartera_id, cliente_id, nodo_id, minimo_base, descripcion, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [cartera_id, cliente_id || null, nodo_id || null, minimo_base, descripcion || null, req.user?.username || 'sistema']);

    res.status(201).json({
      success: true,
      message: 'Mínimo de personal creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error creando mínimo de personal:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un mínimo de personal para esta combinación de cartera, cliente y nodo'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/servicios/minimo-personal/:id - Actualizar mínimo de personal
router.put('/minimo-personal/:id', [
  body('minimo_base')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El mínimo base debe ser un número entero positivo'),
  body('descripcion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser un booleano'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { minimo_base, descripcion, activo } = req.body;

    console.log(`📝 PUT /api/servicios/minimo-personal/${id} - Actualizando mínimo de personal`);

    // Verificar que existe
    const existingCheck = await query('SELECT id FROM servicios.minimo_personal WHERE id = $1', [id]);
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mínimo de personal no encontrado'
      });
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (minimo_base !== undefined) {
      updates.push(`minimo_base = $${paramCount++}`);
      values.push(minimo_base);
    }

    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramCount++}`);
      values.push(descripcion);
    }

    if (activo !== undefined) {
      updates.push(`activo = $${paramCount++}`);
      values.push(activo);
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
      UPDATE servicios.minimo_personal 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    res.json({
      success: true,
      message: 'Mínimo de personal actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error actualizando mínimo de personal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/servicios/minimo-personal/:id - Eliminar mínimo de personal
router.delete('/minimo-personal/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ DELETE /api/servicios/minimo-personal/${id} - Eliminando mínimo de personal`);

    // Verificar que existe
    const existingCheck = await query('SELECT id FROM servicios.minimo_personal WHERE id = $1', [id]);
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mínimo de personal no encontrado'
      });
    }

    // Eliminar (CASCADE eliminará los acuerdos relacionados)
    await query('DELETE FROM servicios.minimo_personal WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Mínimo de personal eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando mínimo de personal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/servicios/minimo-personal/:id/calcular - Calcular mínimo real
router.get('/minimo-personal/:id/calcular', async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha = new Date().toISOString().split('T')[0] } = req.query;

    console.log(`🧮 GET /api/servicios/minimo-personal/${id}/calcular - Calculando mínimo real`);

    // Verificar que existe
    const existingCheck = await query('SELECT id FROM servicios.minimo_personal WHERE id = $1', [id]);
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mínimo de personal no encontrado'
      });
    }

    // Calcular mínimo real usando la función
    const result = await query('SELECT servicios.calcular_minimo_real($1, $2) as minimo_real', [id, fecha]);

    // Obtener detalles de los acuerdos activos
    const acuerdosResult = await query(`
      SELECT 
        id,
        tipo_acuerdo,
        valor_modificacion,
        fecha_inicio,
        fecha_fin,
        motivo,
        estado
      FROM servicios.acuerdos
      WHERE minimo_personal_id = $1
        AND estado = 'activo'
        AND fecha_inicio <= $2
        AND (fecha_fin IS NULL OR fecha_fin >= $2)
      ORDER BY fecha_inicio
    `, [id, fecha]);

    res.json({
      success: true,
      message: 'Mínimo real calculado exitosamente',
      data: {
        minimo_personal_id: id,
        fecha_calculo: fecha,
        minimo_real: parseInt(result.rows[0].minimo_real),
        acuerdos_aplicados: acuerdosResult.rows
      }
    });

  } catch (error) {
    console.error('❌ Error calculando mínimo real:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;







