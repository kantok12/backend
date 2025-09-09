-- Script de inicialización de la base de datos para el sistema de gestión de personal
-- Ejecutar en Supabase SQL Editor

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rol VARCHAR(50) DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario', 'manager')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    rut_empresa VARCHAR(20) UNIQUE NOT NULL,
    direccion TEXT,
    email VARCHAR(255),
    telefono VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) DEFAULT 0,
    duracion_horas INTEGER,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de ubicaciones
CREATE TABLE IF NOT EXISTS ubicacion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region VARCHAR(100),
    comuna VARCHAR(100),
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de contactos
CREATE TABLE IF NOT EXISTS contacto (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255),
    telefono VARCHAR(50),
    celular VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de contactos de emergencia
CREATE TABLE IF NOT EXISTS contacto_emergencia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(200),
    relacion VARCHAR(100),
    telefono VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de formación
CREATE TABLE IF NOT EXISTS formacion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nivel_educacion VARCHAR(100),
    titulo VARCHAR(200),
    institucion VARCHAR(200),
    fecha_obtencion DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de licencias
CREATE TABLE IF NOT EXISTS licencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo_licencia VARCHAR(100),
    numero_licencia VARCHAR(50),
    fecha_emision DATE,
    fecha_vencimiento DATE,
    estado VARCHAR(50) DEFAULT 'vigente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de condiciones de salud
CREATE TABLE IF NOT EXISTS condicion_salud (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alergias TEXT,
    condiciones_medicas TEXT,
    medicamentos TEXT,
    restricciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de disponibilidad
CREATE TABLE IF NOT EXISTS disponibilidad (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disponible BOOLEAN DEFAULT true,
    horario_inicio TIME,
    horario_fin TIME,
    dias_semana VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla principal de personal
CREATE TABLE IF NOT EXISTS personal_servicio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    cargo VARCHAR(100),
    empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
    servicio_id UUID REFERENCES servicios(id) ON DELETE SET NULL,
    ubicacion_id UUID REFERENCES ubicacion(id) ON DELETE SET NULL,
    contacto_id UUID REFERENCES contacto(id) ON DELETE SET NULL,
    contacto_emergencia_id UUID REFERENCES contacto_emergencia(id) ON DELETE SET NULL,
    formacion_id UUID REFERENCES formacion(id) ON DELETE SET NULL,
    licencias_id UUID REFERENCES licencias(id) ON DELETE SET NULL,
    condicion_salud_id UUID REFERENCES condicion_salud(id) ON DELETE SET NULL,
    disponibilidad_id UUID REFERENCES disponibilidad(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_personal_rut ON personal_servicio(rut);
CREATE INDEX IF NOT EXISTS idx_personal_empresa ON personal_servicio(empresa_id);
CREATE INDEX IF NOT EXISTS idx_personal_servicio ON personal_servicio(servicio_id);
CREATE INDEX IF NOT EXISTS idx_personal_activo ON personal_servicio(activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_empresas_rut ON empresas(rut_empresa);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at BEFORE UPDATE ON servicios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_updated_at BEFORE UPDATE ON personal_servicio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo

-- Usuario administrador
INSERT INTO usuarios (email, password, nombre, apellido, rol) VALUES
('admin@sistema.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', 'Administrador', 'Sistema', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Empresas de ejemplo
INSERT INTO empresas (nombre, rut_empresa, direccion, email, telefono) VALUES
('Empresa Ejemplo 1', '12.345.678-9', 'Av. Principal 123, Santiago', 'contacto@empresa1.com', '+56912345678'),
('Empresa Ejemplo 2', '98.765.432-1', 'Calle Secundaria 456, Valparaíso', 'info@empresa2.com', '+56987654321')
ON CONFLICT (rut_empresa) DO NOTHING;

-- Servicios de ejemplo
INSERT INTO servicios (nombre, descripcion, precio, duracion_horas) VALUES
('Mantenimiento Industrial', 'Servicios de mantenimiento preventivo y correctivo para equipos industriales', 50000, 8),
('Limpieza Profesional', 'Servicios de limpieza para oficinas y espacios comerciales', 25000, 4),
('Seguridad', 'Servicios de vigilancia y control de acceso', 35000, 12)
ON CONFLICT DO NOTHING;

-- Habilitar RLS (Row Level Security) si es necesario
-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE personal_servicio ENABLE ROW LEVEL SECURITY;





















