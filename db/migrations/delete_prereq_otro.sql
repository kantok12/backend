-- Eliminar prerrequisitos cuyo tipo_documento es 'otro' (exact match, case-insensitive)
DELETE FROM mantenimiento.cliente_prerrequisitos
WHERE LOWER(TRIM(tipo_documento)) = 'otro';

-- Si quieres revisar antes de borrar, usa:
-- SELECT * FROM mantenimiento.cliente_prerrequisitos WHERE LOWER(TRIM(tipo_documento)) = 'otro';
