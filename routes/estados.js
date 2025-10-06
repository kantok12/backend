const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Estados base requeridos
const ESTADOS_BASE = [
  { nombre: 'asignado', descripcion: 'Personal asignado a labores' },
  { nombre: 'vacaciones', descripcion: 'Personal en vacaciones' },
  { nombre: 'capacitacion', descripcion: 'Personal en capacitación' },
  { nombre: 'examenes', descripcion: 'Personal en exámenes' },
  { nombre: 'desvinculado', descripcion: 'Personal desvinculado' },
  { nombre: 'licencia medica', descripcion: 'Personal con licencia médica' }
];

async function ensureEstadosBase() {
  // Inserta los estados base si no existen ya (case-insensitive)
  for (const estado of ESTADOS_BASE) {
    const exists = await query(
      'SELECT id FROM mantenimiento.estados WHERE lower(nombre) = lower($1) LIMIT 1',
      [estado.nombre]
    );
    if (exists.rows.length === 0) {
      await query(
        `INSERT INTO mantenimiento.estados (nombre, descripcion)
         VALUES ($1, $2)`,
        [estado.nombre, estado.descripcion]
      );
    }
  }
}

// GET /estados - listar todos los estados (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    // Asegurar que existan los 6 estados requeridos
    await ensureEstadosBase();

    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;

    // Construir consulta SQL
    // Solo devolver los 6 estados solicitados, en el orden especificado
    const estadosFiltro = ESTADOS_BASE.map(e => e.nombre.toLowerCase());

    let queryText = `
      SELECT id, nombre, descripcion, activo
      FROM mantenimiento.estados 
      WHERE lower(nombre) = ANY($1)
    `;
    const queryParams = [];
    let paramIndex = 2;

    queryParams.push(estadosFiltro);

    // Filtro de búsqueda por nombre
    if (search) {
      queryText += ` AND nombre ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Agregar paginación
    // Ordenar según el orden definido en ESTADOS_BASE
    queryText += ` ORDER BY array_position($1, lower(nombre)) LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Consulta para contar total
    let countQuery = `SELECT COUNT(*) FROM mantenimiento.estados WHERE lower(nombre) = ANY($1)`;
    const countParams = [estadosFiltro];
    let countParamIndex = 2;

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