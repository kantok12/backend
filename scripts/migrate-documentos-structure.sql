-- =====================================================
-- MIGRACIÓN: Separar documentos de cursos
-- =====================================================
-- Este script modifica la estructura para que documentos
-- se relacione directamente con personal_disponible
-- en lugar de depender de cursos_certificaciones

-- =====================================================
-- 1. CREAR NUEVA TABLA DOCUMENTOS INDEPENDIENTE
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
        'certificado_vencimiento', 'otro'
    )),
    
    -- Foreign key a personal_disponible
    CONSTRAINT fk_documento_persona FOREIGN KEY (rut_persona) 
        REFERENCES mantenimiento.personal_disponible(rut) ON DELETE CASCADE
);

-- =====================================================
-- 2. CREAR ÍNDICES PARA LA NUEVA TABLA DOCUMENTOS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_documentos_rut_persona ON mantenimiento.documentos(rut_persona);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON mantenimiento.documentos(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_documentos_fecha_subida ON mantenimiento.documentos(fecha_subida);
CREATE INDEX IF NOT EXISTS idx_documentos_activo ON mantenimiento.documentos(activo);
CREATE INDEX IF NOT EXISTS idx_documentos_nombre ON mantenimiento.documentos(nombre_documento);

-- =====================================================
-- 3. MIGRAR DATOS EXISTENTES DE cursos_documentos
-- =====================================================

-- Insertar datos existentes de cursos_documentos a la nueva tabla documentos
INSERT INTO mantenimiento.documentos (
    rut_persona,
    nombre_documento,
    tipo_documento,
    nombre_archivo,
    nombre_original,
    tipo_mime,
    tamaño_bytes,
    ruta_archivo,
    descripcion,
    fecha_subida,
    subido_por,
    activo
)
SELECT 
    cc.rut_persona,
    cc.nombre_curso || ' - Documento' as nombre_documento,
    'certificado_curso' as tipo_documento,
    cd.nombre_archivo,
    cd.nombre_original,
    cd.tipo_mime,
    cd.tamaño_bytes,
    cd.ruta_archivo,
    cd.descripcion,
    cd.fecha_subida,
    cd.subido_por,
    cd.activo
FROM mantenimiento.cursos_documentos cd
JOIN mantenimiento.cursos_certificaciones cc ON cd.curso_id = cc.id
WHERE cd.activo = true;

-- =====================================================
-- 4. AGREGAR COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE mantenimiento.documentos IS 'Tabla para almacenar documentos del personal de forma independiente';
COMMENT ON COLUMN mantenimiento.documentos.rut_persona IS 'RUT de la persona propietaria del documento';
COMMENT ON COLUMN mantenimiento.documentos.nombre_documento IS 'Nombre descriptivo del documento';
COMMENT ON COLUMN mantenimiento.documentos.tipo_documento IS 'Tipo de documento: certificado_curso, diploma, certificado_laboral, etc.';
COMMENT ON COLUMN mantenimiento.documentos.nombre_archivo IS 'Nombre del archivo en el sistema (con timestamp)';
COMMENT ON COLUMN mantenimiento.documentos.nombre_original IS 'Nombre original del archivo subido por el usuario';
COMMENT ON COLUMN mantenimiento.documentos.tipo_mime IS 'Tipo MIME del archivo (ej: application/pdf, image/jpeg)';
COMMENT ON COLUMN mantenimiento.documentos.tamaño_bytes IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN mantenimiento.documentos.ruta_archivo IS 'Ruta completa del archivo en el sistema de archivos';

-- =====================================================
-- 5. VERIFICAR MIGRACIÓN
-- =====================================================

-- Mostrar estadísticas de la migración
SELECT 
    'Documentos migrados' as descripcion,
    COUNT(*) as cantidad
FROM mantenimiento.documentos
UNION ALL
SELECT 
    'Documentos originales' as descripcion,
    COUNT(*) as cantidad
FROM mantenimiento.cursos_documentos;

-- =====================================================
-- 6. NOTA IMPORTANTE
-- =====================================================
-- 
-- IMPORTANTE: Después de verificar que la migración fue exitosa,
-- puedes eliminar la tabla cursos_documentos con:
-- 
-- DROP TABLE IF EXISTS mantenimiento.cursos_documentos;
-- 
-- Pero hazlo solo después de confirmar que todo funciona correctamente
-- y que has actualizado todos los endpoints y aplicaciones.
