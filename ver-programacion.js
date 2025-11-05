const {query} = require('./config/database');

query(`
  SELECT cartera_id, semana_inicio, COUNT(*) as total 
  FROM mantenimiento.programacion_semanal 
  WHERE estado='activo' 
  GROUP BY cartera_id, semana_inicio 
  ORDER BY semana_inicio DESC 
  LIMIT 10
`).then(r => {
  console.log('📅 Semanas con programación disponible:\n');
  r.rows.forEach(row => {
    console.log(`   Cartera ${row.cartera_id}: ${row.semana_inicio} (${row.total} asignaciones)`);
  });
  console.log('\n💡 Usa estos valores en test-copiar-programacion.js');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
