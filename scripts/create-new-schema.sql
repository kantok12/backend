-- =====================================================
-- SCRIPT DE CREACIÓN: Nuevo Esquema de Base de Datos
-- =====================================================
-- Este script crea las tablas del nuevo esquema:
-- carteras, clientes, ubicacion_geografica, nodos
-- =====================================================

-- =====================================================
-- 1. CREAR TABLA carteras
-- =====================================================

CREATE TABLE IF NOT EXISTS carteras (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para carteras
CREATE INDEX IF NOT EXISTS idx_carteras_name ON carteras(name);
CREATE INDEX IF NOT EXISTS idx_carteras_created_at ON carteras(created_at);

-- =====================================================
-- 2. CREAR TABLA ubicacion_geografica
-- =====================================================

CREATE TABLE IF NOT EXISTS ubicacion_geografica (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para ubicacion_geografica
CREATE INDEX IF NOT EXISTS idx_ubicacion_geografica_nombre ON ubicacion_geografica(nombre);
CREATE INDEX IF NOT EXISTS idx_ubicacion_geografica_created_at ON ubicacion_geografica(created_at);

-- =====================================================
-- 3. CREAR TABLA clientes
-- =====================================================

CREATE TABLE IF NOT EXISTS clientes (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    cartera_id BIGINT NOT NULL REFERENCES carteras(id) ON DELETE RESTRICT,
    region_id BIGINT NOT NULL REFERENCES ubicacion_geografica(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nombre, cartera_id) -- Un cliente no puede tener el mismo nombre en la misma cartera
);

-- Crear índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_cartera_id ON clientes(cartera_id);
CREATE INDEX IF NOT EXISTS idx_clientes_region_id ON clientes(region_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes(created_at);

-- =====================================================
-- 4. CREAR TABLA nodos
-- =====================================================

CREATE TABLE IF NOT EXISTS nodos (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nombre, cliente_id) -- Un nodo no puede tener el mismo nombre para el mismo cliente
);

-- Crear índices para nodos
CREATE INDEX IF NOT EXISTS idx_nodos_cliente_id ON nodos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_nodos_nombre ON nodos(nombre);
CREATE INDEX IF NOT EXISTS idx_nodos_created_at ON nodos(created_at);

-- =====================================================
-- 5. INSERTAR DATOS DE EJEMPLO
-- =====================================================

-- Insertar carteras de ejemplo
INSERT INTO carteras (name) VALUES 
    ('Cartera Norte'),
    ('Cartera Sur'),
    ('Cartera Centro')
ON CONFLICT (name) DO NOTHING;

-- Insertar ubicaciones geográficas de ejemplo
INSERT INTO ubicacion_geografica (nombre) VALUES 
    ('Región Metropolitana'),
    ('Región de Valparaíso'),
    ('Región del Biobío'),
    ('Región de Antofagasta'),
    ('Región de Atacama')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar clientes de ejemplo
INSERT INTO clientes (nombre, cartera_id, region_id) VALUES 
    ('Cliente Norte 1', 1, 1),
    ('Cliente Norte 2', 1, 2),
    ('Cliente Sur 1', 2, 3),
    ('Cliente Sur 2', 2, 3),
    ('Cliente Centro 1', 3, 1),
    ('Cliente Centro 2', 3, 2)
ON CONFLICT (nombre, cartera_id) DO NOTHING;

-- Insertar nodos de ejemplo
INSERT INTO nodos (nombre, cliente_id) VALUES 
    ('Nodo Industrial Norte 1', 1),
    ('Nodo Eléctrico Norte 1', 1),
    ('Nodo Mecánico Norte 1', 2),
    ('Nodo Industrial Sur 1', 3),
    ('Nodo Eléctrico Sur 1', 3),
    ('Nodo Mecánico Sur 1', 4),
    ('Nodo Industrial Centro 1', 5),
    ('Nodo Eléctrico Centro 1', 6)
ON CONFLICT (nombre, cliente_id) DO NOTHING;

-- =====================================================
-- 6. CREAR VISTAS ÚTILES
-- =====================================================

-- Vista para estructura jerárquica completa
CREATE OR REPLACE VIEW vista_estructura_completa AS
SELECT 
    c.id as cartera_id,
    c.name as cartera_nombre,
    c.created_at as cartera_created_at,
    cl.id as cliente_id,
    cl.nombre as cliente_nombre,
    cl.created_at as cliente_created_at,
    ug.id as region_id,
    ug.nombre as region_nombre,
    n.id as nodo_id,
    n.nombre as nodo_nombre,
    n.created_at as nodo_created_at
FROM carteras c
LEFT JOIN clientes cl ON c.id = cl.cartera_id
LEFT JOIN ubicacion_geografica ug ON cl.region_id = ug.id
LEFT JOIN nodos n ON cl.id = n.cliente_id
ORDER BY c.name, cl.nombre, n.nombre;

-- Vista para estadísticas generales
CREATE OR REPLACE VIEW vista_estadisticas_generales AS
SELECT 
    (SELECT COUNT(*) FROM carteras) as total_carteras,
    (SELECT COUNT(*) FROM clientes) as total_clientes,
    (SELECT COUNT(*) FROM ubicacion_geografica) as total_regiones,
    (SELECT COUNT(*) FROM nodos) as total_nodos,
    (SELECT COUNT(DISTINCT cartera_id) FROM clientes) as carteras_con_clientes,
    (SELECT COUNT(DISTINCT region_id) FROM clientes) as regiones_con_clientes,
    (SELECT COUNT(DISTINCT cliente_id) FROM nodos) as clientes_con_nodos;

-- =====================================================
-- 7. COMENTARIOS EN TABLAS Y COLUMNAS
-- =====================================================

COMMENT ON TABLE carteras IS 'Tabla de carteras de servicios';
COMMENT ON COLUMN carteras.id IS 'Identificador único de la cartera';
COMMENT ON COLUMN carteras.name IS 'Nombre de la cartera';
COMMENT ON COLUMN carteras.created_at IS 'Fecha de creación del registro';

COMMENT ON TABLE ubicacion_geografica IS 'Tabla de ubicaciones geográficas';
COMMENT ON COLUMN ubicacion_geografica.id IS 'Identificador único de la ubicación';
COMMENT ON COLUMN ubicacion_geografica.nombre IS 'Nombre de la ubicación geográfica';
COMMENT ON COLUMN ubicacion_geografica.created_at IS 'Fecha de creación del registro';

COMMENT ON TABLE clientes IS 'Tabla de clientes';
COMMENT ON COLUMN clientes.id IS 'Identificador único del cliente';
COMMENT ON COLUMN clientes.nombre IS 'Nombre del cliente';
COMMENT ON COLUMN clientes.cartera_id IS 'ID de la cartera a la que pertenece el cliente';
COMMENT ON COLUMN clientes.region_id IS 'ID de la región geográfica del cliente';
COMMENT ON COLUMN clientes.created_at IS 'Fecha de creación del registro';

COMMENT ON TABLE nodos IS 'Tabla de nodos';
COMMENT ON COLUMN nodos.id IS 'Identificador único del nodo';
COMMENT ON COLUMN nodos.nombre IS 'Nombre del nodo';
COMMENT ON COLUMN nodos.cliente_id IS 'ID del cliente al que pertenece el nodo';
COMMENT ON COLUMN nodos.created_at IS 'Fecha de creación del registro';

-- =====================================================
-- 8. VERIFICACIÓN DE CREACIÓN
-- =====================================================

-- Verificar que las tablas fueron creadas
SELECT 
    table_name,
    'CREADA' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('carteras', 'clientes', 'ubicacion_geografica', 'nodos')
ORDER BY table_name;

-- Mostrar resumen de datos insertados
SELECT 
    'DATOS INSERTADOS' as accion,
    (SELECT COUNT(*) FROM carteras) as carteras,
    (SELECT COUNT(*) FROM ubicacion_geografica) as regiones,
    (SELECT COUNT(*) FROM clientes) as clientes,
    (SELECT COUNT(*) FROM nodos) as nodos,
    NOW() as fecha_creacion;

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- 
-- Este script crea un esquema de base de datos con la siguiente estructura:
-- 
-- carteras (1) -> clientes (N)
-- ubicacion_geografica (1) -> clientes (N)
-- clientes (1) -> nodos (N)
-- 
-- Las relaciones están definidas con:
-- - Restricciones de integridad referencial
-- - Índices para optimizar consultas
-- - Datos de ejemplo para pruebas
-- - Vistas útiles para consultas complejas
-- 
-- Para usar este esquema, asegúrate de que:
-- 1. La base de datos PostgreSQL esté ejecutándose
-- 2. Tengas permisos para crear tablas
-- 3. No existan tablas con los mismos nombres
-- 
-- Para ejecutar este script:
-- psql -d tu_base_de_datos -f scripts/create-new-schema.sql
