const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * RUTAS PARA ACCESO A NOMBRES DEL PERSONAL
 * Maneja los nombres del personal desde mantenimiento.personal_disponible
 */

// GET /api/nombres - Obtener todos los nombres
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/nombres - Obteniendo todos los nombres');
    
    const getAllQuery = `
      SELECT 
        rut,
        nombres
      FROM mantenimiento.personal_disponible 
      WHERE nombres IS NOT NULL
      ORDER BY nombres, rut
    `;
    
    const result = await query(getAllQuery);
    
    console.log(`✅ Nombres obtenidos: ${result.rows.length}`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo nombres:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/nombres/stats - Estadísticas de nombres
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/nombres/stats - Obteniendo estadísticas');
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_registros,
        COUNT(nombres) as nombres_llenos
      FROM mantenimiento.personal_disponible
    `;
    
    const result = await query(statsQuery);
    const stats = result.rows[0];
    
    // Calcular porcentajes
    const porcentajeNombresLlenos = stats.total_registros > 0 
      ? ((stats.nombres_llenos / stats.total_registros) * 100).toFixed(2)
      : 0;
    
    const response = {
      success: true,
      data: {
        total_registros: parseInt(stats.total_registros),
        nombres_llenos: parseInt(stats.nombres_llenos),
        nombres_vacios: parseInt(stats.total_registros) - parseInt(stats.nombres_llenos),
        porcentaje_nombres_llenos: parseFloat(porcentajeNombresLlenos)
      }
    };
    
    console.log('✅ Estadísticas calculadas:', response.data);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/nombres/search?q=... - Buscar nombres
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Parámetro de búsqueda "q" es requerido'
      });
    }
    
    console.log(`🔍 GET /api/nombres/search - Buscando: "${q}"`);
    
    const searchQuery = `
      SELECT 
        rut,
        nombres
      FROM mantenimiento.personal_disponible 
      WHERE 
        nombres ILIKE $1 OR 
        rut ILIKE $2
      ORDER BY 
        CASE WHEN nombres ILIKE $3 THEN 1 ELSE 2 END,
        nombres, rut
      LIMIT 50
    `;
    
    const searchTerm = `%${q.trim()}%`;
    const exactSearchTerm = `${q.trim()}%`;
    
    const result = await query(searchQuery, [searchTerm, searchTerm, exactSearchTerm]);
    
    console.log(`✅ Resultados encontrados: ${result.rows.length}`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      search_term: q.trim()
    });
    
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/nombres/:rut - Obtener nombre por RUT
router.get('/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    
    console.log(`📋 GET /api/nombres/${rut} - Obteniendo nombre por RUT`);
    
    const getByRutQuery = `
      SELECT 
        rut,
        nombres
      FROM mantenimiento.personal_disponible 
      WHERE rut = $1
    `;
    
    const result = await query(getByRutQuery, [rut]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Nombre no encontrado para RUT: ${rut}`);
      return res.status(404).json({
        success: false,
        message: `No se encontró registro para el RUT: ${rut}`
      });
    }
    
    console.log(`✅ Nombre encontrado para RUT: ${rut}`);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error(`❌ Error obteniendo nombre por RUT ${req.params.rut}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/nombres/:rut - Actualizar nombre por RUT
router.put('/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const { nombres, sexo, fecha_nacimiento, licencia_conducir } = req.body;
    
    console.log(`📝 PUT /api/nombres/${rut} - Actualizando nombre`);
    
    // Validaciones básicas
    if (!nombres || nombres.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }
    
    // Verificar que el registro existe
    const checkExistsQuery = `
      SELECT rut FROM mantenimiento.personal_disponible WHERE rut = $1
    `;
    
    const existsResult = await query(checkExistsQuery, [rut]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró registro para el RUT: ${rut}`
      });
    }
    
    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (nombres) {
      updateFields.push(`nombres = $${paramIndex++}`);
      updateValues.push(nombres.trim());
    }
    
    if (sexo) {
      updateFields.push(`sexo = $${paramIndex++}`);
      updateValues.push(sexo);
    }
    
    if (fecha_nacimiento) {
      updateFields.push(`fecha_nacimiento = $${paramIndex++}`);
      updateValues.push(fecha_nacimiento);
    }
    
    if (licencia_conducir) {
      updateFields.push(`licencia_conducir = $${paramIndex++}`);
      updateValues.push(licencia_conducir);
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(rut); // Para el WHERE
    
    const updateQuery = `
      UPDATE mantenimiento.personal_disponible 
      SET ${updateFields.join(', ')}
      WHERE rut = $${paramIndex}
      RETURNING *
    `;
    
    const result = await query(updateQuery, updateValues);
    
    console.log(`✅ Nombre actualizado para RUT: ${rut}`);
    
    res.json({
      success: true,
      message: 'Nombre actualizado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error(`❌ Error actualizando nombre para RUT ${req.params.rut}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/nombres - Crear nuevo registro de nombre
router.post('/', async (req, res) => {
  try {
    const { rut, nombres, sexo, fecha_nacimiento, licencia_conducir } = req.body;
    
    console.log('📝 POST /api/nombres - Creando nuevo nombre');
    
    // Validaciones
    if (!rut || !nombres) {
      return res.status(400).json({
        success: false,
        message: 'RUT y nombre son requeridos'
      });
    }
    
    // Verificar que no existe
    const checkExistsQuery = `
      SELECT rut FROM mantenimiento.personal_disponible WHERE rut = $1
    `;
    
    const existsResult = await query(checkExistsQuery, [rut]);
    
    if (existsResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un registro para el RUT: ${rut}`
      });
    }
    
    const insertQuery = `
      INSERT INTO mantenimiento.personal_disponible (
        rut, nombres, sexo, fecha_nacimiento, licencia_conducir, estado_id
      ) VALUES ($1, $2, $3, $4, $5, 1)
      RETURNING *
    `;
    
    const result = await query(insertQuery, [
      rut,
      nombres.trim(),
      sexo || null,
      fecha_nacimiento || null,
      licencia_conducir || null
    ]);
    
    console.log(`✅ Nuevo nombre creado para RUT: ${rut}`);
    
    res.status(201).json({
      success: true,
      message: 'Nombre creado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error creando nombre:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/nombres/:rut - Eliminar nombre por RUT
router.delete('/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    
    console.log(`🗑️ DELETE /api/nombres/${rut} - Eliminando nombre`);
    
    // Verificar que existe
    const checkExistsQuery = `
      SELECT rut FROM mantenimiento.personal_disponible WHERE rut = $1
    `;
    
    const existsResult = await query(checkExistsQuery, [rut]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró registro para el RUT: ${rut}`
      });
    }
    
    const deleteQuery = `
      DELETE FROM mantenimiento.personal_disponible 
      WHERE rut = $1
      RETURNING *
    `;
    
    const result = await query(deleteQuery, [rut]);
    
    console.log(`✅ Nombre eliminado para RUT: ${rut}`);
    
    res.json({
      success: true,
      message: 'Nombre eliminado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error(`❌ Error eliminando nombre para RUT ${req.params.rut}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
