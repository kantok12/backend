const { query, getClient } = require('../config/database');

const ruts = [
  '16924504-5',
  '16944848-5',
  '18539810-2',
  '18841612-8',
  '20062278-2',
  '20647833-0',
  '26258374-0'
];

function normalize(r){
  if(!r) return null;
  return String(r).trim().replace(/\./g,'');
}

(async ()=>{
  for(const rutRaw of ruts){
    const rut = rutRaw.trim();
    console.log('\n=== Deleting RUT:', rut, '===');
    const client = await getClient();
    try{
      await client.query('BEGIN');

      const programacion = await client.query('DELETE FROM mantenimiento.programacion_semanal WHERE rut = $1', [rut]);
      console.log('programacion_semanal deleted:', programacion.rowCount);

      const historial = await client.query('DELETE FROM mantenimiento.programacion_historial WHERE rut = $1', [rut]);
      console.log('programacion_historial deleted:', historial.rowCount);

      const carteras = await client.query('DELETE FROM mantenimiento.personal_carteras WHERE rut = $1', [rut]);
      console.log('personal_carteras deleted:', carteras.rowCount);

      const clientes = await client.query('DELETE FROM mantenimiento.personal_clientes WHERE rut = $1', [rut]);
      console.log('personal_clientes deleted:', clientes.rowCount);

      const nodos = await client.query('DELETE FROM mantenimiento.personal_nodos WHERE rut = $1', [rut]);
      console.log('personal_nodos deleted:', nodos.rowCount);

      const estados = await client.query('DELETE FROM mantenimiento.personal_estados WHERE rut = $1', [rut]);
      console.log('personal_estados deleted:', estados.rowCount);

      const documentos = await client.query('DELETE FROM mantenimiento.documentos WHERE rut_persona = $1', [rut]);
      console.log('documentos deleted:', documentos.rowCount);

      const cursos = await client.query('DELETE FROM mantenimiento.cursos WHERE rut_persona = $1', [rut]);
      console.log('cursos deleted:', cursos.rowCount);

      // Finally delete the person
      const personRes = await client.query('DELETE FROM mantenimiento.personal_disponible WHERE rut = $1 RETURNING *', [rut]);
      console.log('personal_disponible deleted:', personRes.rowCount);
      if(personRes.rowCount>0){
        console.log('Deleted person:', personRes.rows[0]);
      }

      await client.query('COMMIT');
      console.log('COMMIT successful for', rut);
    } catch (err){
      await client.query('ROLLBACK');
      console.error('Error deleting', rut, err.message || err);
    } finally {
      client.release();
    }
  }
  console.log('\nAll done');
  process.exit(0);
})();
