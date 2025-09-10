const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/supabase');

// GET /lineas - obtener todas las líneas
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const plantaId = req.query.planta_id;
    const estado = req.query.estado;

    let query = supabase
      .from('lubricacion.lineas')
      .select(`
        *,
        plantas!inner(
          id, nombre, descripcion, codigo_planta,
          faenas!inner(id, nombre, descripcion, ubicacion)
        )
      `)
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`nombre.ilike.%${search}%, descripcion.ilike.%${search}%, codigo_linea.ilike.%${search}%`);
    }

    if (plantaId) {
      query = query.eq('planta_id', plantaId);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener líneas',
        details: error.message 
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /lineas/:id - obtener línea por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('lubricacion.lineas')
      .select(`
        *,
        plantas!inner(
          id, nombre, descripcion, codigo_planta,
          faenas!inner(id, nombre, descripcion, ubicacion)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Línea no encontrada',
        details: error.message 
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /lineas - crear nueva línea
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

    const { data, error } = await supabase
      .from('lubricacion.lineas')
      .insert([payload])
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear línea',
        details: error.message 
      });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /lineas/:id - actualizar línea
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
      .from('lubricacion.lineas')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar línea',
        details: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({
        error: 'Línea no encontrada',
        message: `No se encontró una línea con ID: ${id}`
      });
    }

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /lineas/:id - eliminar línea
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingLinea, error: selectError } = await supabase
      .from('lubricacion.lineas')
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
      .from('lubricacion.lineas')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar línea',
        details: error.message 
      });
    }

    res.json({ 
      message: 'Línea eliminada exitosamente',
      id: id 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;