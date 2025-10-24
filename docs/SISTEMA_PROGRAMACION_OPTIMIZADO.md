# 🚀 Sistema de Programación Optimizado

## 🎯 **Objetivo**
Optimizar el sistema de programación para mejorar la administración, permitir fechas específicas de lunes a viernes y facilitar la identificación de días de trabajo.

## 🔍 **Problemas Solucionados**

### **Sistema Anterior:**
- ❌ Campos booleanos genéricos (lunes, martes, etc.)
- ❌ No se podían identificar fechas específicas
- ❌ Dificultad en administración y consultas
- ❌ Limitaciones en filtros por fechas
- ❌ Problemas de sincronización

### **Sistema Optimizado:**
- ✅ **Fechas específicas** para cada día de trabajo
- ✅ **Identificación clara** de días de la semana
- ✅ **Mejor administración** y consultas
- ✅ **Filtros avanzados** por fechas
- ✅ **Vista de calendario** mensual
- ✅ **Compatibilidad** con sistema anterior

## 🏗️ **Arquitectura del Sistema**

### **1. Tabla Principal: `mantenimiento.programacion_optimizada`**

```sql
CREATE TABLE mantenimiento.programacion_optimizada (
  id SERIAL PRIMARY KEY,
  rut VARCHAR(20) NOT NULL,
  cartera_id BIGINT NOT NULL,
  cliente_id BIGINT,
  nodo_id BIGINT,
  fecha_trabajo DATE NOT NULL,           -- 🆕 Fecha específica
  dia_semana VARCHAR(10) NOT NULL,       -- 🆕 Nombre del día
  horas_estimadas INTEGER DEFAULT 8,
  horas_reales INTEGER,                  -- 🆕 Horas reales trabajadas
  observaciones TEXT,
  estado VARCHAR(20) DEFAULT 'programado',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'sistema',
  UNIQUE (rut, cartera_id, fecha_trabajo) -- 🆕 Unicidad por fecha
);
```

### **2. Tabla de Semanas: `mantenimiento.semanas_trabajo`**

```sql
CREATE TABLE mantenimiento.semanas_trabajo (
  id SERIAL PRIMARY KEY,
  semana_inicio DATE NOT NULL,
  semana_fin DATE NOT NULL,
  año INTEGER NOT NULL,
  semana_numero INTEGER NOT NULL,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (semana_inicio, semana_fin)
);
```

### **3. Historial Optimizado: `mantenimiento.programacion_historial_optimizado`**

```sql
CREATE TABLE mantenimiento.programacion_historial_optimizado (
  id SERIAL PRIMARY KEY,
  programacion_id INTEGER NOT NULL,
  rut VARCHAR(20) NOT NULL,
  cartera_id BIGINT NOT NULL,
  fecha_trabajo DATE NOT NULL,           -- 🆕 Fecha específica
  accion VARCHAR(20) NOT NULL,
  cambios JSONB,
  fecha_accion TIMESTAMP DEFAULT NOW(),
  usuario VARCHAR(50) DEFAULT 'sistema'
);
```

## 🔧 **Funciones de Base de Datos**

### **1. Función para Obtener Fechas de Semana**
```sql
CREATE OR REPLACE FUNCTION get_week_dates(input_date DATE)
RETURNS TABLE(
  lunes DATE,
  martes DATE,
  miercoles DATE,
  jueves DATE,
  viernes DATE,
  sabado DATE,
  domingo DATE
) AS $$
-- Calcula automáticamente las fechas de lunes a domingo
```

### **2. Función para Obtener Nombre del Día**
```sql
CREATE OR REPLACE FUNCTION get_day_name(input_date DATE)
RETURNS VARCHAR(10) AS $$
-- Retorna el nombre del día (lunes, martes, etc.)
```

## 📡 **Nuevos Endpoints de la API**

### **1. Obtener Programación por Rango de Fechas**
```http
GET /api/programacion-optimizada?cartera_id=1&fecha_inicio=2024-01-15&fecha_fin=2024-01-19
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "cartera": {
      "id": 1,
      "nombre": "Cartera A"
    },
    "periodo": {
      "inicio": "2024-01-15",
      "fin": "2024-01-19"
    },
    "programacion": [
      {
        "fecha": "2024-01-15",
        "dia_semana": "lunes",
        "trabajadores": [
          {
            "id": 1,
            "rut": "12345678-9",
            "nombre_persona": "Juan Pérez",
            "cargo": "Técnico",
            "fecha_trabajo": "2024-01-15",
            "dia_semana": "lunes",
            "horas_estimadas": 8,
            "horas_reales": null,
            "estado": "programado"
          }
        ]
      }
    ]
  }
}
```

### **2. Crear Programación para Fechas Específicas**
```http
POST /api/programacion-optimizada
```

**Body:**
```json
{
  "rut": "12345678-9",
  "cartera_id": 1,
  "cliente_id": 5,
  "nodo_id": 12,
  "fechas_trabajo": [
    "2024-01-15",
    "2024-01-16",
    "2024-01-17"
  ],
  "horas_estimadas": 8,
  "observaciones": "Trabajo en planta",
  "estado": "programado"
}
```

### **3. Crear Programación Semanal**
```http
POST /api/programacion-optimizada/semana
```

**Body:**
```json
{
  "rut": "12345678-9",
  "cartera_id": 1,
  "cliente_id": 5,
  "nodo_id": 12,
  "semana_inicio": "2024-01-15",
  "dias_trabajo": [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes"
  ],
  "horas_estimadas": 8,
  "observaciones": "Semana completa",
  "estado": "programado"
}
```

### **4. Vista de Calendario Mensual**
```http
GET /api/programacion-optimizada/calendario?cartera_id=1&mes=1&año=2024
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "cartera": {
      "id": 1,
      "nombre": "Cartera A"
    },
    "mes": {
      "numero": 1,
      "año": 2024,
      "inicio": "2024-01-01",
      "fin": "2024-01-31"
    },
    "calendario": [
      {
        "fecha": "2024-01-15",
        "dia_semana": "lunes",
        "trabajadores": [...]
      }
    ]
  }
}
```

## 🔄 **Migración y Compatibilidad**

### **1. Migración Automática**
El sistema migra automáticamente los datos existentes:
- ✅ Convierte días booleanos a fechas específicas
- ✅ Mantiene toda la información existente
- ✅ Preserva el historial

### **2. Compatibilidad con Sistema Anterior**
- ✅ **Vista de compatibilidad:** `mantenimiento.programacion_semanal_vista`
- ✅ **Endpoints existentes:** Siguen funcionando
- ✅ **Migración gradual:** Se puede migrar paso a paso

### **3. Vista de Compatibilidad**
```sql
CREATE OR REPLACE VIEW mantenimiento.programacion_semanal_vista AS
SELECT 
  p.id,
  p.rut,
  p.cartera_id,
  p.cliente_id,
  p.nodo_id,
  s.semana_inicio,
  s.semana_fin,
  MAX(CASE WHEN p.dia_semana = 'lunes' THEN true ELSE false END) as lunes,
  MAX(CASE WHEN p.dia_semana = 'martes' THEN true ELSE false END) as martes,
  -- ... resto de días
FROM mantenimiento.programacion_optimizada p
JOIN mantenimiento.semanas_trabajo s ON p.fecha_trabajo BETWEEN s.semana_inicio AND s.semana_fin
GROUP BY p.id, p.rut, p.cartera_id, p.cliente_id, p.nodo_id, s.semana_inicio, s.semana_fin;
```

## 🎯 **Ventajas del Sistema Optimizado**

### **1. Administración Mejorada**
- 📅 **Fechas específicas** en lugar de días genéricos
- 🔍 **Filtros avanzados** por fechas exactas
- 📊 **Vista de calendario** mensual
- 📈 **Mejor seguimiento** de horas reales vs estimadas

### **2. Consultas Optimizadas**
- ⚡ **Índices específicos** por fecha y día
- 🔍 **Búsquedas rápidas** por rango de fechas
- 📊 **Agrupaciones eficientes** por fecha
- 🎯 **Filtros precisos** por día de la semana

### **3. Flexibilidad**
- 📅 **Programación por fechas específicas**
- 🔄 **Programación semanal** automática
- 📊 **Vista de calendario** mensual
- 🎯 **Días específicos** fuera de la semana estándar

### **4. Auditoría Mejorada**
- 📋 **Historial por fecha específica**
- 👤 **Trazabilidad completa** de cambios
- 📅 **Timestamps precisos**
- 🔍 **Búsquedas en historial** por fecha

## 🚀 **Instalación y Configuración**

### **1. Ejecutar Script de Configuración**
```bash
node scripts/setup-optimized-programacion.js
```

### **2. Verificar Instalación**
```bash
# Verificar tablas creadas
psql -d tu_base_datos -c "\dt mantenimiento.programacion_optimizada"

# Verificar funciones
psql -d tu_base_datos -c "\df get_week_dates"

# Verificar vista de compatibilidad
psql -d tu_base_datos -c "\dv mantenimiento.programacion_semanal_vista"
```

### **3. Probar Endpoints**
```bash
# Probar endpoint de programación optimizada
curl http://172.27.232.5:3000/api/programacion-optimizada?cartera_id=1

# Probar endpoint de calendario
curl http://172.27.232.5:3000/api/programacion-optimizada/calendario?cartera_id=1&mes=1&año=2024
```

## 📊 **Ejemplos de Uso**

### **1. Programar Trabajador para Días Específicos**
```javascript
const programacion = await fetch('http://172.27.232.5:3000/api/programacion-optimizada', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    rut: "12345678-9",
    cartera_id: 1,
    fechas_trabajo: [
      "2024-01-15", // Lunes
      "2024-01-17", // Miércoles
      "2024-01-19"  // Viernes
    ],
    horas_estimadas: 8,
    observaciones: "Trabajo en días específicos"
  })
});
```

### **2. Obtener Programación de la Semana**
```javascript
const programacion = await fetch('http://172.27.232.5:3000/api/programacion-optimizada?cartera_id=1&fecha=2024-01-15');
```

### **3. Vista de Calendario Mensual**
```javascript
const calendario = await fetch('http://172.27.232.5:3000/api/programacion-optimizada/calendario?cartera_id=1&mes=1&año=2024');
```

## 🔄 **Migración Gradual**

### **Fase 1: Instalación**
- ✅ Instalar sistema optimizado
- ✅ Migrar datos existentes
- ✅ Mantener compatibilidad

### **Fase 2: Pruebas**
- ✅ Probar nuevos endpoints
- ✅ Verificar funcionalidad
- ✅ Validar datos migrados

### **Fase 3: Adopción**
- ✅ Actualizar frontend
- ✅ Usar nuevos endpoints
- ✅ Mantener sistema anterior como respaldo

### **Fase 4: Migración Completa**
- ✅ Migrar completamente al nuevo sistema
- ✅ Considerar eliminar sistema anterior
- ✅ Optimizar consultas

## ✅ **Checklist de Verificación**

- [ ] Tablas optimizadas creadas
- [ ] Funciones de base de datos instaladas
- [ ] Datos migrados correctamente
- [ ] Endpoints funcionando
- [ ] Vista de compatibilidad operativa
- [ ] Índices creados
- [ ] Triggers funcionando
- [ ] Historial optimizado operativo

## 🎯 **Conclusión**

El sistema de programación optimizado resuelve los problemas de administración del sistema anterior, proporcionando:

- ✅ **Fechas específicas** para cada día de trabajo
- ✅ **Mejor administración** y consultas
- ✅ **Vista de calendario** mensual
- ✅ **Compatibilidad** con el sistema anterior
- ✅ **Migración automática** de datos
- ✅ **Flexibilidad** para programar días específicos

El sistema está listo para uso inmediato y puede coexistir con el sistema anterior durante la transición.

---

**Documento generado para el sistema de programación optimizado**  
**Fecha:** Diciembre 2024  
**Versión:** 2.0.0
