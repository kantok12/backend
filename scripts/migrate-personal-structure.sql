-- =====================================================
-- MIGRACIÓN: PERSONAL_DISPONIBLE → PERSONAL + DOCUMENTOS
-- =====================================================
-- Este script separa la tabla personal_disponible en:
-- 1. personal (datos principales del personal)
-- 2. documentos (documentos y tallas del personal)
-- 3. cursos (ya existe, se mantiene)

-- PASO 1: Crear nueva tabla personal
-- ===================================
CREATE TABLE IF NOT EXISTS mantenimiento.personal (
    rut text PRIMARY KEY,
    nombre text,
    sexo varchar NOT NULL,
    fecha_nacimiento date NOT NULL,
    cargo varchar NOT NULL,
    estado_id integer NOT NULL REFERENCES mantenimiento.estados(id),
    comentario_estado text,
    zona_geografica text,
    fecha_creacion timestamp DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true
);

-- Crear índices para la tabla personal
CREATE INDEX IF NOT EXISTS idx_personal_estado ON mantenimiento.personal(estado_id);
CREATE INDEX IF NOT EXISTS idx_personal_activo ON mantenimiento.personal(activo);
CREATE INDEX IF NOT EXISTS idx_personal_cargo ON mantenimiento.personal(cargo);

-- PASO 2: Crear nueva tabla documentos (renombrar la existente si es necesario)
-- =============================================================================
-- Primero verificar si ya existe una tabla documentos
-- Si existe, la renombramos para evitar conflictos

-- Crear tabla documentos para documentos del personal
CREATE TABLE IF NOT EXISTS mantenimiento.documentos_personal (
    id serial PRIMARY KEY,
    rut_persona text NOT NULL REFERENCES mantenimiento.personal(rut),
    tipo_documento varchar NOT NULL,
    nombre_documento varchar,
    valor_documento text,
    fecha_emision date,
    fecha_vencimiento date,
    descripcion text,
    fecha_creacion timestamp DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true
);

-- Crear índices para la tabla documentos_personal
CREATE INDEX IF NOT EXISTS idx_documentos_personal_rut ON mantenimiento.documentos_personal(rut_persona);
CREATE INDEX IF NOT EXISTS idx_documentos_personal_tipo ON mantenimiento.documentos_personal(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_documentos_personal_activo ON mantenimiento.documentos_personal(activo);

-- PASO 3: Migrar datos de personal_disponible a personal
-- =====================================================
INSERT INTO mantenimiento.personal (
    rut, 
    nombre, 
    sexo, 
    fecha_nacimiento, 
    cargo, 
    estado_id, 
    comentario_estado, 
    zona_geografica,
    fecha_creacion,
    fecha_actualizacion
)
SELECT 
    rut, 
    nombre, 
    sexo, 
    fecha_nacimiento, 
    cargo, 
    estado_id, 
    comentario_estado, 
    zona_geografica,
    COALESCE(created_at, CURRENT_TIMESTAMP),
    COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM mantenimiento.personal_disponible
ON CONFLICT (rut) DO NOTHING;

-- PASO 4: Migrar documentos de personal_disponible a documentos_personal
-- ======================================================================

-- Migrar licencia de conducir
INSERT INTO mantenimiento.documentos_personal (
    rut_persona, 
    tipo_documento, 
    valor_documento, 
    nombre_documento,
    fecha_creacion
)
SELECT 
    rut, 
    'licencia_conducir', 
    licencia_conducir,
    'Licencia de Conducir',
    COALESCE(created_at, CURRENT_TIMESTAMP)
FROM mantenimiento.personal_disponible 
WHERE licencia_conducir IS NOT NULL AND licencia_conducir != '';

-- Migrar talla de zapatos
INSERT INTO mantenimiento.documentos_personal (
    rut_persona, 
    tipo_documento, 
    valor_documento, 
    nombre_documento,
    fecha_creacion
)
SELECT 
    rut, 
    'talla_zapatos', 
    talla_zapatos,
    'Talla de Zapatos',
    COALESCE(created_at, CURRENT_TIMESTAMP)
FROM mantenimiento.personal_disponible 
WHERE talla_zapatos IS NOT NULL AND talla_zapatos != '';

-- Migrar talla de pantalones
INSERT INTO mantenimiento.documentos_personal (
    rut_persona, 
    tipo_documento, 
    valor_documento, 
    nombre_documento,
    fecha_creacion
)
SELECT 
    rut, 
    'talla_pantalones', 
    talla_pantalones,
    'Talla de Pantalones',
    COALESCE(created_at, CURRENT_TIMESTAMP)
FROM mantenimiento.personal_disponible 
WHERE talla_pantalones IS NOT NULL AND talla_pantalones != '';

-- Migrar talla de poleras
INSERT INTO mantenimiento.documentos_personal (
    rut_persona, 
    tipo_documento, 
    valor_documento, 
    nombre_documento,
    fecha_creacion
)
SELECT 
    rut, 
    'talla_poleras', 
    talla_poleras,
    'Talla de Poleras',
    COALESCE(created_at, CURRENT_TIMESTAMP)
FROM mantenimiento.personal_disponible 
WHERE talla_poleras IS NOT NULL AND talla_poleras != '';

-- PASO 5: Verificar migración
-- ===========================
-- Contar registros migrados
SELECT 'PERSONAL' as tabla, COUNT(*) as registros FROM mantenimiento.personal
UNION ALL
SELECT 'DOCUMENTOS_PERSONAL' as tabla, COUNT(*) as registros FROM mantenimiento.documentos_personal
UNION ALL
SELECT 'PERSONAL_DISPONIBLE_ORIGINAL' as tabla, COUNT(*) as registros FROM mantenimiento.personal_disponible;

-- PASO 6: Actualizar referencias en cursos (si es necesario)
-- ==========================================================
-- Los cursos ya tienen la relación correcta con rut_persona
-- No es necesario cambiar nada aquí

-- PASO 7: Crear vista para compatibilidad (opcional)
-- ===================================================
CREATE OR REPLACE VIEW mantenimiento.personal_disponible_view AS
SELECT 
    p.rut,
    p.nombre,
    p.sexo,
    p.fecha_nacimiento,
    p.cargo,
    p.estado_id,
    p.comentario_estado,
    p.zona_geografica,
    p.fecha_creacion as created_at,
    p.fecha_actualizacion as updated_at,
    -- Documentos como campos calculados
    (SELECT valor_documento FROM mantenimiento.documentos_personal 
     WHERE rut_persona = p.rut AND tipo_documento = 'licencia_conducir' AND activo = true LIMIT 1) as licencia_conducir,
    (SELECT valor_documento FROM mantenimiento.documentos_personal 
     WHERE rut_persona = p.rut AND tipo_documento = 'talla_zapatos' AND activo = true LIMIT 1) as talla_zapatos,
    (SELECT valor_documento FROM mantenimiento.documentos_personal 
     WHERE rut_persona = p.rut AND tipo_documento = 'talla_pantalones' AND activo = true LIMIT 1) as talla_pantalones,
    (SELECT valor_documento FROM mantenimiento.documentos_personal 
     WHERE rut_persona = p.rut AND tipo_documento = 'talla_poleras' AND activo = true LIMIT 1) as talla_poleras
FROM mantenimiento.personal p
WHERE p.activo = true;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Este script NO elimina la tabla personal_disponible original
-- 2. Se crea una vista para mantener compatibilidad
-- 3. Los endpoints necesitarán ser actualizados para usar las nuevas tablas
-- 4. Se recomienda hacer backup antes de ejecutar
-- 5. Probar en ambiente de desarrollo primero
-- =====================================================




