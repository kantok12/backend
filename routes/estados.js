const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET /estados - listar todos los estados (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;

    // Construir consulta SQL
    let queryText = `
      SELECT id, nombre, descripcion, activo
      FROM mantenimiento.estados 
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    // Filtro de búsqueda por nombre
    if (search) {
      queryText += ` AND nombre ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Agregar paginación
    queryText += ` ORDER BY nombre LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Consulta para contar total
    let countQuery = `SELECT COUNT(*) FROM mantenimiento.estados WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND nombre ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: result.rows.length > 0 ? 'Estados obtenidos exitosamente' : 'No se encontraron estados',
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (offset + limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error al obtener estados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estados',
      message: error.message
    });
  }
});

// GET /estados/:id - obtener estado por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const queryText = 'SELECT * FROM mantenimiento.estados WHERE id = $1';
    const result = await query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estado no encontrado',
        message: `No existe un estado con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Estado obtenido exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado',
      message: error.message
    });
  }
});

// POST /estados - crear nuevo estado
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, color } = req.body;

    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'El nombre es requerido'
      });
    }

    const queryText = `
      INSERT INTO mantenimiento.estados (nombre, descripcion, color, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;

    const result = await query(queryText, [
      nombre.trim(),
      descripcion || null,
      color || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Estado creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear estado',
      message: error.message
    });
  }
});

// PUT /estados/:id - actualizar estado
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, color } = req.body;

    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'El nombre es requerido'
      });
    }

    const queryText = `
      UPDATE mantenimiento.estados 
      SET nombre = $1, descripcion = $2, color = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const result = await query(queryText, [
      nombre.trim(),
      descripcion || null,
      color || null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estado no encontrado',
        message: `No existe un estado con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado',
      message: error.message
    });
  }
});

// DELETE /estados/:id - eliminar estado
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const queryText = 'DELETE FROM mantenimiento.estados WHERE id = $1 RETURNING *';
    const result = await query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estado no encontrado',
        message: `No existe un estado con ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Estado eliminado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar estado',
      message: error.message
    });
  }
});

module.exports = router;