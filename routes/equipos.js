const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/database');

// GET /equipos - listar todos los equipos (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const lineaId = req.query.linea_id;
    const codigoEquipo = req.query.codigo_equipo;

    let query = supabase
      .from('equipos')
      .select('*, lineas!inner(id, nombre, plantas!inner(id, nombre, faenas!inner(id, nombre)))')
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`nombre.ilike.%${search}%, codigo_equipo.ilike.%${search}%`);
    }

    if (lineaId) {
      query = query.eq('linea_id', lineaId);
    }

    if (codigoEquipo) {
      query = query.ilike('codigo_equipo', `%${codigoEquipo}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener equipos',
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
    console.error('Error en GET /equipos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /equipos/:id - obtener un equipo por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('equipos')
      .select('*, lineas!inner(id, nombre, plantas!inner(id, nombre, faenas!inner(id, nombre)))')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Equipo no encontrado',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error en GET /equipos/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /equipos/:id/componentes - obtener componentes de un equipo
router.get('/:id/componentes', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const { data, error } = await supabase
      .from('componentes')
      .select('*')
      .eq('equipo_id', id)
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener componentes del equipo',
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
    console.error('Error en GET /equipos/:id/componentes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /equipos - crear un nuevo equipo
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
      .from('equipos')
      .insert([payload])
      .select('*, lineas!inner(id, nombre, plantas!inner(id, nombre, faenas!inner(id, nombre)))');

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear equipo',
        details: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: data[0],
      message: 'Equipo creado exitosamente'
    });

  } catch (error) {
    console.error('Error en POST /equipos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /equipos/:id - actualizar un equipo
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
      .from('equipos')
      .update(payload)
      .eq('id', id)
      .select('*, lineas!inner(id, nombre, plantas!inner(id, nombre, faenas!inner(id, nombre)))');

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar equipo',
        details: error.message 
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Equipo no encontrado',
        message: `No se encontró un equipo con ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Equipo actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error en PUT /equipos/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /equipos/:id - eliminar un equipo
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingEquipo, error: selectError } = await supabase
      .from('equipos')
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
      .from('equipos')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar equipo',
        details: error.message 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Equipo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /equipos/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;

