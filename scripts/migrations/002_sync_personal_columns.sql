-- Migration: Sync personal_disponible columns to canonical set
-- 1) Backup current table (safe copy)
-- 2) Add missing canonical columns
-- 3) Rename some legacy columns to canonical names (when safe)
-- 4) Drop a small set of known-duplicate/obsolete columns (when present)

-- NOTE: Review this file before running on production. It creates a backup table
-- named mantenimiento.personal_disponible_backup_<ts> and then performs schema changes.

DO $$
DECLARE
  ts text := to_char(now(), 'YYYYMMDD_HH24MISS');
  backup_name text := format('mantenimiento.personal_disponible_backup_%s', ts);
BEGIN
  -- Create a backup table with data (only if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = split_part(backup_name, '.', 2)
  ) THEN
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I AS TABLE mantenimiento.personal_disponible', backup_name);
  END IF;
END$$;

-- Ensure canonical columns exist (use types that are permissive: text for most fields)
ALTER TABLE mantenimiento.personal_disponible
  ADD COLUMN IF NOT EXISTS nombres text,
  ADD COLUMN IF NOT EXISTS sexo text,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
  ADD COLUMN IF NOT EXISTS comuna text,
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS correo_electronico text,
  ADD COLUMN IF NOT EXISTS talla_ropa text,
  ADD COLUMN IF NOT EXISTS talla_zapato text,
  ADD COLUMN IF NOT EXISTS profesion text,
  ADD COLUMN IF NOT EXISTS telefono_2 text,
  ADD COLUMN IF NOT EXISTS licencia_conducir text,
  ADD COLUMN IF NOT EXISTS talla_pantalon text,
  ADD COLUMN IF NOT EXISTS fecha_inicio_contrato date,
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS id_centro_costo text,
  ADD COLUMN IF NOT EXISTS centro_costo text,
  ADD COLUMN IF NOT EXISTS id_area text,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS supervisor text,
  ADD COLUMN IF NOT EXISTS nombre_contacto_emergencia text,
  ADD COLUMN IF NOT EXISTS vinculo_contacto_emergencia text,
  ADD COLUMN IF NOT EXISTS telefono_contacto_emergencia text,
  ADD COLUMN IF NOT EXISTS vencimiento_examen_altura_fisica date,
  ADD COLUMN IF NOT EXISTS vencimiento_examen_gran_altura_geografica date,
  ADD COLUMN IF NOT EXISTS vencimiento_examen_vehiculo_liviano date,
  ADD COLUMN IF NOT EXISTS vencimiento_cedula date,
  ADD COLUMN IF NOT EXISTS vencimiento_licencia_profesional date,
  ADD COLUMN IF NOT EXISTS tipo_asistencia text;

-- Rename legacy columns to canonical names when safe (source exists and target does not)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mantenimiento' AND table_name='personal_disponible' AND column_name='contacto_emergencia')
     AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mantenimiento' AND table_name='personal_disponible' AND column_name='nombre_contacto_emergencia') THEN
    ALTER TABLE mantenimiento.personal_disponible RENAME COLUMN contacto_emergencia TO nombre_contacto_emergencia;
  END IF;

  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mantenimiento' AND table_name='personal_disponible' AND column_name='talla_pantalones')
     AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mantenimiento' AND table_name='personal_disponible' AND column_name='talla_pantalon') THEN
    ALTER TABLE mantenimiento.personal_disponible RENAME COLUMN talla_pantalones TO talla_pantalon;
  END IF;

  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mantenimiento' AND table_name='personal_disponible' AND column_name='talla_zapatos')
     AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mantenimiento' AND table_name='personal_disponible' AND column_name='talla_zapato') THEN
    ALTER TABLE mantenimiento.personal_disponible RENAME COLUMN talla_zapatos TO talla_zapato;
  END IF;

  -- If there is a column named "Listado de Empleados" (very unlikely), skip it.
END$$;

-- Drop clearly obsolete / duplicate columns if present. These are columns we consider surplus
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mantenimiento' AND table_name='personal_disponible' AND column_name='correo_personal') THEN
    ALTER TABLE mantenimiento.personal_disponible DROP COLUMN correo_personal;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mantenimiento' AND table_name='personal_disponible' AND column_name='talla_poleras') THEN
    ALTER TABLE mantenimiento.personal_disponible DROP COLUMN talla_poleras;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mantenimiento' AND table_name='personal_disponible' AND column_name='zona_geografica') THEN
    ALTER TABLE mantenimiento.personal_disponible DROP COLUMN zona_geografica;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mantenimiento' AND table_name='personal_disponible' AND column_name='comentario_estado') THEN
    ALTER TABLE mantenimiento.personal_disponible DROP COLUMN comentario_estado;
  END IF;
END$$;

-- Optional: create index on rut
CREATE INDEX IF NOT EXISTS idx_personal_disponible_rut ON mantenimiento.personal_disponible (rut);

-- End of migration
