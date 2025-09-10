const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

// GET /equipos - obtener todos los equipos
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const estado = req.query.estado;
    const lineaId = req.query.linea_id;

    let sqlQuery = `
      SELECT * FROM lubricacion.equipos
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      sqlQuery += ` AND (nombre ILIKE $${paramCount} OR descripcion ILIKE $${paramCount} OR codigo_equipo ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (estado) {
      paramCount++;
      sqlQuery += ` AND estado = $${paramCount}`;
      params.push(estado);
    }

    if (lineaId) {
      paramCount++;
      sqlQuery += ` AND linea_id = $${paramCount}`;
      params.push(lineaId);
    }

    sqlQuery += ` ORDER BY id LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener equipos',
      details: error.message 
    });
  }
});

// GET /equipos/:id - obtener equipo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM lubricacion.equipos WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Equipo no encontrado',
        message: `No se encontró un equipo con ID: ${id}`
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

// GET /equipos/:id/componentes - obtener componentes de un equipo
router.get('/:id/componentes', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const result = await query(`
      SELECT * FROM lubricacion.componentes 
      WHERE equipo_id = $1 
      ORDER BY id 
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener componentes',
      details: error.message 
    });
  }
});

// POST /equipos - crear nuevo equipo
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, codigo_equipo, estado, linea_id } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      INSERT INTO lubricacion.equipos (nombre, descripcion, codigo_equipo, estado, linea_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [nombre, descripcion, codigo_equipo, estado, linea_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al crear equipo',
      details: error.message 
    });
  }
});

// PUT /equipos/:id - actualizar equipo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, codigo_equipo, estado, linea_id } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      UPDATE lubricacion.equipos 
      SET nombre = $1, descripcion = $2, codigo_equipo = $3, estado = $4, linea_id = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [nombre, descripcion, codigo_equipo, estado, linea_id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Equipo no encontrado',
        message: `No se encontró un equipo con ID: ${id}`
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al actualizar equipo',
      details: error.message 
    });
  }
});

// DELETE /equipos/:id - eliminar equipo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await query('SELECT id FROM lubricacion.equipos WHERE id = $1', [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Equipo no encontrado',
        message: `No se encontró un equipo con ID: ${id}`
      });
    }

    await query('DELETE FROM lubricacion.equipos WHERE id = $1', [id]);

    res.json({ 
      message: 'Equipo eliminado exitosamente',
      id: id 
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al eliminar equipo',
      details: error.message 
    });
  }
});

module.exports = router;