const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

// GET /lubricantes - listar todos los lubricantes (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const tipo = req.query.tipo;
    const marca = req.query.marca;

    let sqlQuery = `
      SELECT * FROM lubricacion.lubricantes
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      sqlQuery += ` AND (marca ILIKE $${paramCount} OR tipo ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (tipo) {
      paramCount++;
      sqlQuery += ` AND tipo = $${paramCount}`;
      params.push(tipo);
    }

    if (marca) {
      paramCount++;
      sqlQuery += ` AND marca = $${paramCount}`;
      params.push(marca);
    }

    sqlQuery += ` ORDER BY id LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(sqlQuery, params);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener lubricantes',
      details: error.message 
    });
  }
});

// GET /lubricantes/:id - obtener lubricante por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM lubricacion.lubricantes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Lubricante no encontrado',
        message: `No se encontró un lubricante con ID: ${id}`
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

// GET /lubricantes/:id/puntos - obtener puntos de lubricación por lubricante
router.get('/:id/puntos', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const result = await query(`
      SELECT 
        pl.*,
        c.nombre as componente_nombre,
        e.nombre as equipo_nombre,
        e.codigo_equipo
      FROM lubricacion.punto_lubricacion pl
      JOIN lubricacion.componentes c ON pl.componente_id = c.id
      JOIN lubricacion.equipos e ON c.equipo_id = e.id
      WHERE pl.lubricante_id = $1
      ORDER BY pl.id
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener puntos de lubricación',
      details: error.message 
    });
  }
});

// GET /lubricantes/tipos/disponibles - obtener tipos únicos de lubricantes
router.get('/tipos/disponibles', async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT tipo 
      FROM lubricacion.lubricantes 
      WHERE tipo IS NOT NULL 
      ORDER BY tipo
    `);

    const tipos = result.rows.map(row => row.tipo);
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener tipos de lubricantes',
      details: error.message 
    });
  }
});

// GET /lubricantes/marcas/disponibles - obtener marcas únicas de lubricantes
router.get('/marcas/disponibles', async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT marca 
      FROM lubricacion.lubricantes 
      WHERE marca IS NOT NULL 
      ORDER BY marca
    `);

    const marcas = result.rows.map(row => row.marca);
    res.json(marcas);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener marcas de lubricantes',
      details: error.message 
    });
  }
});

// POST /lubricantes - crear nuevo lubricante
router.post('/', async (req, res) => {
  try {
    const { marca, tipo, especificaciones } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      INSERT INTO lubricacion.lubricantes (marca, tipo, especificaciones)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [marca, tipo, especificaciones]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al crear lubricante',
      details: error.message 
    });
  }
});

// PUT /lubricantes/:id - actualizar lubricante
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { marca, tipo, especificaciones } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const result = await query(`
      UPDATE lubricacion.lubricantes 
      SET marca = $1, tipo = $2, especificaciones = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [marca, tipo, especificaciones, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Lubricante no encontrado',
        message: `No se encontró un lubricante con ID: ${id}`
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al actualizar lubricante',
      details: error.message 
    });
  }
});

// DELETE /lubricantes/:id - eliminar lubricante
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el lubricante existe
    const checkResult = await query(
      'SELECT id FROM lubricacion.lubricantes WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Lubricante no encontrado',
        message: `No se encontró un lubricante con ID: ${id}`
      });
    }

    // Eliminar el lubricante
    await query('DELETE FROM lubricacion.lubricantes WHERE id = $1', [id]);

    res.json({ 
      message: 'Lubricante eliminado exitosamente',
      id: id 
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al eliminar lubricante',
      details: error.message 
    });
  }
});

module.exports = router;
