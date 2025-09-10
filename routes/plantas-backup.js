const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/supabase');

// GET /plantas - obtener todas las plantas
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const faenaId = req.query.faena_id;
    const estado = req.query.estado;

    let query = supabase
      .from('lubricacion.plantas')
      .select(`
        *,
        faenas!inner(id, nombre, descripcion, ubicacion)
      `)
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`nombre.ilike.%${search}%, descripcion.ilike.%${search}%, codigo_planta.ilike.%${search}%`);
    }

    if (faenaId) {
      query = query.eq('faena_id', faenaId);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener plantas',
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

// GET /plantas/:id - obtener planta por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('lubricacion.plantas')
      .select(`
        *,
        faenas!inner(id, nombre, descripcion, ubicacion)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Planta no encontrada',
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

// POST /plantas - crear nueva planta
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
      .from('lubricacion.plantas')
      .insert([payload])
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear planta',
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

// PUT /plantas/:id - actualizar planta
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
      .from('lubricacion.plantas')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar planta',
        details: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({
        error: 'Planta no encontrada',
        message: `No se encontró una planta con ID: ${id}`
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

// DELETE /plantas/:id - eliminar planta
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingPlanta, error: selectError } = await supabase
      .from('lubricacion.plantas')
      .select('id')
      .eq('id', id)
      .single();

    if (selectError || !existingPlanta) {
      return res.status(404).json({
        error: 'Planta no encontrada',
        message: `No se encontró una planta con ID: ${id}`
      });
    }

    const { error } = await supabase
      .from('lubricacion.plantas')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar planta',
        details: error.message 
      });
    }

    res.json({ 
      message: 'Planta eliminada exitosamente',
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