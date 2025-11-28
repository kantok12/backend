-- Cascade delete script for carteras 13 and 14
-- WARNING: This script performs destructive operations. Read and BACKUP before running.
-- Usage (recommended):
-- 1) Inspect dependents: psql -h <host> -U <user> -d <db> -f cascade_delete_carteras_13_14.sql --dry-run (see notes below)
-- 2) Run backups (psql \copy commands shown below)
-- 3) Run the transaction block at the end to perform deletion

-- TARGET CARTERAS
-- Adjust these IDs if needed
\set CARTERAS '13,14'

-- ==============================
-- 0) Show FK constraints that reference servicios.clientes or servicios.carteras
-- ==============================
SELECT conname,
       confrelid::regclass AS referenced_table,
       conrelid::regclass AS child_table,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'f'
  AND (confrelid = 'servicios.clientes'::regclass OR confrelid = 'servicios.carteras'::regclass)
ORDER BY referenced_table, child_table;

-- ==============================
-- 1) Dry-run counts: how many rows would be affected
-- ==============================
-- Count nodes that belong to clients in these carteras
SELECT 'nodos_to_delete' AS what, COUNT(*) AS total
FROM servicios.nodos n
WHERE n.cliente_id IN (
  SELECT id FROM servicios.clientes WHERE cartera_id IN (13,14)
);

-- Count clients to delete
SELECT 'clientes_to_delete' AS what, COUNT(*) AS total
FROM servicios.clientes
WHERE cartera_id IN (13,14);

-- Count carteras to delete
SELECT 'carteras_to_delete' AS what, COUNT(*) AS total
FROM servicios.carteras
WHERE id IN (13,14);

-- ==============================
-- 2) BACKUP commands (psql \copy) - run these from your shell BEFORE running deletion
-- Adjust paths and connection params
-- ==============================
-- Backup carteras
-- psql -h <host> -U <user> -d <dbname> -c "\copy (SELECT * FROM servicios.carteras WHERE id IN (13,14)) TO 'C:\\temp\\carteras_backup_13_14.csv' CSV HEADER"

-- Backup clients
-- psql -h <host> -U <user> -d <dbname> -c "\copy (SELECT * FROM servicios.clientes WHERE cartera_id IN (13,14)) TO 'C:\\temp\\clientes_cartera_13_14_backup.csv' CSV HEADER"

-- Backup nodes related to those clients
-- psql -h <host> -U <user> -d <dbname> -c "\copy (SELECT * FROM servicios.nodos WHERE cliente_id IN (SELECT id FROM servicios.clientes WHERE cartera_id IN (13,14))) TO 'C:\\temp\\nodos_carteras_13_14_backup.csv' CSV HEADER"

-- If other dependent tables exist (see FK list above), backup them similarly before proceeding.

-- ==============================
-- 3) DELETION (transactional)
-- Run only after you've backed up and reviewed the dry-run counts and FK list.
-- This block deletes from servicios.nodos -> servicios.clientes -> servicios.carteras
-- ==============================
BEGIN;

-- delete child rows in servicios.nodos referencing clients in the target carteras
DELETE FROM servicios.nodos
WHERE cliente_id IN (
  SELECT id FROM servicios.clientes WHERE cartera_id IN (13,14)
);

-- delete clients belonging to the target carteras
DELETE FROM servicios.clientes
WHERE cartera_id IN (13,14);

-- delete the carteras themselves
DELETE FROM servicios.carteras
WHERE id IN (13,14);

COMMIT;

-- ==============================
-- 4) Post-checks
-- Verify that no rows remain
SELECT COUNT(*) AS remaining_carteras FROM servicios.carteras WHERE id IN (13,14);
SELECT COUNT(*) AS remaining_clientes FROM servicios.clientes WHERE cartera_id IN (13,14);
SELECT COUNT(*) AS remaining_nodos FROM servicios.nodos WHERE cliente_id IN (SELECT id FROM servicios.clientes WHERE cartera_id IN (13,14));

-- End of script
