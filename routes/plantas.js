const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

// GET /plantas - listar todas las plantas (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const faenaId = req.query.faena_id;

    // Construir consulta SQL
    let queryText = `
      SELECT p.*, f.nombre as faena_nombre 
      FROM mantenimiento.plantas p
      LEFT JOIN mantenimiento.faenas f ON p.faena_id = f.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    // Filtro por faena
    if (faenaId) {
      queryText += ` AND p.faena_id = $${paramIndex}`;
      queryParams.push(faenaId);
      paramIndex++;
    }

    // Filtro de búsqueda por nombre
    if (search) {
      queryText += ` AND p.nombre ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Agregar paginación
    queryText += ` ORDER BY p.nombre LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Consulta para contar total
    let countQuery = `SELECT COUNT(*) FROM mantenimiento.plantas p WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (faenaId) {
      countQuery += ` AND p.faena_id = $${countParamIndex}`;
      countParams.push(faenaId);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND p.nombre ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: result.rows.length > 0 ? 'Plantas obtenidas exitosamente' : 'No se encontraron plantas',
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (offset + limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error al obtener plantas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener plantas',
      message: error.message
    });
  }
});

// GET /plantas/:id - obtener planta por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const queryText = `
      SELECT p.*, f.nombre as faena_nombre 
      FROM mantenimiento.plantas p
      LEFT JOIN mantenimiento.faenas f ON p.faena_id = f.id
      WHERE p.id = $1
    `;

    const result = await query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Planta no encontrada',
        message: `No existe una planta con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Planta obtenida exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener planta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener planta',
      message: error.message
    });
  }
});

// POST /plantas - crear nueva planta
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, faena_id } = req.body;

    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'El nombre es requerido'
      });
    }

    const queryText = `
      INSERT INTO mantenimiento.plantas (nombre, descripcion, faena_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;

    const result = await query(queryText, [
      nombre.trim(),
      descripcion || null,
      faena_id || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Planta creada exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear planta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear planta',
      message: error.message
    });
  }
});

// PUT /plantas/:id - actualizar planta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, faena_id } = req.body;

    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'El nombre es requerido'
      });
    }

    const queryText = `
      UPDATE mantenimiento.plantas 
      SET nombre = $1, descripcion = $2, faena_id = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const result = await query(queryText, [
      nombre.trim(),
      descripcion || null,
      faena_id || null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Planta no encontrada',
        message: `No existe una planta con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Planta actualizada exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar planta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar planta',
      message: error.message
    });
  }
});

// DELETE /plantas/:id - eliminar planta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const queryText = 'DELETE FROM mantenimiento.plantas WHERE id = $1 RETURNING *';
    const result = await query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Planta no encontrada',
        message: `No existe una planta con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Planta eliminada exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar planta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar planta',
      message: error.message
    });
  }
});

module.exports = router;