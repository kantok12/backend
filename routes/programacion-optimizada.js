const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Helper para verificar si una persona existe
async function personExists(rut) {
  const r = await query('SELECT rut FROM mantenimiento.personal_disponible WHERE rut = $1', [rut]);
  return r.rows.length > 0;
}

// Helper para verificar si una cartera existe
async function carteraExists(id) {
  const r = await query('SELECT id FROM servicios.carteras WHERE id = $1', [id]);
  return r.rows.length > 0;
}

// Helper para verificar si un cliente existe
async function clienteExists(id) {
  const r = await query('SELECT id FROM servicios.clientes WHERE id = $1', [id]);
  return r.rows.length > 0;
}

// Helper para verificar si un nodo existe
async function nodoExists(id) {
  const r = await query('SELECT id FROM servicios.nodos WHERE id = $1', [id]);
  return r.rows.length > 0;
}

// Helper para obtener fechas de semana
function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    inicio: monday.toISOString().split('T')[0],
    fin: sunday.toISOString().split('T')[0]
  };
}

// Helper para obtener nombre del día
function getDayName(date) {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[new Date(date).getDay()];
}

// GET /api/programacion-optimizada - Obtener programación por cartera y rango de fechas
router.get('/', async (req, res) => {
  try {
    const { cartera_id, fecha_inicio, fecha_fin, semana, fecha } = req.query;
    
    if (!cartera_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'cartera_id es requerido' 
      });
    }

    if (!(await carteraExists(cartera_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cartera no encontrada' 
      });
    }

    let fechaInicio, fechaFin;
    
    if (fecha_inicio && fecha_fin) {
      fechaInicio = fecha_inicio;
      fechaFin = fecha_fin;
    } else if (fecha) {
      const weekDates = getWeekDates(fecha);
      fechaInicio = weekDates.inicio;
      fechaFin = weekDates.fin;
    } else if (semana) {
      fechaInicio = semana;
      const d = new Date(semana);
      d.setDate(d.getDate() + 6);
      fechaFin = d.toISOString().split('T')[0];
    } else {
      // Por defecto, semana actual
      const weekDates = getWeekDates(new Date());
      fechaInicio = weekDates.inicio;
      fechaFin = weekDates.fin;
    }

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
      WHERE p.cartera_id = $1 
        AND p.fecha_trabajo BETWEEN $2 AND $3
      ORDER BY p.fecha_trabajo, pd.nombres
    `, [cartera_id, fechaInicio, fechaFin]);

    // Agrupar por fecha
    const programacionPorFecha = {};
    result.rows.forEach(row => {
      const fecha = row.fecha_trabajo;
      if (!programacionPorFecha[fecha]) {
        programacionPorFecha[fecha] = {
          fecha: fecha,
          dia_semana: row.dia_semana,
          trabajadores: []
        };
      }
      programacionPorFecha[fecha].trabajadores.push(row);
    });

    res.json({
      success: true,
      data: {
        cartera: {
          id: parseInt(cartera_id),
          nombre: result.rows[0]?.nombre_cartera || 'Cartera no encontrada'
        },
        periodo: {
          inicio: fechaInicio,
          fin: fechaFin
        },
        programacion: Object.values(programacionPorFecha)
      }
    });

  } catch (err) {
    console.error('Error en GET /programacion-optimizada:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener programación', 
      error: err.message 
    });
  }
});

// GET /api/programacion-optimizada/persona/:rut - Obtener programación de una persona
router.get('/persona/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const { dias = 30 } = req.query; // Por defecto, próximos 30 días

    if (!(await personExists(rut))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Persona no encontrada' 
      });
    }

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
      WHERE p.rut = $1
        AND p.fecha_trabajo >= CURRENT_DATE
        AND p.fecha_trabajo <= CURRENT_DATE + INTERVAL '${parseInt(dias)} days'
      ORDER BY p.fecha_trabajo
    `, [rut]);

    res.json({
      success: true,
      data: {
        persona: {
          rut,
          nombre: result.rows[0]?.nombre_persona || 'Nombre no encontrado',
          cargo: result.rows[0]?.cargo || 'Cargo no encontrado'
        },
        programacion: result.rows
      }
    });

  } catch (err) {
    console.error('Error en GET /programacion-optimizada/persona/:rut:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener programación de persona', 
      error: err.message 
    });
  }
});

// POST /api/programacion-optimizada - Crear programación para fechas específicas
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/programacion-optimizada - Datos recibidos:');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    
    const {
      rut,
      cartera_id,
      cliente_id,
      nodo_id,
      fechas_trabajo, // Array de fechas: ['2024-01-15', '2024-01-16', '2024-01-17']
      horas_estimadas = 8,
      observaciones,
      estado = 'programado'
    } = req.body;
    
    console.log('📋 Datos extraídos:');
    console.log('- rut:', rut);
    console.log('- cartera_id:', cartera_id);
    console.log('- cliente_id:', cliente_id);
    console.log('- nodo_id:', nodo_id);
    console.log('- fechas_trabajo:', fechas_trabajo);
    console.log('- horas_estimadas:', horas_estimadas);
    console.log('- observaciones:', observaciones);
    console.log('- estado:', estado);

    // Validaciones
    if (!rut || !cartera_id || !fechas_trabajo || !Array.isArray(fechas_trabajo) || fechas_trabajo.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'rut, cartera_id y fechas_trabajo (array) son requeridos'
      });
    }

    if (!(await personExists(rut))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Persona no encontrada' 
      });
    }

    if (!(await carteraExists(cartera_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cartera no encontrada' 
      });
    }

    if (cliente_id && !(await clienteExists(cliente_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }

    if (nodo_id && !(await nodoExists(nodo_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Nodo no encontrado' 
      });
    }

    // Crear o actualizar programaciones para cada fecha
    const resultados = [];
    const fechasActualizadas = [];
    const fechasCreadas = [];
    
    for (const fecha of fechas_trabajo) {
      const diaSemana = getDayName(fecha);
      
      // Verificar si ya existe programación para esta fecha
      const existingResult = await query(`
        SELECT id FROM mantenimiento.programacion_optimizada 
        WHERE rut = $1 AND cartera_id = $2 AND fecha_trabajo = $3
      `, [rut, cartera_id, fecha]);
      
      let result;
      let accion;
      
      if (existingResult.rows.length > 0) {
        // Actualizar registro existente
        result = await query(`
          UPDATE mantenimiento.programacion_optimizada 
          SET cliente_id = $2, nodo_id = $3, dia_semana = $4, 
              horas_estimadas = $5, observaciones = $6, estado = $7,
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [
          existingResult.rows[0].id,
          cliente_id, nodo_id, diaSemana,
          horas_estimadas, observaciones, estado
        ]);
        
        accion = 'actualizado';
        fechasActualizadas.push(fecha);
      } else {
        // Crear nuevo registro
        result = await query(`
          INSERT INTO mantenimiento.programacion_optimizada 
          (rut, cartera_id, cliente_id, nodo_id, fecha_trabajo, dia_semana, 
           horas_estimadas, observaciones, estado, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          rut, cartera_id, cliente_id, nodo_id, fecha, diaSemana,
          horas_estimadas, observaciones, estado, req.user?.username || 'sistema'
        ]);
        
        accion = 'creado';
        fechasCreadas.push(fecha);
      }

      resultados.push(result.rows[0]);

      // Registrar en historial
      await query(`
        INSERT INTO mantenimiento.programacion_historial_optimizado 
        (programacion_id, rut, cartera_id, fecha_trabajo, accion, cambios, usuario)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        result.rows[0].id,
        rut,
        cartera_id,
        fecha,
        accion,
        JSON.stringify(result.rows[0]),
        req.user?.username || 'sistema'
      ]);
    }

    // Crear mensaje informativo
    let mensaje = '';
    if (fechasCreadas.length > 0 && fechasActualizadas.length > 0) {
      mensaje = `Programación procesada: ${fechasCreadas.length} fechas creadas, ${fechasActualizadas.length} fechas actualizadas`;
    } else if (fechasCreadas.length > 0) {
      mensaje = `Programación creada exitosamente para ${fechasCreadas.length} fechas`;
    } else if (fechasActualizadas.length > 0) {
      mensaje = `Programación actualizada exitosamente para ${fechasActualizadas.length} fechas`;
    }

    res.status(201).json({
      success: true,
      message: mensaje,
      data: {
        programacion: resultados,
        resumen: {
          total: resultados.length,
          creadas: fechasCreadas.length,
          actualizadas: fechasActualizadas.length,
          fechas_creadas: fechasCreadas,
          fechas_actualizadas: fechasActualizadas
        }
      }
    });

  } catch (err) {
    console.error('Error en POST /programacion-optimizada:', err);
    if (err.code === '23505') { // Unique constraint violation
      res.status(409).json({
        success: false,
        message: 'Ya existe programación para esta persona en esta cartera y fecha'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al crear programación',
        error: err.message
      });
    }
  }
});

// POST /api/programacion-optimizada/semana - Crear programación para una semana completa
router.post('/semana', async (req, res) => {
  try {
    const {
      rut,
      cartera_id,
      cliente_id,
      nodo_id,
      semana_inicio, // Lunes de la semana
      dias_trabajo = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'], // Días a programar
      horas_estimadas = 8,
      observaciones,
      estado = 'programado'
    } = req.body;

    if (!rut || !cartera_id || !semana_inicio) {
      return res.status(400).json({
        success: false,
        message: 'rut, cartera_id y semana_inicio son requeridos'
      });
    }

    // Validaciones
    if (!(await personExists(rut))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Persona no encontrada' 
      });
    }

    if (!(await carteraExists(cartera_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cartera no encontrada' 
      });
    }

    // Obtener fechas de la semana
    const weekDates = await query(`SELECT * FROM get_week_dates($1)`, [semana_inicio]);
    const dates = weekDates.rows[0];

    // Crear programaciones para los días especificados
    const resultados = [];
    const diasMap = {
      'lunes': dates.lunes,
      'martes': dates.martes,
      'miercoles': dates.miercoles,
      'jueves': dates.jueves,
      'viernes': dates.viernes,
      'sabado': dates.sabado,
      'domingo': dates.domingo
    };

    for (const dia of dias_trabajo) {
      if (diasMap[dia]) {
        const fecha = diasMap[dia];
        
        const result = await query(`
          INSERT INTO mantenimiento.programacion_optimizada 
          (rut, cartera_id, cliente_id, nodo_id, fecha_trabajo, dia_semana, 
           horas_estimadas, observaciones, estado, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          rut, cartera_id, cliente_id, nodo_id, fecha, dia,
          horas_estimadas, observaciones, estado, req.user?.username || 'sistema'
        ]);

        resultados.push(result.rows[0]);

        // Registrar en historial
        await query(`
          INSERT INTO mantenimiento.programacion_historial_optimizado 
          (programacion_id, rut, cartera_id, fecha_trabajo, accion, cambios, usuario)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          result.rows[0].id,
          rut,
          cartera_id,
          fecha,
          'creado',
          JSON.stringify(result.rows[0]),
          req.user?.username || 'sistema'
        ]);
      }
    }

    res.status(201).json({
      success: true,
      message: `Programación semanal creada exitosamente para ${resultados.length} días`,
      data: {
        semana: {
          inicio: dates.lunes,
          fin: dates.domingo
        },
        programacion: resultados
      }
    });

  } catch (err) {
    console.error('Error en POST /programacion-optimizada/semana:', err);
    res.status(500).json({
      success: false,
      message: 'Error al crear programación semanal',
      error: err.message
    });
  }
});

// PUT /api/programacion-optimizada/:id - Actualizar programación
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cliente_id,
      nodo_id,
      horas_estimadas,
      horas_reales,
      observaciones,
      estado
    } = req.body;

    // Obtener programación actual
    const currentResult = await query(`
      SELECT * FROM mantenimiento.programacion_optimizada WHERE id = $1
    `, [id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Programación no encontrada'
      });
    }

    const current = currentResult.rows[0];

    // Validaciones opcionales
    if (cliente_id && !(await clienteExists(cliente_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }

    if (nodo_id && !(await nodoExists(nodo_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Nodo no encontrado' 
      });
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (cliente_id !== undefined) {
      updates.push(`cliente_id = $${paramCount++}`);
      values.push(cliente_id);
    }
    if (nodo_id !== undefined) {
      updates.push(`nodo_id = $${paramCount++}`);
      values.push(nodo_id);
    }
    if (horas_estimadas !== undefined) {
      updates.push(`horas_estimadas = $${paramCount++}`);
      values.push(horas_estimadas);
    }
    if (horas_reales !== undefined) {
      updates.push(`horas_reales = $${paramCount++}`);
      values.push(horas_reales);
    }
    if (observaciones !== undefined) {
      updates.push(`observaciones = $${paramCount++}`);
      values.push(observaciones);
    }
    if (estado !== undefined) {
      updates.push(`estado = $${paramCount++}`);
      values.push(estado);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(`
      UPDATE mantenimiento.programacion_optimizada 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    // Registrar en historial
    await query(`
      INSERT INTO mantenimiento.programacion_historial_optimizado 
      (programacion_id, rut, cartera_id, fecha_trabajo, accion, cambios, usuario)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      id,
      current.rut,
      current.cartera_id,
      current.fecha_trabajo,
      'actualizado',
      JSON.stringify({ anterior: current, nuevo: result.rows[0] }),
      req.user?.username || 'sistema'
    ]);

    res.json({
      success: true,
      message: 'Programación actualizada exitosamente',
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Error en PUT /programacion-optimizada/:id:', err);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar programación',
      error: err.message
    });
  }
});

// DELETE /api/programacion-optimizada/:id - Eliminar programación
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener programación actual
    const currentResult = await query(`
      SELECT * FROM mantenimiento.programacion_optimizada WHERE id = $1
    `, [id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Programación no encontrada'
      });
    }

    const current = currentResult.rows[0];

    // Eliminar programación
    await query(`
      DELETE FROM mantenimiento.programacion_optimizada WHERE id = $1
    `, [id]);

    // Registrar en historial
    await query(`
      INSERT INTO mantenimiento.programacion_historial_optimizado 
      (programacion_id, rut, cartera_id, fecha_trabajo, accion, cambios, usuario)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      id,
      current.rut,
      current.cartera_id,
      current.fecha_trabajo,
      'eliminado',
      JSON.stringify(current),
      req.user?.username || 'sistema'
    ]);

    res.json({
      success: true,
      message: 'Programación eliminada exitosamente'
    });

  } catch (err) {
    console.error('Error en DELETE /programacion-optimizada/:id:', err);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar programación',
      error: err.message
    });
  }
});

// GET /api/programacion-optimizada/calendario - Vista de calendario
router.get('/calendario', async (req, res) => {
  try {
    const { cartera_id, mes, año } = req.query;
    
    if (!cartera_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'cartera_id es requerido' 
      });
    }

    const currentDate = new Date();
    const targetMonth = mes ? parseInt(mes) : currentDate.getMonth() + 1;
    const targetYear = año ? parseInt(año) : currentDate.getFullYear();

    // Calcular fechas del mes
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

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
        p.estado
      FROM mantenimiento.programacion_optimizada p
      JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      JOIN servicios.carteras c ON c.id = p.cartera_id
      LEFT JOIN servicios.clientes cl ON cl.id = p.cliente_id
      LEFT JOIN servicios.nodos n ON n.id = p.nodo_id
      WHERE p.cartera_id = $1 
        AND p.fecha_trabajo BETWEEN $2 AND $3
      ORDER BY p.fecha_trabajo, pd.nombres
    `, [cartera_id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

    // Agrupar por fecha
    const calendario = {};
    result.rows.forEach(row => {
      const fecha = row.fecha_trabajo;
      if (!calendario[fecha]) {
        calendario[fecha] = {
          fecha: fecha,
          dia_semana: row.dia_semana,
          trabajadores: []
        };
      }
      calendario[fecha].trabajadores.push(row);
    });

    res.json({
      success: true,
      data: {
        cartera: {
          id: parseInt(cartera_id),
          nombre: result.rows[0]?.nombre_cartera || 'Cartera no encontrada'
        },
        mes: {
          numero: targetMonth,
          año: targetYear,
          inicio: startDate.toISOString().split('T')[0],
          fin: endDate.toISOString().split('T')[0]
        },
        calendario: Object.values(calendario)
      }
    });

  } catch (err) {
    console.error('Error en GET /programacion-optimizada/calendario:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener calendario', 
      error: err.message 
    });
  }
});

module.exports = router;
