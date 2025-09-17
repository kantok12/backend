-- =====================================================
-- CREAR TABLA PERSONAL_ESTADOS
-- =====================================================
-- Tabla para el historial de estados del personal
-- Basado en el diagrama ERD proporcionado

CREATE TABLE IF NOT EXISTS mantenimiento.personal_estados (
    id BIGSERIAL PRIMARY KEY,
    rut TEXT NOT NULL,
    estado_id INTEGER NOT NULL,
    cargo TEXT,
    activo BOOLEAN DEFAULT TRUE,
    comentario TEXT,
    desde TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    hasta TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_personal_estados_rut FOREIGN KEY (rut) 
        REFERENCES mantenimiento.personal_disponible(rut) ON DELETE CASCADE,
    CONSTRAINT fk_personal_estados_estado FOREIGN KEY (estado_id) 
        REFERENCES mantenimiento.estados(id) ON DELETE RESTRICT
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_personal_estados_rut ON mantenimiento.personal_estados(rut);
CREATE INDEX IF NOT EXISTS idx_personal_estados_estado_id ON mantenimiento.personal_estados(estado_id);
CREATE INDEX IF NOT EXISTS idx_personal_estados_activo ON mantenimiento.personal_estados(activo);
CREATE INDEX IF NOT EXISTS idx_personal_estados_desde ON mantenimiento.personal_estados(desde);
CREATE INDEX IF NOT EXISTS idx_personal_estados_hasta ON mantenimiento.personal_estados(hasta);

-- Comentarios para documentación
COMMENT ON TABLE mantenimiento.personal_estados IS 'Historial de estados del personal a lo largo del tiempo';
COMMENT ON COLUMN mantenimiento.personal_estados.rut IS 'RUT del personal';
COMMENT ON COLUMN mantenimiento.personal_estados.estado_id IS 'ID del estado en la tabla estados';
COMMENT ON COLUMN mantenimiento.personal_estados.cargo IS 'Cargo que tenía durante este estado';
COMMENT ON COLUMN mantenimiento.personal_estados.activo IS 'Si este registro de estado está activo';
COMMENT ON COLUMN mantenimiento.personal_estados.comentario IS 'Comentarios sobre este estado';
COMMENT ON COLUMN mantenimiento.personal_estados.desde IS 'Fecha y hora de inicio de este estado';
COMMENT ON COLUMN mantenimiento.personal_estados.hasta IS 'Fecha y hora de fin de este estado (NULL si es el estado actual)';
COMMENT ON COLUMN mantenimiento.personal_estados.created_at IS 'Fecha de creación del registro';

-- Insertar datos iniciales basados en el personal actual
INSERT INTO mantenimiento.personal_estados (rut, estado_id, cargo, activo, comentario, desde)
SELECT 
    rut,
    estado_id,
    cargo,
    TRUE,
    comentario_estado,
    CURRENT_TIMESTAMP
FROM mantenimiento.personal_disponible
WHERE rut IS NOT NULL
ON CONFLICT DO NOTHING;

-- Verificar la creación
SELECT 
    COUNT(*) as total_registros,
    COUNT(DISTINCT rut) as personal_único,
    COUNT(CASE WHEN hasta IS NULL THEN 1 END) as estados_activos
FROM mantenimiento.personal_estados;


