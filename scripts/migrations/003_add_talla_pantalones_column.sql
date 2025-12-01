-- Add talla_pantalones column to personal_disponible table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mantenimiento' AND table_name='personal_disponible' AND column_name='talla_pantalones') THEN
    ALTER TABLE mantenimiento.personal_disponible ADD COLUMN talla_pantalones VARCHAR(255);
    RAISE NOTICE 'Column talla_pantalones added to mantenimiento.personal_disponible';
  ELSE
    RAISE NOTICE 'Column talla_pantalones already exists in mantenimiento.personal_disponible';
  END IF;
END $$;
