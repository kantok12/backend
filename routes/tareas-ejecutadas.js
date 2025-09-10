const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

// GET /tareas-ejecutadas - obtener todas las tareas ejecutadas
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const estado = req.query.estado;
    const puntoLubricacionId = req.query.punto_lubricacion_id;

    let sqlQuery = `
      SELECT 
        te.*,
        pl.nombre as punto_lubricacion_nombre,
        c.nombre as componente_nombre,
        e.nombre as equipo_nombre,
        e.codigo_equipo,
        l.nombre as linea_nombre,
        p.nombre as planta_nombre,
        f.nombre as faena_nombre,
        lub.marca as lubricante_marca,
        lub.tipo as lubricante_tipo
      FROM lubricacion.tareas_ejecutadas te
      JOIN lubricacion.punto_lubricacion pl ON te.punto_lubricacion_id = pl.id
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
      sqlQuery += ` AND (te.descripcion ILIKE $${paramCount} OR pl.nombre ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (estado) {
      paramCount++;
      sqlQuery += ` AND te.estado = $${paramCount}`;
      params.push(estado);
    }

    if (puntoLubricacionId) {
      paramCount++;
      sqlQuery += ` AND te.punto_lubricacion_id = $${paramCount}`;
      params.push(puntoLubricacionId);
    }

    sqlQuery += ` ORDER BY te.fecha_ejecucion DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener tareas ejecutadas',
      details: error.message 
    });
  }
});

// GET /tareas-ejecutadas/:id - obtener tarea ejecutada por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        te.*,
        pl.nombre as punto_lubricacion_nombre,
        c.nombre as componente_nombre,
        e.nombre as equipo_nombre,
        e.codigo_equipo,
        l.nombre as linea_nombre,
        p.nombre as planta_nombre,
        f.nombre as faena_nombre,
        lub.marca as lubricante_marca,
        lub.tipo as lubricante_tipo
      FROM lubricacion.tareas_ejecutadas te
      JOIN lubricacion.punto_lubricacion pl ON te.punto_lubricacion_id = pl.id
      JOIN lubricacion.componentes c ON pl.componente_id = c.id
      JOIN lubricacion.equipos e ON c.equipo_id = e.id
      JOIN lubricacion.lineas l ON e.linea_id = l.id
      JOIN lubricacion.plantas p ON l.planta_id = p.id
      JOIN lubricacion.faenas f ON p.faena_id = f.id
      JOIN lubricacion.lubricantes lub ON pl.lubricante_id = lub.id
      WHERE te.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Tarea ejecutada no encontrada',
        message: `No se encontró una tarea ejecutada con ID: ${id}`
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

// POST /tareas-ejecutadas - crear nueva tarea ejecutada
router.post('/', async (req, res) => {
  try {
    const { 
      punto_lubricacion_id, 
      fecha_ejecucion, 
      descripcion, 
      estado, 
      observaciones,
      cantidad_usada,
      responsable
    } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      INSERT INTO lubricacion.tareas_ejecutadas 
      (punto_lubricacion_id, fecha_ejecucion, descripcion, estado, observaciones, cantidad_usada, responsable)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [punto_lubricacion_id, fecha_ejecucion, descripcion, estado, observaciones, cantidad_usada, responsable]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al crear tarea ejecutada',
      details: error.message 
    });
  }
});

// PUT /tareas-ejecutadas/:id - actualizar tarea ejecutada
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      punto_lubricacion_id, 
      fecha_ejecucion, 
      descripcion, 
      estado, 
      observaciones,
      cantidad_usada,
      responsable
    } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      UPDATE lubricacion.tareas_ejecutadas 
      SET 
        punto_lubricacion_id = $1, 
        fecha_ejecucion = $2, 
        descripcion = $3, 
        estado = $4, 
        observaciones = $5,
        cantidad_usada = $6,
        responsable = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [punto_lubricacion_id, fecha_ejecucion, descripcion, estado, observaciones, cantidad_usada, responsable, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tarea ejecutada no encontrada',
        message: `No se encontró una tarea ejecutada con ID: ${id}`
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al actualizar tarea ejecutada',
      details: error.message 
    });
  }
});

// DELETE /tareas-ejecutadas/:id - eliminar tarea ejecutada
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await query(
      'SELECT id FROM lubricacion.tareas_ejecutadas WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Tarea ejecutada no encontrada',
        message: `No se encontró una tarea ejecutada con ID: ${id}`
      });
    }

    await query('DELETE FROM lubricacion.tareas_ejecutadas WHERE id = $1', [id]);

    res.json({ 
      message: 'Tarea ejecutada eliminada exitosamente',
      id: id 
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al eliminar tarea ejecutada',
      details: error.message 
    });
  }
});

module.exports = router;