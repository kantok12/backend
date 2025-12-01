-- Migración: Agregar campos para método de subida de documentos en servicios.clientes
-- Fecha: 2025-12-01
-- Propósito: Permitir configurar por cliente cómo/dónde se suben los documentos de prerrequisitos

-- Agregar columnas a servicios.clientes
ALTER TABLE servicios.clientes 
  ADD COLUMN IF NOT EXISTS metodo_subida_documentos VARCHAR(50) DEFAULT 'portal_web',
  ADD COLUMN IF NOT EXISTS config_subida_documentos JSONB DEFAULT '{}';

-- Agregar comentarios para documentación
COMMENT ON COLUMN servicios.clientes.metodo_subida_documentos IS 
  'Método para subir documentos: portal_web, email, carpeta_compartida, plataforma_externa, presencial';
  
COMMENT ON COLUMN servicios.clientes.config_subida_documentos IS 
  'Configuración JSON con detalles específicos del método de subida (rutas, URLs, contactos, etc.)';

-- Crear índice para búsquedas rápidas por método
CREATE INDEX IF NOT EXISTS idx_clientes_metodo_subida 
  ON servicios.clientes(metodo_subida_documentos);

-- Registrar valores por defecto para clientes existentes
UPDATE servicios.clientes 
SET 
  metodo_subida_documentos = 'portal_web',
  config_subida_documentos = jsonb_build_object(
    'descripcion', 'Portal web interno del sistema',
    'url', '/documentos/upload',
    'activo', true
  )
WHERE metodo_subida_documentos IS NULL;

-- Crear tabla de registro de configuraciones (opcional, para auditoría)
CREATE TABLE IF NOT EXISTS servicios.clientes_metodo_subida_historial (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES servicios.clientes(id) ON DELETE CASCADE,
  metodo_anterior VARCHAR(50),
  metodo_nuevo VARCHAR(50),
  config_anterior JSONB,
  config_nueva JSONB,
  usuario_modificacion VARCHAR(255),
  fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para historial
CREATE INDEX IF NOT EXISTS idx_historial_cliente_metodo 
  ON servicios.clientes_metodo_subida_historial(cliente_id, fecha_modificacion DESC);

-- Comentario en tabla de historial
COMMENT ON TABLE servicios.clientes_metodo_subida_historial IS 
  'Historial de cambios en la configuración de métodos de subida de documentos por cliente';
