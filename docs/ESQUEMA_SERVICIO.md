# 🏢 Esquema de Servicio - Estructura Jerárquica

## 📋 Resumen General

**Esquema**: `servicio`  
**Estructura**: Jerárquica en cascada  
**Niveles**: Cartera → Ingeniería de Servicios → Nodos  
**Propósito**: Gestión de servicios con control de cumplimiento según programación

---

## 🎯 Estructura Jerárquica

### **Nivel 1: Carteras**
- **Función**: Agrupación superior de servicios
- **Responsabilidad**: Gestión general de carteras de servicios
- **Ejemplo**: Cartera Norte, Cartera Sur, Cartera Centro

### **Nivel 2: Ingeniería de Servicios**
- **Función**: Ingenieros asignados a cada cartera
- **Responsabilidad**: Asegurar cumplimiento de servicios en sus nodos asignados
- **Especialidades**: Mantenimiento Industrial, Eléctrico, Mecánico, etc.

### **Nivel 3: Nodos**
- **Función**: Puntos de servicio específicos
- **Responsabilidad**: Ejecutar servicios programados
- **Tipos**: Industrial, Eléctrico, Mecánico, Preventivo, Predictivo

---

## 📊 Estructura de Base de Datos

### **1. Tabla `servicio.carteras`**
```sql
CREATE TABLE servicio.carteras (
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
```

**Campos Clave**:
- `codigo`: Identificador único de la cartera
- `responsable`: Persona responsable de la cartera
- `estado`: Estado actual de la cartera

### **2. Tabla `servicio.ingenieria_servicios`**
```sql
CREATE TABLE servicio.ingenieria_servicios (
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
```

**Campos Clave**:
- `cartera_id`: FK a la cartera asignada
- `rut`: Identificador único del ingeniero
- `especialidad`: Área de especialización
- `nivel_experiencia`: senior, intermedio, junior

### **3. Tabla `servicio.nodos`**
```sql
CREATE TABLE servicio.nodos (
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
```

**Campos Clave**:
- `ingeniero_id`: FK al ingeniero responsable
- `codigo`: Identificador único del nodo
- `tipo_nodo`: Tipo de nodo (Industrial, Eléctrico, etc.)
- `prioridad`: alta, media, baja

### **4. Tabla `servicio.servicios_programados`**
```sql
CREATE TABLE servicio.servicios_programados (
    id SERIAL PRIMARY KEY,
    nodo_id INTEGER NOT NULL REFERENCES servicio.nodos(id) ON DELETE CASCADE,
    tipo_servicio VARCHAR(255) NOT NULL,
    descripcion TEXT,
    frecuencia VARCHAR(50) NOT NULL,
    duracion_estimada INTEGER,
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
```

**Campos Clave**:
- `nodo_id`: FK al nodo donde se ejecuta el servicio
- `frecuencia`: diario, semanal, mensual, trimestral, anual
- `fecha_proximo_servicio`: Fecha programada para el próximo servicio
- `estado`: pendiente, en_progreso, completado, cancelado

### **5. Tabla `servicio.historial_servicios`**
```sql
CREATE TABLE servicio.historial_servicios (
    id SERIAL PRIMARY KEY,
    servicio_programado_id INTEGER NOT NULL REFERENCES servicio.servicios_programados(id) ON DELETE CASCADE,
    ingeniero_id INTEGER NOT NULL REFERENCES servicio.ingenieria_servicios(id) ON DELETE CASCADE,
    fecha_ejecucion DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    duracion_real INTEGER,
    estado_ejecucion VARCHAR(50) NOT NULL,
    observaciones TEXT,
    materiales_utilizados TEXT,
    herramientas_utilizadas TEXT,
    problemas_encontrados TEXT,
    soluciones_aplicadas TEXT,
    calificacion_servicio INTEGER CHECK (calificacion_servicio >= 1 AND calificacion_servicio <= 5),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);
```

**Campos Clave**:
- `servicio_programado_id`: FK al servicio programado
- `ingeniero_id`: FK al ingeniero que ejecutó el servicio
- `estado_ejecucion`: completado, parcial, cancelado, reprogramado
- `calificacion_servicio`: Calificación del 1 al 5

---

## 🔗 Relaciones Entre Tablas

### **Diagrama de Relaciones**:
```
servicio.carteras (id)
    │
    ├── servicio.ingenieria_servicios (cartera_id)
    │       │
    │       ├── servicio.nodos (ingeniero_id)
    │       │       │
    │       │       ├── servicio.servicios_programados (nodo_id)
    │       │       │       │
    │       │       │       └── servicio.historial_servicios (servicio_programado_id)
    │       │       │               │
    │       │       │               └── servicio.ingenieria_servicios (ingeniero_id)
    │       │       │
    │       │       └── servicio.historial_servicios (nodo_id)
    │       │
    │       └── servicio.historial_servicios (ingeniero_id)
    │
    └── servicio.ingenieria_servicios (cartera_id)
```

### **Restricciones de Integridad**:
- **CASCADE DELETE**: Al eliminar una cartera, se eliminan todos sus ingenieros y nodos
- **CASCADE DELETE**: Al eliminar un ingeniero, se eliminan todos sus nodos
- **CASCADE DELETE**: Al eliminar un nodo, se eliminan todos sus servicios programados
- **UNIQUE**: Códigos únicos para carteras, RUTs únicos para ingenieros, códigos únicos para nodos

---

## 🌐 Endpoints Disponibles

### **Base URL**: `/api/servicio`

#### **1. Gestión de Carteras**
```
GET    /carteras                    # Listar carteras
GET    /carteras/:id                # Obtener cartera por ID
POST   /carteras                    # Crear nueva cartera
```

#### **2. Gestión de Ingenieros**
```
GET    /ingenieros                  # Listar ingenieros
GET    /ingenieros/:id              # Obtener ingeniero por ID
POST   /ingenieros                  # Crear nuevo ingeniero
```

#### **3. Gestión de Nodos**
```
GET    /nodos                       # Listar nodos
```

#### **4. Estructura y Análisis**
```
GET    /estructura                  # Estructura jerárquica completa
GET    /servicios-vencer            # Servicios próximos a vencer
GET    /estadisticas                # Estadísticas generales
```

---

## 📊 Vistas Útiles

### **1. Vista de Estructura Completa**
```sql
CREATE VIEW servicio.vista_estructura_completa AS
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
```

### **2. Vista de Servicios Próximos a Vencer**
```sql
CREATE VIEW servicio.vista_servicios_vencer AS
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
```

---

## 🎯 Casos de Uso

### **1. Gestión de Carteras**
- **Crear cartera**: Asignar responsable y definir alcance
- **Asignar ingenieros**: Especialistas por área
- **Monitorear cumplimiento**: Servicios por cartera

### **2. Gestión de Ingenieros**
- **Asignar a cartera**: Según especialidad
- **Asignar nodos**: Responsabilidad específica
- **Seguimiento de servicios**: Cumplimiento de programación

### **3. Gestión de Nodos**
- **Crear nodos**: Puntos de servicio específicos
- **Programar servicios**: Frecuencia y tipo
- **Seguimiento de cumplimiento**: Estado de servicios

### **4. Control de Servicios**
- **Servicios próximos a vencer**: Alertas automáticas
- **Historial de servicios**: Trazabilidad completa
- **Estadísticas de cumplimiento**: Métricas por cartera

---

## 📈 Beneficios del Sistema

### **Para la Gestión**:
- **Visibilidad completa**: Estructura jerárquica clara
- **Control de cumplimiento**: Servicios según programación
- **Estadísticas detalladas**: Métricas por cartera y tipo
- **Alertas automáticas**: Servicios próximos a vencer

### **Para los Ingenieros**:
- **Responsabilidad clara**: Nodos asignados específicamente
- **Programación definida**: Servicios con frecuencia establecida
- **Seguimiento de servicios**: Historial completo de ejecución
- **Recursos definidos**: Materiales y herramientas requeridas

### **Para el Sistema**:
- **Estructura normalizada**: Relaciones claras entre entidades
- **Integridad de datos**: Restricciones y validaciones
- **Escalabilidad**: Fácil agregar nuevas carteras y nodos
- **Trazabilidad**: Historial completo de servicios

---

## 🔧 Configuración e Instalación

### **1. Ejecutar Script de Creación**
```bash
# Ejecutar el script SQL
psql -d tu_base_de_datos -f scripts/create-servicio-schema.sql
```

### **2. Verificar Instalación**
```bash
# Verificar tablas creadas
GET /api/servicio/estadisticas

# Verificar estructura
GET /api/servicio/estructura
```

### **3. Datos de Ejemplo**
El script incluye datos de ejemplo:
- 3 carteras (Norte, Sur, Centro)
- 5 ingenieros con diferentes especialidades
- 7 nodos de diferentes tipos
- 8 servicios programados

---

## 📊 Estadísticas del Sistema

- **Total de tablas**: 5
- **Total de vistas**: 2
- **Total de índices**: 20+
- **Total de triggers**: 4
- **Endpoints disponibles**: 10
- **Relaciones FK**: 5
- **Restricciones únicas**: 3

---

**Fecha de creación**: 10 de enero de 2025  
**Versión**: 1.0.0  
**Estado**: ✅ **COMPLETADO Y FUNCIONAL**

El esquema de servicio está **listo para producción** y proporciona una gestión completa y jerárquica de servicios con control de cumplimiento según programación.
