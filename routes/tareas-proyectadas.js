const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/database');

// GET /tareas-proyectadas - listar todas las tareas proyectadas (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const puntoLubricacionId = req.query.punto_lubricacion_id;
    const fechaDesde = req.query.fecha_desde;
    const fechaHasta = req.query.fecha_hasta;
    const frecuencia = req.query.frecuencia;
    const origen = req.query.origen;

    let query = supabase
      .from('tareas_proyectadas')
      .select(`
        *,
        punto_lubricacion!inner(
          id, nombre, cantidad, frecuencia,
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
          lubricantes!inner(id, marca, tipo)
        )
      `)
      .range(offset, offset + limit - 1)
      .order('fecha_proyectada', { ascending: true });

    if (puntoLubricacionId) {
      query = query.eq('punto_lubricacion_id', puntoLubricacionId);
    }

    if (fechaDesde) {
      query = query.gte('fecha_proyectada', fechaDesde);
    }

    if (fechaHasta) {
      query = query.lte('fecha_proyectada', fechaHasta);
    }

    if (frecuencia) {
      query = query.ilike('frecuencia', `%${frecuencia}%`);
    }

    if (origen) {
      query = query.eq('origen', origen);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener tareas proyectadas',
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
    console.error('Error en GET /tareas-proyectadas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /tareas-proyectadas/:id - obtener una tarea proyectada por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tareas_proyectadas')
      .select(`
        *,
        punto_lubricacion!inner(
          id, nombre, cantidad, frecuencia,
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

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error en GET /tareas-proyectadas/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /tareas-proyectadas/calendario/mes - obtener tareas proyectadas por mes
router.get('/calendario/mes', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const año = req.query.año || new Date().getFullYear();
    const mes = req.query.mes || (new Date().getMonth() + 1);

    // Crear fechas del primer y último día del mes
    const fechaInicio = `${año}-${mes.toString().padStart(2, '0')}-01`;
    const fechaFin = new Date(año, mes, 0).toISOString().split('T')[0]; // Último día del mes

    const { data, error } = await supabase
      .from('tareas_proyectadas')
      .select(`
        *,
        punto_lubricacion!inner(
          id, nombre,
          componentes!inner(
            id, nombre,
            equipos!inner(id, nombre, codigo_equipo)
          ),
          lubricantes!inner(id, marca, tipo)
        )
      `)
      .gte('fecha_proyectada', fechaInicio)
      .lte('fecha_proyectada', fechaFin)
      .order('fecha_proyectada', { ascending: true });

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener calendario de tareas',
        details: error.message 
      });
    }

    // Agrupar por fecha
    const tareasPorFecha = data.reduce((acc, tarea) => {
      const fecha = tarea.fecha_proyectada;
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push(tarea);
      return acc;
    }, {});

    res.json({
      success: true,
      data: tareasPorFecha,
      meta: {
        año: parseInt(año),
        mes: parseInt(mes),
        totalTareas: data.length
      }
    });

  } catch (error) {
    console.error('Error en GET /tareas-proyectadas/calendario/mes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /tareas-proyectadas - crear una nueva tarea proyectada
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

    // Validar campos requeridos
    if (!payload.punto_lubricacion_id || !payload.fecha_proyectada) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        message: 'punto_lubricacion_id y fecha_proyectada son requeridos'
      });
    }

    const { data, error } = await supabase
      .from('tareas_proyectadas')
      .insert([payload])
      .select(`
        *,
        punto_lubricacion!inner(
          id, nombre, cantidad, frecuencia,
          componentes!inner(
            id, nombre,
            equipos!inner(id, nombre, codigo_equipo)
          ),
          lubricantes!inner(id, marca, tipo)
        )
      `);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear tarea proyectada',
        details: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: data[0],
      message: 'Tarea proyectada creada exitosamente'
    });

  } catch (error) {
    console.error('Error en POST /tareas-proyectadas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /tareas-proyectadas/bulk - crear múltiples tareas proyectadas
router.post('/bulk', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { tareas } = req.body;

    if (!Array.isArray(tareas) || tareas.length === 0) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'Se requiere un array de tareas no vacío'
      });
    }

    const { data, error } = await supabase
      .from('tareas_proyectadas')
      .insert(tareas)
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear tareas proyectadas',
        details: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: data,
      message: `${data.length} tareas proyectadas creadas exitosamente`
    });

  } catch (error) {
    console.error('Error en POST /tareas-proyectadas/bulk:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /tareas-proyectadas/:id - actualizar una tarea proyectada
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
      .from('tareas_proyectadas')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        punto_lubricacion!inner(
          id, nombre, cantidad, frecuencia,
          componentes!inner(
            id, nombre,
            equipos!inner(id, nombre, codigo_equipo)
          ),
          lubricantes!inner(id, marca, tipo)
        )
      `);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar tarea proyectada',
        details: error.message 
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Tarea proyectada no encontrada',
        message: `No se encontró una tarea proyectada con ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Tarea proyectada actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en PUT /tareas-proyectadas/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /tareas-proyectadas/:id - eliminar una tarea proyectada
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingTarea, error: selectError } = await supabase
      .from('tareas_proyectadas')
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
      .from('tareas_proyectadas')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar tarea proyectada',
        details: error.message 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tarea proyectada eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /tareas-proyectadas/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;

