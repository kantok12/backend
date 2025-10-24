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
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando domingo es 0
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    inicio: monday.toISOString().split('T')[0],
    fin: sunday.toISOString().split('T')[0]
  };
}

// GET /api/programacion - Obtener programación por cartera y semana
router.get('/', async (req, res) => {
  try {
    const { cartera_id, semana, fecha } = req.query;
    
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
    
    if (fecha) {
      const weekDates = getWeekDates(fecha);
      fechaInicio = weekDates.inicio;
      fechaFin = weekDates.fin;
    } else if (semana) {
      // Formato esperado: YYYY-MM-DD (lunes de la semana)
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
        p.semana_inicio,
        p.semana_fin,
        p.lunes,
        p.martes,
        p.miercoles,
        p.jueves,
        p.viernes,
        p.sabado,
        p.domingo,
        p.horas_estimadas,
        p.observaciones,
        p.estado,
        p.created_at,
        p.updated_at
      FROM mantenimiento.programacion_semanal p
      JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      JOIN servicios.carteras c ON c.id = p.cartera_id
      LEFT JOIN servicios.clientes cl ON cl.id = p.cliente_id
      LEFT JOIN servicios.nodos n ON n.id = p.nodo_id
      WHERE p.cartera_id = $1 
        AND p.semana_inicio = $2
        AND p.semana_fin = $3
      ORDER BY pd.nombres, p.created_at
    `, [cartera_id, fechaInicio, fechaFin]);

    res.json({
      success: true,
      data: {
        cartera: {
          id: parseInt(cartera_id),
          nombre: result.rows[0]?.nombre_cartera || 'Cartera no encontrada'
        },
        semana: {
          inicio: fechaInicio,
          fin: fechaFin
        },
        programacion: result.rows
      }
    });

  } catch (err) {
    console.error('Error en GET /programacion:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener programación', 
      error: err.message 
    });
  }
});

// GET /api/programacion/persona/:rut - Obtener programación de una persona
router.get('/persona/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const { semanas = 4 } = req.query; // Por defecto, últimas 4 semanas

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
        p.semana_inicio,
        p.semana_fin,
        p.lunes,
        p.martes,
        p.miercoles,
        p.jueves,
        p.viernes,
        p.sabado,
        p.domingo,
        p.horas_estimadas,
        p.observaciones,
        p.estado,
        p.created_at,
        p.updated_at
      FROM mantenimiento.programacion_semanal p
      JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      JOIN servicios.carteras c ON c.id = p.cartera_id
      LEFT JOIN servicios.clientes cl ON cl.id = p.cliente_id
      LEFT JOIN servicios.nodos n ON n.id = p.nodo_id
      WHERE p.rut = $1
      ORDER BY p.semana_inicio DESC
      LIMIT $2
    `, [rut, parseInt(semanas)]);

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
    console.error('Error en GET /programacion/persona/:rut:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener programación de persona', 
      error: err.message 
    });
  }
});

// POST /api/programacion - Crear programación para una persona
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/programacion - Datos recibidos:');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    const {
      rut,
      cartera_id,
      cliente_id,
      nodo_id,
      semana_inicio,
      lunes = false,
      martes = false,
      miercoles = false,
      jueves = false,
      viernes = false,
      sabado = false,
      domingo = false,
      horas_estimadas = 8,
      observaciones,
      estado = 'programado'
    } = req.body;
    
    console.log('📋 Datos extraídos:');
    console.log('- rut:', rut);
    console.log('- cartera_id:', cartera_id);
    console.log('- cliente_id:', cliente_id);
    console.log('- nodo_id:', nodo_id);
    console.log('- semana_inicio:', semana_inicio);
    console.log('- horas_estimadas:', horas_estimadas);
    console.log('- observaciones:', observaciones);
    console.log('- estado:', estado);

    // Validaciones
    console.log('🔍 Validando campos requeridos...');
    console.log('- rut válido:', !!rut);
    console.log('- cartera_id válido:', !!cartera_id);
    console.log('- semana_inicio válido:', !!semana_inicio);
    
    if (!rut || !cartera_id || !semana_inicio) {
      console.log('❌ Validación fallida - campos requeridos faltantes');
      return res.status(400).json({
        success: false,
        message: 'rut, cartera_id y semana_inicio son requeridos',
        details: {
          rut: !!rut,
          cartera_id: !!cartera_id,
          semana_inicio: !!semana_inicio
        }
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

    // Calcular fecha fin de semana
    const weekDates = getWeekDates(semana_inicio);
    const fechaFin = weekDates.fin;

    const result = await query(`
      INSERT INTO mantenimiento.programacion_semanal 
      (rut, cartera_id, cliente_id, nodo_id, semana_inicio, semana_fin, 
       lunes, martes, miercoles, jueves, viernes, sabado, domingo, 
       horas_estimadas, observaciones, estado, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      rut, cartera_id, cliente_id, nodo_id, semana_inicio, fechaFin,
      lunes, martes, miercoles, jueves, viernes, sabado, domingo,
      horas_estimadas, observaciones, estado, req.user?.username || 'sistema'
    ]);

    // Registrar en historial
    await query(`
      INSERT INTO mantenimiento.programacion_historial 
      (programacion_id, rut, cartera_id, accion, cambios, usuario)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      result.rows[0].id,
      rut,
      cartera_id,
      'creado',
      JSON.stringify(result.rows[0]),
      req.user?.username || 'sistema'
    ]);

    res.status(201).json({
      success: true,
      message: 'Programación creada exitosamente',
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Error en POST /programacion:', err);
    if (err.code === '23505') { // Unique constraint violation
      res.status(409).json({
        success: false,
        message: 'Ya existe programación para esta persona en esta cartera y semana'
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

// PUT /api/programacion/:id - Actualizar programación
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cliente_id,
      nodo_id,
      lunes,
      martes,
      miercoles,
      jueves,
      viernes,
      sabado,
      domingo,
      horas_estimadas,
      observaciones,
      estado
    } = req.body;

    // Obtener programación actual
    const currentResult = await query(`
      SELECT * FROM mantenimiento.programacion_semanal WHERE id = $1
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
    if (lunes !== undefined) {
      updates.push(`lunes = $${paramCount++}`);
      values.push(lunes);
    }
    if (martes !== undefined) {
      updates.push(`martes = $${paramCount++}`);
      values.push(martes);
    }
    if (miercoles !== undefined) {
      updates.push(`miercoles = $${paramCount++}`);
      values.push(miercoles);
    }
    if (jueves !== undefined) {
      updates.push(`jueves = $${paramCount++}`);
      values.push(jueves);
    }
    if (viernes !== undefined) {
      updates.push(`viernes = $${paramCount++}`);
      values.push(viernes);
    }
    if (sabado !== undefined) {
      updates.push(`sabado = $${paramCount++}`);
      values.push(sabado);
    }
    if (domingo !== undefined) {
      updates.push(`domingo = $${paramCount++}`);
      values.push(domingo);
    }
    if (horas_estimadas !== undefined) {
      updates.push(`horas_estimadas = $${paramCount++}`);
      values.push(horas_estimadas);
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
      UPDATE mantenimiento.programacion_semanal 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    // Registrar en historial
    await query(`
      INSERT INTO mantenimiento.programacion_historial 
      (programacion_id, rut, cartera_id, accion, cambios, usuario)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      id,
      current.rut,
      current.cartera_id,
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
    console.error('Error en PUT /programacion/:id:', err);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar programación',
      error: err.message
    });
  }
});

// DELETE /api/programacion/:id - Eliminar programación
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener programación actual
    const currentResult = await query(`
      SELECT * FROM mantenimiento.programacion_semanal WHERE id = $1
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
      DELETE FROM mantenimiento.programacion_semanal WHERE id = $1
    `, [id]);

    // Registrar en historial
    await query(`
      INSERT INTO mantenimiento.programacion_historial 
      (programacion_id, rut, cartera_id, accion, cambios, usuario)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      id,
      current.rut,
      current.cartera_id,
      'eliminado',
      JSON.stringify(current),
      req.user?.username || 'sistema'
    ]);

    res.json({
      success: true,
      message: 'Programación eliminada exitosamente'
    });

  } catch (err) {
    console.error('Error en DELETE /programacion/:id:', err);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar programación',
      error: err.message
    });
  }
});

// GET /api/programacion/semana/:fecha - Obtener programación de toda la semana (todas las carteras)
router.get('/semana/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;
    const weekDates = getWeekDates(fecha);

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
        p.semana_inicio,
        p.semana_fin,
        p.lunes,
        p.martes,
        p.miercoles,
        p.jueves,
        p.viernes,
        p.sabado,
        p.domingo,
        p.horas_estimadas,
        p.observaciones,
        p.estado,
        p.created_at,
        p.updated_at
      FROM mantenimiento.programacion_semanal p
      JOIN mantenimiento.personal_disponible pd ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      JOIN servicios.carteras c ON c.id = p.cartera_id
      LEFT JOIN servicios.clientes cl ON cl.id = p.cliente_id
      LEFT JOIN servicios.nodos n ON n.id = p.nodo_id
      WHERE p.semana_inicio = $1 AND p.semana_fin = $2
      ORDER BY c.name, pd.nombres
    `, [weekDates.inicio, weekDates.fin]);

    // Agrupar por cartera
    const programacionPorCartera = {};
    result.rows.forEach(row => {
      if (!programacionPorCartera[row.cartera_id]) {
        programacionPorCartera[row.cartera_id] = {
          cartera: {
            id: row.cartera_id,
            nombre: row.nombre_cartera
          },
          trabajadores: []
        };
      }
      programacionPorCartera[row.cartera_id].trabajadores.push(row);
    });

    res.json({
      success: true,
      data: {
        semana: {
          inicio: weekDates.inicio,
          fin: weekDates.fin
        },
        programacion: Object.values(programacionPorCartera)
      }
    });

  } catch (err) {
    console.error('Error en GET /programacion/semana/:fecha:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener programación de semana',
      error: err.message
    });
  }
});

module.exports = router;
