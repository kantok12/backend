#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { query, closePool } = require('../config/database');

async function run() {
  try {
    const sqlPath = path.join(__dirname, 'setup_tipo_normalizado.sql');
    console.log('🔁 Leyendo SQL de:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('➡️ Ejecutando migración tipo_normalizado (esto puede tardar)...');
    await query(sql);
    console.log('✅ Migración ejecutada correctamente.');
  } catch (err) {
    console.error('❌ Error ejecutando migración:', err.message);
  } finally {
    await closePool();
  }
}

if (require.main === module) run();
