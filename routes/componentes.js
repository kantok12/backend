const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/database');

// GET /componentes - listar todos los componentes (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const equipoId = req.query.equipo_id;

    let query = supabase
      .from('componentes')
      .select('*, equipos!inner(id, nombre, codigo_equipo, lineas!inner(id, nombre, plantas!inner(id, nombre, faenas!inner(id, nombre))))')
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('nombre', `%${search}%`);
    }

    if (equipoId) {
      query = query.eq('equipo_id', equipoId);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener componentes',
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
    console.error('Error en GET /componentes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /componentes/:id - obtener un componente por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('componentes')
      .select('*, equipos!inner(id, nombre, codigo_equipo, lineas!inner(id, nombre, plantas!inner(id, nombre, faenas!inner(id, nombre))))')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Componente no encontrado',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error en GET /componentes/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /componentes/:id/puntos-lubricacion - obtener puntos de lubricación de un componente
router.get('/:id/puntos-lubricacion', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const { data, error } = await supabase
      .from('punto_lubricacion')
      .select('*, lubricantes!inner(id, marca, tipo)')
      .eq('componente_id', id)
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener puntos de lubricación del componente',
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
    console.error('Error en GET /componentes/:id/puntos-lubricacion:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /componentes - crear un nuevo componente
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
      .from('componentes')
      .insert([payload])
      .select('*, equipos!inner(id, nombre, codigo_equipo, lineas!inner(id, nombre, plantas!inner(id, nombre, faenas!inner(id, nombre))))');

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear componente',
        details: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: data[0],
      message: 'Componente creado exitosamente'
    });

  } catch (error) {
    console.error('Error en POST /componentes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /componentes/:id - actualizar un componente
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
      .from('componentes')
      .update(payload)
      .eq('id', id)
      .select('*, equipos!inner(id, nombre, codigo_equipo, lineas!inner(id, nombre, plantas!inner(id, nombre, faenas!inner(id, nombre))))');

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar componente',
        details: error.message 
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Componente no encontrado',
        message: `No se encontró un componente con ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Componente actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error en PUT /componentes/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /componentes/:id - eliminar un componente
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingComponente, error: selectError } = await supabase
      .from('componentes')
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
      .from('componentes')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar componente',
        details: error.message 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Componente eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /componentes/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;

