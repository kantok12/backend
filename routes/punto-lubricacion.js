const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/database');

// GET /punto-lubricacion - listar todos los puntos de lubricación (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const componenteId = req.query.componente_id;
    const lubricanteId = req.query.lubricante_id;
    const frecuencia = req.query.frecuencia;

    let query = supabase
      .from('punto_lubricacion')
      .select(`
        *,
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
      `)
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('nombre', `%${search}%`);
    }

    if (componenteId) {
      query = query.eq('componente_id', componenteId);
    }

    if (lubricanteId) {
      query = query.eq('lubricante_id', lubricanteId);
    }

    if (frecuencia) {
      query = query.ilike('frecuencia', `%${frecuencia}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener puntos de lubricación',
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
    console.error('Error en GET /punto-lubricacion:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /punto-lubricacion/:id - obtener un punto de lubricación por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('punto_lubricacion')
      .select(`
        *,
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
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Punto de lubricación no encontrado',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error en GET /punto-lubricacion/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /punto-lubricacion/:id/tareas-proyectadas - obtener tareas proyectadas de un punto
router.get('/:id/tareas-proyectadas', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const { data, error } = await supabase
      .from('tareas_proyectadas')
      .select('*')
      .eq('punto_lubricacion_id', id)
      .range(offset, offset + limit - 1)
      .order('fecha_proyectada', { ascending: true });

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
    console.error('Error en GET /punto-lubricacion/:id/tareas-proyectadas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /punto-lubricacion/:id/tareas-programadas - obtener tareas programadas de un punto
router.get('/:id/tareas-programadas', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const estado = req.query.estado;

    let query = supabase
      .from('tareas_programadas')
      .select('*')
      .eq('punto_lubricacion_id', id)
      .range(offset, offset + limit - 1)
      .order('fecha_programada', { ascending: true });

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener tareas programadas',
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
    console.error('Error en GET /punto-lubricacion/:id/tareas-programadas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /punto-lubricacion - crear un nuevo punto de lubricación
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
    if (!payload.componente_id || !payload.lubricante_id || !payload.cantidad) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        message: 'componente_id, lubricante_id y cantidad son requeridos'
      });
    }

    const { data, error } = await supabase
      .from('punto_lubricacion')
      .insert([payload])
      .select(`
        *,
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
      `);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear punto de lubricación',
        details: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: data[0],
      message: 'Punto de lubricación creado exitosamente'
    });

  } catch (error) {
    console.error('Error en POST /punto-lubricacion:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /punto-lubricacion/:id - actualizar un punto de lubricación
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
      .from('punto_lubricacion')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
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
      `);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar punto de lubricación',
        details: error.message 
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Punto de lubricación no encontrado',
        message: `No se encontró un punto de lubricación con ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Punto de lubricación actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error en PUT /punto-lubricacion/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /punto-lubricacion/:id - eliminar un punto de lubricación
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingPunto, error: selectError } = await supabase
      .from('punto_lubricacion')
      .select('id')
      .eq('id', id)
      .single();

    if (selectError || !existingPunto) {
      return res.status(404).json({
        error: 'Punto de lubricación no encontrado',
        message: `No se encontró un punto de lubricación con ID: ${id}`
      });
    }

    const { error } = await supabase
      .from('punto_lubricacion')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar punto de lubricación',
        details: error.message 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Punto de lubricación eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /punto-lubricacion/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;

