const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/database');

// GET /lineas - listar todas las líneas (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const plantaId = req.query.planta_id;

    let query = supabase
      .from('lineas')
      .select('*, plantas!inner(id, nombre, faenas!inner(id, nombre))')
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('nombre', `%${search}%`);
    }

    if (plantaId) {
      query = query.eq('planta_id', plantaId);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener líneas',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: data,
      pagination: {
        offset,
        limit,
        count: data.length
      }
    });

  } catch (error) {
    console.error('Error en GET /lineas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /lineas/:id - obtener una línea por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('lineas')
      .select('*, plantas!inner(id, nombre, faenas!inner(id, nombre))')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Línea no encontrada',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error en GET /lineas/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /lineas/:id/equipos - obtener equipos de una línea
router.get('/:id/equipos', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const { data, error } = await supabase
      .from('equipos')
      .select('*')
      .eq('linea_id', id)
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener equipos de la línea',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: data,
      pagination: {
        offset,
        limit,
        count: data.length
      }
    });

  } catch (error) {
    console.error('Error en GET /lineas/:id/equipos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /lineas - crear una nueva línea
router.post('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const payload = req.body;

    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    if (!payload.planta_id) {
      return res.status(400).json({
        error: 'planta_id es requerido',
        message: 'Debe especificar el ID de la planta'
      });
    }

    const { data, error } = await supabase
      .from('lineas')
      .insert([payload])
      .select('*, plantas!inner(id, nombre, faenas!inner(id, nombre))');

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear línea',
        details: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: data[0],
      message: 'Línea creada exitosamente'
    });

  } catch (error) {
    console.error('Error en POST /lineas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /lineas/:id - actualizar una línea
router.put('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;
    const payload = req.body;

    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const { data, error } = await supabase
      .from('lineas')
      .update(payload)
      .eq('id', id)
      .select('*, plantas!inner(id, nombre, faenas!inner(id, nombre))');

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar línea',
        details: error.message 
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Línea no encontrada',
        message: `No se encontró una línea con ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Línea actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en PUT /lineas/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /lineas/:id - eliminar una línea
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingLinea, error: selectError } = await supabase
      .from('lineas')
      .select('id')
      .eq('id', id)
      .single();

    if (selectError || !existingLinea) {
      return res.status(404).json({
        error: 'Línea no encontrada',
        message: `No se encontró una línea con ID: ${id}`
      });
    }

    const { error } = await supabase
      .from('lineas')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar línea',
        details: error.message 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Línea eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /lineas/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;

