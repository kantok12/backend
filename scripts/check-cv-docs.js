const { query } = require('../config/database');

async function checkCVDocuments() {
  try {
    console.log('Verificando documentos CV para 20320662-3...');

    const result = await query(`
      SELECT id, tipo_documento, nombre_documento, fecha_subida
      FROM mantenimiento.documentos 
      WHERE rut_persona = '20320662-3' AND LOWER(tipo_documento) = 'cv'
    `);

    console.log('Documentos CV encontrados:', result.rows.length);
    result.rows.forEach(doc => {
      console.log(`- ID: ${doc.id}, Tipo: ${doc.tipo_documento}, Nombre: ${doc.nombre_documento}, Fecha: ${doc.fecha_subida}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkCVDocuments();