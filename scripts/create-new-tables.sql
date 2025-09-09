-- Script para crear las nuevas tablas: cursos y documentos
-- Ejecutar en PostgreSQL

-- =====================================================
-- 1. CREAR TABLA CURSOS
-- =====================================================

CREATE TABLE IF NOT EXISTS mantenimiento.cursos (
    id SERIAL PRIMARY KEY,
    rut_persona TEXT NOT NULL,
    nombre_curso VARCHAR(255) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(50) DEFAULT 'completado',
    institucion VARCHAR(255),
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    
    -- Constraint para validar estado
    CONSTRAINT chk_estado_curso CHECK (estado IN ('pendiente', 'en_progreso', 'completado', 'cancelado')),
    
    -- Foreign key a personal_disponible
    CONSTRAINT fk_curso_persona FOREIGN KEY (rut_persona) 
        REFERENCES mantenimiento.personal_disponible(rut) ON DELETE CASCADE
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_cursos_rut_persona ON mantenimiento.cursos(rut_persona);
CREATE INDEX IF NOT EXISTS idx_cursos_estado ON mantenimiento.cursos(estado);
CREATE INDEX IF NOT EXISTS idx_cursos_fecha_inicio ON mantenimiento.cursos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_cursos_activo ON mantenimiento.cursos(activo);

-- Comentarios para documentación
COMMENT ON TABLE mantenimiento.cursos IS 'Tabla para almacenar cursos del personal';
COMMENT ON COLUMN mantenimiento.cursos.rut_persona IS 'RUT de la persona que tomó el curso';
COMMENT ON COLUMN mantenimiento.cursos.nombre_curso IS 'Nombre del curso';
COMMENT ON COLUMN mantenimiento.cursos.fecha_inicio IS 'Fecha de inicio del curso';
COMMENT ON COLUMN mantenimiento.cursos.fecha_fin IS 'Fecha de finalización del curso';
COMMENT ON COLUMN mantenimiento.cursos.estado IS 'Estado del curso: pendiente, en_progreso, completado, cancelado';
COMMENT ON COLUMN mantenimiento.cursos.institucion IS 'Institución que impartió el curso';
COMMENT ON COLUMN mantenimiento.cursos.descripcion IS 'Descripción adicional del curso';

-- =====================================================
-- 2. CREAR TABLA DOCUMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS mantenimiento.documentos (
    id SERIAL PRIMARY KEY,
    rut_persona TEXT NOT NULL,
    nombre_documento VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(100) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamaño_bytes BIGINT NOT NULL,
    ruta_archivo TEXT NOT NULL,
    descripcion TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subido_por VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    
    -- Constraint para validar tipo de documento
    CONSTRAINT chk_tipo_documento CHECK (tipo_documento IN (
        'certificado_curso', 'diploma', 'certificado_laboral', 
        'certificado_medico', 'licencia_conducir', 'certificado_seguridad',
        'otro'
    )),
    
    -- Foreign key a personal_disponible
    CONSTRAINT fk_documento_persona FOREIGN KEY (rut_persona) 
        REFERENCES mantenimiento.personal_disponible(rut) ON DELETE CASCADE
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_documentos_rut_persona ON mantenimiento.documentos(rut_persona);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON mantenimiento.documentos(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_documentos_fecha_subida ON mantenimiento.documentos(fecha_subida);
CREATE INDEX IF NOT EXISTS idx_documentos_activo ON mantenimiento.documentos(activo);

-- Comentarios para documentación
COMMENT ON TABLE mantenimiento.documentos IS 'Tabla para almacenar documentos del personal';
COMMENT ON COLUMN mantenimiento.documentos.rut_persona IS 'RUT de la persona propietaria del documento';
COMMENT ON COLUMN mantenimiento.documentos.nombre_documento IS 'Nombre descriptivo del documento';
COMMENT ON COLUMN mantenimiento.documentos.tipo_documento IS 'Tipo de documento: certificado_curso, diploma, certificado_laboral, etc.';
COMMENT ON COLUMN mantenimiento.documentos.nombre_archivo IS 'Nombre del archivo en el sistema (con timestamp)';
COMMENT ON COLUMN mantenimiento.documentos.nombre_original IS 'Nombre original del archivo subido por el usuario';
COMMENT ON COLUMN mantenimiento.documentos.tipo_mime IS 'Tipo MIME del archivo (ej: application/pdf, image/jpeg)';
COMMENT ON COLUMN mantenimiento.documentos.tamaño_bytes IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN mantenimiento.documentos.ruta_archivo IS 'Ruta completa del archivo en el sistema de archivos';

-- =====================================================
-- 3. ELIMINAR TABLA ANTIGUA (OPCIONAL - COMENTAR SI NO SE QUIERE)
-- =====================================================

-- CUIDADO: Descomenta solo si quieres eliminar la tabla antigua
-- DROP TABLE IF EXISTS mantenimiento.cursos_certificaciones CASCADE;
-- DROP TABLE IF EXISTS mantenimiento.cursos_documentos CASCADE;

-- =====================================================
-- 4. CREAR DIRECTORIOS DE ALMACENAMIENTO
-- =====================================================

-- Nota: Los directorios se crearán automáticamente por el middleware de upload
-- uploads/cursos/ - para documentos de cursos
-- uploads/documentos/ - para documentos generales
