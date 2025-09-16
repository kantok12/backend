# 🏢 Endpoints del Área de Servicio

## 📋 Resumen General

**Módulo**: Área de Servicio  
**Base URL**: `/api/area-servicio`  
**Métodos**: `GET`  
**Descripción**: Gestión especializada del personal del área de servicio con filtros avanzados y estadísticas detalladas

---

## 🎯 Propósito

Los endpoints del área de servicio están diseñados para:

- **Organizar el personal** por cargos y zonas geográficas
- **Identificar personal disponible** para asignaciones de servicio
- **Generar estadísticas** detalladas del área de servicio
- **Filtrar y buscar** personal de manera eficiente
- **Gestionar recursos humanos** de forma especializada

---

## 📊 Endpoints Disponibles

### 1. **Listar Personal del Área de Servicio**
```
GET /api/area-servicio
```

**Descripción**: Lista todo el personal del área de servicio con filtros avanzados

**Parámetros de Query**:
- `limit` (opcional): Número de registros por página (default: 20)
- `offset` (opcional): Número de registros a omitir (default: 0)
- `search` (opcional): Búsqueda por RUT o nombre
- `estado_id` (opcional): Filtrar por estado específico
- `cargo` (opcional): Filtrar por cargo
- `zona_geografica` (opcional): Filtrar por zona geográfica

**Ejemplo de Respuesta**:
```json
{
  "success": true,
  "message": "Personal del área de servicio obtenido exitosamente",
  "data": [
    {
      "rut": "12345678-9",
      "nombre": "Juan Pérez",
      "sexo": "M",
      "fecha_nacimiento": "1990-01-15",
      "cargo": "Operador",
      "estado_nombre": "Proceso de Activo",
      "estado_descripcion": "Personal en proceso de activación",
      "zona_geografica": "Norte"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 50,
    "hasMore": true
  }
}
```

---

### 2. **Estadísticas del Área de Servicio**
```
GET /api/area-servicio/stats
```

**Descripción**: Obtiene estadísticas detalladas del área de servicio

**Respuesta**:
```json
{
  "success": true,
  "message": "Estadísticas del área de servicio obtenidas exitosamente",
  "data": {
    "general": {
      "total_personal": 50,
      "proceso_activo": 25,
      "acreditacion": 15,
      "inactivo": 5,
      "vacaciones": 5,
      "total_cargos": 8,
      "total_zonas": 4
    },
    "por_cargo": [
      {
        "cargo": "Operador",
        "total": 20,
        "proceso_activo": 10,
        "acreditacion": 6,
        "inactivo": 2,
        "vacaciones": 2
      }
    ],
    "por_zona": [
      {
        "zona": "Norte",
        "total": 15,
        "proceso_activo": 8,
        "acreditacion": 4,
        "inactivo": 2,
        "vacaciones": 1
      }
    ],
    "por_estado": [
      {
        "estado": "Proceso de Activo",
        "descripcion": "Personal en proceso de activación",
        "total": 25
      }
    ]
  }
}
```

---

### 3. **Listar Cargos Disponibles**
```
GET /api/area-servicio/cargos
```

**Descripción**: Lista todos los cargos disponibles con estadísticas

**Respuesta**:
```json
{
  "success": true,
  "message": "Cargos del área de servicio obtenidos exitosamente",
  "data": [
    {
      "cargo": "Operador",
      "total_personal": 20,
      "proceso_activo": 10,
      "acreditacion": 6,
      "inactivo": 2,
      "vacaciones": 2
    },
    {
      "cargo": "Supervisor",
      "total_personal": 8,
      "proceso_activo": 4,
      "acreditacion": 3,
      "inactivo": 1,
      "vacaciones": 0
    }
  ]
}
```

---

### 4. **Listar Zonas Geográficas**
```
GET /api/area-servicio/zonas
```

**Descripción**: Lista todas las zonas geográficas con estadísticas

**Respuesta**:
```json
{
  "success": true,
  "message": "Zonas geográficas del área de servicio obtenidas exitosamente",
  "data": [
    {
      "zona": "Norte",
      "total_personal": 15,
      "proceso_activo": 8,
      "acreditacion": 4,
      "inactivo": 2,
      "vacaciones": 1
    },
    {
      "zona": "Sur",
      "total_personal": 12,
      "proceso_activo": 6,
      "acreditacion": 4,
      "inactivo": 1,
      "vacaciones": 1
    }
  ]
}
```

---

### 5. **Personal por Cargo Específico**
```
GET /api/area-servicio/cargo/:cargo
```

**Descripción**: Obtiene personal de un cargo específico

**Parámetros**:
- `:cargo` (requerido): Nombre del cargo (puede ser parcial)

**Parámetros de Query**:
- `limit` (opcional): Número de registros por página
- `offset` (opcional): Número de registros a omitir
- `estado_id` (opcional): Filtrar por estado

**Ejemplo**:
```
GET /api/area-servicio/cargo/operador?estado_id=1&limit=10
```

---

### 6. **Personal por Zona Geográfica**
```
GET /api/area-servicio/zona/:zona
```

**Descripción**: Obtiene personal de una zona geográfica específica

**Parámetros**:
- `:zona` (requerido): Nombre de la zona (puede ser parcial)

**Parámetros de Query**:
- `limit` (opcional): Número de registros por página
- `offset` (opcional): Número de registros a omitir
- `estado_id` (opcional): Filtrar por estado

**Ejemplo**:
```
GET /api/area-servicio/zona/norte?estado_id=1
```

---

### 7. **Personal Disponible para Servicio**
```
GET /api/area-servicio/disponibles
```

**Descripción**: Obtiene personal disponible para asignaciones de servicio (estados "Proceso de Activo" y "De Acreditación")

**Parámetros de Query**:
- `limit` (opcional): Número de registros por página
- `offset` (opcional): Número de registros a omitir
- `cargo` (opcional): Filtrar por cargo
- `zona_geografica` (opcional): Filtrar por zona

**Ejemplo**:
```
GET /api/area-servicio/disponibles?cargo=operador&zona_geografica=norte
```

---

## 🔍 Casos de Uso Comunes

### **1. Dashboard del Área de Servicio**
```bash
# Obtener estadísticas generales
GET /api/area-servicio/stats

# Obtener personal disponible
GET /api/area-servicio/disponibles?limit=10
```

### **2. Asignación de Personal**
```bash
# Buscar operadores disponibles en zona norte
GET /api/area-servicio/disponibles?cargo=operador&zona_geografica=norte

# Ver todos los supervisores
GET /api/area-servicio/cargo/supervisor
```

### **3. Reportes por Área**
```bash
# Estadísticas por cargo
GET /api/area-servicio/cargos

# Estadísticas por zona
GET /api/area-servicio/zonas

# Personal en proceso de activación
GET /api/area-servicio?estado_id=1
```

### **4. Búsqueda de Personal**
```bash
# Buscar por nombre o RUT
GET /api/area-servicio?search=juan

# Filtrar por múltiples criterios
GET /api/area-servicio?cargo=operador&estado_id=1&zona_geografica=norte
```

---

## 📊 Estados del Personal

Los endpoints del área de servicio trabajan con los siguientes estados:

| ID | Estado | Descripción |
|----|--------|-------------|
| 1 | Proceso de Activo | Personal en proceso de activación |
| 2 | De Acreditación | Personal en proceso de acreditación |
| 3 | Inactivo | Personal temporalmente inactivo |
| 4 | Vacaciones | Personal en período de vacaciones |

**Personal Disponible**: Estados 1 y 2 (Proceso de Activo y De Acreditación)

---

## 🎯 Beneficios de los Endpoints

### **Para Supervisores**:
- **Identificación rápida** de personal disponible
- **Asignación eficiente** por cargo y zona
- **Monitoreo de estados** del personal

### **Para Gestión**:
- **Estadísticas detalladas** para toma de decisiones
- **Visibilidad completa** del área de servicio
- **Reportes organizados** por criterios específicos

### **Para el Sistema**:
- **Filtros optimizados** para consultas eficientes
- **Paginación** para manejo de grandes volúmenes
- **Respuestas estructuradas** y consistentes

---

## 🔧 Integración con Otros Módulos

Los endpoints del área de servicio se integran con:

- **Personal Disponible**: Base de datos del personal
- **Estados**: Gestión de estados del personal
- **Documentos**: Documentos del personal
- **Cursos**: Cursos y certificaciones

---

**Fecha de creación**: 10 de enero de 2025  
**Versión**: 1.2.0  
**Estado**: ✅ Funcional y documentado



