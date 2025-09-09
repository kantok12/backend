const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

// GET /api/tareas-ejecutadas - Obtener todas las tareas ejecutadas
router.get('/', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      tarea_programada_id,
      personal_ejecutor,
      fecha_desde,
      fecha_hasta,
      cumplimiento
    } = req.query;

    // Construir query base
    let query = supabase
      .from('tareas_ejecutadas')
      .select(`
        *,
        tareas_programadas!inner(
          id,
          fecha_programada,
          estado,
          punto_lubricacion_id,
          punto_lubricacion(
            id,
            nombre,
            componentes(
              id,
              nombre,
              equipos(
                id,
                nombre,
                codigo_equipo
              )
            )
          )
        )
      `)
      .order('fecha_ejecucion', { ascending: false });

    // Aplicar filtros
    if (tarea_programada_id) {
      query = query.eq('tarea_programada_id', tarea_programada_id);
    }

    if (personal_ejecutor) {
      query = query.eq('personal_ejecutor', personal_ejecutor);
    }

    if (fecha_desde) {
      query = query.gte('fecha_ejecucion', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_ejecucion', fecha_hasta);
    }

    if (cumplimiento !== undefined) {
      query = query.eq('cumplimiento', cumplimiento === 'true');
    }

    // Aplicar paginación
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error al obtener tareas ejecutadas:', error);
      return res.status(500).json({
        error: 'Error al obtener tareas ejecutadas',
        details: error.message
      });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        offset: parseInt(offset),
        limit: parseInt(limit),
        count: data?.length || 0
      }
    });

  } catch (error) {
    console.error('Error en GET /tareas-ejecutadas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// GET /api/tareas-ejecutadas/personal/:rutPersonal - Obtener tareas ejecutadas por personal específico
router.get('/personal/:rutPersonal', async (req, res) => {
  try {
    const { rutPersonal } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('tareas_ejecutadas')
      .select(`
        *,
        tareas_programadas(
          id,
          fecha_programada,
          punto_lubricacion(
            id,
            nombre,
            componentes(
              nombre,
              equipos(
                nombre,
                codigo_equipo
              )
            )
          )
        )
      `)
      .eq('personal_ejecutor', rutPersonal)
      .order('fecha_ejecucion', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Error al obtener tareas del personal:', error);
      return res.status(500).json({
        error: 'Error al obtener tareas del personal',
        details: error.message
      });
    }

    res.json({
      success: true,
      personal_ejecutor: rutPersonal,
      data: data || [],
      pagination: {
        offset: parseInt(offset),
        limit: parseInt(limit),
        count: data?.length || 0
      }
    });

  } catch (error) {
    console.error('Error en GET /tareas-ejecutadas/personal:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// GET /api/tareas-ejecutadas/estadisticas/cumplimiento - Estadísticas de cumplimiento
router.get('/estadisticas/cumplimiento', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tareas_ejecutadas')
      .select('cumplimiento');

    if (error) {
      console.error('Error al obtener estadísticas:', error);
      return res.status(500).json({
        error: 'Error al obtener estadísticas',
        details: error.message
      });
    }

    const total = data?.length || 0;
    const cumplidas = data?.filter(t => t.cumplimiento === true).length || 0;
    const noCumplidas = data?.filter(t => t.cumplimiento === false).length || 0;
    const sinDatos = total - cumplidas - noCumplidas;
    const porcentajeCumplimiento = total > 0 ? ((cumplidas / total) * 100).toFixed(2) : '0.00';

    res.json({
      success: true,
      data: {
        total,
        cumplidas,
        noCumplidas,
        sinDatos,
        porcentajeCumplimiento
      }
    });

  } catch (error) {
    console.error('Error en GET /estadisticas/cumplimiento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// GET /api/tareas-ejecutadas/estadisticas/consumo-lubricante - Estadísticas de consumo
router.get('/estadisticas/consumo-lubricante', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tareas_ejecutadas')
      .select(`
        cantidad_usada,
        tareas_programadas(
          punto_lubricacion(
            cantidad,
            lubricantes(
              marca,
              tipo
            )
          )
        )
      `)
      .not('cantidad_usada', 'is', null);

    if (error) {
      console.error('Error al obtener consumo de lubricantes:', error);
      return res.status(500).json({
        error: 'Error al obtener consumo de lubricantes',
        details: error.message
      });
    }

    // Procesar datos para estadísticas
    const consumoTotal = data?.reduce((sum, item) => sum + (item.cantidad_usada || 0), 0) || 0;
    const consumoPromedio = data?.length > 0 ? (consumoTotal / data.length).toFixed(2) : '0.00';

    res.json({
      success: true,
      data: {
        totalEjecuciones: data?.length || 0,
        consumoTotal: consumoTotal.toFixed(2),
        consumoPromedio,
        detalles: data || []
      }
    });

  } catch (error) {
    console.error('Error en GET /estadisticas/consumo-lubricante:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// POST /api/tareas-ejecutadas - Crear nueva tarea ejecutada
router.post('/', async (req, res) => {
  try {
    const {
      tarea_programada_id,
      fecha_ejecucion,
      personal_ejecutor,
      cantidad_usada,
      observaciones,
      cumplimiento
    } = req.body;

    // Validaciones básicas
    if (!tarea_programada_id || !fecha_ejecucion || !personal_ejecutor) {
      return res.status(400).json({
        error: 'Datos faltantes',
        message: 'tarea_programada_id, fecha_ejecucion y personal_ejecutor son requeridos'
      });
    }

    const { data, error } = await supabase
      .from('tareas_ejecutadas')
      .insert([{
        tarea_programada_id,
        fecha_ejecucion,
        personal_ejecutor,
        cantidad_usada: cantidad_usada || null,
        observaciones: observaciones || null,
        cumplimiento: cumplimiento !== undefined ? cumplimiento : true
      }])
      .select();

    if (error) {
      console.error('Error al crear tarea ejecutada:', error);
      return res.status(500).json({
        error: 'Error al crear tarea ejecutada',
        details: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: data[0],
      message: 'Tarea ejecutada creada exitosamente'
    });

  } catch (error) {
    console.error('Error en POST /tareas-ejecutadas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// GET /api/tareas-ejecutadas/:id - Obtener tarea ejecutada por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tareas_ejecutadas')
      .select(`
        *,
        tareas_programadas(
          id,
          fecha_programada,
          estado,
          punto_lubricacion(
            id,
            nombre,
            cantidad,
            frecuencia,
            componentes(
              id,
              nombre,
              equipos(
                id,
                nombre,
                codigo_equipo,
                lineas(
                  id,
                  nombre,
                  plantas(
                    id,
                    nombre,
                    faenas(
                      id,
                      nombre
                    )
                  )
                )
              )
            ),
            lubricantes(
              id,
              marca,
              tipo
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Tarea ejecutada no encontrada'
        });
      }
      console.error('Error al obtener tarea ejecutada:', error);
      return res.status(500).json({
        error: 'Error al obtener tarea ejecutada',
        details: error.message
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error en GET /tareas-ejecutadas/:id:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// PUT /api/tareas-ejecutadas/:id - Actualizar tarea ejecutada
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha_ejecucion,
      personal_ejecutor,
      cantidad_usada,
      observaciones,
      cumplimiento
    } = req.body;

    // Construir objeto de actualización
    const updateData = {};
    if (fecha_ejecucion !== undefined) updateData.fecha_ejecucion = fecha_ejecucion;
    if (personal_ejecutor !== undefined) updateData.personal_ejecutor = personal_ejecutor;
    if (cantidad_usada !== undefined) updateData.cantidad_usada = cantidad_usada;
    if (observaciones !== undefined) updateData.observaciones = observaciones;
    if (cumplimiento !== undefined) updateData.cumplimiento = cumplimiento;

    const { data, error } = await supabase
      .from('tareas_ejecutadas')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error al actualizar tarea ejecutada:', error);
      return res.status(500).json({
        error: 'Error al actualizar tarea ejecutada',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Tarea ejecutada no encontrada'
      });
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Tarea ejecutada actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en PUT /tareas-ejecutadas/:id:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// DELETE /api/tareas-ejecutadas/:id - Eliminar tarea ejecutada
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tareas_ejecutadas')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error al eliminar tarea ejecutada:', error);
      return res.status(500).json({
        error: 'Error al eliminar tarea ejecutada',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Tarea ejecutada no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Tarea ejecutada eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /tareas-ejecutadas/:id:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;









