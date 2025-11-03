const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// GET /api/programacion-optimizada/todas - Obtener toda la programación de todas las carteras
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.id,
        p.rut,
        pd.nombres as nombre_persona,
        pd.cargo,
        p.cartera_id,
        c.name as nombre_cartera,
        p.cliente_id,
        cl.nombre as nombre_cliente,
        p.nodo_id,
        n.nombre as nombre_nodo,
        p.fecha_trabajo,
        p.dia_semana,
        p.horas_estimadas,
        p.horas_reales,
        p.observaciones,
        p.estado,
        p.created_at,
        p.updated_at
      FROM mantenimiento.programacion_optimizada p
      JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      JOIN servicios.carteras c ON c.id = p.cartera_id
      LEFT JOIN servicios.clientes cl ON cl.id = p.cliente_id
      LEFT JOIN servicios.nodos n ON n.id = p.nodo_id
      ORDER BY p.fecha_trabajo DESC, c.name, pd.nombres
    `);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error en GET /programacion-optimizada/todas:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener toda la programación', 
      error: err.message 
    });
  }
});

module.exports = router;
