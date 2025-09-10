const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/supabase');

// GET /equipos - obtener todos los equipos
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const lineaId = req.query.linea_id;
    const tipoEquipo = req.query.tipo_equipo;
    const estado = req.query.estado;

    let query = supabase
      .from('lubricacion.equipos')
      .select(`
        *,
        lineas!inner(
          id, nombre, descripcion, codigo_linea,
          plantas!inner(
            id, nombre, descripcion, codigo_planta,
            faenas!inner(id, nombre, descripcion, ubicacion)
          )
        )
      `)
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`nombre.ilike.%${search}%, descripcion.ilike.%${search}%, codigo_equipo.ilike.%${search}%`);
    }

    if (lineaId) {
      query = query.eq('linea_id', lineaId);
    }

    if (tipoEquipo) {
      query = query.eq('tipo_equipo', tipoEquipo);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener equipos',
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

// GET /equipos/:id - obtener equipo por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('lubricacion.equipos')
      .select(`
        *,
        lineas!inner(
          id, nombre, descripcion, codigo_linea,
          plantas!inner(
            id, nombre, descripcion, codigo_planta,
            faenas!inner(id, nombre, descripcion, ubicacion)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Equipo no encontrado',
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

// POST /equipos - crear nuevo equipo
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
      .from('lubricacion.equipos')
      .insert([payload])
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear equipo',
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

// PUT /equipos/:id - actualizar equipo
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
      .from('lubricacion.equipos')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar equipo',
        details: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({
        error: 'Equipo no encontrado',
        message: `No se encontró un equipo con ID: ${id}`
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

// DELETE /equipos/:id - eliminar equipo
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingEquipo, error: selectError } = await supabase
      .from('lubricacion.equipos')
      .select('id')
      .eq('id', id)
      .single();

    if (selectError || !existingEquipo) {
      return res.status(404).json({
        error: 'Equipo no encontrado',
        message: `No se encontró un equipo con ID: ${id}`
      });
    }

    const { error } = await supabase
      .from('lubricacion.equipos')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar equipo',
        details: error.message 
      });
    }

    res.json({ 
      message: 'Equipo eliminado exitosamente',
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