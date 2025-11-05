const {query} = require('./config/database');

query(`
  SELECT fecha_trabajo, COUNT(*) as total 
  FROM mantenimiento.programacion_optimizada 
  WHERE cartera_id = 6 
  GROUP BY fecha_trabajo 
  ORDER BY fecha_trabajo
`).then(r => {
  console.log('📅 Fechas con programación (Cartera 6):\n');
  r.rows.forEach(row => {
    const fecha = new Date(row.fecha_trabajo);
    console.log(`   ${fecha.toISOString().split('T')[0]}: ${row.total} asignaciones`);
  });
  process.exit(0);
});
