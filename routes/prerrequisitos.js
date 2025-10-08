const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Listar prerrequisitos por cliente
router.get('/clientes/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { match, rut } = req.query;

    // Si se pide match via query (?match=1&rut=...), delegar al handler de match
    if ((match === '1' || match === 'true') && rut) {
      req.query.rut = rut;
      return router.handle({ ...req, url: `/clientes/${clienteId}/match?rut=${encodeURIComponent(rut)}`, method: 'GET' }, res);
    }
    const result = await query(`
      SELECT id, cliente_id, tipo_documento, obligatorio, dias_validez
      FROM mantenimiento.prerrequisitos_clientes
      WHERE cliente_id = $1
      ORDER BY tipo_documento
    `, [clienteId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error al listar prerrequisitos:', err);
    res.status(500).json({ success: false, message: 'Error al listar prerrequisitos', error: err.message });
  }
});

// Crear/actualizar lista de prerrequisitos del cliente
router.post('/clientes/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { requisitos } = req.body; // [{tipo_documento, obligatorio, dias_validez}]
    if (!Array.isArray(requisitos)) {
      return res.status(400).json({ success: false, message: 'requisitos debe ser un arreglo' });
    }

    // Borrado suave: opcionalmente podríamos reemplazar por upserts; aquí haremos upsert individual
    for (const r of requisitos) {
      if (!r.tipo_documento) continue;
      await query(`
        INSERT INTO mantenimiento.prerrequisitos_clientes (cliente_id, tipo_documento, obligatorio, dias_validez)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (cliente_id, tipo_documento)
        DO UPDATE SET obligatorio = EXCLUDED.obligatorio, dias_validez = EXCLUDED.dias_validez
      `, [clienteId, r.tipo_documento, r.obligatorio !== false, r.dias_validez || null]);
    }

    const result = await query(`
      SELECT id, cliente_id, tipo_documento, obligatorio, dias_validez
      FROM mantenimiento.prerrequisitos_clientes
      WHERE cliente_id = $1
      ORDER BY tipo_documento
    `, [clienteId]);

    res.status(201).json({ success: true, message: 'Prerrequisitos guardados', data: result.rows });
  } catch (err) {
    console.error('Error al guardar prerrequisitos:', err);
    res.status(500).json({ success: false, message: 'Error al guardar prerrequisitos', error: err.message });
  }
});

// Match prerrequisitos vs documentos del personal
router.get('/clientes/:clienteId/match', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { rut } = req.query;
    if (!rut) return res.status(400).json({ success: false, message: 'rut es requerido' });

    // Obtener requisitos (si no hay, generar mock temporal)
    let requisitos = (await query(`
      SELECT tipo_documento, obligatorio, dias_validez
      FROM mantenimiento.prerrequisitos_clientes
      WHERE cliente_id = $1
    `, [clienteId])).rows;

    if (requisitos.length === 0) {
      requisitos = [
        { tipo_documento: 'licencia_conducir', obligatorio: true, dias_validez: 365 },
        { tipo_documento: 'certificado_seguridad', obligatorio: true, dias_validez: 365 },
        { tipo_documento: 'certificado_medico', obligatorio: false, dias_validez: 365 }
      ];
    }

    // Documentos del personal
    const docs = (await query(`
      SELECT id, tipo_documento, nombre_documento, fecha_subida
      FROM mantenimiento.documentos
      WHERE rut_persona = $1 AND activo = true
    `, [rut])).rows;

    const now = new Date();
    const cumplidos = [];
    const faltantes = [];
    const vencidos = [];
    const por_vencer = [];

    for (const reqq of requisitos) {
      const match = docs.find(d => d.tipo_documento === reqq.tipo_documento);
      if (!match) {
        faltantes.push({ tipo_documento: reqq.tipo_documento, obligatorio: reqq.obligatorio });
        continue;
      }

      // Validación de vigencia si aplica
      if (reqq.dias_validez && match.fecha_vencimiento) {
        const fv = new Date(match.fecha_vencimiento);
        if (fv < now) {
          vencidos.push({ tipo_documento: reqq.tipo_documento, documento_id: match.id, vence: match.fecha_vencimiento });
          continue;
        }
        const diasRestantes = Math.ceil((fv.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diasRestantes <= 30) {
          por_vencer.push({ tipo_documento: reqq.tipo_documento, documento_id: match.id, dias_restantes: diasRestantes });
        }
      }
      cumplidos.push({ tipo_documento: reqq.tipo_documento, documento_id: match.id });
    }

    res.json({ success: true, data: { requisitos, cumplidos, faltantes, vencidos, por_vencer } });
  } catch (err) {
    console.error('Error en match de prerrequisitos:', err);
    res.status(500).json({ success: false, message: 'Error en match de prerrequisitos', error: err.message });
  }
});

module.exports = router;


