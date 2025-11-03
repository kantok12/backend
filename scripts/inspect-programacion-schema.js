const { query } = require('../config/database');

// Tablas a inspeccionar (schema.table)
const tables = [
  'mantenimiento.programacion_optimizada',
  'mantenimiento.programacion_historial_optimizado',
  'mantenimiento.programacion_semanal',
  'mantenimiento.personal_disponible',
  'servicios.carteras',
  'servicios.clientes',
  'servicios.nodos'
];

function splitSchemaTable(fullName) {
  const parts = fullName.split('.');
  return { schema: parts[0], table: parts[1] };
}

async function inspectTable(fullName) {
  const { schema, table } = splitSchemaTable(fullName);
  console.log('\n==================================================');
  console.log(`🔎 Inspeccionando: ${schema}.${table}`);
  console.log('--------------------------------------------------');

  try {
    // Verificar existencia
    const existsRes = await query(
      `SELECT to_regclass($1) as exists`,
      [`${schema}.${table}`]
    );
    if (!existsRes.rows[0].exists) {
      console.log(`❌ Tabla ${schema}.${table} no existe o no es accesible`);
      return;
    }

    // Columnas
    const cols = await query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [schema, table]
    );

    console.log('\n📋 Columnas:');
    cols.rows.forEach(c => {
      console.log(` - ${c.column_name} | ${c.data_type} | nullable: ${c.is_nullable} | default: ${c.column_default}`);
    });

    // Primary keys and foreign keys
    const fks = await query(
      `SELECT
         tc.constraint_name,
         kcu.column_name,
         ccu.table_schema AS foreign_table_schema,
         ccu.table_name AS foreign_table_name,
         ccu.column_name AS foreign_column_name
       FROM information_schema.table_constraints AS tc
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.constraint_schema = kcu.constraint_schema
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_schema = $1
         AND tc.table_name = $2`,
      [schema, table]
    );

    console.log('\n🔗 Foreign keys:');
    if (fks.rows.length === 0) {
      console.log(' - Ninguna FK encontrada');
    } else {
      fks.rows.forEach(r => {
        console.log(` - ${r.constraint_name}: ${r.column_name} -> ${r.foreign_table_schema}.${r.foreign_table_name}(${r.foreign_column_name})`);
      });
    }

    // Índices
    const idx = await query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = $1 AND tablename = $2`,
      [schema, table]
    );

    console.log('\n🧭 Índices (pg_indexes):');
    if (idx.rows.length === 0) {
      console.log(' - Ningún índice listado');
    } else {
      idx.rows.forEach(i => console.log(` - ${i.indexname}: ${i.indexdef}`));
    }

    // Conteo de filas
    const countRes = await query(`SELECT COUNT(*) as total FROM ${schema}.${table}`);
    console.log(`\n# filas: ${countRes.rows[0].total}`);

    // Muestras de filas (limit 5)
    console.log('\n🧾 Ejemplos (hasta 5 filas):');
    const sampleRes = await query(`SELECT * FROM ${schema}.${table} ORDER BY created_at DESC NULLS LAST LIMIT 5`);
    if (sampleRes.rows.length === 0) {
      // Intentar sin ORDER BY created_at si no existe
      const sampleRes2 = await query(`SELECT * FROM ${schema}.${table} LIMIT 5`);
      console.log(sampleRes2.rows);
    } else {
      console.log(sampleRes.rows);
    }

  } catch (err) {
    console.error('Error inspeccionando tabla', `${schema}.${table}:`, err.message || err);
  }
}

async function main() {
  console.log('\nIniciando inspección de esquema de programación...');
  for (const t of tables) {
    await inspectTable(t);
  }
  console.log('\nInspección completada.');
  process.exit(0);
}

main();
