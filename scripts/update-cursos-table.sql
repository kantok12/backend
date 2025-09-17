-- =====================================================
-- ACTUALIZAR TABLA CURSOS CON FECHA_VENCIMIENTO
-- =====================================================
-- Agregar columna fecha_vencimiento a la tabla cursos
-- Basado en el diagrama ERD proporcionado

-- Verificar si la columna ya existe
DO $$
BEGIN
    -- Agregar columna fecha_vencimiento si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'mantenimiento' 
        AND table_name = 'cursos' 
        AND column_name = 'fecha_vencimiento'
    ) THEN
        ALTER TABLE mantenimiento.cursos 
        ADD COLUMN fecha_vencimiento DATE;
        
        RAISE NOTICE 'Columna fecha_vencimiento agregada a la tabla cursos';
    ELSE
        RAISE NOTICE 'Columna fecha_vencimiento ya existe en la tabla cursos';
    END IF;
END $$;

-- Agregar comentario a la nueva columna
COMMENT ON COLUMN mantenimiento.cursos.fecha_vencimiento IS 'Fecha de vencimiento de la certificación del curso';

-- Crear índice para optimizar consultas de vencimiento
CREATE INDEX IF NOT EXISTS idx_cursos_fecha_vencimiento ON mantenimiento.cursos(fecha_vencimiento);

-- Actualizar cursos existentes con fechas de vencimiento estimadas
-- (30 días después de la fecha de fin, o 365 días después de la fecha de inicio si no hay fecha de fin)
UPDATE mantenimiento.cursos 
SET fecha_vencimiento = CASE 
    WHEN fecha_fin IS NOT NULL THEN fecha_fin + INTERVAL '30 days'
    WHEN fecha_inicio IS NOT NULL THEN fecha_inicio + INTERVAL '365 days'
    ELSE CURRENT_DATE + INTERVAL '365 days'
END
WHERE fecha_vencimiento IS NULL;

-- Verificar la actualización
SELECT 
    COUNT(*) as total_cursos,
    COUNT(fecha_vencimiento) as cursos_con_vencimiento,
    COUNT(CASE WHEN fecha_vencimiento < CURRENT_DATE THEN 1 END) as cursos_vencidos,
    COUNT(CASE WHEN fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as cursos_por_vencer_30_dias,
    COUNT(CASE WHEN fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' THEN 1 END) as cursos_por_vencer_90_dias
FROM mantenimiento.cursos;


