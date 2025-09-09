-- Script para crear tabla de documentos de cursos y certificaciones
-- Ejecutar en PostgreSQL

-- Crear tabla para almacenar documentos de cursos
CREATE TABLE IF NOT EXISTS mantenimiento.cursos_documentos (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER NOT NULL REFERENCES mantenimiento.cursos_certificaciones(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamaño_bytes BIGINT NOT NULL,
    ruta_archivo TEXT NOT NULL,
    descripcion TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subido_por VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    
    -- Índices para optimización
    CONSTRAINT fk_curso_documento FOREIGN KEY (curso_id) REFERENCES mantenimiento.cursos_certificaciones(id)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_cursos_documentos_curso_id ON mantenimiento.cursos_documentos(curso_id);
CREATE INDEX IF NOT EXISTS idx_cursos_documentos_activo ON mantenimiento.cursos_documentos(activo);
CREATE INDEX IF NOT EXISTS idx_cursos_documentos_fecha ON mantenimiento.cursos_documentos(fecha_subida);

-- Comentarios para documentación
COMMENT ON TABLE mantenimiento.cursos_documentos IS 'Tabla para almacenar documentos asociados a cursos y certificaciones';
COMMENT ON COLUMN mantenimiento.cursos_documentos.curso_id IS 'ID del curso/certificación al que pertenece el documento';
COMMENT ON COLUMN mantenimiento.cursos_documentos.nombre_archivo IS 'Nombre del archivo en el sistema (con timestamp)';
COMMENT ON COLUMN mantenimiento.cursos_documentos.nombre_original IS 'Nombre original del archivo subido por el usuario';
COMMENT ON COLUMN mantenimiento.cursos_documentos.tipo_mime IS 'Tipo MIME del archivo (ej: application/pdf, image/jpeg)';
COMMENT ON COLUMN mantenimiento.cursos_documentos.tamaño_bytes IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN mantenimiento.cursos_documentos.ruta_archivo IS 'Ruta completa del archivo en el sistema de archivos';
COMMENT ON COLUMN mantenimiento.cursos_documentos.descripcion IS 'Descripción opcional del documento';
COMMENT ON COLUMN mantenimiento.cursos_documentos.subido_por IS 'Usuario que subió el documento';
COMMENT ON COLUMN mantenimiento.cursos_documentos.activo IS 'Indica si el documento está activo (no eliminado lógicamente)';
