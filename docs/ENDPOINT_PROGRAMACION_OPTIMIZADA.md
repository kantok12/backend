# 🎯 Endpoint Programación Optimizada - Análisis Detallado

## 📋 Información General

**Endpoint:** `GET /api/programacion-optimizada`  
**URL de ejemplo:** `http://localhost:3000/api/programacion-optimizada?cartera_id=6&fecha_inicio=2024-01-15&fecha_fin=2024-01-21`  
**Propósito:** Obtener programación de personal por cartera y rango de fechas

---

## 🔍 Parámetros de Entrada

### Query Parameters

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `cartera_id` | integer | ✅ Sí | ID de la cartera a consultar | `6` |
| `fecha_inicio` | string | ❌ No | Fecha de inicio del rango (YYYY-MM-DD) | `2024-01-15` |
| `fecha_fin` | string | ❌ No | Fecha de fin del rango (YYYY-MM-DD) | `2024-01-21` |
| `semana` | string | ❌ No | Fecha de inicio de semana (YYYY-MM-DD) | `2024-01-15` |
| `fecha` | string | ❌ No | Fecha específica para obtener su semana | `2024-01-15` |

### 📝 Notas sobre Parámetros

- Si no se proporcionan `fecha_inicio` y `fecha_fin`, el sistema usa la semana actual por defecto
- El parámetro `fecha` calcula automáticamente el rango de la semana que contiene esa fecha
- El parámetro `semana` asume que es el lunes de la semana y calcula hasta el domingo

---

## 📊 Estructura de la Respuesta

### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "data": {
    "cartera": {
      "id": 6,
      "nombre": "BAKERY - CARNES"
    },
    "periodo": {
      "inicio": "2025-10-13",
      "fin": "2025-10-25"
    },
    "programacion": [
      {
        "fecha": "2025-10-13T03:00:00.000Z",
        "dia_semana": "lunes",
        "trabajadores": [
          {
            "id": 1,
            "rut": "20.320.662-3",
            "nombre_persona": "Dilhan Jasson Saavedra Gonzalez",
            "cargo": "Ingeniero de Servicio",
            "cartera_id": "6",
            "nombre_cartera": "BAKERY - CARNES",
            "cliente_id": "28",
            "nombre_cliente": "ACONCAGUA FOODS - BUIN",
            "nodo_id": "1",
            "nombre_nodo": "ACONCAGUA FOODS - BUIN",
            "fecha_trabajo": "2025-10-13T03:00:00.000Z",
            "dia_semana": "lunes",
            "horas_estimadas": 9,
            "horas_reales": null,
            "observaciones": "",
            "estado": "activo",
            "created_at": "2025-10-24T12:26:06.953Z",
            "updated_at": "2025-10-24T12:26:06.953Z"
          }
        ]
      }
    ]
  }
}
```

### Respuesta sin Datos

```json
{
  "success": true,
  "data": {
    "cartera": {
      "id": 6,
      "nombre": "Cartera no encontrada"
    },
    "periodo": {
      "inicio": "2024-01-15",
      "fin": "2024-01-21"
    },
    "programacion": []
  }
}
```

---

## 📋 Descripción Detallada de Campos

### 🏢 Información de Cartera

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer | ID numérico de la cartera |
| `nombre` | string | Nombre de la cartera |

### 📅 Información del Período

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `inicio` | string | Fecha de inicio del rango consultado (YYYY-MM-DD) |
| `fin` | string | Fecha de fin del rango consultado (YYYY-MM-DD) |

### 👥 Programación por Fecha

Cada elemento del array `programacion` contiene:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fecha` | string | Fecha específica de trabajo (ISO 8601) |
| `dia_semana` | string | Día de la semana (lunes, martes, etc.) |
| `trabajadores` | array | Lista de trabajadores asignados para esa fecha |

### 👷 Información de Trabajadores

Cada trabajador en el array `trabajadores` contiene:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer | ID único de la programación |
| `rut` | string | RUT del trabajador |
| `nombre_persona` | string | Nombre completo del trabajador |
| `cargo` | string | Cargo del trabajador |
| `cartera_id` | string | ID de la cartera |
| `nombre_cartera` | string | Nombre de la cartera |
| `cliente_id` | string | ID del cliente asignado |
| `nombre_cliente` | string | Nombre del cliente |
| `nodo_id` | string | ID del nodo de trabajo |
| `nombre_nodo` | string | Nombre del nodo |
| `fecha_trabajo` | string | Fecha específica de trabajo (ISO 8601) |
| `dia_semana` | string | Día de la semana |
| `horas_estimadas` | integer | Horas planificadas para el trabajo |
| `horas_reales` | integer/null | Horas realmente trabajadas (null si no se han registrado) |
| `observaciones` | string | Notas adicionales sobre la programación |
| `estado` | string | Estado de la programación |
| `created_at` | string | Timestamp de creación (ISO 8601) |
| `updated_at` | string | Timestamp de última actualización (ISO 8601) |

---

## 🎯 Estados de Programación

| Estado | Descripción |
|--------|-------------|
| `activo` | Programación activa y en curso |
| `programado` | Programación creada pero no iniciada |
| `completado` | Trabajo completado |
| `cancelado` | Programación cancelada |

---

## 🔧 Códigos de Error

### 400 Bad Request
```json
{
  "success": false,
  "message": "cartera_id es requerido"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Cartera no encontrada"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error al obtener programación",
  "error": "Detalles del error"
}
```

---

## 🚀 Características Especiales

### ✅ Ventajas del Sistema Optimizado

1. **📅 Fechas Específicas**: Cada día tiene una fecha exacta en lugar de días booleanos
2. **🔍 Filtros Avanzados**: Consultas por rango de fechas precisas
3. **📊 Agrupación Inteligente**: Los trabajadores se agrupan por fecha de trabajo
4. **⏰ Seguimiento de Horas**: Horas estimadas vs reales trabajadas
5. **🔄 Flexibilidad Total**: Permite programar días específicos fuera de la semana estándar
6. **📋 Información Completa**: Incluye datos de persona, cartera, cliente y nodo
7. **🎯 Selección Múltiple**: Un usuario puede estar asignado a múltiples días simultáneamente

### 🛡️ Validaciones y Seguridad

- ✅ **Validación de cartera**: Verifica que la cartera existe
- ✅ **Validación de fechas**: Maneja rangos de fechas correctamente
- ✅ **Restricción única**: No permite duplicados por RUT + cartera + fecha específica
- ✅ **Historial completo**: Registra todas las operaciones
- ✅ **Selección múltiple**: Permite asignaciones en múltiples días de la misma semana

---

## 📝 Ejemplos de Uso

### 1. Consultar Programación de una Semana
```http
GET /api/programacion-optimizada?cartera_id=6&fecha_inicio=2025-10-13&fecha_fin=2025-10-19
```

### 2. Consultar Programación de un Mes
```http
GET /api/programacion-optimizada?cartera_id=6&fecha_inicio=2025-10-01&fecha_fin=2025-10-31
```

### 3. Consultar Semana Actual (sin parámetros de fecha)
```http
GET /api/programacion-optimizada?cartera_id=6
```

### 4. Consultar Semana de una Fecha Específica
```http
GET /api/programacion-optimizada?cartera_id=6&fecha=2025-10-15
```

---

## 🔍 Casos de Uso Comunes

### 📊 Dashboard de Programación
- Mostrar programación semanal/mensual por cartera
- Visualizar trabajadores asignados por fecha
- Seguimiento de horas estimadas vs reales
- **NUEVO**: Ver usuarios asignados a múltiples días

### 👥 Gestión de Personal
- Verificar disponibilidad de trabajadores
- Planificar asignaciones por cliente/nodo
- Revisar estados de programación
- **NUEVO**: Asignar usuarios a múltiples días de la semana

### 📈 Reportes y Análisis
- Generar reportes de programación por período
- Analizar distribución de personal por cartera
- Seguimiento de cumplimiento de horarios
- **NUEVO**: Análisis de patrones de trabajo múltiples días

---

## ⚠️ Notas Importantes

1. **Formato de Fechas**: Todas las fechas se manejan en formato ISO 8601 (YYYY-MM-DD)
2. **Zona Horaria**: Las fechas se almacenan en UTC y se convierten según la zona horaria local
3. **Datos Vacíos**: Si no hay programación para el período consultado, el array `programacion` estará vacío
4. **Nombres de Cartera**: Si no hay datos de programación, el nombre de la cartera puede mostrar "Cartera no encontrada"
5. **Relaciones**: El endpoint hace JOIN con las tablas de personal, carteras, clientes y nodos
6. **Selección Múltiple**: Un usuario puede aparecer en múltiples fechas de la misma semana

---

## 🔄 Diferencias con el Sistema Anterior

| Característica | Sistema Anterior | Sistema Optimizado |
|----------------|------------------|-------------------|
| **Fechas** | Días booleanos (lunes, martes, etc.) | Fechas específicas (2025-10-13) |
| **Filtros** | Solo por semana | Por rango de fechas exactas |
| **Agrupación** | Por persona | Por fecha de trabajo |
| **Flexibilidad** | Solo semanas completas | Días específicos |
| **Seguimiento** | Básico | Horas estimadas vs reales |
| **Selección Múltiple** | ❌ No permitido | ✅ Permitido |

---

## 🎯 **NUEVA FUNCIONALIDAD: Selección Múltiple de Días**

### 📋 **¿Qué es la Selección Múltiple?**

La nueva funcionalidad permite que **un mismo usuario pueda estar asignado a múltiples días de la semana simultáneamente**.

### 🔄 **Antes vs Después**

#### **Antes (Limitado):**
```javascript
// Un usuario solo podía estar en UN día por semana
{
  "rut": "20320662-3",
  "lunes": true,    // ← Solo podía estar en lunes
  "martes": false,  // ← No podía estar en martes al mismo tiempo
  "miercoles": false
}
```

#### **Después (Flexible):**
```javascript
// Un usuario puede estar en MÚLTIPLES días por semana
{
  "rut": "20320662-3",
  "lunes": true,    // ← Puede estar en lunes
  "martes": true,   // ← Y también en martes
  "miercoles": true, // ← Y también en miércoles
  "viernes": true   // ← Y también en viernes
}
```

### 🎯 **Casos de Uso de Selección Múltiple**

#### **1. Trabajador de Tiempo Completo**
```javascript
// Trabaja todos los días laborales
{
  "lunes": true,
  "martes": true,
  "miercoles": true,
  "jueves": true,
  "viernes": true,
  "sabado": false,
  "domingo": false
}
```

#### **2. Trabajador de Tiempo Parcial**
```javascript
// Trabaja solo algunos días
{
  "lunes": true,
  "martes": false,
  "miercoles": true,
  "jueves": false,
  "viernes": true,
  "sabado": false,
  "domingo": false
}
```

#### **3. Trabajador de Fines de Semana**
```javascript
// Solo trabaja fines de semana
{
  "lunes": false,
  "martes": false,
  "miercoles": false,
  "jueves": false,
  "viernes": false,
  "sabado": true,
  "domingo": true
}
```

### 🔧 **Implementación Técnica**

#### **Base de Datos:**
- ✅ **Restricción modificada**: `UNIQUE (rut, cartera_id, semana_inicio, dia_semana)`
- ✅ **Múltiples registros**: Un registro por cada día asignado
- ✅ **Eliminación previa**: Se eliminan asignaciones existentes antes de crear nuevas

#### **Endpoint POST:**
```javascript
// Crea un registro por cada día seleccionado
{
  "rut": "20320662-3",
  "cartera_id": 6,
  "semana_inicio": "2025-01-27",
  "lunes": true,
  "martes": true,
  "miercoles": true,
  "jueves": false,
  "viernes": false,
  "sabado": false,
  "domingo": false
}

// Respuesta:
{
  "success": true,
  "data": {
    "asignaciones": [
      { "id": 9, "dia": "lunes", "action": "created" },
      { "id": 10, "dia": "martes", "action": "created" },
      { "id": 11, "dia": "miercoles", "action": "created" }
    ],
    "dias_seleccionados": ["lunes", "martes", "miercoles"],
    "message": "Programación creada: 3 días asignados"
  }
}
```

#### **Endpoint GET:**
```javascript
// Agrupa múltiples registros por persona
{
  "success": true,
  "data": {
    "programacion": [
      {
        "rut": "20320662-3",
        "nombre_persona": "data ss",
        "lunes": true,    // ← Múltiples días asignados
        "martes": true,
        "miercoles": true,
        "jueves": false,
        "viernes": false,
        "sabado": false,
        "domingo": false
      }
    ]
  }
}
```

### ✅ **Beneficios de la Selección Múltiple**

1. **🎯 Flexibilidad Total**: Cualquier combinación de días es posible
2. **👥 Mejor Gestión**: Planificación más precisa del personal
3. **📊 Optimización**: Mejor uso de recursos humanos
4. **🔄 Actualización Fácil**: Cambiar días sin perder otros
5. **📱 UX Mejorada**: Los botones muestran estado correcto
6. **💾 Persistencia**: Los datos se mantienen después de recargar

### 🚀 **Para el Frontend**

El frontend puede usar **cualquier combinación** de días sin cambios en el código:

```typescript
// El código existente sigue funcionando igual
const handleAsignarDia = (dia: string, rut: string) => {
  const diaKey = dia.toLowerCase() as keyof typeof programacion;
  setProgramacion(prev => ({
    ...prev,
    [diaKey]: !prev[diaKey]
  }));
};

// Ahora puede manejar múltiples días simultáneamente
const estaAsignado = programacion.lunes || programacion.martes || 
                    programacion.miercoles || programacion.jueves || 
                    programacion.viernes || programacion.sabado || 
                    programacion.domingo;
```

---

**Última actualización**: 27 de Octubre, 2025  
**Versión del endpoint**: 2.0.0 (con Selección Múltiple)  
**Nueva funcionalidad**: ✅ Selección Múltiple de Días por Usuario