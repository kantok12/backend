-- Migration: add tipo_normalizado to mantenimiento.documentos
ALTER TABLE mantenimiento.documentos
  ADD COLUMN IF NOT EXISTS tipo_normalizado text;

-- Backfill example: normalize using lower + remove non-alphanum -> underscores
-- This is a best-effort SQL backfill; consider running a JS script for better normalization.
UPDATE mantenimiento.documentos
SET tipo_normalizado = regexp_replace(lower(unaccent(coalesce(tipo_documento, ''))), '[^a-z0-9]+', '_', 'g')
WHERE tipo_normalizado IS NULL;

-- Index to speed queries by tipo_normalizado
CREATE INDEX IF NOT EXISTS idx_documentos_tipo_normalizado ON mantenimiento.documentos(tipo_normalizado);
