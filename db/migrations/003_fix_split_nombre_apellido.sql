-- Migration 003: Fix split of full name into nombre + apellido
-- Context: Dataset uses format "Apellido1 Apellido2 Nombre(s)".
-- Goal: Ensure mantenimiento.personal_disponible has correct nombre/apellido derived from "nombres".

BEGIN;

-- Ensure columns exist
ALTER TABLE mantenimiento.personal_disponible
  ADD COLUMN IF NOT EXISTS nombre TEXT,
  ADD COLUMN IF NOT EXISTS apellido TEXT;

-- 1) Fill NULL/empty nombre/apellido using desired heuristic
WITH base AS (
  SELECT rut,
         trim(nombres) AS nombres_trim,
         regexp_split_to_array(trim(nombres), '\\s+') AS tokens
  FROM mantenimiento.personal_disponible
  WHERE nombres IS NOT NULL AND trim(nombres) <> ''
), desired AS (
  SELECT b.rut,
         CASE
           WHEN array_length(b.tokens, 1) >= 3 THEN b.tokens[1] || ' ' || b.tokens[2]
           WHEN array_length(b.tokens, 1) = 2 THEN b.tokens[1]
           WHEN array_length(b.tokens, 1) = 1 THEN NULL
           ELSE NULL
         END AS apellido_new,
         CASE
           WHEN array_length(b.tokens, 1) >= 3 THEN array_to_string(b.tokens[3:array_length(b.tokens, 1)], ' ')
           WHEN array_length(b.tokens, 1) = 2 THEN b.tokens[2]
           WHEN array_length(b.tokens, 1) = 1 THEN b.tokens[1]
           ELSE NULL
         END AS nombre_new
  FROM base b
)
UPDATE mantenimiento.personal_disponible pd
SET apellido = COALESCE(NULLIF(pd.apellido, ''), d.apellido_new),
    nombre   = COALESCE(NULLIF(pd.nombre,   ''), d.nombre_new)
FROM desired d
WHERE pd.rut = d.rut
  AND (
    pd.apellido IS NULL OR pd.apellido = '' OR
    pd.nombre   IS NULL OR pd.nombre   = ''
  );

-- 2) Correct rows that were set using old rule (nombre=first token, apellido=rest)
WITH base AS (
  SELECT rut,
         trim(nombres) AS nombres_trim,
         regexp_split_to_array(trim(nombres), '\\s+') AS tokens,
         split_part(nombres, ' ', 1) AS first_token,
         NULLIF(trim(SUBSTRING(nombres FROM '^\\S+\\s+(.*)$')), '') AS rest_tokens
  FROM mantenimiento.personal_disponible
  WHERE nombres IS NOT NULL AND trim(nombres) <> ''
), desired AS (
  SELECT b.rut,
         CASE
           WHEN array_length(b.tokens, 1) >= 3 THEN b.tokens[1] || ' ' || b.tokens[2]
           WHEN array_length(b.tokens, 1) = 2 THEN b.tokens[1]
           ELSE NULL
         END AS apellido_new,
         CASE
           WHEN array_length(b.tokens, 1) >= 3 THEN array_to_string(b.tokens[3:array_length(b.tokens, 1)], ' ')
           WHEN array_length(b.tokens, 1) = 2 THEN b.tokens[2]
           ELSE b.first_token
         END AS nombre_new,
         array_length(b.tokens, 1) AS len
  FROM base b
)
UPDATE mantenimiento.personal_disponible pd
SET apellido = d.apellido_new,
    nombre   = d.nombre_new
FROM desired d
WHERE pd.rut = d.rut
  AND d.len >= 3
  AND pd.nombre = split_part(pd.nombres, ' ', 1)
  AND pd.apellido = NULLIF(trim(SUBSTRING(pd.nombres FROM '^\\S+\\s+(.*)$')), '');

COMMIT;
