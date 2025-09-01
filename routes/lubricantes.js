const express = require('express');
const router = express.Router();
const { getSupabaseAdminClient } = require('../config/database');

// GET /lubricantes - listar todos los lubricantes (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const tipo = req.query.tipo;
    const marca = req.query.marca;

    let query = supabase
      .from('lubricantes')
      .select('*')
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`marca.ilike.%${search}%, tipo.ilike.%${search}%`);
    }

    if (tipo) {
      query = query.ilike('tipo', `%${tipo}%`);
    }

    if (marca) {
      query = query.ilike('marca', `%${marca}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener lubricantes',
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
    console.error('Error en GET /lubricantes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /lubricantes/:id - obtener un lubricante por ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('lubricantes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Lubricante no encontrado',
        details: error.message 
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error en GET /lubricantes/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /lubricantes/:id/puntos-lubricacion - obtener puntos de lubricación que usan este lubricante
router.get('/:id/puntos-lubricacion', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const { data, error } = await supabase
      .from('punto_lubricacion')
      .select('*, componentes!inner(id, nombre, equipos!inner(id, nombre, codigo_equipo))')
      .eq('lubricante_id', id)
      .range(offset, offset + limit - 1);

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
    console.error('Error en GET /lubricantes/:id/puntos-lubricacion:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /lubricantes/tipos/disponibles - obtener tipos únicos de lubricantes
router.get('/tipos/disponibles', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('lubricantes')
      .select('tipo')
      .not('tipo', 'is', null);

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener tipos de lubricantes',
        details: error.message 
      });
    }

    // Extraer tipos únicos
    const tiposUnicos = [...new Set(data.map(item => item.tipo).filter(Boolean))];

    res.json({
      success: true,
      data: tiposUnicos
    });

  } catch (error) {
    console.error('Error en GET /lubricantes/tipos/disponibles:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /lubricantes/marcas/disponibles - obtener marcas únicas de lubricantes
router.get('/marcas/disponibles', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('lubricantes')
      .select('marca')
      .not('marca', 'is', null);

    if (error) {
      return res.status(500).json({ 
        error: 'Error al obtener marcas de lubricantes',
        details: error.message 
      });
    }

    // Extraer marcas únicas
    const marcasUnicas = [...new Set(data.map(item => item.marca).filter(Boolean))];

    res.json({
      success: true,
      data: marcasUnicas
    });

  } catch (error) {
    console.error('Error en GET /lubricantes/marcas/disponibles:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /lubricantes - crear un nuevo lubricante
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
      .from('lubricantes')
      .insert([payload])
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al crear lubricante',
        details: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: data[0],
      message: 'Lubricante creado exitosamente'
    });

  } catch (error) {
    console.error('Error en POST /lubricantes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /lubricantes/:id - actualizar un lubricante
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
      .from('lubricantes')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ 
        error: 'Error al actualizar lubricante',
        details: error.message 
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Lubricante no encontrado',
        message: `No se encontró un lubricante con ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Lubricante actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error en PUT /lubricantes/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /lubricantes/:id - eliminar un lubricante
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: existingLubricante, error: selectError } = await supabase
      .from('lubricantes')
      .select('id')
      .eq('id', id)
      .single();

    if (selectError || !existingLubricante) {
      return res.status(404).json({
        error: 'Lubricante no encontrado',
        message: `No se encontró un lubricante con ID: ${id}`
      });
    }

    const { error } = await supabase
      .from('lubricantes')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Error al eliminar lubricante',
        details: error.message 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lubricante eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /lubricantes/:id:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;

