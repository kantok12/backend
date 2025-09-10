const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

// GET /punto-lubricacion - listar todos los puntos de lubricación (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const componenteId = req.query.componente_id;
    const lubricanteId = req.query.lubricante_id;
    const frecuencia = req.query.frecuencia;

    let sqlQuery = `
      SELECT 
        pl.*,
        c.nombre as componente_nombre,
        e.nombre as equipo_nombre,
        e.codigo_equipo,
        l.nombre as linea_nombre,
        p.nombre as planta_nombre,
        f.nombre as faena_nombre,
        lub.marca as lubricante_marca,
        lub.tipo as lubricante_tipo
      FROM lubricacion.punto_lubricacion pl
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
      sqlQuery += ` AND pl.nombre ILIKE $${paramCount}`;
      params.push(`%${search}%`);
    }

    if (componenteId) {
      paramCount++;
      sqlQuery += ` AND pl.componente_id = $${paramCount}`;
      params.push(componenteId);
    }

    if (lubricanteId) {
      paramCount++;
      sqlQuery += ` AND pl.lubricante_id = $${paramCount}`;
      params.push(lubricanteId);
    }

    if (frecuencia) {
      paramCount++;
      sqlQuery += ` AND pl.frecuencia ILIKE $${paramCount}`;
      params.push(`%${frecuencia}%`);
    }

    sqlQuery += ` ORDER BY pl.id LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(sqlQuery, params);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener puntos de lubricación',
      details: error.message 
    });
  }
});

// GET /punto-lubricacion/:id - obtener punto de lubricación por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        pl.*,
        c.nombre as componente_nombre,
        e.nombre as equipo_nombre,
        e.codigo_equipo,
        l.nombre as linea_nombre,
        p.nombre as planta_nombre,
        f.nombre as faena_nombre,
        lub.marca as lubricante_marca,
        lub.tipo as lubricante_tipo
      FROM lubricacion.punto_lubricacion pl
      JOIN lubricacion.componentes c ON pl.componente_id = c.id
      JOIN lubricacion.equipos e ON c.equipo_id = e.id
      JOIN lubricacion.lineas l ON e.linea_id = l.id
      JOIN lubricacion.plantas p ON l.planta_id = p.id
      JOIN lubricacion.faenas f ON p.faena_id = f.id
      JOIN lubricacion.lubricantes lub ON pl.lubricante_id = lub.id
      WHERE pl.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Punto de lubricación no encontrado',
        message: `No se encontró un punto de lubricación con ID: ${id}`
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

// GET /punto-lubricacion/componente/:componenteId - obtener puntos por componente
router.get('/componente/:componenteId', async (req, res) => {
  try {
    const { componenteId } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const result = await query(`
      SELECT 
        pl.*,
        lub.marca as lubricante_marca,
        lub.tipo as lubricante_tipo
      FROM lubricacion.punto_lubricacion pl
      JOIN lubricacion.lubricantes lub ON pl.lubricante_id = lub.id
      WHERE pl.componente_id = $1
      ORDER BY pl.id
      LIMIT $2 OFFSET $3
    `, [componenteId, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener puntos de lubricación',
      details: error.message 
    });
  }
});

// POST /punto-lubricacion - crear nuevo punto de lubricación
router.post('/', async (req, res) => {
  try {
    const { 
      nombre, 
      componente_id, 
      lubricante_id, 
      frecuencia, 
      cantidad, 
      unidad, 
      observaciones 
    } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      INSERT INTO lubricacion.punto_lubricacion 
      (nombre, componente_id, lubricante_id, frecuencia, cantidad, unidad, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [nombre, componente_id, lubricante_id, frecuencia, cantidad, unidad, observaciones]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al crear punto de lubricación',
      details: error.message 
    });
  }
});

// PUT /punto-lubricacion/:id - actualizar punto de lubricación
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      componente_id, 
      lubricante_id, 
      frecuencia, 
      cantidad, 
      unidad, 
      observaciones 
    } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      UPDATE lubricacion.punto_lubricacion 
      SET 
        nombre = $1, 
        componente_id = $2, 
        lubricante_id = $3, 
        frecuencia = $4, 
        cantidad = $5, 
        unidad = $6, 
        observaciones = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [nombre, componente_id, lubricante_id, frecuencia, cantidad, unidad, observaciones, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Punto de lubricación no encontrado',
        message: `No se encontró un punto de lubricación con ID: ${id}`
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al actualizar punto de lubricación',
      details: error.message 
    });
  }
});

// DELETE /punto-lubricacion/:id - eliminar punto de lubricación
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el punto existe
    const checkResult = await query(
      'SELECT id FROM lubricacion.punto_lubricacion WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Punto de lubricación no encontrado',
        message: `No se encontró un punto de lubricación con ID: ${id}`
      });
    }

    // Eliminar el punto
    await query('DELETE FROM lubricacion.punto_lubricacion WHERE id = $1', [id]);

    res.json({ 
      message: 'Punto de lubricación eliminado exitosamente',
      id: id 
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al eliminar punto de lubricación',
      details: error.message 
    });
  }
});

module.exports = router;
