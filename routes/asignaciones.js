const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

async function personExists(rut) {
  const r = await query('SELECT rut FROM mantenimiento.personal_disponible WHERE rut = $1', [rut]);
  return r.rows.length > 0;
}
async function carteraExists(id) {
  const r = await query('SELECT id FROM servicios.carteras WHERE id = $1', [id]);
  return r.rows.length > 0;
}
async function clienteExists(id) {
  const r = await query('SELECT id FROM servicios.clientes WHERE id = $1', [id]);
  return r.rows.length > 0;
}
async function nodoExists(id) {
  const r = await query('SELECT id FROM servicios.nodos WHERE id = $1', [id]);
  return r.rows.length > 0;
}

// Obtener todas las asignaciones de una persona
router.get('/persona/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    if (!(await personExists(rut))) {
      return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    }

    const [carteras, clientes, nodos] = await Promise.all([
      query(`
        SELECT pc.cartera_id as id, c.name as nombre, c.created_at
        FROM mantenimiento.personal_carteras pc
        JOIN servicios.carteras c ON c.id = pc.cartera_id
        WHERE pc.rut = $1
        ORDER BY c.name
      `, [rut]),
      query(`
        SELECT pcli.cliente_id as id, cl.nombre, cl.created_at, cl.cartera_id
        FROM mantenimiento.personal_clientes pcli
        JOIN servicios.clientes cl ON cl.id = pcli.cliente_id
        WHERE pcli.rut = $1
        ORDER BY cl.nombre
      `, [rut]),
      query(`
        SELECT pn.nodo_id as id, n.nombre, n.created_at, n.cliente_id
        FROM mantenimiento.personal_nodos pn
        JOIN servicios.nodos n ON n.id = pn.nodo_id
        WHERE pn.rut = $1
        ORDER BY n.nombre
      `, [rut])
    ]);

    res.json({ success: true, data: { carteras: carteras.rows, clientes: clientes.rows, nodos: nodos.rows } });
  } catch (err) {
    console.error('Error en GET /persona/:rut', err);
    res.status(500).json({ success: false, message: 'Error al obtener asignaciones', error: err.message });
  }
});

// Crear asignación de cartera
router.post('/persona/:rut/carteras', async (req, res) => {
  try {
    const { rut } = req.params;
    const { cartera_id } = req.body;
    if (!cartera_id) return res.status(400).json({ success: false, message: 'cartera_id es requerido' });
    if (!(await personExists(rut))) return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    if (!(await carteraExists(cartera_id))) return res.status(404).json({ success: false, message: 'Cartera no encontrada' });

    await query(`
      INSERT INTO mantenimiento.personal_carteras (rut, cartera_id)
      VALUES ($1, $2)
      ON CONFLICT (rut, cartera_id) DO NOTHING
    `, [rut, cartera_id]);

    res.status(201).json({ success: true, message: 'Cartera asignada' });
  } catch (err) {
    console.error('Error asignando cartera:', err);
    res.status(500).json({ success: false, message: 'Error asignando cartera', error: err.message });
  }
});

// Eliminar asignación de cartera
router.delete('/persona/:rut/carteras/:cartera_id', async (req, res) => {
  try {
    const { rut, cartera_id } = req.params;
    const r = await query('DELETE FROM mantenimiento.personal_carteras WHERE rut = $1 AND cartera_id = $2 RETURNING id', [rut, cartera_id]);
    if (r.rows.length === 0) return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
    res.json({ success: true, message: 'Cartera desasignada' });
  } catch (err) {
    console.error('Error desasignando cartera:', err);
    res.status(500).json({ success: false, message: 'Error desasignando cartera', error: err.message });
  }
});

// Crear asignación de cliente
router.post('/persona/:rut/clientes', async (req, res) => {
  try {
    const { rut } = req.params;
    const { cliente_id, enforce } = req.body;
    if (!cliente_id) return res.status(400).json({ success: false, message: 'cliente_id es requerido' });
    if (!(await personExists(rut))) return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    if (!(await clienteExists(cliente_id))) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });

    // Validar prerrequisitos antes de asignar (enforce por defecto true)
    const requisitos = (await query(`
      SELECT tipo_documento, obligatorio, dias_validez
      FROM mantenimiento.prerrequisitos_clientes
      WHERE cliente_id = $1
    `, [cliente_id])).rows;

    let requisitosUsados = requisitos;
    if (requisitosUsados.length === 0) {
      requisitosUsados = [
        { tipo_documento: 'licencia_conducir', obligatorio: true, dias_validez: 365 },
        { tipo_documento: 'certificado_seguridad', obligatorio: true, dias_validez: 365 },
        { tipo_documento: 'certificado_medico', obligatorio: false, dias_validez: 365 }
      ];
    }

    const docs = (await query(`
      SELECT id, tipo_documento
      FROM mantenimiento.documentos
      WHERE rut_persona = $1 AND activo = true
    `, [rut])).rows;

    const cumplidos = [];
    const faltantes = [];
    for (const reqq of requisitosUsados) {
      const match = docs.find(d => d.tipo_documento === reqq.tipo_documento);
      if (match) {
        cumplidos.push({ tipo_documento: reqq.tipo_documento, documento_id: match.id });
      } else if (reqq.obligatorio) {
        faltantes.push({ tipo_documento: reqq.tipo_documento, obligatorio: true });
      }
    }

    const shouldEnforce = enforce === false ? false : true;
    const requiredCount = requisitosUsados.filter(r => r.obligatorio).length;
    const providedCount = cumplidos.length;

    if (shouldEnforce && faltantes.length > 0) {
      // Crear etiquetas legibles para el frontend
      const labelMap = {
        licencia_conducir: 'Licencia de conducir',
        certificado_seguridad: 'Certificado de seguridad',
        certificado_medico: 'Certificado médico',
        carnet_identidad: 'Carnet de identidad',
        otro: 'Otros documentos'
      };

      const requiredCount = requisitosUsados.filter(r => r.obligatorio).length;
      const providedCount = cumplidos.length;

      const missing = faltantes.map(f => ({
        type: f.tipo_documento,
        label: labelMap[f.tipo_documento] || f.tipo_documento,
        required: !!f.obligatorio
      }));

      return res.status(409).json({
        success: false,
        code: 'PREREQUISITOS_INCOMPATIBLES',
        message: 'No es posible asignar el cliente porque faltan documentos obligatorios.',
        payload: {
          cliente_id: cliente_id,
          rut: rut,
          required_count: requiredCount,
          provided_count: providedCount,
          missing: missing
        },
        // Mantener `validacion` para compatibilidad con consumidores existentes
        validacion: { requisitos: requisitosUsados, cumplidos, faltantes, vencidos: [], por_vencer: [] }
      });
    }

    await query(`
      INSERT INTO mantenimiento.personal_clientes (rut, cliente_id)
      VALUES ($1, $2)
      ON CONFLICT (rut, cliente_id) DO NOTHING
    `, [rut, cliente_id]);

    // Responder con payload consistente para el frontend
    res.status(201).json({
      success: true,
      code: 'PREREQUISITOS_OK',
      message: 'Cliente asignado correctamente.',
      payload: {
        cliente_id: cliente_id,
        rut: rut,
        required_count: requiredCount,
        provided_count: providedCount,
        missing: []
      },
      validacion: { requisitos: requisitosUsados, cumplidos, faltantes, vencidos: [], por_vencer: [] }
    });
  } catch (err) {
    console.error('Error asignando cliente:', err);
    res.status(500).json({ success: false, message: 'Error asignando cliente', error: err.message });
  }
});

// Eliminar asignación de cliente
router.delete('/persona/:rut/clientes/:cliente_id', async (req, res) => {
  try {
    const { rut, cliente_id } = req.params;
    const r = await query('DELETE FROM mantenimiento.personal_clientes WHERE rut = $1 AND cliente_id = $2 RETURNING id', [rut, cliente_id]);
    if (r.rows.length === 0) return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
    res.json({ success: true, message: 'Cliente desasignado' });
  } catch (err) {
    console.error('Error desasignando cliente:', err);
    res.status(500).json({ success: false, message: 'Error desasignando cliente', error: err.message });
  }
});

// Crear asignación de nodo
router.post('/persona/:rut/nodos', async (req, res) => {
  try {
    const { rut } = req.params;
    const { nodo_id } = req.body;
    if (!nodo_id) return res.status(400).json({ success: false, message: 'nodo_id es requerido' });
    if (!(await personExists(rut))) return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    if (!(await nodoExists(nodo_id))) return res.status(404).json({ success: false, message: 'Nodo no encontrado' });

    await query(`
      INSERT INTO mantenimiento.personal_nodos (rut, nodo_id)
      VALUES ($1, $2)
      ON CONFLICT (rut, nodo_id) DO NOTHING
    `, [rut, nodo_id]);

    res.status(201).json({ success: true, message: 'Nodo asignado' });
  } catch (err) {
    console.error('Error asignando nodo:', err);
    res.status(500).json({ success: false, message: 'Error asignando nodo', error: err.message });
  }
});

// Eliminar asignación de nodo
router.delete('/persona/:rut/nodos/:nodo_id', async (req, res) => {
  try {
    const { rut, nodo_id } = req.params;
    const r = await query('DELETE FROM mantenimiento.personal_nodos WHERE rut = $1 AND nodo_id = $2 RETURNING id', [rut, nodo_id]);
    if (r.rows.length === 0) return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
    res.json({ success: true, message: 'Nodo desasignado' });
  } catch (err) {
    console.error('Error desasignando nodo:', err);
    res.status(500).json({ success: false, message: 'Error desasignando nodo', error: err.message });
  }
});

// Listados inversos
router.get('/carteras/:id/personal', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await query(`
      SELECT pc.rut, pd.nombres
      FROM mantenimiento.personal_carteras pc
      JOIN mantenimiento.personal_disponible pd ON pd.rut = pc.rut
      WHERE pc.cartera_id = $1
      ORDER BY pd.nombres
    `, [id]);
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('Error listando personal por cartera:', err);
    res.status(500).json({ success: false, message: 'Error listando personal', error: err.message });
  }
});

router.get('/clientes/:id/personal', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await query(`
      SELECT pc.rut, pd.nombres
      FROM mantenimiento.personal_clientes pc
      JOIN mantenimiento.personal_disponible pd ON pd.rut = pc.rut
      WHERE pc.cliente_id = $1
      ORDER BY pd.nombres
    `, [id]);
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('Error listando personal por cliente:', err);
    res.status(500).json({ success: false, message: 'Error listando personal', error: err.message });
  }
});

router.get('/nodos/:id/personal', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await query(`
      SELECT pn.rut, pd.nombres
      FROM mantenimiento.personal_nodos pn
      JOIN mantenimiento.personal_disponible pd ON pd.rut = pn.rut
      WHERE pn.nodo_id = $1
      ORDER BY pd.nombres
    `, [id]);
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('Error listando personal por nodo:', err);
    res.status(500).json({ success: false, message: 'Error listando personal', error: err.message });
  }
});

module.exports = router;


