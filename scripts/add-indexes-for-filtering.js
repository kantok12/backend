const { query } = require('../config/database');

const createIndexes = async () => {
  console.log('🚀 Iniciando la creación de índices para optimizar el filtrado de personal...');

  const queries = [
    // Índice en cliente_prerrequisitos (cliente_id, tipo_documento)
    `CREATE INDEX IF NOT EXISTS idx_cliente_prerrequisitos_cliente_tipo 
     ON mantenimiento.cliente_prerrequisitos (cliente_id, tipo_documento);`,
    
    // Índice en documentos (rut_persona, tipo_documento)
    `CREATE INDEX IF NOT EXISTS idx_documentos_rut_tipo 
     ON mantenimiento.documentos (rut_persona, tipo_documento);`,

    // Índice en documentos (fecha_emision) para filtrar por fechas de expiración
    `CREATE INDEX IF NOT EXISTS idx_documentos_fecha_emision 
     ON mantenimiento.documentos (fecha_emision);`,

    // Índice en personal_disponible (estado_id) para filtrar por personal disponible
    `CREATE INDEX IF NOT EXISTS idx_personal_disponible_estado_id 
     ON mantenimiento.personal_disponible (estado_id);`
  ];

  try {
    await query('BEGIN');
    for (const q of queries) {
      console.log(`   -> Ejecutando: ${q.substring(0, 100)}...`);
      await query(q);
    }
    await query('COMMIT');
    console.log('✅ Todos los índices fueron creados exitosamente.');
  } catch (error) {
    await query('ROLLBACK');
    console.error('❌ Error al crear los índices. Se revirtieron los cambios.', error);
    throw error;
  }
};

const dropIndexes = async () => {
  console.log('🗑️ Iniciando la eliminación de los índices de filtrado...');

  const indexNames = [
    'idx_cliente_prerrequisitos_cliente_tipo',
    'idx_documentos_rut_tipo',
    'idx_documentos_fecha_emision',
    'idx_personal_disponible_estado_id'
  ];

  try {
    await query('BEGIN');
    for (const name of indexNames) {
      console.log(`   -> Eliminando índice: ${name}...`);
      await query(`DROP INDEX IF EXISTS mantenimiento.${name};`);
    }
    await query('COMMIT');
    console.log('✅ Todos los índices fueron eliminados exitosamente.');
  } catch (error) {
    await query('ROLLBACK');
    console.error('❌ Error al eliminar los índices. Se revirtieron los cambios.', error);
    throw error;
  }
};

const main = async () => {
  const arg = process.argv[2];
  if (arg === 'down') {
    await dropIndexes();
  } else {
    await createIndexes();
  }
};

main().catch(err => {
  console.error("Error en la ejecución del script de índices:", err);
  process.exit(1);
});
