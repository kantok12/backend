const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

// GET /tareas-programadas - obtener todas las tareas programadas
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const estado = req.query.estado;
    const puntoLubricacionId = req.query.punto_lubricacion_id;

    let sqlQuery = `
      SELECT 
        tp.*,
        pl.nombre as punto_lubricacion_nombre,
        c.nombre as componente_nombre,
        e.nombre as equipo_nombre,
        e.codigo_equipo,
        l.nombre as linea_nombre,
        p.nombre as planta_nombre,
        f.nombre as faena_nombre,
        lub.marca as lubricante_marca,
        lub.tipo as lubricante_tipo
      FROM lubricacion.tareas_programadas tp
      JOIN lubricacion.punto_lubricacion pl ON tp.punto_lubricacion_id = pl.id
      JOIN lubricacion.componentes c ON pl.componente_id = c.id
      JOIN lubricacion.equipos e ON c.equipo_id = e.id
      JOIN lubricacion.lineas l ON e.linea_id = l.id
      JOIN lubricacion.plantas p ON l.planta_id = p.id
      JOIN lubricacion.faenas f ON p.faena_id = f.id
      JOIN lubricacion.lubricantes lub ON pl.lubricante_id = lub.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      sqlQuery += ` AND (tp.descripcion ILIKE $${paramCount} OR pl.nombre ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (estado) {
      paramCount++;
      sqlQuery += ` AND tp.estado = $${paramCount}`;
      params.push(estado);
    }

    if (puntoLubricacionId) {
      paramCount++;
      sqlQuery += ` AND tp.punto_lubricacion_id = $${paramCount}`;
      params.push(puntoLubricacionId);
    }

    sqlQuery += ` ORDER BY tp.fecha_programada DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener tareas programadas',
      details: error.message 
    });
  }
});

// GET /tareas-programadas/:id - obtener tarea programada por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        tp.*,
        pl.nombre as punto_lubricacion_nombre,
        c.nombre as componente_nombre,
        e.nombre as equipo_nombre,
        e.codigo_equipo,
        l.nombre as linea_nombre,
        p.nombre as planta_nombre,
        f.nombre as faena_nombre,
        lub.marca as lubricante_marca,
        lub.tipo as lubricante_tipo
      FROM lubricacion.tareas_programadas tp
      JOIN lubricacion.punto_lubricacion pl ON tp.punto_lubricacion_id = pl.id
      JOIN lubricacion.componentes c ON pl.componente_id = c.id
      JOIN lubricacion.equipos e ON c.equipo_id = e.id
      JOIN lubricacion.lineas l ON e.linea_id = l.id
      JOIN lubricacion.plantas p ON l.planta_id = p.id
      JOIN lubricacion.faenas f ON p.faena_id = f.id
      JOIN lubricacion.lubricantes lub ON pl.lubricante_id = lub.id
      WHERE tp.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Tarea programada no encontrada',
        message: `No se encontró una tarea programada con ID: ${id}`
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

// POST /tareas-programadas - crear nueva tarea programada
router.post('/', async (req, res) => {
  try {
    const { 
      punto_lubricacion_id, 
      fecha_programada, 
      descripcion, 
      estado, 
      observaciones 
    } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      INSERT INTO lubricacion.tareas_programadas 
      (punto_lubricacion_id, fecha_programada, descripcion, estado, observaciones)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [punto_lubricacion_id, fecha_programada, descripcion, estado, observaciones]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al crear tarea programada',
      details: error.message 
    });
  }
});

// PUT /tareas-programadas/:id - actualizar tarea programada
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      punto_lubricacion_id, 
      fecha_programada, 
      descripcion, 
      estado, 
      observaciones 
    } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      UPDATE lubricacion.tareas_programadas 
      SET 
        punto_lubricacion_id = $1, 
        fecha_programada = $2, 
        descripcion = $3, 
        estado = $4, 
        observaciones = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [punto_lubricacion_id, fecha_programada, descripcion, estado, observaciones, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tarea programada no encontrada',
        message: `No se encontró una tarea programada con ID: ${id}`
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al actualizar tarea programada',
      details: error.message 
    });
  }
});

// DELETE /tareas-programadas/:id - eliminar tarea programada
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await query(
      'SELECT id FROM lubricacion.tareas_programadas WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Tarea programada no encontrada',
        message: `No se encontró una tarea programada con ID: ${id}`
      });
    }

    await query('DELETE FROM lubricacion.tareas_programadas WHERE id = $1', [id]);

    res.json({ 
      message: 'Tarea programada eliminada exitosamente',
      id: id 
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al eliminar tarea programada',
      details: error.message 
    });
  }
});

module.exports = router;