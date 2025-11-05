const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Función para verificar si una cartera existe
async function carteraExists(carteraId) {
  try {
    const result = await query('SELECT id FROM servicios.carteras WHERE id = $1', [carteraId]);
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error verificando cartera:', err);
    return false;
  }
}

// Función para verificar si una persona existe
async function personExists(rut) {
  try {
    // Primero intentar búsqueda exacta
    let result = await query('SELECT rut FROM mantenimiento.personal_disponible WHERE rut = $1', [rut]);
    if (result.rows.length > 0) return true;
    
    // Si no encuentra, intentar sin puntos
    const rutSinPuntos = rut.replace(/\./g, '');
    result = await query('SELECT rut FROM mantenimiento.personal_disponible WHERE REPLACE(rut, \'.\', \') = $1', [rutSinPuntos]);
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error verificando persona:', err);
    return false;
  }
}

// Función para verificar si un cliente existe
async function clienteExists(clienteId) {
  try {
    const result = await query('SELECT id FROM servicios.clientes WHERE id = $1', [clienteId]);
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error verificando cliente:', err);
    return false;
  }
}

// Función para verificar si un nodo existe
async function nodoExists(nodoId) {
  try {
    const result = await query('SELECT id FROM servicios.nodos WHERE id = $1', [nodoId]);
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error verificando nodo:', err);
    return false;
  }
}

// Función para agrupar programación por día
function agruparProgramacionPorDia(registros) {
  const programacion = [];
  
  // Agrupar por fecha
  const agrupadoPorFecha = {};
  registros.forEach(registro => {
    const fecha = registro.fecha_trabajo;
    if (!agrupadoPorFecha[fecha]) {
      agrupadoPorFecha[fecha] = {
        fecha: fecha,
        dia_semana: registro.dia_semana,
        trabajadores: []
      };
    }
    agrupadoPorFecha[fecha].trabajadores.push(registro);
  });
  
  // Convertir a array y ordenar por fecha
  return Object.values(agrupadoPorFecha)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

// GET /api/programacion-semanal - Obtener programación por cartera y rango de fechas
router.get('/', async (req, res) => {
  try {
    const { cartera_id, fecha_inicio, fecha_fin } = req.query;
    
    // Validaciones de entrada
    if (!cartera_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'cartera_id es requerido' 
      });
    }

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        success: false, 
        message: 'fecha_inicio y fecha_fin son requeridos' 
      });
    }

    // Validar formato de fechas
    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = new Date(fecha_fin);
    
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de fecha inválido. Use YYYY-MM-DD' 
      });
    }

    // Validar que fecha_fin >= fecha_inicio
    if (fechaFin < fechaInicio) {
      return res.status(400).json({ 
        success: false, 
        message: 'fecha_fin debe ser mayor o igual a fecha_inicio' 
      });
    }

    // Validar rango máximo de 7 días
    const diffTime = Math.abs(fechaFin - fechaInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      return res.status(400).json({ 
        success: false, 
        message: 'El rango máximo permitido es de 7 días' 
      });
    }

    // Verificar que la cartera existe
    if (!(await carteraExists(cartera_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cartera no encontrada' 
      });
    }

    // Query optimizado para obtener programación
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
      FROM mantenimiento.programacion_semanal p
      JOIN mantenimiento.personal_disponible pd 
        ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      JOIN servicios.carteras c ON c.id = p.cartera_id
      LEFT JOIN servicios.clientes cl ON cl.id = p.cliente_id
      LEFT JOIN servicios.nodos n ON n.id = p.nodo_id
      WHERE p.cartera_id = $1 
        AND p.fecha_trabajo BETWEEN $2 AND $3
        AND p.estado = 'activo'
      ORDER BY p.fecha_trabajo, pd.nombres
    `, [cartera_id, fecha_inicio, fecha_fin]);

    // Agrupar programación por día
    const programacionAgrupada = agruparProgramacionPorDia(result.rows);

    res.json({
      success: true,
      data: {
        cartera: {
          id: parseInt(cartera_id),
          nombre: result.rows[0]?.nombre_cartera || 'Cartera no encontrada'
        },
        periodo: {
          inicio: fecha_inicio,
          fin: fecha_fin
        },
        programacion: programacionAgrupada
      }
    });

  } catch (err) {
    console.error('Error en GET /programacion-semanal:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener programación', 
      error: err.message 
    });
  }
});

// POST /api/programacion-semanal - Crear nueva asignación de personal
router.post('/', async (req, res) => {
  try {
    const { 
      rut, 
      cartera_id, 
      cliente_id, 
      nodo_id, 
      fecha_trabajo, 
      horas_estimadas = 8, 
      observaciones = '', 
      estado = 'activo' 
    } = req.body;

    // Validaciones de entrada
    if (!rut || !cartera_id || !fecha_trabajo) {
      return res.status(400).json({ 
        success: false, 
        message: 'rut, cartera_id y fecha_trabajo son requeridos' 
      });
    }

    // Validar formato de fecha
    const fechaTrabajo = new Date(fecha_trabajo);
    if (isNaN(fechaTrabajo.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de fecha inválido. Use YYYY-MM-DD' 
      });
    }

    // Validar que la persona existe
    if (!(await personExists(rut))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Persona no encontrada' 
      });
    }

    // Validar que la cartera existe
    if (!(await carteraExists(cartera_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cartera no encontrada' 
      });
    }

    // Validar cliente si se proporciona
    if (cliente_id && !(await clienteExists(cliente_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }

    // Validar nodo si se proporciona
    if (nodo_id && !(await nodoExists(nodo_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Nodo no encontrado' 
      });
    }

    // Calcular día de la semana
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaTrabajo.getDay()];

    // Calcular semana_inicio y semana_fin (lunes y domingo de la semana)
    const lunes = new Date(fechaTrabajo);
    lunes.setDate(fechaTrabajo.getDate() - fechaTrabajo.getDay() + 1);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    
    const semanaInicio = lunes.toISOString().split('T')[0];
    const semanaFin = domingo.toISOString().split('T')[0];

    // Verificar si ya existe una asignación para esta persona en esta semana (activa o eliminada)
    const existingAssignment = await query(`
      SELECT id, estado FROM mantenimiento.programacion_semanal 
      WHERE rut = $1 AND cartera_id = $2 AND semana_inicio = $3
    `, [rut, cartera_id, semanaInicio]);

    let result;
    let action;
    let message;

    if (existingAssignment.rows.length > 0) {
      const existingId = existingAssignment.rows[0].id;
      const existingEstado = existingAssignment.rows[0].estado;
      
      if (existingEstado === 'eliminado') {
        // Reactivar asignación eliminada
        result = await query(`
          UPDATE mantenimiento.programacion_semanal 
          SET cliente_id = $1, 
              nodo_id = $2, 
              fecha_trabajo = $3,
              dia_semana = $4, 
              horas_estimadas = $5, 
              observaciones = $6, 
              estado = $7, 
              semana_inicio = $8, 
              semana_fin = $9,
              updated_at = NOW()
          WHERE id = $10
          RETURNING id
        `, [cliente_id, nodo_id, fecha_trabajo, diaSemana, horas_estimadas, observaciones, estado, semanaInicio, semanaFin, existingId]);
        
        action = 'reactivated';
        message = 'Asignación reactivada exitosamente';
      } else {
        console.log('🔄 Actualizando asignación existente ID:', existingId);
        // Actualizar asignación existente
        result = await query(`
          UPDATE mantenimiento.programacion_semanal 
          SET cliente_id = $1, 
              nodo_id = $2, 
              fecha_trabajo = $3,
              dia_semana = $4, 
              horas_estimadas = $5, 
              observaciones = $6, 
              estado = $7, 
              semana_inicio = $8, 
              semana_fin = $9,
              updated_at = NOW()
          WHERE id = $10
          RETURNING id
        `, [cliente_id, nodo_id, fecha_trabajo, diaSemana, horas_estimadas, observaciones, estado, semanaInicio, semanaFin, existingId]);
        
        action = 'updated';
        message = 'Asignación actualizada exitosamente';
      }
    } else {
      // Crear nueva asignación
      result = await query(`
        INSERT INTO mantenimiento.programacion_semanal 
        (rut, cartera_id, cliente_id, nodo_id, fecha_trabajo, dia_semana, horas_estimadas, observaciones, estado, semana_inicio, semana_fin)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [rut, cartera_id, cliente_id, nodo_id, fecha_trabajo, diaSemana, horas_estimadas, observaciones, estado, semanaInicio, semanaFin]);
      
      action = 'created';
      message = 'Asignación creada exitosamente';
    }

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        action: action,
        message: message
      }
    });

  } catch (err) {
    console.error('Error en POST /programacion-semanal:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear asignación', 
      error: err.message 
    });
  }
});

// DELETE /api/programacion-semanal/:id - Eliminar asignación específica
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID es un número
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID inválido' 
      });
    }

    // Verificar que la asignación existe
    const existingAssignment = await query(`
      SELECT id, rut, fecha_trabajo FROM mantenimiento.programacion_semanal 
      WHERE id = $1 AND estado = 'activo'
    `, [id]);

    if (existingAssignment.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Asignación no encontrada' 
      });
    }

    // Eliminar asignación (soft delete - cambiar estado)
    await query(`
      UPDATE mantenimiento.programacion_semanal 
      SET estado = 'eliminado', updated_at = NOW()
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Asignación eliminada exitosamente'
    });

  } catch (err) {
    console.error('Error en DELETE /programacion-semanal/:id:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar asignación', 
      error: err.message 
    });
  }
});

// POST /api/programacion-semanal/copiar-semana - Copiar programación a la siguiente semana
router.post('/copiar-semana', async (req, res) => {
  try {
    const { fecha_inicio, cartera_id } = req.body;

    // Validaciones de entrada
    if (!fecha_inicio) {
      return res.status(400).json({ 
        success: false, 
        message: 'fecha_inicio es requerida' 
      });
    }

    if (!cartera_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'cartera_id es requerido' 
      });
    }

    // Validar formato de fecha
    const fechaInicio = new Date(fecha_inicio);
    if (isNaN(fechaInicio.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de fecha inválido. Use YYYY-MM-DD' 
      });
    }

    // Calcular semana actual (lunes y domingo)
    const lunesActual = new Date(fechaInicio);
    lunesActual.setDate(fechaInicio.getDate() - fechaInicio.getDay() + 1);
    const domingoActual = new Date(lunesActual);
    domingoActual.setDate(lunesActual.getDate() + 6);
    
    const semanaInicioActual = lunesActual.toISOString().split('T')[0];
    const semanaFinActual = domingoActual.toISOString().split('T')[0];

    // Calcular semana siguiente
    const lunesSiguiente = new Date(lunesActual);
    lunesSiguiente.setDate(lunesActual.getDate() + 7);
    const domingoSiguiente = new Date(lunesSiguiente);
    domingoSiguiente.setDate(lunesSiguiente.getDate() + 6);
    
    const semanaInicioSiguiente = lunesSiguiente.toISOString().split('T')[0];
    const semanaFinSiguiente = domingoSiguiente.toISOString().split('T')[0];

    console.log(`📅 Copiando programación de semana ${semanaInicioActual} a ${semanaInicioSiguiente} para cartera ${cartera_id}`);

    // Obtener programación de la semana actual
    const programacionActual = await query(`
      SELECT 
        rut,
        cartera_id,
        cliente_id,
        nodo_id,
        fecha_trabajo,
        dia_semana,
        horas_estimadas,
        observaciones
      FROM mantenimiento.programacion_semanal
      WHERE cartera_id = $1 
        AND semana_inicio = $2
        AND estado = 'activo'
      ORDER BY fecha_trabajo, rut
    `, [cartera_id, semanaInicioActual]);

    if (programacionActual.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No se encontró programación para la semana especificada' 
      });
    }

    console.log(`📋 Se encontraron ${programacionActual.rows.length} asignaciones para copiar`);

    // Verificar si ya existe programación en la semana siguiente
    const programacionExistente = await query(`
      SELECT COUNT(*) as total
      FROM mantenimiento.programacion_semanal
      WHERE cartera_id = $1 
        AND semana_inicio = $2
        AND estado = 'activo'
    `, [cartera_id, semanaInicioSiguiente]);

    if (parseInt(programacionExistente.rows[0].total) > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe programación para la semana siguiente. Elimínela primero si desea reemplazarla.' 
      });
    }

    // Copiar cada asignación a la siguiente semana
    const nuevasAsignaciones = [];
    let copiadosExitosos = 0;
    let errores = 0;

    for (const asignacion of programacionActual.rows) {
      try {
        // Calcular nueva fecha de trabajo (mismo día de la semana, pero siguiente semana)
        const fechaTrabajoActual = new Date(asignacion.fecha_trabajo);
        const nuevaFechaTrabajo = new Date(fechaTrabajoActual);
        nuevaFechaTrabajo.setDate(fechaTrabajoActual.getDate() + 7);
        
        const nuevaFechaTrabajoStr = nuevaFechaTrabajo.toISOString().split('T')[0];

        // Insertar nueva asignación
        const result = await query(`
          INSERT INTO mantenimiento.programacion_semanal 
          (rut, cartera_id, cliente_id, nodo_id, fecha_trabajo, dia_semana, horas_estimadas, observaciones, estado, semana_inicio, semana_fin)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, rut, fecha_trabajo
        `, [
          asignacion.rut, 
          asignacion.cartera_id, 
          asignacion.cliente_id, 
          asignacion.nodo_id, 
          nuevaFechaTrabajoStr, 
          asignacion.dia_semana, 
          asignacion.horas_estimadas, 
          asignacion.observaciones, 
          'activo',
          semanaInicioSiguiente,
          semanaFinSiguiente
        ]);

        nuevasAsignaciones.push(result.rows[0]);
        copiadosExitosos++;

        console.log(`✅ Copiado: ${asignacion.rut} - ${asignacion.fecha_trabajo} → ${nuevaFechaTrabajoStr}`);

      } catch (err) {
        console.error(`❌ Error copiando asignación de ${asignacion.rut}:`, err.message);
        errores++;
      }
    }

    console.log(`📊 Resultado: ${copiadosExitosos} copiados, ${errores} errores`);

    res.status(201).json({
      success: true,
      message: `Programación copiada exitosamente: ${copiadosExitosos} asignaciones creadas`,
      data: {
        semana_origen: {
          inicio: semanaInicioActual,
          fin: semanaFinActual
        },
        semana_destino: {
          inicio: semanaInicioSiguiente,
          fin: semanaFinSiguiente
        },
        asignaciones_copiadas: copiadosExitosos,
        errores: errores,
        nuevas_asignaciones: nuevasAsignaciones
      }
    });

  } catch (err) {
    console.error('❌ Error en POST /programacion-semanal/copiar-semana:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al copiar programación', 
      error: err.message 
    });
  }
});

module.exports = router;
