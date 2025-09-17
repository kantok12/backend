const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET /personal-disponible - listar todo el personal disponible (con paginación opcional)
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search;
    const estadoId = req.query.estado_id;
    const cargo = req.query.cargo;

    // Construir consulta SQL con JOIN a estados
    let queryText = `
      SELECT 
        pd.*,
        e.nombre as estado_nombre
      FROM mantenimiento.personal_disponible pd
      LEFT JOIN mantenimiento.estados e ON pd.estado_id = e.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    // Filtro por RUT (búsqueda)
    if (search) {
      queryText += ` AND pd.rut ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por estado
    if (estadoId) {
      queryText += ` AND pd.estado_id = $${paramIndex}`;
      queryParams.push(estadoId);
      paramIndex++;
    }

    // Filtro por cargo
    if (cargo) {
      queryText += ` AND pd.cargo ILIKE $${paramIndex}`;
      queryParams.push(`%${cargo}%`);
      paramIndex++;
    }

    // Agregar paginación
    queryText += ` ORDER BY pd.rut LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Consulta para contar total
    let countQuery = `SELECT COUNT(*) FROM mantenimiento.personal_disponible pd WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND pd.rut ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (estadoId) {
      countQuery += ` AND pd.estado_id = $${countParamIndex}`;
      countParams.push(estadoId);
      countParamIndex++;
    }

    if (cargo) {
      countQuery += ` AND pd.cargo ILIKE $${countParamIndex}`;
      countParams.push(`%${cargo}%`);
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      message: result.rows.length > 0 ? 'Personal disponible obtenido exitosamente' : 'No se encontró personal disponible',
      data: result.rows,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (offset + limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error al obtener personal disponible:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener personal disponible',
      message: error.message
    });
  }
});

// GET /personal-disponible/stats/cargos - estadísticas por cargos
router.get('/stats/cargos', async (req, res) => {
  try {
    const queryText = `
      SELECT 
        cargo,
        COUNT(*) as cantidad,
        COUNT(CASE WHEN estado_id = 1 THEN 1 END) as disponibles
      FROM mantenimiento.personal_disponible pd
      GROUP BY cargo
      ORDER BY cantidad DESC
    `;

    const result = await query(queryText);

    res.json({
      success: true,
      message: 'Estadísticas por cargo obtenidas exitosamente',
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
});

// GET /personal-disponible/:rut - obtener personal por RUT
router.get('/:rut', async (req, res) => {
  try {
    const { rut } = req.params;

    const queryText = `
      SELECT 
        pd.*,
        e.nombre as estado_nombre
      FROM mantenimiento.personal_disponible pd
      LEFT JOIN mantenimiento.estados e ON pd.estado_id = e.id
      WHERE pd.rut = $1
    `;

    const result = await query(queryText, [rut]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Personal no encontrado',
        message: `No existe personal disponible con RUT ${rut}`
      });
    }

    res.json({
      success: true,
      message: 'Personal disponible obtenido exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener personal:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener personal',
      message: error.message
    });
  }
});

// POST /personal-disponible - crear nuevo registro de personal disponible
router.post('/', async (req, res) => {
  try {
    const {
      rut,
      sexo,
      fecha_nacimiento,
      licencia_conducir,
      talla_zapatos,
      talla_pantalones,
      talla_poleras,
      cargo,
      estado_id,
      zona_geografica
    } = req.body;

    // Validaciones
    if (!rut || rut.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'El RUT es requerido'
      });
    }

    if (!sexo || !fecha_nacimiento || !licencia_conducir || !cargo || !estado_id) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'Los campos sexo, fecha_nacimiento, licencia_conducir, cargo y estado_id son requeridos'
      });
    }

    // Verificar que no exista ya el RUT
    const existingCheck = await query('SELECT rut FROM mantenimiento.personal_disponible WHERE rut = $1', [rut]);
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'RUT ya existe',
        message: `Ya existe personal disponible con RUT ${rut}`
      });
    }

    const queryText = `
      INSERT INTO mantenimiento.personal_disponible (
        rut, sexo, fecha_nacimiento, licencia_conducir, 
        talla_zapatos, talla_pantalones, talla_poleras, 
        cargo, estado_id, zona_geografica
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await query(queryText, [
      rut.trim(),
      sexo,
      fecha_nacimiento,
      licencia_conducir,
      talla_zapatos || '',
      talla_pantalones || '',
      talla_poleras || '',
      cargo,
      estado_id,
      zona_geografica || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Personal disponible creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear personal disponible:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear personal disponible',
      message: error.message
    });
  }
});

// PUT /personal-disponible/:rut - actualizar personal disponible
router.put('/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const {
      sexo,
      fecha_nacimiento,
      licencia_conducir,
      talla_zapatos,
      talla_pantalones,
      talla_poleras,
      cargo,
      estado_id,
      zona_geografica
    } = req.body;

    // Validaciones
    if (!sexo || !fecha_nacimiento || !licencia_conducir || !cargo || !estado_id) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'Los campos sexo, fecha_nacimiento, licencia_conducir, cargo y estado_id son requeridos'
      });
    }

    const queryText = `
      UPDATE mantenimiento.personal_disponible 
      SET 
        sexo = $1, 
        fecha_nacimiento = $2, 
        licencia_conducir = $3,
        talla_zapatos = $4, 
        talla_pantalones = $5, 
        talla_poleras = $6,
        cargo = $7, 
        estado_id = $8, 
        zona_geografica = $9
      WHERE rut = $10
      RETURNING *
    `;

    const result = await query(queryText, [
      sexo,
      fecha_nacimiento,
      licencia_conducir,
      talla_zapatos || '',
      talla_pantalones || '',
      talla_poleras || '',
      cargo,
      estado_id,
      zona_geografica || null,
      rut
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Personal no encontrado',
        message: `No existe personal disponible con RUT ${rut}`
      });
    }

    res.json({
      success: true,
      message: 'Personal disponible actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar personal disponible:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar personal disponible',
      message: error.message
    });
  }
});

// DELETE /personal-disponible/:rut - eliminar personal disponible

// GET /personal-disponible/verify-import - verificar importación reciente
router.get('/verify-import', async (req, res) => {
  try {
    console.log('🔍 Verificando importación de personal disponible...');
    
    // Obtener estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_registros,
        COUNT(CASE WHEN estado_id = 1 THEN 1 END) as activos,
        COUNT(DISTINCT cargo) as cargos_diferentes,
        COUNT(DISTINCT zona_geografica) as zonas_diferentes,
        MIN(fecha_nacimiento) as persona_mayor,
        MAX(fecha_nacimiento) as persona_menor
      FROM mantenimiento.personal_disponible
    `;
    
    const statsResult = await query(statsQuery);
    const stats = statsResult.rows[0];
    
    // Obtener últimos registros importados (asumiendo que tienen comentario_estado con 'Importado:')
    const recentImportsQuery = `
      SELECT 
        rut,
        sexo,
        fecha_nacimiento,
        cargo,
        zona_geografica,
        comentario_estado
      FROM mantenimiento.personal_disponible 
      WHERE comentario_estado LIKE 'Importado:%'
      ORDER BY rut
      LIMIT 10
    `;
    
    const recentImports = await query(recentImportsQuery);
    
    // Obtener distribución por cargos
    const cargoDistQuery = `
      SELECT 
        cargo,
        COUNT(*) as cantidad
      FROM mantenimiento.personal_disponible
      GROUP BY cargo
      ORDER BY cantidad DESC
    `;
    
    const cargoDistribution = await query(cargoDistQuery);
    
    // Obtener distribución por zonas
    const zonaDistQuery = `
      SELECT 
        zona_geografica,
        COUNT(*) as cantidad
      FROM mantenimiento.personal_disponible
      WHERE zona_geografica IS NOT NULL
      GROUP BY zona_geografica
      ORDER BY cantidad DESC
    `;
    
    const zonaDistribution = await query(zonaDistQuery);
    
    // Obtener estados disponibles
    const estadosQuery = `
      SELECT 
        e.id,
        e.nombre,
        e.descripcion,
        COUNT(pd.estado_id) as personal_count
      FROM mantenimiento.estados e
      LEFT JOIN mantenimiento.personal_disponible pd ON e.id = pd.estado_id
      GROUP BY e.id, e.nombre, e.descripcion
      ORDER BY e.id
    `;
    
    const estados = await query(estadosQuery);
    
    res.json({
      success: true,
      message: 'Verificación de importación completada',
      timestamp: new Date().toISOString(),
      data: {
        estadisticas_generales: {
          total_registros: parseInt(stats.total_registros),
          registros_activos: parseInt(stats.activos),
          cargos_diferentes: parseInt(stats.cargos_diferentes),
          zonas_diferentes: parseInt(stats.zonas_diferentes),
          persona_mayor_nacimiento: stats.persona_mayor,
          persona_menor_nacimiento: stats.persona_menor
        },
        ultimos_importados: recentImports.rows,
        distribucion_por_cargo: cargoDistribution.rows,
        distribucion_por_zona: zonaDistribution.rows,
        estados_disponibles: estados.rows
      }
    });
    
  } catch (error) {
    console.error('Error en verificación de importación:', error);
    res.status(500).json({
      success: false,
      error: 'Error en verificación de importación',
      message: error.message
    });
  }
});


router.delete('/:rut', async (req, res) => {
  try {
    const { rut } = req.params;

    const queryText = 'DELETE FROM mantenimiento.personal_disponible WHERE rut = $1 RETURNING *';
    const result = await query(queryText, [rut]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Personal no encontrado',
        message: `No existe personal disponible con RUT ${rut}`
      });
    }

    res.json({
      success: true,
      message: 'Personal disponible eliminado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar personal disponible:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar personal disponible',
      message: error.message
    });
  }
});

module.exports = router;