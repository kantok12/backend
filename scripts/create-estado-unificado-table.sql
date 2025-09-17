-- =====================================================
-- CREAR TABLA ESTADO_UNIFICADO
-- =====================================================
-- Tabla para estados unificados de diferentes orígenes
-- Basado en el diagrama ERD proporcionado

CREATE TABLE IF NOT EXISTS mantenimiento.estado_unificado (
    id BIGSERIAL PRIMARY KEY,
    origen TEXT NOT NULL,
    origen_id BIGINT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para validar orígenes válidos
    CONSTRAINT chk_origen_valido CHECK (origen IN (
        'personal', 'cursos', 'documentos', 'servicio', 'carteras', 
        'ingenieria_servicios', 'nodos', 'servicios_programados'
    ))
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_estado_unificado_origen ON mantenimiento.estado_unificado(origen);
CREATE INDEX IF NOT EXISTS idx_estado_unificado_origen_id ON mantenimiento.estado_unificado(origen_id);
CREATE INDEX IF NOT EXISTS idx_estado_unificado_activo ON mantenimiento.estado_unificado(activo);
CREATE INDEX IF NOT EXISTS idx_estado_unificado_created_at ON mantenimiento.estado_unificado(created_at);
CREATE INDEX IF NOT EXISTS idx_estado_unificado_origen_origen_id ON mantenimiento.estado_unificado(origen, origen_id);

-- Comentarios para documentación
COMMENT ON TABLE mantenimiento.estado_unificado IS 'Estados unificados de diferentes módulos del sistema';
COMMENT ON COLUMN mantenimiento.estado_unificado.origen IS 'Módulo de origen: personal, cursos, documentos, servicio, etc.';
COMMENT ON COLUMN mantenimiento.estado_unificado.origen_id IS 'ID del registro en el módulo de origen';
COMMENT ON COLUMN mantenimiento.estado_unificado.nombre IS 'Nombre del estado unificado';
COMMENT ON COLUMN mantenimiento.estado_unificado.descripcion IS 'Descripción detallada del estado';
COMMENT ON COLUMN mantenimiento.estado_unificado.activo IS 'Si este estado está activo';
COMMENT ON COLUMN mantenimiento.estado_unificado.created_at IS 'Fecha de creación del estado';

-- Insertar estados unificados iniciales para el personal
INSERT INTO mantenimiento.estado_unificado (origen, origen_id, nombre, descripcion, activo)
SELECT 
    'personal' as origen,
    CAST(SUBSTRING(rut FROM '[0-9]+') AS BIGINT) as origen_id,
    e.nombre as nombre,
    e.descripcion as descripcion,
    TRUE as activo
FROM mantenimiento.personal_disponible pd
JOIN mantenimiento.estados e ON pd.estado_id = e.id
WHERE pd.rut IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insertar estados unificados para cursos
INSERT INTO mantenimiento.estado_unificado (origen, origen_id, nombre, descripcion, activo)
SELECT 
    'cursos' as origen,
    id as origen_id,
    estado as nombre,
    CONCAT('Curso: ', nombre_curso, ' - Estado: ', estado) as descripcion,
    activo
FROM mantenimiento.cursos
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Verificar la creación
SELECT 
    origen,
    COUNT(*) as total_estados,
    COUNT(CASE WHEN activo THEN 1 END) as estados_activos
FROM mantenimiento.estado_unificado
GROUP BY origen
ORDER BY origen;


