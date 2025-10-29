const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Helper para verificar si un cliente existe
async function clienteExists(id) {
  const r = await query('SELECT id FROM servicios.clientes WHERE id = $1', [id]);
  return r.rows.length > 0;
}

// Helper para verificar si una cartera existe
async function carteraExists(id) {
  const r = await query('SELECT id FROM servicios.carteras WHERE id = $1', [id]);
  return r.rows.length > 0;
}

// GET /api/personal-por-cliente - Obtener personal asignado por cliente
router.get('/', async (req, res) => {
  try {
    const { 
      cliente_id, 
      cartera_id, 
      fecha_inicio, 
      fecha_fin,
      activo = true,
      limit = 50, 
      offset = 0 
    } = req.query;

    console.log('📋 GET /api/personal-por-cliente - Obteniendo personal por cliente');
    console.log('Parámetros:', { cliente_id, cartera_id, fecha_inicio, fecha_fin, activo, limit, offset });

    // Construir condiciones WHERE de forma más simple
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (cliente_id) {
      paramCount++;
      whereConditions.push(`cl.id = $${paramCount}`);
      queryParams.push(parseInt(cliente_id));
    }

    if (cartera_id) {
      paramCount++;
      whereConditions.push(`cl.cartera_id = $${paramCount}`);
      queryParams.push(parseInt(cartera_id));
    }

    if (fecha_inicio && fecha_fin) {
      paramCount++;
      whereConditions.push(`p.fecha_trabajo >= $${paramCount}`);
      queryParams.push(fecha_inicio);
      
      paramCount++;
      whereConditions.push(`p.fecha_trabajo <= $${paramCount}`);
      queryParams.push(fecha_fin);
    }

    if (activo === 'true') {
      whereConditions.push(`p.estado = 'activo'`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query simplificado para obtener personal por cliente
    const queryText = `
      SELECT 
        cl.id as cliente_id,
        cl.nombre as cliente_nombre,
        cl.cartera_id,
        c.name as cartera_nombre,
        p.rut,
        pd.nombres as personal_nombre,
        pd.cargo as personal_cargo,
        p.fecha_trabajo,
        p.horas_estimadas,
        p.horas_reales,
        p.observaciones,
        p.estado,
        p.nodo_id,
        n.nombre as nodo_nombre,
        p.created_at,
        p.updated_at
      FROM servicios.clientes cl
      LEFT JOIN servicios.carteras c ON cl.cartera_id = c.id
      LEFT JOIN mantenimiento.programacion_optimizada p ON cl.id = p.cliente_id
      LEFT JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      LEFT JOIN servicios.nodos n ON p.nodo_id = n.id
      ${whereClause}
      ORDER BY cl.nombre, p.fecha_trabajo DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    // Agregar parámetros de paginación
    queryParams.push(parseInt(limit));
    queryParams.push(parseInt(offset));

    console.log('📊 Ejecutando query:', queryText);
    console.log('📊 Parámetros:', queryParams);

    const result = await query(queryText, queryParams);

    // Agrupar resultados por cliente
    const clientesMap = {};
    result.rows.forEach(row => {
      if (!clientesMap[row.cliente_id]) {
        clientesMap[row.cliente_id] = {
          cliente_id: row.cliente_id,
          cliente_nombre: row.cliente_nombre,
          cartera_id: row.cartera_id,
          cartera_nombre: row.cartera_nombre,
          personal: {}
        };
      }

      if (row.rut && !clientesMap[row.cliente_id].personal[row.rut]) {
        clientesMap[row.cliente_id].personal[row.rut] = {
          rut: row.rut,
          nombre: row.personal_nombre,
          cargo: row.personal_cargo,
          programaciones: []
        };
      }

      if (row.rut && clientesMap[row.cliente_id].personal[row.rut]) {
        clientesMap[row.cliente_id].personal[row.rut].programaciones.push({
          fecha_trabajo: row.fecha_trabajo,
          horas_estimadas: row.horas_estimadas,
          horas_reales: row.horas_reales,
          observaciones: row.observaciones,
          estado: row.estado,
          nodo_id: row.nodo_id,
          nodo_nombre: row.nodo_nombre,
          created_at: row.created_at,
          updated_at: row.updated_at
        });
      }
    });

    // Convertir a array y calcular totales
    const processedData = Object.values(clientesMap).map(cliente => ({
      cliente_id: cliente.cliente_id,
      cliente_nombre: cliente.cliente_nombre,
      cartera_id: cliente.cartera_id,
      cartera_nombre: cliente.cartera_nombre,
      total_personal_asignado: Object.keys(cliente.personal).length,
      total_programaciones: Object.values(cliente.personal).reduce((total, persona) => total + persona.programaciones.length, 0),
      personal: Object.values(cliente.personal)
    }));

    // Obtener total de registros para paginación
    const countQuery = `
      SELECT COUNT(DISTINCT cl.id) as total
      FROM servicios.clientes cl
      LEFT JOIN servicios.carteras c ON cl.cartera_id = c.id
      LEFT JOIN mantenimiento.programacion_optimizada p ON cl.id = p.cliente_id
      LEFT JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      ${whereClause}
      HAVING COUNT(DISTINCT p.rut) > 0 OR COUNT(DISTINCT p.id) > 0
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].total) : 0;

    res.json({
      success: true,
      message: 'Personal por cliente obtenido exitosamente',
      data: processedData,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      },
      filters: {
        cliente_id: cliente_id || null,
        cartera_id: cartera_id || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        activo: activo === 'true'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en GET /api/personal-por-cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/personal-por-cliente/resumen - Obtener resumen de personal por cliente
router.get('/resumen', async (req, res) => {
  try {
    const { cartera_id, fecha_inicio, fecha_fin } = req.query;

    console.log('📋 GET /api/personal-por-cliente/resumen - Obteniendo resumen');

    // Construir condiciones WHERE
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (cartera_id) {
      paramCount++;
      whereConditions.push(`cl.cartera_id = $${paramCount}`);
      queryParams.push(parseInt(cartera_id));
    }

    if (fecha_inicio && fecha_fin) {
      paramCount++;
      whereConditions.push(`p.fecha_trabajo >= $${paramCount}`);
      queryParams.push(fecha_inicio);
      
      paramCount++;
      whereConditions.push(`p.fecha_trabajo <= $${paramCount}`);
      queryParams.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query para resumen
    const queryText = `
      SELECT 
        cl.id as cliente_id,
        cl.nombre as cliente_nombre,
        cl.cartera_id,
        c.name as cartera_nombre,
        COUNT(DISTINCT p.rut) as total_personal,
        COUNT(DISTINCT p.id) as total_programaciones,
        SUM(p.horas_estimadas) as total_horas_estimadas,
        SUM(COALESCE(p.horas_reales, 0)) as total_horas_reales,
        COUNT(DISTINCT CASE WHEN p.estado = 'activo' THEN p.rut END) as personal_activo,
        COUNT(DISTINCT CASE WHEN p.estado = 'completado' THEN p.rut END) as personal_completado
      FROM servicios.clientes cl
      LEFT JOIN servicios.carteras c ON cl.cartera_id = c.id
      LEFT JOIN mantenimiento.programacion_optimizada p ON cl.id = p.cliente_id
      ${whereClause}
      GROUP BY cl.id, cl.nombre, cl.cartera_id, c.name
      HAVING COUNT(DISTINCT p.rut) > 0 OR COUNT(DISTINCT p.id) > 0
      ORDER BY total_personal DESC, cl.nombre
    `;

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      message: 'Resumen de personal por cliente obtenido exitosamente',
      data: result.rows,
      filters: {
        cartera_id: cartera_id || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en GET /api/personal-por-cliente/resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/personal-por-cliente/:cliente_id - Obtener personal de un cliente específico
router.get('/:cliente_id', async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const { fecha_inicio, fecha_fin, activo = true } = req.query;

    console.log(`📋 GET /api/personal-por-cliente/${cliente_id} - Obteniendo personal del cliente`);

    if (!(await clienteExists(cliente_id))) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Construir condiciones WHERE
    let whereConditions = ['cl.id = $1'];
    let queryParams = [parseInt(cliente_id)];
    let paramCount = 1;

    if (fecha_inicio && fecha_fin) {
      paramCount++;
      whereConditions.push(`p.fecha_trabajo >= $${paramCount}`);
      queryParams.push(fecha_inicio);
      
      paramCount++;
      whereConditions.push(`p.fecha_trabajo <= $${paramCount}`);
      queryParams.push(fecha_fin);
    }

    if (activo === 'true') {
      whereConditions.push(`p.estado = 'activo'`);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Query para obtener personal del cliente específico
    const queryText = `
      SELECT 
        cl.id as cliente_id,
        cl.nombre as cliente_nombre,
        cl.cartera_id,
        c.name as cartera_nombre,
        p.rut,
        pd.nombres as personal_nombre,
        pd.cargo as personal_cargo,
        p.fecha_trabajo,
        p.horas_estimadas,
        p.horas_reales,
        p.observaciones,
        p.estado,
        p.nodo_id,
        n.nombre as nodo_nombre,
        p.created_at,
        p.updated_at
      FROM servicios.clientes cl
      JOIN servicios.carteras c ON cl.cartera_id = c.id
      LEFT JOIN mantenimiento.programacion_optimizada p ON cl.id = p.cliente_id
      LEFT JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      LEFT JOIN servicios.nodos n ON p.nodo_id = n.id
      ${whereClause}
      ORDER BY p.fecha_trabajo DESC, pd.nombres
    `;

    console.log('📊 Ejecutando query:', queryText);
    console.log('📊 Parámetros:', queryParams);

    const result = await query(queryText, queryParams);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Cliente encontrado pero sin personal asignado',
        data: {
          cliente_id: parseInt(cliente_id),
          cliente_nombre: 'Cliente no encontrado',
          cartera_id: null,
          cartera_nombre: null,
          personal: []
        }
      });
    }

    // Agrupar por personal
    const personalAgrupado = {};
    result.rows.forEach(row => {
      if (row.rut && !personalAgrupado[row.rut]) {
        personalAgrupado[row.rut] = {
          rut: row.rut,
          nombre: row.personal_nombre,
          cargo: row.personal_cargo,
          programaciones: []
        };
      }
      
      if (row.rut && personalAgrupado[row.rut]) {
        personalAgrupado[row.rut].programaciones.push({
          fecha_trabajo: row.fecha_trabajo,
          horas_estimadas: row.horas_estimadas,
          horas_reales: row.horas_reales,
          observaciones: row.observaciones,
          estado: row.estado,
          nodo_id: row.nodo_id,
          nodo_nombre: row.nodo_nombre,
          created_at: row.created_at,
          updated_at: row.updated_at
        });
      }
    });

    const clienteInfo = result.rows[0];

    res.json({
      success: true,
      message: 'Personal del cliente obtenido exitosamente',
      data: {
        cliente_id: clienteInfo.cliente_id,
        cliente_nombre: clienteInfo.cliente_nombre,
        cartera_id: clienteInfo.cartera_id,
        cartera_nombre: clienteInfo.cartera_nombre,
        total_personal: Object.keys(personalAgrupado).length,
        total_programaciones: result.rows.length,
        personal: Object.values(personalAgrupado)
      },
      filters: {
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        activo: activo === 'true'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en GET /api/personal-por-cliente/:cliente_id:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;