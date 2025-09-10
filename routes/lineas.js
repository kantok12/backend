const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

// GET /lineas - obtener todas las líneas
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const estado = req.query.estado;
    const plantaId = req.query.planta_id;

    let sqlQuery = `
      SELECT * FROM lubricacion.lineas
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

    if (plantaId) {
      paramCount++;
      sqlQuery += ` AND planta_id = $${paramCount}`;
      params.push(plantaId);
    }

    sqlQuery += ` ORDER BY id LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener líneas',
      details: error.message 
    });
  }
});

// GET /lineas/:id - obtener línea por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM lubricacion.lineas WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Línea no encontrada',
        message: `No se encontró una línea con ID: ${id}`
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

// GET /lineas/:id/equipos - obtener equipos de una línea
router.get('/:id/equipos', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const result = await query(`
      SELECT * FROM lubricacion.equipos 
      WHERE linea_id = $1 
      ORDER BY id 
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener equipos',
      details: error.message 
    });
  }
});

// POST /lineas - crear nueva línea
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, estado, planta_id } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      INSERT INTO lubricacion.lineas (nombre, descripcion, estado, planta_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [nombre, descripcion, estado, planta_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al crear línea',
      details: error.message 
    });
  }
});

// PUT /lineas/:id - actualizar línea
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado, planta_id } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      UPDATE lubricacion.lineas 
      SET nombre = $1, descripcion = $2, estado = $3, planta_id = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [nombre, descripcion, estado, planta_id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Línea no encontrada',
        message: `No se encontró una línea con ID: ${id}`
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al actualizar línea',
      details: error.message 
    });
  }
});

// DELETE /lineas/:id - eliminar línea
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await query('SELECT id FROM lubricacion.lineas WHERE id = $1', [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Línea no encontrada',
        message: `No se encontró una línea con ID: ${id}`
      });
    }

    await query('DELETE FROM lubricacion.lineas WHERE id = $1', [id]);

    res.json({ 
      message: 'Línea eliminada exitosamente',
      id: id 
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al eliminar línea',
      details: error.message 
    });
  }
});

module.exports = router;