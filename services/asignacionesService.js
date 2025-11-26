const db = require('../config/database');
const prerrequisitosService = require('./prerrequisitosService');

/**
 * Asigna personal a un cliente si cumple con los requisitos.
 * @param {number} clienteId - ID del cliente.
 * @param {string} rut - RUT del personal.
 * @returns {Promise<{ success: boolean, message: string }>} - Resultado de la asignación.
 */
async function asignarPersonal(clienteId, rut) {
  try {
    // Verificar si el personal cumple con los requisitos usando el wrapper machForCliente
    const matchResult = await prerrequisitosService.machForCliente(parseInt(clienteId, 10), rut, { includeGlobal: true });

    if (!matchResult || !matchResult.success) {
      // Si el servicio no devolvió datos válidos
      return { success: false, message: 'No se pudo verificar los prerrequisitos para este RUT.' };
    }

    if (!matchResult.data || !matchResult.data.cumple) {
      return { success: false, message: 'El personal no cumple con los requisitos para este cliente.', details: matchResult.data };
    }

    // Verificar si el personal ya tiene una asignación
    const asignRes = await db.query(
      'SELECT * FROM servicios.asignacion WHERE rut = $1 AND cliente_id = $2',
      [rut, clienteId]
    );

    if (asignRes && asignRes.rows && asignRes.rows.length > 0) {
      return { success: false, message: 'El personal ya tiene una asignación con este cliente.' };
    }

    // Registrar la nueva asignación
    await db.query(
      'INSERT INTO servicios.asignacion (cliente_id, rut, fecha_asignacion) VALUES ($1, $2, NOW())',
      [clienteId, rut]
    );

    return { success: true, message: 'El personal ha sido asignado exitosamente.' };
  } catch (error) {
    console.error('Error al asignar personal:', error);
    throw new Error('Error interno del servidor.');
  }
}

module.exports = {
  asignarPersonal,
};