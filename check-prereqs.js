const { query } = require('./config/database');

async function checkPrerequisites() {
  try {
    console.log('Verificando prerrequisitos para cliente 28...');

    // Consulta que hace machForCliente
    const prereqRes = await query(`
      SELECT id, cliente_id, tipo_documento, descripcion, dias_duracion
      FROM mantenimiento.cliente_prerrequisitos
      WHERE cliente_id = $1 OR cliente_id IS NULL
    `, [28]);

    console.log('Prerrequisitos encontrados:', prereqRes.rows.length);
    prereqRes.rows.forEach(p => {
      console.log(`- ID: ${p.id}, Cliente: ${p.cliente_id}, Tipo: ${p.tipo_documento}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkPrerequisites();