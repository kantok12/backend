#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const db = require('../config/database.js');

async function main() {
  console.log('🔍 Extrayendo esquema desde la base de datos...');

  const client = await db.getClient();
  try {
    // Obtener tablas (excluyendo pg_ y information_schema)
    const tablesRes = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `);

    const tables = tablesRes.rows;

    const mermaidLines = [
      '# Diagrama ER generado desde la base de datos (Mermaid)',
      '',
      '```mermaid',
      'erDiagram'
    ];

    const sqlLines = [
      '-- Esquema extraído (no es un CREATE TABLE completo, resumen de columnas y constraints)',
      ''
    ];

    const relations = [];

    for (const t of tables) {
      const schema = t.table_schema;
      const table = t.table_name;

      // columnas
      const colsRes = await client.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema=$1 AND table_name=$2
         ORDER BY ordinal_position`,
        [schema, table]
      );

      // PK
      const pkRes = await client.query(
        `SELECT kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_schema=$1 AND tc.table_name=$2`,
        [schema, table]
      );

      const pkCols = pkRes.rows.map(r => r.column_name);

      // FKs
      const fkRes = await client.query(
        `SELECT
           kcu.column_name AS fk_column,
           ccu.table_schema AS foreign_table_schema,
           ccu.table_name AS foreign_table_name,
           ccu.column_name AS foreign_column_name,
           tc.constraint_name
         FROM information_schema.table_constraints AS tc
         JOIN information_schema.key_column_usage AS kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage AS ccu
           ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
         WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema=$1 AND tc.table_name=$2`,
        [schema, table]
      );

      // Mermaid table header: TABLE_NAME {
      const mermaidTableName = `${table.toUpperCase()}`;
      mermaidLines.push(`    ${mermaidTableName} {`);

      sqlLines.push(`-- Tabla: ${schema}.${table}`);
      for (const col of colsRes.rows) {
        const isPk = pkCols.includes(col.column_name);
        const colLine = `  ${col.column_name} ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ' DEFAULT ' + col.column_default : ''}`;
        sqlLines.push(colLine);

        // marcar PK en mermaid
        mermaidLines.push(`        ${isPk ? 'PK ' : ''}${col.column_name} : ${col.data_type}`);
      }
      mermaidLines.push('    }');
      mermaidLines.push('');

      // registrar relaciones
      for (const fk of fkRes.rows) {
        const left = mermaidTableName;
        const right = fk.foreign_table_name.toUpperCase();
        const relLabel = fk.fk_column;
        relations.push({ left, right, label: relLabel });
        sqlLines.push(`-- FK: ${fk.constraint_name} (${fk.fk_column}) -> ${fk.foreign_table_schema}.${fk.foreign_table_name}(${fk.foreign_column_name})`);
      }

      sqlLines.push('');
    }

    // Añadir relaciones en mermaid
    for (const r of relations) {
      // utilizar relación genérica many-to-one
      mermaidLines.push(`    ${r.left} ||--o{ ${r.right} : "${r.label}"`);
    }

    mermaidLines.push('```');

    // Escribir archivos
    const docsDir = path.join(__dirname, '..', 'docs');
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

    const mermaidPath = path.join(docsDir, 'ER_FROM_DB.md');
    fs.writeFileSync(mermaidPath, mermaidLines.join('\n'));

    const sqlPath = path.join(docsDir, 'SCHEMA_EXTRACT.txt');
    fs.writeFileSync(sqlPath, sqlLines.join('\n'));

    console.log('✅ Diagramas generados:');
    console.log(' -', mermaidPath);
    console.log(' -', sqlPath);

    await client.release();
    await db.closePool();
  } catch (err) {
    console.error('❌ Error extrayendo esquema:', err.message);
    try { await client.release(); } catch (e) {}
    process.exit(1);
  }
}

main();
