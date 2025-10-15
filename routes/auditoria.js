const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// Middleware para configurar contexto de auditoría
const setAuditContext = (req, res, next) => {
  const usuario = req.user?.username || req.headers['x-user'] || 'sistema';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const endpoint = req.originalUrl || 'unknown';
  
  // Configurar contexto en la sesión de base de datos
  query('SELECT sistema.set_audit_context($1, $2, $3)', [usuario, userAgent, endpoint])
    .then(() => next())
    .catch(() => next()); // Continuar aunque falle la configuración
};

// Aplicar middleware a todas las rutas
router.use(setAuditContext);

// GET /api/auditoria/dashboard - Dashboard de actividad en tiempo real
router.get('/dashboard', async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      tabla = null, 
      operacion = null, 
      usuario = null,
      es_critico = null,
      desde = null,
      hasta = null
    } = req.query;

    console.log('📊 Obteniendo dashboard de actividad...');

    // Construir filtros dinámicos
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (tabla) {
      paramCount++;
      whereClause += ` AND al.tabla_afectada = $${paramCount}`;
      params.push(tabla);
    }

    if (operacion) {
      paramCount++;
      whereClause += ` AND al.operacion = $${paramCount}`;
      params.push(operacion.toUpperCase());
    }

    if (usuario) {
      paramCount++;
      whereClause += ` AND al.usuario ILIKE $${paramCount}`;
      params.push(`%${usuario}%`);
    }

    if (es_critico !== null) {
      paramCount++;
      whereClause += ` AND al.es_critico = $${paramCount}`;
      params.push(es_critico === 'true');
    }

    if (desde) {
      paramCount++;
      whereClause += ` AND al.timestamp >= $${paramCount}`;
      params.push(desde);
    }

    if (hasta) {
      paramCount++;
      whereClause += ` AND al.timestamp <= $${paramCount}`;
      params.push(hasta);
    }

    // Consulta principal del dashboard
    const dashboardQuery = `
      SELECT 
        al.id,
        al.tabla_afectada,
        al.operacion,
        al.registro_id,
        al.usuario,
        al.timestamp,
        al.es_critico,
        al.contexto,
        al.endpoint,
        n.tipo as tipo_notificacion,
        n.titulo,
        n.mensaje,
        n.leida,
        CASE 
          WHEN al.operacion = 'INSERT' THEN 'success'
          WHEN al.operacion = 'UPDATE' THEN 'info'
          WHEN al.operacion = 'DELETE' THEN 'warning'
        END as color_operacion,
        CASE 
          WHEN al.es_critico THEN '🔴'
          WHEN al.operacion = 'DELETE' THEN '⚠️'
          WHEN al.operacion = 'INSERT' THEN '✅'
          ELSE 'ℹ️'
        END as icono
      FROM sistema.auditoria_log al
      LEFT JOIN sistema.notificaciones n ON n.auditoria_id = al.id
      ${whereClause}
      ORDER BY al.timestamp DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    const result = await query(dashboardQuery, [...params, limit, offset]);

    // Estadísticas del dashboard
    const statsQuery = `
      SELECT 
        COUNT(*) as total_actividades,
        COUNT(*) FILTER (WHERE al.es_critico = true) as actividades_criticas,
        COUNT(*) FILTER (WHERE al.operacion = 'INSERT') as inserciones,
        COUNT(*) FILTER (WHERE al.operacion = 'UPDATE') as actualizaciones,
        COUNT(*) FILTER (WHERE al.operacion = 'DELETE') as eliminaciones,
        COUNT(DISTINCT al.usuario) as usuarios_activos,
        COUNT(DISTINCT al.tabla_afectada) as tablas_afectadas
      FROM sistema.auditoria_log al
      ${whereClause}
    `;

    const stats = await query(statsQuery, params);

    // Actividad por tabla
    const actividadPorTabla = await query(`
      SELECT 
        tabla_afectada,
        COUNT(*) as total_operaciones,
        COUNT(*) FILTER (WHERE operacion = 'INSERT') as inserciones,
        COUNT(*) FILTER (WHERE operacion = 'UPDATE') as actualizaciones,
        COUNT(*) FILTER (WHERE operacion = 'DELETE') as eliminaciones,
        COUNT(*) FILTER (WHERE es_critico = true) as criticas
      FROM sistema.auditoria_log al
      ${whereClause}
      GROUP BY tabla_afectada
      ORDER BY total_operaciones DESC
    `, params);

    // Actividad por usuario
    const actividadPorUsuario = await query(`
      SELECT 
        usuario,
        COUNT(*) as total_operaciones,
        COUNT(*) FILTER (WHERE es_critico = true) as criticas,
        MAX(timestamp) as ultima_actividad
      FROM sistema.auditoria_log al
      ${whereClause}
      GROUP BY usuario
      ORDER BY total_operaciones DESC
      LIMIT 10
    `, params);

    res.json({
      success: true,
      message: 'Dashboard de actividad obtenido exitosamente',
      data: {
        actividades: result.rows,
        estadisticas: stats.rows[0],
        actividad_por_tabla: actividadPorTabla.rows,
        actividad_por_usuario: actividadPorUsuario.rows,
        filtros_aplicados: {
          tabla,
          operacion,
          usuario,
          es_critico,
          desde,
          hasta,
          limit,
          offset
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo dashboard de actividad',
      error: error.message
    });
  }
});

// GET /api/auditoria/notificaciones - Obtener notificaciones
router.get('/notificaciones', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      tipo = null, 
      leida = null,
      usuario_destino = null
    } = req.query;

    console.log('🔔 Obteniendo notificaciones...');

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (tipo) {
      paramCount++;
      whereClause += ` AND tipo = $${paramCount}`;
      params.push(tipo);
    }

    if (leida !== null) {
      paramCount++;
      whereClause += ` AND leida = $${paramCount}`;
      params.push(leida === 'true');
    }

    if (usuario_destino) {
      paramCount++;
      whereClause += ` AND (usuario_destino = $${paramCount} OR usuario_destino IS NULL)`;
      params.push(usuario_destino);
    }

    const result = await query(`
      SELECT 
        n.*,
        al.tabla_afectada,
        al.operacion,
        al.registro_id,
        al.es_critico,
        al.contexto
      FROM sistema.notificaciones n
      LEFT JOIN sistema.auditoria_log al ON n.auditoria_id = al.id
      ${whereClause}
      ORDER BY n.timestamp DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, limit, offset]);

    // Contar notificaciones no leídas
    const noLeidas = await query(`
      SELECT COUNT(*) as total_no_leidas
      FROM sistema.notificaciones
      WHERE leida = false
      ${usuario_destino ? 'AND (usuario_destino = $1 OR usuario_destino IS NULL)' : ''}
    `, usuario_destino ? [usuario_destino] : []);

    res.json({
      success: true,
      message: 'Notificaciones obtenidas exitosamente',
      data: {
        notificaciones: result.rows,
        total_no_leidas: noLeidas.rows[0].total_no_leidas,
        filtros_aplicados: {
          tipo,
          leida,
          usuario_destino,
          limit,
          offset
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo notificaciones',
      error: error.message
    });
  }
});

// POST /api/auditoria/notificaciones - Crear notificación manual
router.post('/notificaciones', async (req, res) => {
  try {
    const { 
      tipo, 
      titulo, 
      mensaje, 
      usuario_destino = null,
      es_critico = false,
      metadata = null,
      expira_en = null
    } = req.body;

    console.log('📝 Creando notificación manual...');

    // Validaciones
    if (!tipo || !titulo || !mensaje) {
      return res.status(400).json({
        success: false,
        message: 'tipo, titulo y mensaje son requeridos'
      });
    }

    if (!['info', 'warning', 'error', 'success', 'critical'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'tipo debe ser: info, warning, error, success, critical'
      });
    }

    const result = await query(`
      INSERT INTO sistema.notificaciones (
        tipo, titulo, mensaje, usuario_destino, es_critico, metadata, expira_en
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [tipo, titulo, mensaje, usuario_destino, es_critico, metadata, expira_en]);

    console.log(`✅ Notificación creada: ${result.rows[0].id}`);

    res.status(201).json({
      success: true,
      message: 'Notificación creada exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando notificación',
      error: error.message
    });
  }
});

// PUT /api/auditoria/notificaciones/:id/marcar-leida - Marcar notificación como leída
router.put('/notificaciones/:id/marcar-leida', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📖 Marcando notificación ${id} como leída...`);

    const result = await query(`
      UPDATE sistema.notificaciones 
      SET leida = true 
      WHERE id = $1 
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando notificación como leída',
      error: error.message
    });
  }
});

// GET /api/auditoria/historial/:tabla/:id - Historial de cambios de un registro específico
router.get('/historial/:tabla/:id', async (req, res) => {
  try {
    const { tabla, id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    console.log(`📋 Obteniendo historial para ${tabla}:${id}...`);

    const result = await query(`
      SELECT 
        al.*,
        n.tipo as tipo_notificacion,
        n.titulo,
        n.mensaje
      FROM sistema.auditoria_log al
      LEFT JOIN sistema.notificaciones n ON n.auditoria_id = al.id
      WHERE al.tabla_afectada = $1 AND al.registro_id = $2
      ORDER BY al.timestamp DESC
      LIMIT $3 OFFSET $4
    `, [tabla, id, limit, offset]);

    res.json({
      success: true,
      message: 'Historial obtenido exitosamente',
      data: {
        tabla,
        registro_id: id,
        historial: result.rows,
        total_cambios: result.rows.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial',
      error: error.message
    });
  }
});

// GET /api/auditoria/estadisticas - Estadísticas generales del sistema
router.get('/estadisticas', async (req, res) => {
  try {
    const { periodo = '7' } = req.query; // días

    console.log(`📊 Obteniendo estadísticas de los últimos ${periodo} días...`);

    // Estadísticas generales
    const generales = await query(`
      SELECT 
        COUNT(*) as total_operaciones,
        COUNT(*) FILTER (WHERE es_critico = true) as operaciones_criticas,
        COUNT(*) FILTER (WHERE operacion = 'INSERT') as inserciones,
        COUNT(*) FILTER (WHERE operacion = 'UPDATE') as actualizaciones,
        COUNT(*) FILTER (WHERE operacion = 'DELETE') as eliminaciones,
        COUNT(DISTINCT usuario) as usuarios_activos,
        COUNT(DISTINCT tabla_afectada) as tablas_afectadas
      FROM sistema.auditoria_log
      WHERE timestamp >= NOW() - INTERVAL '${periodo} days'
    `);

    // Actividad por día
    const actividadDiaria = await query(`
      SELECT 
        DATE(timestamp) as fecha,
        COUNT(*) as total_operaciones,
        COUNT(*) FILTER (WHERE es_critico = true) as criticas
      FROM sistema.auditoria_log
      WHERE timestamp >= NOW() - INTERVAL '${periodo} days'
      GROUP BY DATE(timestamp)
      ORDER BY fecha DESC
    `);

    // Top usuarios más activos
    const topUsuarios = await query(`
      SELECT 
        usuario,
        COUNT(*) as total_operaciones,
        COUNT(*) FILTER (WHERE es_critico = true) as criticas
      FROM sistema.auditoria_log
      WHERE timestamp >= NOW() - INTERVAL '${periodo} days'
      GROUP BY usuario
      ORDER BY total_operaciones DESC
      LIMIT 10
    `);

    // Top tablas más modificadas
    const topTablas = await query(`
      SELECT 
        tabla_afectada,
        COUNT(*) as total_operaciones,
        COUNT(*) FILTER (WHERE es_critico = true) as criticas
      FROM sistema.auditoria_log
      WHERE timestamp >= NOW() - INTERVAL '${periodo} days'
      GROUP BY tabla_afectada
      ORDER BY total_operaciones DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: {
        periodo_dias: parseInt(periodo),
        estadisticas_generales: generales.rows[0],
        actividad_diaria: actividadDiaria.rows,
        top_usuarios: topUsuarios.rows,
        top_tablas: topTablas.rows
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
});

// POST /api/auditoria/limpiar-logs - Limpiar logs antiguos
router.post('/limpiar-logs', async (req, res) => {
  try {
    const { dias_antiguedad = 90 } = req.body;

    console.log(`🧹 Limpiando logs más antiguos que ${dias_antiguedad} días...`);

    const registrosEliminados = await query(`
      SELECT sistema.limpiar_logs_antiguos($1) as registros_eliminados
    `, [dias_antiguedad]);

    res.json({
      success: true,
      message: 'Limpieza de logs completada',
      data: {
        dias_antiguedad,
        registros_eliminados: registrosEliminados.rows[0].registros_eliminados
      }
    });

  } catch (error) {
    console.error('Error limpiando logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error limpiando logs',
      error: error.message
    });
  }
});

module.exports = router;
