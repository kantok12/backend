const express = require('express');
const router = express.Router();
const { query } = require('../config/postgresql');

// GET /faenas - obtener todas las faenas
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const estado = req.query.estado;

    let query = supabase
      .from('lubricacion.faenas')
      .select('*')
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`nombre.ilike.%${search}%, descripcion.ilike.%${search}%, ubicacion.ilike.%${search}%`);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener faenas',
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

// GET /faenas/:id - obtener faena por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('lubricacion.faenas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Faena no encontrada',
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

// POST /faenas - crear nueva faena
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
      .from('lubricacion.faenas')
      .insert([payload])
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear faena',
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

// PUT /faenas/:id - actualizar faena
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
      .from('lubricacion.faenas')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar faena',
        details: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({
        error: 'Faena no encontrada',
        message: `No se encontró una faena con ID: ${id}`
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

// DELETE /faenas/:id - eliminar faena
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingFaena, error: selectError } = await supabase
      .from('lubricacion.faenas')
      .select('id')
      .eq('id', id)
      .single();

    if (selectError || !existingFaena) {
      return res.status(404).json({
        error: 'Faena no encontrada',
        message: `No se encontró una faena con ID: ${id}`
      });
    }

    const { error } = await supabase
      .from('lubricacion.faenas')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar faena',
        details: error.message 
      });
    }

    res.json({ 
      message: 'Faena eliminada exitosamente',
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