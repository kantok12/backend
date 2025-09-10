const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/supabase');

// GET /tareas-proyectadas - obtener todas las tareas proyectadas
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const puntoLubricacionId = req.query.punto_lubricacion_id;
    const frecuencia = req.query.frecuencia;

    let query = supabase
      .from('lubricacion.tareas_proyectadas')
      .select(`
        *,
        punto_lubricacion!inner(
          id, nombre, descripcion, cantidad, frecuencia,
          componentes!inner(
            id, nombre, 
            equipos!inner(
              id, nombre, codigo_equipo,
              lineas!inner(
                id, nombre,
                plantas!inner(
                  id, nombre,
                  faenas!inner(id, nombre)
                )
              )
            )
          ),
          lubricantes!inner(id, marca, tipo, especificaciones)
        )
      `)
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`especificaciones.ilike.%${search}%, frecuencia.ilike.%${search}%`);
    }

    if (puntoLubricacionId) {
      query = query.eq('punto_lubricacion_id', puntoLubricacionId);
    }

    if (frecuencia) {
      query = query.eq('frecuencia', frecuencia);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener tareas proyectadas',
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

// GET /tareas-proyectadas/:id - obtener tarea proyectada por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('lubricacion.tareas_proyectadas')
      .select(`
        *,
        punto_lubricacion!inner(
          id, nombre, descripcion, cantidad, frecuencia,
          componentes!inner(
            id, nombre, 
            equipos!inner(
              id, nombre, codigo_equipo,
              lineas!inner(
                id, nombre,
                plantas!inner(
                  id, nombre,
                  faenas!inner(id, nombre)
                )
              )
            )
          ),
          lubricantes!inner(id, marca, tipo, especificaciones)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Tarea proyectada no encontrada',
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

// POST /tareas-proyectadas - crear nueva tarea proyectada
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
      .from('lubricacion.tareas_proyectadas')
      .insert([payload])
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear tarea proyectada',
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

// PUT /tareas-proyectadas/:id - actualizar tarea proyectada
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
      .from('lubricacion.tareas_proyectadas')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar tarea proyectada',
        details: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({
        error: 'Tarea proyectada no encontrada',
        message: `No se encontró una tarea proyectada con ID: ${id}`
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

// DELETE /tareas-proyectadas/:id - eliminar tarea proyectada
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingTarea, error: selectError } = await supabase
      .from('lubricacion.tareas_proyectadas')
      .select('id')
      .eq('id', id)
      .single();

    if (selectError || !existingTarea) {
      return res.status(404).json({
        error: 'Tarea proyectada no encontrada',
        message: `No se encontró una tarea proyectada con ID: ${id}`
      });
    }

    const { error } = await supabase
      .from('lubricacion.tareas_proyectadas')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar tarea proyectada',
        details: error.message 
      });
    }

    res.json({ 
      message: 'Tarea proyectada eliminada exitosamente',
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