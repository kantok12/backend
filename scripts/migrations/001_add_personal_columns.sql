-- Migration: Add optional columns to mantenimiento.personal_disponible
-- Safe to run multiple times (uses IF NOT EXISTS)

ALTER TABLE mantenimiento.personal_disponible
  ADD COLUMN IF NOT EXISTS documentacion_id integer,
  ADD COLUMN IF NOT EXISTS estado_civil text,
  ADD COLUMN IF NOT EXISTS pais text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS comuna text,
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS correo_electronico text,
  ADD COLUMN IF NOT EXISTS correo_personal text,
  ADD COLUMN IF NOT EXISTS contacto_emergencia text,
  ADD COLUMN IF NOT EXISTS talla_ropa text,
  ADD COLUMN IF NOT EXISTS talla_pantalon text,
  ADD COLUMN IF NOT EXISTS talla_zapato text,
  ADD COLUMN IF NOT EXISTS id_centro_costo text,
  ADD COLUMN IF NOT EXISTS centro_costo text,
  ADD COLUMN IF NOT EXISTS sede text;

-- created_at is usually already present; if not, add it with default now()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'mantenimiento' AND table_name = 'personal_disponible' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE mantenimiento.personal_disponible
      ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END$$;

-- Optional: create an index on rut if not exists (should already exist as unique)
CREATE INDEX IF NOT EXISTS idx_personal_disponible_rut ON mantenimiento.personal_disponible (rut);
