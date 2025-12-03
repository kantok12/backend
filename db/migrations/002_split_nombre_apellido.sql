-- Migration: split full name into nombre + apellido for mantenimiento.personal_disponible
-- Adds columns if missing and backfills from existing "nombres" when available.

BEGIN;

-- Add columns if not exist
ALTER TABLE mantenimiento.personal_disponible
  ADD COLUMN IF NOT EXISTS nombre TEXT,
  ADD COLUMN IF NOT EXISTS apellido TEXT;

-- Backfill nombre from nombres when nombre is NULL
UPDATE mantenimiento.personal_disponible pd
SET nombre = CASE
  WHEN pd.nombre IS NULL OR pd.nombre = '' THEN
    NULLIF(trim(split_part(pd.nombres, ' ', 1)), '')
  ELSE pd.nombre
END
WHERE pd.nombre IS NULL OR pd.nombre = '';

-- Backfill apellido from nombres when apellido is NULL
-- Heuristic: everything after first space is apellido (supports apellidos compuestos)
UPDATE mantenimiento.personal_disponible pd
SET apellido = CASE
  WHEN pd.apellido IS NULL OR pd.apellido = '' THEN
    NULLIF(trim(SUBSTRING(pd.nombres FROM '^\S+\s+(.*)$')), '')
  ELSE pd.apellido
END
WHERE pd.apellido IS NULL OR pd.apellido = '';

-- Optional: if both nombre and apellido remain NULL but "nombres" has content, put all into nombre
UPDATE mantenimiento.personal_disponible pd
SET nombre = COALESCE(pd.nombre, NULLIF(trim(pd.nombres), ''))
WHERE (pd.nombre IS NULL OR pd.nombre = '')
  AND (pd.apellido IS NULL OR pd.apellido = '');

COMMIT;
