const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/supabase');

// GET /componentes - obtener todos los componentes
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const equipoId = req.query.equipo_id;
    const tipoComponente = req.query.tipo_componente;
    const estado = req.query.estado;

    let query = supabase
      .from('lubricacion.componentes')
      .select(`
        *,
        equipos!inner(
          id, nombre, descripcion, codigo_equipo, tipo_equipo,
          lineas!inner(
            id, nombre, descripcion, codigo_linea,
            plantas!inner(
              id, nombre, descripcion, codigo_planta,
              faenas!inner(id, nombre, descripcion, ubicacion)
            )
          )
        )
      `)
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`nombre.ilike.%${search}%, descripcion.ilike.%${search}%, codigo_componente.ilike.%${search}%`);
    }

    if (equipoId) {
      query = query.eq('equipo_id', equipoId);
    }

    if (tipoComponente) {
      query = query.eq('tipo_componente', tipoComponente);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener componentes',
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

// GET /componentes/:id - obtener componente por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('lubricacion.componentes')
      .select(`
        *,
        equipos!inner(
          id, nombre, descripcion, codigo_equipo, tipo_equipo,
          lineas!inner(
            id, nombre, descripcion, codigo_linea,
            plantas!inner(
              id, nombre, descripcion, codigo_planta,
              faenas!inner(id, nombre, descripcion, ubicacion)
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Componente no encontrado',
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

// POST /componentes - crear nuevo componente
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
      .from('lubricacion.componentes')
      .insert([payload])
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear componente',
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

// PUT /componentes/:id - actualizar componente
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
      .from('lubricacion.componentes')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar componente',
        details: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({
        error: 'Componente no encontrado',
        message: `No se encontró un componente con ID: ${id}`
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

// DELETE /componentes/:id - eliminar componente
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingComponente, error: selectError } = await supabase
      .from('lubricacion.componentes')
      .select('id')
      .eq('id', id)
      .single();

    if (selectError || !existingComponente) {
      return res.status(404).json({
        error: 'Componente no encontrado',
        message: `No se encontró un componente con ID: ${id}`
      });
    }

    const { error } = await supabase
      .from('lubricacion.componentes')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar componente',
        details: error.message 
      });
    }

    res.json({ 
      message: 'Componente eliminado exitosamente',
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