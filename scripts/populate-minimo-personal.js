const { query } = require('../config/database');

const populateMinimoPersonal = async () => {
  console.log('🚀 Iniciando el llenado de la tabla servicios.minimo_personal...');

  try {
    // 1. Obtener todos los clientes que tienen una cartera asignada
    console.log('   -> Obteniendo todos los clientes con su cartera...');
    const clientesResult = await query('SELECT id, cartera_id FROM servicios.clientes WHERE cartera_id IS NOT NULL ORDER BY id;');
    const clientes = clientesResult.rows;
    console.log(`   -> ${clientes.length} clientes encontrados para procesar.`);

    if (clientes.length === 0) {
      console.log('⚠️ No se encontraron clientes con carteras asignadas. No hay nada que hacer.');
      return;
    }

    // 2. Iniciar transacción
    await query('BEGIN');
    console.log('   -> Transacción iniciada.');

    // 3. Iterar y poblar la tabla
    let updatedCount = 0;
    let insertedCount = 0;

    for (const cliente of clientes) {
      const { id: clienteId, cartera_id: carteraId } = cliente;
      // Generar un número aleatorio entre 1 y 10
      const cantidadMinima = Math.floor(Math.random() * 10) + 1;

      // Se asume que el mínimo por cliente no está asociado a un nodo específico (nodo_id es NULL)
      // El ON CONFLICT se basa en el índice único (cartera_id, cliente_id, nodo_id)
      const insertQuery = `
        INSERT INTO servicios.minimo_personal (cartera_id, cliente_id, minimo_base, descripcion, created_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (cartera_id, cliente_id, nodo_id) WHERE nodo_id IS NULL
        DO UPDATE SET 
          minimo_base = EXCLUDED.minimo_base, 
          updated_at = NOW()
        RETURNING xmax; -- xmax es 0 para inserción, diferente de 0 para actualización
      `;
      
      const result = await query(insertQuery, [carteraId, clienteId, cantidadMinima, `Mínimo para cliente ${clienteId}`, 'populate-script']);
      
      if (result.rows[0].xmax === '0') {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }

    // 4. Confirmar transacción
    await query('COMMIT');
    console.log('   -> Transacción confirmada.');

    console.log('\n✅ Proceso completado exitosamente!');
    console.log(`   - Nuevos registros de mínimo personal creados: ${insertedCount}`);
    console.log(`   - Registros de mínimo personal actualizados: ${updatedCount}`);
    console.log(`   - Total de clientes procesados: ${clientes.length}`);

  } catch (error) {
    console.error('❌ Error durante el proceso. Se revirtieron los cambios.', error);
    await query('ROLLBACK');
    throw error;
  }
};

populateMinimoPersonal().catch(err => {
  console.error("\nError fatal en la ejecución del script:", err);
  process.exit(1);
});
