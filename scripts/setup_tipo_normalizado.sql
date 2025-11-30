-- SQL de migración: crear función de normalización, columnas, tabla de mapeo, trigger e índices
-- Ejecutar con psql o desde un cliente SQL conectado a la BD del proyecto

BEGIN;

-- 1) Extensión unaccent (opcional pero recomendable)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2) Función de normalización (quita acentos, reemplaza no-alnum por '_', colapsa guiones bajos)
CREATE OR REPLACE FUNCTION mantenimiento.normalize_text(input text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(
    regexp_replace(
      trim(both '_' FROM regexp_replace(unaccent(coalesce($1,'')), '[^0-9A-Za-z]+', '_', 'g')),
      '_{2,}', '_', 'g'
    )
  );
$$;

-- 3) Añadir columnas tipo_normalizado donde falten
ALTER TABLE IF EXISTS mantenimiento.documentos
  ADD COLUMN IF NOT EXISTS tipo_normalizado text;

ALTER TABLE IF EXISTS mantenimiento.cliente_prerrequisitos
  ADD COLUMN IF NOT EXISTS tipo_normalizado text;

-- 4) Tabla de mapeo semántico (opcional)
CREATE TABLE IF NOT EXISTS mantenimiento.tipo_normalizado_map (
  id serial PRIMARY KEY,
  canonical_code text NOT NULL,
  canonical_label text,
  synonyms text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 5) Trigger function for mantenimiento.documentos
CREATE OR REPLACE FUNCTION mantenimiento.documentos_tipo_normalizado_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.tipo_normalizado := mantenimiento.normalize_text(COALESCE(NEW.nombre_documento, NEW.tipo_documento, NEW.nombre_archivo, ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_documentos_tipo_normalizado ON mantenimiento.documentos;
CREATE TRIGGER trg_documentos_tipo_normalizado
BEFORE INSERT OR UPDATE ON mantenimiento.documentos
FOR EACH ROW EXECUTE FUNCTION mantenimiento.documentos_tipo_normalizado_trigger();

-- 6) Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_documentos_tipo_normalizado ON mantenimiento.documentos(tipo_normalizado);
CREATE INDEX IF NOT EXISTS idx_prerrequisitos_tipo_normalizado ON mantenimiento.cliente_prerrequisitos(tipo_normalizado);

COMMIT;

-- Nota: Después de ejecutar este script, ejecutar el script Node `populate_tipo_normalizado.js`
-- para inicializar valores existentes y generar sugerencias de mapeo.
