const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

// GET /plantas - obtener todas las plantas
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const estado = req.query.estado;
    const faenaId = req.query.faena_id;

    let sqlQuery = `
      SELECT * FROM lubricacion.plantas
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      sqlQuery += ` AND (nombre ILIKE $${paramCount} OR descripcion ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (estado) {
      paramCount++;
      sqlQuery += ` AND estado = $${paramCount}`;
      params.push(estado);
    }

    if (faenaId) {
      paramCount++;
      sqlQuery += ` AND faena_id = $${paramCount}`;
      params.push(faenaId);
    }

    sqlQuery += ` ORDER BY id LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener plantas',
      details: error.message 
    });
  }
});

// GET /plantas/:id - obtener planta por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM lubricacion.plantas WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Planta no encontrada',
        message: `No se encontró una planta con ID: ${id}`
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /plantas - crear nueva planta
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, ubicacion, estado, faena_id } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      INSERT INTO lubricacion.plantas (nombre, descripcion, ubicacion, estado, faena_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [nombre, descripcion, ubicacion, estado, faena_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al crear planta',
      details: error.message 
    });
  }
});

// PUT /plantas/:id - actualizar planta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, ubicacion, estado, faena_id } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      UPDATE lubricacion.plantas 
      SET nombre = $1, descripcion = $2, ubicacion = $3, estado = $4, faena_id = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [nombre, descripcion, ubicacion, estado, faena_id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Planta no encontrada',
        message: `No se encontró una planta con ID: ${id}`
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al actualizar planta',
      details: error.message 
    });
  }
});

// DELETE /plantas/:id - eliminar planta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await query('SELECT id FROM lubricacion.plantas WHERE id = $1', [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Planta no encontrada',
        message: `No se encontró una planta con ID: ${id}`
      });
    }

    await query('DELETE FROM lubricacion.plantas WHERE id = $1', [id]);

    res.json({ 
      message: 'Planta eliminada exitosamente',
      id: id 
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al eliminar planta',
      details: error.message 
    });
  }
});

module.exports = router;