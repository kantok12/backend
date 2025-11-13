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
    // Usar comparación normalizada (acepta con o sin puntos)
    const result = await query(`SELECT rut FROM mantenimiento.personal_disponible WHERE translate(rut, '.', '') = translate($1, '.', '')`, [rut]);
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error verificando persona:', err);
    return false;
  }
}

// Función para calcular fechas de la semana
function calcularFechasSemana(semanaInicio) {
  const lunes = new Date(semanaInicio);
  const fechas = [];
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    fechas.push({
      fecha: fecha.toISOString().split('T')[0],
      dia: diasSemana[fecha.getDay()]
    });
  }
  
  return fechas;
}

// Función para convertir datos del sistema nuevo al formato antiguo
function convertirANuevoFormato(programacionNueva) {
  const resultado = [];
  
  programacionNueva.forEach(persona => {
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diasBooleanos = {
      domingo: false,
      lunes: false,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false
    };
    
    // Marcar días asignados
    persona.fechas_asignadas?.forEach(fecha => {
      const diaSemana = diasSemana[new Date(fecha).getDay()];
      diasBooleanos[diaSemana] = true;
    });
    
    resultado.push({
      id: persona.id,
      rut: persona.rut,
      nombre_persona: persona.nombre_persona,
      cargo: persona.cargo,
      cartera_id: persona.cartera_id,
      nombre_cartera: persona.nombre_cartera,
      semana_inicio: persona.semana_inicio,
      semana_fin: persona.semana_fin,
      ...diasBooleanos,
      horas_estimadas: persona.horas_estimadas,
      observaciones: persona.observaciones,
      estado: persona.estado,
      created_at: persona.created_at,
      updated_at: persona.updated_at
    });
  });
  
  return resultado;
}

// Función para convertir datos del formato antiguo al sistema nuevo
function convertirANuevoSistema(datosAntiguos, semanaInicio) {
  const fechasSemana = calcularFechasSemana(semanaInicio);
  const asignaciones = [];
  
  fechasSemana.forEach(({ fecha, dia }) => {
    const diaKey = dia.toLowerCase();
    if (datosAntiguos[diaKey]) {
      asignaciones.push({
        rut: datosAntiguos.rut,
        cartera_id: datosAntiguos.cartera_id,
        cliente_id: datosAntiguos.cliente_id,
        nodo_id: datosAntiguos.nodo_id,
        fecha_trabajo: fecha,
        dia_semana: dia,
        horas_estimadas: datosAntiguos.horas_estimadas || 8,
        observaciones: datosAntiguos.observaciones || '',
        estado: datosAntiguos.estado || 'activo'
      });
    }
  });
  
  return asignaciones;
}

// GET /api/programacion-compatibilidad - Obtener programación en formato antiguo
router.get('/', async (req, res) => {
  try {
    const { cartera_id, semana } = req.query;
    
    // Validaciones de entrada
    if (!cartera_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'cartera_id es requerido' 
      });
    }

    if (!semana) {
      return res.status(400).json({ 
        success: false, 
        message: 'semana es requerido (formato: YYYY-MM-DD)' 
      });
    }

    // Verificar que la cartera existe
    if (!(await carteraExists(cartera_id))) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cartera no encontrada' 
      });
    }

    // Calcular fechas de la semana
    const fechasSemana = calcularFechasSemana(semana);
    const fechaInicio = fechasSemana[0].fecha; // Lunes
    const fechaFin = fechasSemana[6].fecha;    // Domingo

    // Obtener programación de la tabla de compatibilidad (nueva estructura con múltiples días)
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
        p.dia_semana,
        p.horas_estimadas,
        p.observaciones,
        p.estado,
        p.created_at,
        p.updated_at
      FROM mantenimiento.programacion_compatibilidad p
      JOIN mantenimiento.personal_disponible pd 
        ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
      JOIN servicios.carteras c ON c.id = p.cartera_id
      LEFT JOIN servicios.clientes cl ON cl.id = p.cliente_id
      LEFT JOIN servicios.nodos n ON n.id = p.nodo_id
      WHERE p.cartera_id = $1 
        AND p.semana_inicio = $2
        AND p.estado = 'activo'
      ORDER BY p.rut, p.dia_semana
    `, [cartera_id, fechaInicio]);

    // Agrupar por persona y convertir múltiples días a formato de días booleanos
    const programacionPorPersona = {};
    result.rows.forEach(row => {
      if (!programacionPorPersona[row.rut]) {
        programacionPorPersona[row.rut] = {
          id: row.id,
          rut: row.rut,
          nombre_persona: row.nombre_persona,
          cargo: row.cargo,
          cartera_id: row.cartera_id,
          nombre_cartera: row.nombre_cartera,
          semana_inicio: row.semana_inicio,
          semana_fin: row.semana_fin,
          domingo: false,
          lunes: false,
          martes: false,
          miercoles: false,
          jueves: false,
          viernes: false,
          sabado: false,
          horas_estimadas: row.horas_estimadas,
          observaciones: row.observaciones,
          estado: row.estado,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      }
      
      // Marcar el día correspondiente
      programacionPorPersona[row.rut][row.dia_semana] = true;
    });

    // Convertir a array
    const programacionFormatoAntiguo = Object.values(programacionPorPersona);

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
        programacion: programacionFormatoAntiguo
      }
    });

  } catch (err) {
    console.error('Error en GET /programacion-compatibilidad:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener programación', 
      error: err.message 
    });
  }
});

// POST /api/programacion-compatibilidad - Crear programación en formato antiguo
router.post('/', async (req, res) => {
  try {
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
      observaciones = '', 
      estado = 'activo' 
    } = req.body;

    // Validaciones de entrada
    if (!rut || !cartera_id || !semana_inicio) {
      return res.status(400).json({ 
        success: false, 
        message: 'rut, cartera_id y semana_inicio son requeridos' 
      });
    }

    // Validar formato de fecha
    const fechaSemana = new Date(semana_inicio);
    if (isNaN(fechaSemana.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de semana_inicio inválido. Use YYYY-MM-DD' 
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

    // Verificar que se seleccionó al menos un día
    if (!lunes && !martes && !miercoles && !jueves && !viernes && !sabado && !domingo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Debe seleccionar al menos un día de la semana' 
      });
    }

    // Calcular semana_inicio y semana_fin
    const lunesSemana = new Date(semana_inicio);
    const domingoSemana = new Date(lunesSemana);
    domingoSemana.setDate(lunesSemana.getDate() + 6);
    
    const semanaInicio = lunesSemana.toISOString().split('T')[0];
    const semanaFin = domingoSemana.toISOString().split('T')[0];

    // Crear array de días seleccionados
    const diasSeleccionados = [];
    if (lunes) diasSeleccionados.push('lunes');
    if (martes) diasSeleccionados.push('martes');
    if (miercoles) diasSeleccionados.push('miercoles');
    if (jueves) diasSeleccionados.push('jueves');
    if (viernes) diasSeleccionados.push('viernes');
    if (sabado) diasSeleccionados.push('sabado');
    if (domingo) diasSeleccionados.push('domingo');

    // Eliminar asignaciones existentes para esta persona en esta semana (comparación normalizada de RUT)
    await query(`
      DELETE FROM mantenimiento.programacion_compatibilidad 
      WHERE translate(rut, '.', '') = translate($1, '.', '') AND cartera_id = $2 AND semana_inicio = $3
    `, [rut, cartera_id, semanaInicio]);

    // Crear un registro por cada día seleccionado
    const resultados = [];
    for (const dia of diasSeleccionados) {
      const result = await query(`
        INSERT INTO mantenimiento.programacion_compatibilidad 
        (rut, cartera_id, cliente_id, nodo_id, semana_inicio, semana_fin, dia_semana, horas_estimadas, observaciones, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [rut, cartera_id, cliente_id, nodo_id, semanaInicio, semanaFin, dia, horas_estimadas, observaciones, estado]);

      resultados.push({
        id: result.rows[0].id,
        dia: dia,
        action: 'created'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        asignaciones: resultados,
        dias_seleccionados: diasSeleccionados,
        message: `Programación creada: ${resultados.length} días asignados`
      }
    });

  } catch (err) {
    console.error('Error en POST /programacion-compatibilidad:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear programación', 
      error: err.message 
    });
  }
});

module.exports = router;
