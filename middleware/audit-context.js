const { query } = require('../config/database');

/**
 * Middleware para configurar el contexto de auditoría en las operaciones
 * Este middleware debe aplicarse a los endpoints que realizan operaciones CRUD
 */
const setAuditContext = (req, res, next) => {
  try {
    // Extraer información del usuario y contexto
    const usuario = req.user?.username || 
                   req.headers['x-user'] || 
                   req.body?.usuario || 
                   'sistema';
    
    const userAgent = req.headers['user-agent'] || 'unknown';
    const endpoint = req.originalUrl || req.url || 'unknown';
    const ipAddress = req.ip || 
                     req.connection.remoteAddress || 
                     req.headers['x-forwarded-for'] || 
                     'unknown';

    // Configurar contexto en la sesión de base de datos
    query('SELECT sistema.set_audit_context($1, $2, $3)', [usuario, userAgent, endpoint])
      .then(() => {
        // Agregar información al request para uso posterior
        req.auditContext = {
          usuario,
          userAgent,
          endpoint,
          ipAddress,
          timestamp: new Date()
        };
        next();
      })
      .catch((error) => {
        console.warn('⚠️ Error configurando contexto de auditoría:', error.message);
        // Continuar aunque falle la configuración
        req.auditContext = {
          usuario,
          userAgent,
          endpoint,
          ipAddress,
          timestamp: new Date()
        };
        next();
      });
  } catch (error) {
    console.warn('⚠️ Error en middleware de auditoría:', error.message);
    next();
  }
};

/**
 * Función para crear notificaciones manuales desde los endpoints
 */
const createNotification = async (tipo, titulo, mensaje, metadata = null, usuarioDestino = null) => {
  try {
    const result = await query(`
      INSERT INTO sistema.notificaciones (
        tipo, titulo, mensaje, usuario_destino, metadata, es_critico
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      tipo, 
      titulo, 
      mensaje, 
      usuarioDestino, 
      metadata ? JSON.stringify(metadata) : null,
      tipo === 'critical' || tipo === 'error'
    ]);
    
    return result.rows[0].id;
  } catch (error) {
    console.error('❌ Error creando notificación manual:', error);
    return null;
  }
};

/**
 * Función para registrar operaciones críticas manualmente
 */
const logCriticalOperation = async (tabla, operacion, registroId, datosAnteriores, datosNuevos, contexto) => {
  try {
    const result = await query(`
      INSERT INTO sistema.auditoria_log (
        tabla_afectada, operacion, registro_id, datos_anteriores, 
        datos_nuevos, es_critico, contexto, usuario, endpoint
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      tabla,
      operacion,
      registroId,
      datosAnteriores ? JSON.stringify(datosAnteriores) : null,
      datosNuevos ? JSON.stringify(datosNuevos) : null,
      true, // Siempre crítico para operaciones manuales
      contexto,
      current_setting('app.current_user', true),
      current_setting('app.current_endpoint', true)
    ]);
    
    return result.rows[0].id;
  } catch (error) {
    console.error('❌ Error registrando operación crítica:', error);
    return null;
  }
};

/**
 * Middleware específico para operaciones de eliminación
 */
const auditDeleteOperation = (tabla, getRecordId) => {
  return async (req, res, next) => {
    const originalDelete = res.json;
    
    res.json = async function(data) {
      try {
        if (data.success && req.method === 'DELETE') {
          const recordId = getRecordId ? getRecordId(req, data) : req.params.id;
          
          // Crear notificación de eliminación
          await createNotification(
            'warning',
            `Registro eliminado de ${tabla}`,
            `Se eliminó un registro de la tabla ${tabla} (ID: ${recordId})`,
            { tabla, registro_id: recordId, endpoint: req.originalUrl },
            req.auditContext?.usuario
          );
        }
      } catch (error) {
        console.warn('⚠️ Error en auditoría de eliminación:', error.message);
      }
      
      originalDelete.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware específico para operaciones de creación
 */
const auditCreateOperation = (tabla, getRecordData) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = async function(data) {
      try {
        if (data.success && req.method === 'POST') {
          const recordData = getRecordData ? getRecordData(req, data) : data.data;
          
          // Crear notificación de creación
          await createNotification(
            'success',
            `Nuevo registro creado en ${tabla}`,
            `Se creó un nuevo registro en la tabla ${tabla}`,
            { tabla, registro_data: recordData, endpoint: req.originalUrl },
            req.auditContext?.usuario
          );
        }
      } catch (error) {
        console.warn('⚠️ Error en auditoría de creación:', error.message);
      }
      
      originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware específico para operaciones de actualización
 */
const auditUpdateOperation = (tabla, getRecordData) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = async function(data) {
      try {
        if (data.success && req.method === 'PUT') {
          const recordData = getRecordData ? getRecordData(req, data) : data.data;
          
          // Crear notificación de actualización
          await createNotification(
            'info',
            `Registro actualizado en ${tabla}`,
            `Se actualizó un registro en la tabla ${tabla}`,
            { tabla, registro_data: recordData, endpoint: req.originalUrl },
            req.auditContext?.usuario
          );
        }
      } catch (error) {
        console.warn('⚠️ Error en auditoría de actualización:', error.message);
      }
      
      originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  setAuditContext,
  createNotification,
  logCriticalOperation,
  auditDeleteOperation,
  auditCreateOperation,
  auditUpdateOperation
};
