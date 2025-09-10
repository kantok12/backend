const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

// GET /faenas - obtener todas las faenas
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const estado = req.query.estado;

    let sqlQuery = `
      SELECT * FROM lubricacion.faenas
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

    sqlQuery += ` ORDER BY id LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener faenas',
      details: error.message 
    });
  }
});

// GET /faenas/:id - obtener faena por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM lubricacion.faenas WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Faena no encontrada',
        message: `No se encontró una faena con ID: ${id}`
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

// POST /faenas - crear nueva faena
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, ubicacion, estado } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      INSERT INTO lubricacion.faenas (nombre, descripcion, ubicacion, estado)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [nombre, descripcion, ubicacion, estado]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al crear faena',
      details: error.message 
    });
  }
});

// PUT /faenas/:id - actualizar faena
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, ubicacion, estado } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      UPDATE lubricacion.faenas 
      SET nombre = $1, descripcion = $2, ubicacion = $3, estado = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [nombre, descripcion, ubicacion, estado, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Faena no encontrada',
        message: `No se encontró una faena con ID: ${id}`
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al actualizar faena',
      details: error.message 
    });
  }
});

// DELETE /faenas/:id - eliminar faena
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await query('SELECT id FROM lubricacion.faenas WHERE id = $1', [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Faena no encontrada',
        message: `No se encontró una faena con ID: ${id}`
      });
    }

    await query('DELETE FROM lubricacion.faenas WHERE id = $1', [id]);

    res.json({ 
      message: 'Faena eliminada exitosamente',
      id: id 
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al eliminar faena',
      details: error.message 
    });
  }
});

module.exports = router;