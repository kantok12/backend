-- =====================================================
-- ESQUEMA DE SERVICIO - ESTRUCTURA JERÁRQUICA
-- =====================================================
-- Estructura: Cartera → Ingeniería de Servicios → Nodos
-- Los ingenieros de servicios se aseguran que cada nodo tenga 
-- todos sus servicios cumplidos según su programación

-- Crear esquema servicio si no existe
CREATE SCHEMA IF NOT EXISTS servicio;

-- =====================================================
-- 1. TABLA CARTEAS
-- =====================================================
-- Nivel superior: Carteras de servicios
CREATE TABLE IF NOT EXISTS servicio.carteras (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    responsable VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    estado VARCHAR(50) DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- =====================================================
-- 2. TABLA INGENIERIA DE SERVICIOS
-- =====================================================
-- Nivel intermedio: Ingenieros de servicios por cartera
CREATE TABLE IF NOT EXISTS servicio.ingenieria_servicios (
    id SERIAL PRIMARY KEY,
    cartera_id INTEGER NOT NULL REFERENCES servicio.carteras(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    especialidad VARCHAR(255),
    nivel_experiencia VARCHAR(50) DEFAULT 'intermedio',
    fecha_ingreso DATE,
    estado VARCHAR(50) DEFAULT 'activo',
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- =====================================================
-- 3. TABLA NODOS
-- =====================================================
-- Nivel inferior: Nodos de servicio asignados a ingenieros
CREATE TABLE IF NOT EXISTS servicio.nodos (
    id SERIAL PRIMARY KEY,
    ingeniero_id INTEGER NOT NULL REFERENCES servicio.ingenieria_servicios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    tipo_nodo VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255),
    direccion TEXT,
    coordenadas_lat DECIMAL(10, 8),
    coordenadas_lng DECIMAL(11, 8),
    estado VARCHAR(50) DEFAULT 'activo',
    prioridad VARCHAR(20) DEFAULT 'media',
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- =====================================================
-- 4. TABLA SERVICIOS PROGRAMADOS
-- =====================================================
-- Servicios que deben cumplirse en cada nodo
CREATE TABLE IF NOT EXISTS servicio.servicios_programados (
    id SERIAL PRIMARY KEY,
    nodo_id INTEGER NOT NULL REFERENCES servicio.nodos(id) ON DELETE CASCADE,
    tipo_servicio VARCHAR(255) NOT NULL,
    descripcion TEXT,
    frecuencia VARCHAR(50) NOT NULL, -- diario, semanal, mensual, trimestral, anual
    duracion_estimada INTEGER, -- en minutos
    materiales_requeridos TEXT,
    herramientas_requeridas TEXT,
    procedimiento TEXT,
    fecha_ultimo_servicio DATE,
    fecha_proximo_servicio DATE,
    estado VARCHAR(50) DEFAULT 'pendiente',
    prioridad VARCHAR(20) DEFAULT 'media',
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- =====================================================
-- 5. TABLA HISTORIAL DE SERVICIOS
-- =====================================================
-- Registro de servicios ejecutados
CREATE TABLE IF NOT EXISTS servicio.historial_servicios (
    id SERIAL PRIMARY KEY,
    servicio_programado_id INTEGER NOT NULL REFERENCES servicio.servicios_programados(id) ON DELETE CASCADE,
    ingeniero_id INTEGER NOT NULL REFERENCES servicio.ingenieria_servicios(id) ON DELETE CASCADE,
    fecha_ejecucion DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    duracion_real INTEGER, -- en minutos
    estado_ejecucion VARCHAR(50) NOT NULL, -- completado, parcial, cancelado, reprogramado
    observaciones TEXT,
    materiales_utilizados TEXT,
    herramientas_utilizadas TEXT,
    problemas_encontrados TEXT,
    soluciones_aplicadas TEXT,
    calificacion_servicio INTEGER CHECK (calificacion_servicio >= 1 AND calificacion_servicio <= 5),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para carteras
CREATE INDEX IF NOT EXISTS idx_carteras_codigo ON servicio.carteras(codigo);
CREATE INDEX IF NOT EXISTS idx_carteras_estado ON servicio.carteras(estado);
CREATE INDEX IF NOT EXISTS idx_carteras_activo ON servicio.carteras(activo);

-- Índices para ingeniería de servicios
CREATE INDEX IF NOT EXISTS idx_ingenieria_cartera ON servicio.ingenieria_servicios(cartera_id);
CREATE INDEX IF NOT EXISTS idx_ingenieria_rut ON servicio.ingenieria_servicios(rut);
CREATE INDEX IF NOT EXISTS idx_ingenieria_estado ON servicio.ingenieria_servicios(estado);
CREATE INDEX IF NOT EXISTS idx_ingenieria_activo ON servicio.ingenieria_servicios(activo);

-- Índices para nodos
CREATE INDEX IF NOT EXISTS idx_nodos_ingeniero ON servicio.nodos(ingeniero_id);
CREATE INDEX IF NOT EXISTS idx_nodos_codigo ON servicio.nodos(codigo);
CREATE INDEX IF NOT EXISTS idx_nodos_tipo ON servicio.nodos(tipo_nodo);
CREATE INDEX IF NOT EXISTS idx_nodos_estado ON servicio.nodos(estado);
CREATE INDEX IF NOT EXISTS idx_nodos_activo ON servicio.nodos(activo);

-- Índices para servicios programados
CREATE INDEX IF NOT EXISTS idx_servicios_nodo ON servicio.servicios_programados(nodo_id);
CREATE INDEX IF NOT EXISTS idx_servicios_tipo ON servicio.servicios_programados(tipo_servicio);
CREATE INDEX IF NOT EXISTS idx_servicios_frecuencia ON servicio.servicios_programados(frecuencia);
CREATE INDEX IF NOT EXISTS idx_servicios_fecha_proximo ON servicio.servicios_programados(fecha_proximo_servicio);
CREATE INDEX IF NOT EXISTS idx_servicios_estado ON servicio.servicios_programados(estado);
CREATE INDEX IF NOT EXISTS idx_servicios_activo ON servicio.servicios_programados(activo);

-- Índices para historial de servicios
CREATE INDEX IF NOT EXISTS idx_historial_servicio ON servicio.historial_servicios(servicio_programado_id);
CREATE INDEX IF NOT EXISTS idx_historial_ingeniero ON servicio.historial_servicios(ingeniero_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON servicio.historial_servicios(fecha_ejecucion);
CREATE INDEX IF NOT EXISTS idx_historial_estado ON servicio.historial_servicios(estado_ejecucion);
CREATE INDEX IF NOT EXISTS idx_historial_activo ON servicio.historial_servicios(activo);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION servicio.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar fecha_actualizacion
CREATE TRIGGER update_carteras_updated_at 
    BEFORE UPDATE ON servicio.carteras
    FOR EACH ROW EXECUTE FUNCTION servicio.update_updated_at_column();

CREATE TRIGGER update_ingenieria_updated_at 
    BEFORE UPDATE ON servicio.ingenieria_servicios
    FOR EACH ROW EXECUTE FUNCTION servicio.update_updated_at_column();

CREATE TRIGGER update_nodos_updated_at 
    BEFORE UPDATE ON servicio.nodos
    FOR EACH ROW EXECUTE FUNCTION servicio.update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at 
    BEFORE UPDATE ON servicio.servicios_programados
    FOR EACH ROW EXECUTE FUNCTION servicio.update_updated_at_column();

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

-- Insertar carteras de ejemplo
INSERT INTO servicio.carteras (nombre, descripcion, codigo, responsable, telefono, email) VALUES
('Cartera Norte', 'Servicios de mantenimiento para la zona norte', 'CN001', 'María González', '+56912345678', 'maria.gonzalez@empresa.com'),
('Cartera Sur', 'Servicios de mantenimiento para la zona sur', 'CS001', 'Carlos Rodríguez', '+56987654321', 'carlos.rodriguez@empresa.com'),
('Cartera Centro', 'Servicios de mantenimiento para la zona centro', 'CC001', 'Ana Martínez', '+56911223344', 'ana.martinez@empresa.com');

-- Insertar ingenieros de servicios
INSERT INTO servicio.ingenieria_servicios (cartera_id, nombre, apellido, rut, telefono, email, especialidad, nivel_experiencia) VALUES
(1, 'Juan', 'Pérez', '12345678-9', '+56911111111', 'juan.perez@empresa.com', 'Mantenimiento Industrial', 'senior'),
(1, 'Pedro', 'García', '23456789-0', '+56922222222', 'pedro.garcia@empresa.com', 'Mantenimiento Eléctrico', 'intermedio'),
(2, 'Luis', 'Martín', '34567890-1', '+56933333333', 'luis.martin@empresa.com', 'Mantenimiento Mecánico', 'senior'),
(2, 'Miguel', 'López', '45678901-2', '+56944444444', 'miguel.lopez@empresa.com', 'Mantenimiento Preventivo', 'intermedio'),
(3, 'Roberto', 'Hernández', '56789012-3', '+56955555555', 'roberto.hernandez@empresa.com', 'Mantenimiento Predictivo', 'senior');

-- Insertar nodos
INSERT INTO servicio.nodos (ingeniero_id, nombre, codigo, tipo_nodo, ubicacion, direccion, prioridad) VALUES
(1, 'Nodo Industrial Norte 1', 'NIN001', 'Industrial', 'Zona Norte', 'Av. Industrial 123, Santiago', 'alta'),
(1, 'Nodo Industrial Norte 2', 'NIN002', 'Industrial', 'Zona Norte', 'Av. Industrial 456, Santiago', 'media'),
(2, 'Nodo Eléctrico Norte 1', 'NEN001', 'Eléctrico', 'Zona Norte', 'Av. Eléctrica 789, Santiago', 'alta'),
(3, 'Nodo Mecánico Sur 1', 'NMS001', 'Mecánico', 'Zona Sur', 'Av. Mecánica 321, Santiago', 'alta'),
(3, 'Nodo Mecánico Sur 2', 'NMS002', 'Mecánico', 'Zona Sur', 'Av. Mecánica 654, Santiago', 'media'),
(4, 'Nodo Preventivo Sur 1', 'NPS001', 'Preventivo', 'Zona Sur', 'Av. Preventiva 987, Santiago', 'baja'),
(5, 'Nodo Predictivo Centro 1', 'NPC001', 'Predictivo', 'Zona Centro', 'Av. Predictiva 147, Santiago', 'alta');

-- Insertar servicios programados
INSERT INTO servicio.servicios_programados (nodo_id, tipo_servicio, descripcion, frecuencia, duracion_estimada, fecha_proximo_servicio, prioridad) VALUES
(1, 'Mantenimiento Preventivo', 'Revisión general de equipos industriales', 'semanal', 120, CURRENT_DATE + INTERVAL '3 days', 'alta'),
(1, 'Limpieza de Equipos', 'Limpieza profunda de maquinaria', 'mensual', 180, CURRENT_DATE + INTERVAL '15 days', 'media'),
(2, 'Inspección Visual', 'Inspección visual de equipos', 'diario', 30, CURRENT_DATE + INTERVAL '1 day', 'alta'),
(3, 'Mantenimiento Eléctrico', 'Revisión de sistemas eléctricos', 'semanal', 90, CURRENT_DATE + INTERVAL '2 days', 'alta'),
(4, 'Mantenimiento Mecánico', 'Revisión de sistemas mecánicos', 'semanal', 150, CURRENT_DATE + INTERVAL '4 days', 'alta'),
(5, 'Calibración', 'Calibración de instrumentos', 'mensual', 60, CURRENT_DATE + INTERVAL '20 days', 'media'),
(6, 'Inspección Preventiva', 'Inspección general preventiva', 'trimestral', 240, CURRENT_DATE + INTERVAL '45 days', 'baja'),
(7, 'Análisis Predictivo', 'Análisis de tendencias y predicciones', 'mensual', 120, CURRENT_DATE + INTERVAL '10 days', 'alta');

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE servicio.carteras IS 'Carteras de servicios - Nivel superior de la jerarquía';
COMMENT ON TABLE servicio.ingenieria_servicios IS 'Ingenieros de servicios - Nivel intermedio, asignados a carteras';
COMMENT ON TABLE servicio.nodos IS 'Nodos de servicio - Nivel inferior, asignados a ingenieros';
COMMENT ON TABLE servicio.servicios_programados IS 'Servicios programados para cada nodo';
COMMENT ON TABLE servicio.historial_servicios IS 'Historial de servicios ejecutados';

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para obtener la estructura completa jerárquica
CREATE OR REPLACE VIEW servicio.vista_estructura_completa AS
SELECT 
    c.id as cartera_id,
    c.nombre as cartera_nombre,
    c.codigo as cartera_codigo,
    c.responsable as cartera_responsable,
    i.id as ingeniero_id,
    i.nombre as ingeniero_nombre,
    i.apellido as ingeniero_apellido,
    i.rut as ingeniero_rut,
    i.especialidad,
    n.id as nodo_id,
    n.nombre as nodo_nombre,
    n.codigo as nodo_codigo,
    n.tipo_nodo,
    n.ubicacion,
    n.prioridad as nodo_prioridad,
    COUNT(sp.id) as total_servicios_programados,
    COUNT(CASE WHEN sp.estado = 'pendiente' THEN 1 END) as servicios_pendientes,
    COUNT(CASE WHEN sp.fecha_proximo_servicio <= CURRENT_DATE THEN 1 END) as servicios_vencidos
FROM servicio.carteras c
LEFT JOIN servicio.ingenieria_servicios i ON c.id = i.cartera_id AND i.activo = true
LEFT JOIN servicio.nodos n ON i.id = n.ingeniero_id AND n.activo = true
LEFT JOIN servicio.servicios_programados sp ON n.id = sp.nodo_id AND sp.activo = true
WHERE c.activo = true
GROUP BY c.id, c.nombre, c.codigo, c.responsable, i.id, i.nombre, i.apellido, i.rut, i.especialidad, n.id, n.nombre, n.codigo, n.tipo_nodo, n.ubicacion, n.prioridad
ORDER BY c.nombre, i.nombre, n.nombre;

-- Vista para servicios próximos a vencer
CREATE OR REPLACE VIEW servicio.vista_servicios_vencer AS
SELECT 
    c.nombre as cartera,
    i.nombre || ' ' || i.apellido as ingeniero,
    n.nombre as nodo,
    n.codigo as nodo_codigo,
    sp.tipo_servicio,
    sp.descripcion,
    sp.fecha_proximo_servicio,
    sp.prioridad,
    CASE 
        WHEN sp.fecha_proximo_servicio < CURRENT_DATE THEN 'VENCIDO'
        WHEN sp.fecha_proximo_servicio = CURRENT_DATE THEN 'HOY'
        WHEN sp.fecha_proximo_servicio <= CURRENT_DATE + INTERVAL '3 days' THEN 'PRÓXIMO'
        ELSE 'PROGRAMADO'
    END as estado_urgencia
FROM servicio.servicios_programados sp
JOIN servicio.nodos n ON sp.nodo_id = n.id
JOIN servicio.ingenieria_servicios i ON n.ingeniero_id = i.id
JOIN servicio.carteras c ON i.cartera_id = c.id
WHERE sp.activo = true 
    AND sp.estado = 'pendiente'
    AND sp.fecha_proximo_servicio <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY sp.fecha_proximo_servicio ASC, sp.prioridad DESC;

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'ESQUEMA DE SERVICIO CREADO EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '- servicio.carteras';
    RAISE NOTICE '- servicio.ingenieria_servicios';
    RAISE NOTICE '- servicio.nodos';
    RAISE NOTICE '- servicio.servicios_programados';
    RAISE NOTICE '- servicio.historial_servicios';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Vistas creadas:';
    RAISE NOTICE '- servicio.vista_estructura_completa';
    RAISE NOTICE '- servicio.vista_servicios_vencer';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Datos de ejemplo insertados';
    RAISE NOTICE '=====================================================';
END $$;



