const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function exportPrerequisitos() {
  try {
    // 1) Load clients
    const clientsRes = await query('SELECT id, nombre FROM servicios.clientes ORDER BY id');
    const clients = clientsRes.rows;

    // 2) Load all prereqs (including global: cliente_id IS NULL)
    const prereqRes = await query(`SELECT id, cliente_id, tipo_documento, descripcion, dias_duracion FROM mantenimiento.cliente_prerrequisitos ORDER BY cliente_id NULLS FIRST, id`);
    const prereqs = prereqRes.rows;

    // 3) Map prereqs per client (include global = cliente_id IS NULL for every client)
    const globalPrereqs = prereqs.filter(p => p.cliente_id === null || p.cliente_id === undefined);
    const clientMap = new Map();
    for (const c of clients) clientMap.set(c.id, { client: c, prereqs: [] });

    for (const p of prereqs) {
      if (p.cliente_id === null || p.cliente_id === undefined) continue; // handled as global
      if (clientMap.has(p.cliente_id)) clientMap.get(p.cliente_id).prereqs.push(p);
    }

    // 4) Prepare output rows: for each client, emit global prereqs then client prereqs
    const rows = [];
    for (const [clientId, obj] of clientMap.entries()) {
      const client = obj.client;
      // add global
      for (const g of globalPrereqs) {
        rows.push({
          cliente_id: client.id,
          cliente_nombre: client.nombre,
          prerrequisito_id: g.id,
          prerrequisito_cliente_id: g.cliente_id,
          tipo_documento: g.tipo_documento,
          descripcion: g.descripcion,
          dias_duracion: g.dias_duracion
        });
      }
      // add specific
      for (const p of obj.prereqs) {
        rows.push({
          cliente_id: client.id,
          cliente_nombre: client.nombre,
          prerrequisito_id: p.id,
          prerrequisito_cliente_id: p.cliente_id,
          tipo_documento: p.tipo_documento,
          descripcion: p.descripcion,
          dias_duracion: p.dias_duracion
        });
      }
      // If no rows at all, still emit a placeholder row
      if (globalPrereqs.length === 0 && obj.prereqs.length === 0) {
        rows.push({ cliente_id: client.id, cliente_nombre: client.nombre, prerrequisito_id: null, prerrequisito_cliente_id: null, tipo_documento: null, descripcion: null, dias_duracion: null });
      }
    }

    // 5) Write Excel using exceljs
    const Excel = require('exceljs');
    const outDir = path.join(__dirname, '..', 'exports');
    await ensureDir(outDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = path.join(outDir, `prerrequisitos_por_cliente_${timestamp}.xlsx`);

    const wb = new Excel.Workbook();
    const ws = wb.addWorksheet('Prerrequisitos por cliente');
    ws.columns = [
      { header: 'cliente_id', key: 'cliente_id', width: 12 },
      { header: 'cliente_nombre', key: 'cliente_nombre', width: 40 },
      { header: 'prerrequisito_id', key: 'prerrequisito_id', width: 14 },
      { header: 'prerrequisito_cliente_id', key: 'prerrequisito_cliente_id', width: 14 },
      { header: 'tipo_documento', key: 'tipo_documento', width: 30 },
      { header: 'descripcion', key: 'descripcion', width: 60 },
      { header: 'dias_duracion', key: 'dias_duracion', width: 14 }
    ];

    for (const r of rows) ws.addRow(r);

    await wb.xlsx.writeFile(outFile);
    console.log('✅ Excel generado en:', outFile);
    return outFile;
  } catch (err) {
    console.error('Error exportando prerrequisitos:', err);
    process.exitCode = 1;
    throw err;
  }
}

if (require.main === module) {
  (async () => {
    await exportPrerequisitos();
    // close DB pool gracefully
    const { closePool } = require('../config/database');
    await closePool();
  })();
}

module.exports = { exportPrerequisitos };
