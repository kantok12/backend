# 🔧 Documentación de Endpoints - Sistema de Mantenimiento

## 🔗 Información General

- **Base URL**: `http://localhost:3000/api`
- **Versión**: 1.0.0
- **Formato de respuesta**: JSON
- **Autenticación**: JWT Bearer Token

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante JWT. Incluye el token en el header:
```
Authorization: Bearer <tu-jwt-token>
```

---

## 📋 Estructura del Sistema de Mantenimiento

El sistema sigue una jerarquía organizacional:
```
Faenas → Plantas → Líneas → Equipos → Componentes → Puntos de Lubricación
```

---

## 🗂️ Endpoints Disponibles

### 1. Estados (`b`)

#### GET /api/estados
Lista todos los estados disponibles para el personal.

**Parámetros de consulta:**
- `limit`: Número máximo de resultados (default: 20)
- `offset`: Número de registros a omitir (default: 0)
- `search`: Buscar por nombre

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Activo",
      "descripcion": "Personal en estado activo",
      "activo": true
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "count": 1
  }
}
```

#### POST /api/estados
Crear un nuevo estado.

**Body:**
```json
{
  "nombre": "Nuevo Estado",
  "descripcion": "Descripción del estado",
  "activo": true
}
```

---

### 2. Faenas (`/api/faenas`)

#### GET /api/faenas
Lista todas las faenas.

#### GET /api/faenas/:id/plantas
Obtiene las plantas de una faena específica.

#### POST /api/faenas
Crear una nueva faena.

**Body:**
```json
{
  "nombre": "Faena Norte",
  "descripcion": "Faena ubicada en el norte"
}
```

---

### 3. Plantas (`/api/plantas`)

#### GET /api/plantas
Lista todas las plantas.

**Parámetros de consulta:**
- `faena_id`: Filtrar por ID de faena
- `search`: Buscar por nombre

#### GET /api/plantas/:id/lineas
Obtiene las líneas de una planta específica.

#### POST /api/plantas
Crear una nueva planta.

**Body:**
```json
{
  "faena_id": 1,
  "nombre": "Planta Concentradora",
  "descripcion": "Planta de concentración de minerales"
}
```

---

### 4. Líneas (`/api/lineas`)

#### GET /api/lineas
Lista todas las líneas de producción.

**Parámetros de consulta:**
- `planta_id`: Filtrar por ID de planta
- `search`: Buscar por nombre

#### GET /api/lineas/:id/equipos
Obtiene los equipos de una línea específica.

#### POST /api/lineas
Crear una nueva línea.

**Body:**
```json
{
  "planta_id": 1,
  "nombre": "Línea 1",
  "descripcion": "Primera línea de producción"
}
```

---

### 5. Equipos (`/api/equipos`)

#### GET /api/equipos
Lista todos los equipos.

**Parámetros de consulta:**
- `linea_id`: Filtrar por ID de línea
- `codigo_equipo`: Buscar por código de equipo
- `search`: Buscar por nombre o código

#### GET /api/equipos/:id/componentes
Obtiene los componentes de un equipo específico.

#### POST /api/equipos
Crear un nuevo equipo.

**Body:**
```json
{
  "linea_id": 1,
  "nombre": "Molino SAG",
  "codigo_equipo": "MO-SAG-001",
  "descripcion": "Molino semiautógeno principal"
}
```

---

### 6. Componentes (`/api/componentes`)

#### GET /api/componentes
Lista todos los componentes.

**Parámetros de consulta:**
- `equipo_id`: Filtrar por ID de equipo
- `search`: Buscar por nombre

#### GET /api/componentes/:id/puntos-lubricacion
Obtiene los puntos de lubricación de un componente específico.

#### POST /api/componentes
Crear un nuevo componente.

**Body:**
```json
{
  "equipo_id": 1,
  "nombre": "Motor Principal",
  "descripcion": "Motor de accionamiento principal"
}
```

---

### 7. Lubricantes (`/api/lubricantes`)

#### GET /api/lubricantes
Lista todos los lubricantes.

**Parámetros de consulta:**
- `tipo`: Filtrar por tipo de lubricante
- `marca`: Filtrar por marca
- `search`: Buscar por marca o tipo

#### GET /api/lubricantes/tipos/disponibles
Obtiene lista única de tipos de lubricantes.

#### GET /api/lubricantes/marcas/disponibles
Obtiene lista única de marcas de lubricantes.

#### POST /api/lubricantes
Crear un nuevo lubricante.

**Body:**
```json
{
  "marca": "Shell",
  "tipo": "Aceite Hidráulico",
  "especificaciones": "ISO VG 46, DIN 51524 Part 2"
}
```

---

### 8. Puntos de Lubricación (`/api/punto-lubricacion`)

#### GET /api/punto-lubricacion
Lista todos los puntos de lubricación.

**Parámetros de consulta:**
- `componente_id`: Filtrar por ID de componente
- `lubricante_id`: Filtrar por ID de lubricante
- `frecuencia`: Filtrar por frecuencia
- `search`: Buscar por nombre

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "componente_id": 1,
      "lubricante_id": 1,
      "nombre": "Punto A1",
      "descripcion": "Punto de lubricación del rodamiento principal",
      "cantidad": 0.5,
      "frecuencia": "Semanal",
      "componentes": {
        "id": 1,
        "nombre": "Motor Principal",
        "equipos": {
          "id": 1,
          "nombre": "Molino SAG",
          "codigo_equipo": "MO-SAG-001"
        }
      },
      "lubricantes": {
        "id": 1,
        "marca": "Shell",
        "tipo": "Grasa Multipropósito"
      }
    }
  ]
}
```

#### POST /api/punto-lubricacion
Crear un nuevo punto de lubricación.

**Body:**
```json
{
  "componente_id": 1,
  "lubricante_id": 1,
  "nombre": "Punto B2",
  "descripcion": "Lubricación de rodamiento auxiliar",
  "cantidad": 0.25,
  "frecuencia": "Quincenal"
}
```

---

### 9. Tareas Proyectadas (`/api/tareas-proyectadas`)

#### GET /api/tareas-proyectadas
Lista todas las tareas proyectadas.

**Parámetros de consulta:**
- `punto_lubricacion_id`: Filtrar por punto de lubricación
- `fecha_desde`: Filtrar desde fecha (YYYY-MM-DD)
- `fecha_hasta`: Filtrar hasta fecha (YYYY-MM-DD)
- `frecuencia`: Filtrar por frecuencia
- `origen`: Filtrar por origen

#### GET /api/tareas-proyectadas/calendario/mes
Obtiene tareas proyectadas organizadas por calendario mensual.

**Parámetros de consulta:**
- `año`: Año del calendario (default: año actual)
- `mes`: Mes del calendario (default: mes actual)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "2024-01-15": [
      {
        "id": 1,
        "punto_lubricacion_id": 1,
        "fecha_proyectada": "2024-01-15",
        "frecuencia": "Semanal",
        "punto_lubricacion": {
          "id": 1,
          "nombre": "Punto A1"
        }
      }
    ]
  },
  "meta": {
    "año": 2024,
    "mes": 1,
    "totalTareas": 5
  }
}
```

#### POST /api/tareas-proyectadas
Crear una nueva tarea proyectada.

#### POST /api/tareas-proyectadas/bulk
Crear múltiples tareas proyectadas.

**Body:**
```json
{
  "tareas": [
    {
      "punto_lubricacion_id": 1,
      "fecha_proyectada": "2024-01-15",
      "frecuencia": "Semanal"
    },
    {
      "punto_lubricacion_id": 2,
      "fecha_proyectada": "2024-01-16",
      "frecuencia": "Quincenal"
    }
  ]
}
```

---

### 10. Tareas Programadas (`/api/tareas-programadas`)

#### GET /api/tareas-programadas
Lista todas las tareas programadas.

**Parámetros de consulta:**
- `punto_lubricacion_id`: Filtrar por punto de lubricación
- `estado`: Filtrar por estado de la tarea
- `fecha_desde`: Filtrar desde fecha
- `fecha_hasta`: Filtrar hasta fecha
- `personal_asignado`: Filtrar por RUT del personal asignado

#### GET /api/tareas-programadas/estado/resumen
Obtiene resumen de tareas agrupadas por estado.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "Pendiente": 15,
    "En Proceso": 8,
    "Completada": 32,
    "Cancelada": 2
  },
  "total": 57
}
```

#### GET /api/tareas-programadas/personal/:rutPersonal
Obtiene tareas asignadas a un personal específico.

#### POST /api/tareas-programadas
Crear una nueva tarea programada.

**Body:**
```json
{
  "punto_lubricacion_id": 1,
  "fecha_programada": "2024-01-20",
  "estado": "Pendiente",
  "personal_asignado": "12345678-9",
  "observaciones": "Revisar estado del rodamiento"
}
```

#### PATCH /api/tareas-programadas/:id/estado
Cambiar solo el estado de una tarea.

**Body:**
```json
{
  "estado": "En Proceso",
  "observaciones": "Iniciando lubricación"
}
```

---

### 11. Tareas Ejecutadas (`/api/tareas-ejecutadas`)

#### GET /api/tareas-ejecutadas
Lista todas las tareas ejecutadas.

**Parámetros de consulta:**
- `tarea_programada_id`: Filtrar por tarea programada
- `personal_ejecutor`: Filtrar por RUT del ejecutor
- `fecha_desde`: Filtrar desde fecha
- `fecha_hasta`: Filtrar hasta fecha
- `cumplimiento`: Filtrar por cumplimiento (true/false)

#### GET /api/tareas-ejecutadas/personal/:rutPersonal
Obtiene tareas ejecutadas por un personal específico.

#### GET /api/tareas-ejecutadas/estadisticas/cumplimiento
Obtiene estadísticas de cumplimiento de tareas.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "cumplidas": 142,
    "noCumplidas": 5,
    "sinDatos": 3,
    "porcentajeCumplimiento": "94.67"
  }
}
```

#### GET /api/tareas-ejecutadas/estadisticas/consumo-lubricante
Obtiene estadísticas de consumo de lubricantes.

#### POST /api/tareas-ejecutadas
Crear una nueva tarea ejecutada.

**Body:**
```json
{
  "tarea_programada_id": 1,
  "fecha_ejecucion": "14:30:00",
  "personal_ejecutor": "12345678-9",
  "cantidad_usada": 0.25,
  "observaciones": "Lubricación completada sin novedades",
  "cumplimiento": true
}
```

---

### 12. Personal Disponible (`/api/personal-disponible`)

#### GET /api/personal-disponible
Lista todo el personal disponible.

**Parámetros de consulta:**
- `cargo`: Filtrar por cargo
- `estado_id`: Filtrar por ID de estado
- `zona_geografica`: Filtrar por zona geográfica
- `sexo`: Filtrar por sexo
- `search`: Buscar por RUT o cargo

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "rut": "12345678-9",
      "sexo": "M",
      "fecha_nacimiento": "1990-05-15",
      "licencia_conducir": "Clase B",
      "talla_zapatos": "42",
      "talla_pantalones": "L",
      "talla_poleras": "L",
      "cargo": "Técnico Mecánico",
      "estado_id": 1,
      "comentario_estado": null,
      "zona_geografica": "Norte",
      "estados": {
        "id": 1,
        "nombre": "Activo",
        "descripcion": "Personal en estado activo"
      }
    }
  ]
}
```

#### GET /api/personal-disponible/:rut/cursos
Obtiene cursos/certificaciones de un personal.

#### GET /api/personal-disponible/estadisticas/resumen
Obtiene estadísticas generales del personal.

#### GET /api/personal-disponible/cargos/disponibles
Obtiene lista única de cargos.

#### GET /api/personal-disponible/zonas/disponibles
Obtiene lista única de zonas geográficas.

#### POST /api/personal-disponible
Crear nuevo personal.

**Body:**
```json
{
  "rut": "98765432-1",
  "sexo": "F",
  "fecha_nacimiento": "1985-08-20",
  "licencia_conducir": "Clase B",
  "talla_zapatos": "38",
  "talla_pantalones": "M",
  "talla_poleras": "M",
  "cargo": "Operadora",
  "estado_id": 1,
  "zona_geografica": "Centro"
}
```

#### PATCH /api/personal-disponible/:rut/estado
Cambiar solo el estado del personal.

**Body:**
```json
{
  "estado_id": 2,
  "comentario_estado": "En licencia médica"
}
```

---

### 13. Cursos/Certificaciones (`/api/cursos`)

*Ya documentado en CURSOS_ENDPOINTS.md*

---

## 🔍 Funcionalidades Especiales

### 1. Búsquedas Avanzadas
- Todos los endpoints soportan búsqueda mediante el parámetro `search`
- Filtros específicos por campos relacionados
- Búsqueda en campos anidados (ej: por código de equipo desde componentes)

### 2. Relaciones Jerárquicas
- Los endpoints muestran la jerarquía completa del sistema
- Navegación desde cualquier nivel hacia sus elementos relacionados
- Información contextual en cada respuesta

### 3. Estadísticas y Reportes
- Endpoints específicos para estadísticas por módulo
- Resúmenes agrupados por diferentes criterios
- Métricas de cumplimiento y rendimiento

### 4. Gestión de Estados
- Control de estados para personal y tareas
- Transiciones de estado con observaciones
- Trazabilidad de cambios

---

## 📊 Códigos de Respuesta

### Códigos de Éxito
- **200**: OK - Operación exitosa
- **201**: Created - Recurso creado exitosamente

### Códigos de Error
- **400**: Bad Request - Datos inválidos
- **401**: Unauthorized - Token JWT faltante o inválido
- **404**: Not Found - Recurso no encontrado
- **500**: Internal Server Error - Error del servidor

---

## 🚀 Ejemplos de Uso con Postman

### 1. Flujo Completo de Creación

```bash
# 1. Crear faena
POST /api/faenas
{
  "nombre": "Faena Ejemplo",
  "descripcion": "Faena de prueba"
}

# 2. Crear planta
POST /api/plantas
{
  "faena_id": 1,
  "nombre": "Planta Principal",
  "descripcion": "Planta de procesamiento"
}

# 3. Crear línea
POST /api/lineas
{
  "planta_id": 1,
  "nombre": "Línea 1",
  "descripcion": "Primera línea"
}

# 4. Crear equipo
POST /api/equipos
{
  "linea_id": 1,
  "nombre": "Molino",
  "codigo_equipo": "MOL-001"
}

# 5. Crear componente
POST /api/componentes
{
  "equipo_id": 1,
  "nombre": "Motor"
}

# 6. Crear punto de lubricación
POST /api/punto-lubricacion
{
  "componente_id": 1,
  "lubricante_id": 1,
  "nombre": "Punto A",
  "cantidad": 0.5,
  "frecuencia": "Semanal"
}
```

### 2. Programación de Tareas

```bash
# 1. Crear tarea proyectada
POST /api/tareas-proyectadas
{
  "punto_lubricacion_id": 1,
  "fecha_proyectada": "2024-01-20",
  "frecuencia": "Semanal"
}

# 2. Convertir en tarea programada
POST /api/tareas-programadas
{
  "punto_lubricacion_id": 1,
  "fecha_programada": "2024-01-20",
  "estado": "Pendiente",
  "personal_asignado": "12345678-9"
}

# 3. Ejecutar tarea
POST /api/tareas-ejecutadas
{
  "tarea_programada_id": 1,
  "fecha_ejecucion": "10:30:00",
  "personal_ejecutor": "12345678-9",
  "cantidad_usada": 0.5,
  "cumplimiento": true
}
```

---

## 🔧 Configuración Adicional

### Variables de Entorno Requeridas
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
JWT_SECRET=tu-jwt-secret
```

### Políticas RLS Recomendadas
Consulta el archivo DDL para ejemplos de políticas Row Level Security.

---

## 📝 Notas Importantes

1. **Autenticación obligatoria**: Todos los endpoints requieren JWT token
2. **Jerarquía de datos**: Respeta las relaciones padre-hijo del sistema
3. **Validaciones**: Los campos marcados como NOT NULL son obligatorios
4. **Paginación**: Usa `limit` y `offset` para manejar grandes volúmenes
5. **Service Role**: El backend usa la clave Service Role para acceso completo
