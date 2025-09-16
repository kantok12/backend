-- =====================================================
-- SCRIPT DE LIMPIEZA: Eliminar tablas obsoletas
-- =====================================================
-- Este script elimina las tablas que ya no se necesitan
-- después de la migración a la nueva estructura de documentos

-- =====================================================
-- 1. VERIFICAR DATOS ANTES DE ELIMINAR
-- =====================================================

-- Verificar registros en cursos_documentos
SELECT 
    'cursos_documentos' as tabla,
    COUNT(*) as registros_totales,
    COUNT(CASE WHEN activo = true THEN 1 END) as registros_activos
FROM mantenimiento.cursos_documentos;

-- Verificar registros en cursos_certificaciones
SELECT 
    'cursos_certificaciones' as tabla,
    COUNT(*) as registros_totales
FROM mantenimiento.cursos_certificaciones;

-- Verificar registros migrados en documentos
SELECT 
    'documentos' as tabla,
    COUNT(*) as registros_totales,
    COUNT(CASE WHEN activo = true THEN 1 END) as registros_activos
FROM mantenimiento.documentos;

-- =====================================================
-- 2. ELIMINAR TABLA cursos_documentos
-- =====================================================

-- Eliminar índices primero
DROP INDEX IF EXISTS mantenimiento.idx_cursos_documentos_curso_id;
DROP INDEX IF EXISTS mantenimiento.idx_cursos_documentos_activo;
DROP INDEX IF EXISTS mantenimiento.idx_cursos_documentos_fecha;

-- Eliminar tabla
DROP TABLE IF EXISTS mantenimiento.cursos_documentos;

-- =====================================================
-- 3. ELIMINAR TABLA cursos_certificaciones
-- =====================================================

-- Eliminar índices primero
DROP INDEX IF EXISTS mantenimiento.idx_cursos_rut;

-- Eliminar tabla
DROP TABLE IF EXISTS mantenimiento.cursos_certificaciones;

-- =====================================================
-- 4. VERIFICAR ELIMINACIÓN
-- =====================================================

-- Verificar que las tablas fueron eliminadas
SELECT 
    table_name,
    'ELIMINADA' as estado
FROM information_schema.tables 
WHERE table_schema = 'mantenimiento' 
AND table_name IN ('cursos_documentos', 'cursos_certificaciones');

-- Verificar tablas restantes en el esquema mantenimiento
SELECT 
    table_name,
    'ACTIVA' as estado
FROM information_schema.tables 
WHERE table_schema = 'mantenimiento'
ORDER BY table_name;

-- =====================================================
-- 5. COMENTARIOS FINALES
-- =====================================================

-- Mostrar resumen de la limpieza
SELECT 
    'LIMPIEZA COMPLETADA' as accion,
    'Tablas cursos_documentos y cursos_certificaciones eliminadas' as descripcion,
    NOW() as fecha_limpieza;

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- 
-- IMPORTANTE: Este script elimina permanentemente las tablas
-- cursos_documentos y cursos_certificaciones.
-- 
-- Asegúrate de que:
-- 1. Los datos fueron migrados correctamente a la tabla documentos
-- 2. Todos los endpoints están funcionando con la nueva estructura
-- 3. No hay aplicaciones que dependan de estas tablas
-- 
-- Si necesitas recuperar los datos, tendrás que restaurar desde backup.



