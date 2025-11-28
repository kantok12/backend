-- Cascade delete script for carteras named 'INDUSTRIA 1' and 'INDUSTRIA 2'
-- WARNING: destructive. Backup before running.

-- 0) Find matching carteras and their ids
SELECT id, name, created_at FROM servicios.carteras WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2' ORDER BY id;

-- 1) Dry-run counts (how many rows would be affected)
SELECT 'nodos_to_delete' AS what, COUNT(*) AS total
FROM servicios.nodos n
WHERE n.cliente_id IN (
  SELECT id FROM servicios.clientes WHERE cartera_id IN (
    SELECT id FROM servicios.carteras WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2'
  )
);

SELECT 'clientes_to_delete' AS what, COUNT(*) AS total
FROM servicios.clientes
WHERE cartera_id IN (
  SELECT id FROM servicios.carteras WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2'
);

SELECT 'carteras_to_delete' AS what, COUNT(*) AS total
FROM servicios.carteras
WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2';

-- 2) BACKUP commands (psql \copy) - run these from your shell BEFORE running deletion
-- psql -h <host> -U <user> -d <dbname> -c "\copy (SELECT * FROM servicios.carteras WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2') TO 'C:\\temp\\carteras_industria_backup.csv' CSV HEADER"
-- psql -h <host> -U <user> -d <dbname> -c "\copy (SELECT * FROM servicios.clientes WHERE cartera_id IN (SELECT id FROM servicios.carteras WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2')) TO 'C:\\temp\\clientes_industria_backup.csv' CSV HEADER"
-- psql -h <host> -U <user> -d <dbname> -c "\copy (SELECT * FROM servicios.nodos WHERE cliente_id IN (SELECT id FROM servicios.clientes WHERE cartera_id IN (SELECT id FROM servicios.carteras WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2'))) TO 'C:\\temp\\nodos_industria_backup.csv' CSV HEADER"

-- 3) DELETION (transactional) - run only after backups and review
BEGIN;

DELETE FROM servicios.nodos
WHERE cliente_id IN (
  SELECT id FROM servicios.clientes WHERE cartera_id IN (
    SELECT id FROM servicios.carteras WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2'
  )
);

DELETE FROM servicios.clientes
WHERE cartera_id IN (
  SELECT id FROM servicios.carteras WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2'
);

DELETE FROM servicios.carteras
WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2';

COMMIT;

-- 4) Post-checks
SELECT COUNT(*) AS remaining_carteras FROM servicios.carteras WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2';
SELECT COUNT(*) AS remaining_clientes FROM servicios.clientes WHERE cartera_id IN (SELECT id FROM servicios.carteras WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2');
SELECT COUNT(*) AS remaining_nodos FROM servicios.nodos WHERE cliente_id IN (SELECT id FROM servicios.clientes WHERE cartera_id IN (SELECT id FROM servicios.carteras WHERE name ILIKE 'INDUSTRIA 1' OR name ILIKE 'INDUSTRIA 2'));
