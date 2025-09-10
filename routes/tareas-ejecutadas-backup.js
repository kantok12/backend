const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/supabase');

// GET /tareas-ejecutadas - obtener todas las tareas ejecutadas
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const tareaProgramadaId = req.query.tarea_programada_id;
    const personalEjecutor = req.query.personal_ejecutor;
    const cumplimiento = req.query.cumplimiento;

    let query = supabase
      .from('lubricacion.tareas_ejecutadas')
      .select(`
        *,
        tareas_programadas!inner(
          id, fecha_programada, estado, observaciones,
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
        )
      `)
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`observaciones.ilike.%${search}%`);
    }

    if (tareaProgramadaId) {
      query = query.eq('tarea_programada_id', tareaProgramadaId);
    }

    if (personalEjecutor) {
      query = query.eq('personal_ejecutor', personalEjecutor);
    }

    if (cumplimiento !== undefined) {
      query = query.eq('cumplimiento', cumplimiento === 'true');
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener tareas ejecutadas',
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

// GET /tareas-ejecutadas/:id - obtener tarea ejecutada por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('lubricacion.tareas_ejecutadas')
      .select(`
        *,
        tareas_programadas!inner(
          id, fecha_programada, estado, observaciones,
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
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Tarea ejecutada no encontrada',
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

// POST /tareas-ejecutadas - crear nueva tarea ejecutada
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
      .from('lubricacion.tareas_ejecutadas')
      .insert([payload])
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear tarea ejecutada',
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

// PUT /tareas-ejecutadas/:id - actualizar tarea ejecutada
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
      .from('lubricacion.tareas_ejecutadas')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar tarea ejecutada',
        details: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({
        error: 'Tarea ejecutada no encontrada',
        message: `No se encontró una tarea ejecutada con ID: ${id}`
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

// DELETE /tareas-ejecutadas/:id - eliminar tarea ejecutada
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingTarea, error: selectError } = await supabase
      .from('lubricacion.tareas_ejecutadas')
      .select('id')
      .eq('id', id)
      .single();

    if (selectError || !existingTarea) {
      return res.status(404).json({
        error: 'Tarea ejecutada no encontrada',
        message: `No se encontró una tarea ejecutada con ID: ${id}`
      });
    }

    const { error } = await supabase
      .from('lubricacion.tareas_ejecutadas')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar tarea ejecutada',
        details: error.message 
      });
    }

    res.json({ 
      message: 'Tarea ejecutada eliminada exitosamente',
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