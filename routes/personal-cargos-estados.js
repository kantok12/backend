const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// GET /api/personal/cargos-estados - Cantidad de personas por cargo y estado
router.get('/cargos-estados', async (req, res) => {
  try {
    const result = await query(`
      SELECT pd.cargo, pd.estado_id, e.nombre as estado_nombre, COUNT(*) as cantidad
      FROM mantenimiento.personal_disponible pd
      LEFT JOIN mantenimiento.estados e ON pd.estado_id = e.id
      GROUP BY pd.cargo, pd.estado_id, e.nombre
      ORDER BY pd.cargo, e.nombre
    `);

    // Procesar resultados para agrupar por cargo
    const cargos = {};
    result.rows.forEach(row => {
      if (!cargos[row.cargo]) {
        cargos[row.cargo] = {
          cargo: row.cargo,
          total: 0,
          estados: {}
        };
      }
      cargos[row.cargo].total += parseInt(row.cantidad);
      cargos[row.cargo].estados[row.estado_nombre || 'Sin estado'] = parseInt(row.cantidad);
    });

    res.json({
      success: true,
      data: Object.values(cargos)
    });
  } catch (err) {
    console.error('Error en GET /api/personal/cargos-estados:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cargos y estados',
      error: err.message
    });
  }
});

module.exports = router;
