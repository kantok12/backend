-- Consulta: listar carteras cuyo nombre contiene 'cartera test'
-- Uso: ejecutar en psql, pgAdmin o cualquier cliente SQL conectado a la DB
-- Ejemplo psql (ajusta host/usuario/dbname):
-- psql -h <host> -U <user> -d <dbname> -c "SELECT id, name, created_at FROM servicios.carteras WHERE name ILIKE '%cartera test%' ORDER BY id;"

SELECT id, name, created_at
FROM servicios.carteras
WHERE name ILIKE '%cartera test%'
ORDER BY id;
