# 📋 API Endpoints - Sistema de Gestión de Personal

## 🚀 Información General

- **Base URL**: `http://localhost:3000/api`
- **Autenticación**: JWT Bearer Token (donde aplique)
- **Formato**: JSON
- **CORS**: Habilitado para localhost y redes locales

---

## 🔐 Autenticación (`/api/auth`)

### **POST** `/api/auth/register`
Registrar nuevo usuario
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "nombre": "Juan",
  "apellido": "Pérez"
}
```

### **POST** `/api/auth/login`
Iniciar sesión
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

### **GET** `/api/auth/me`
Obtener información del usuario actual (requiere token)

### **POST** `/api/auth/refresh`
Renovar token de acceso

### **POST** `/api/auth/logout`
Cerrar sesión

### **GET** `/api/auth/test`
Verificar que las rutas de auth funcionan

### **GET** `/api/auth/check-users`
Verificar usuarios existentes

---

## 👥 Usuarios (`/api/users`)

### **GET** `/api/users`
Listar usuarios (requiere autenticación)

### **GET** `/api/users/:id`
Obtener usuario específico

### **PUT** `/api/users/:id`
Actualizar usuario

### **DELETE** `/api/users/:id`
Eliminar usuario

---

## 👷 Personal Disponible (`/api/personal-disponible`)

### **GET** `/api/personal-disponible`
Listar personal disponible
**Query Parameters:**
- `limit` (opcional): Número de registros (default: 20)
- `offset` (opcional): Registros a saltar (default: 0)
- `search` (opcional): Buscar por RUT
- `estado_id` (opcional): Filtrar por estado
- `cargo` (opcional): Filtrar por cargo

### **GET** `/api/personal-disponible/:rut`
Obtener persona específica por RUT

### **POST** `/api/personal-disponible`
Crear nuevo personal
```json
{
  "rut": "12345678-9",
  "nombres": "Juan Carlos",
  "apellidos": "Pérez González",
  "cargo": "Técnico",
  "estado_id": 1,
  "zona_geografica": "Norte"
}
```

### **PUT** `/api/personal-disponible/:rut`
Actualizar personal

### **DELETE** `/api/personal-disponible/:rut`
Eliminar personal

---

## 📊 Estados (`/api/estados`)

### **GET** `/api/estados`
Listar todos los estados

### **GET** `/api/estados/:id`
Obtener estado específico

### **POST** `/api/estados`
Crear nuevo estado

### **PUT** `/api/estados/:id`
Actualizar estado

### **DELETE** `/api/estados/:id`
Eliminar estado

---

## 🎓 Cursos (`/api/cursos`)

### **GET** `/api/cursos`
Listar cursos

### **GET** `/api/cursos/:id`
Obtener curso específico

### **POST** `/api/cursos`
Crear nuevo curso

### **PUT** `/api/cursos/:id`
Actualizar curso

### **DELETE** `/api/cursos/:id`
Eliminar curso

### **GET** `/api/cursos/persona/:rut/documentos`
Obtener documentos de cursos por persona

---

## 📄 Documentos (`/api/documentos`)

### **GET** `/api/documentos`
Listar documentos
**Query Parameters:**
- `limit` (opcional): Número de registros (default: 50)
- `offset` (opcional): Registros a saltar (default: 0)
- `rut` (opcional): Filtrar por RUT de persona
- `tipo_documento` (opcional): Filtrar por tipo
- `nombre_documento` (opcional): Buscar por nombre

### **GET** `/api/documentos/:id`
Obtener documento específico

### **POST** `/api/documentos`
Subir nuevo documento

### **PUT** `/api/documentos/:id`
Actualizar documento

### **DELETE** `/api/documentos/:id`
Eliminar documento

### **GET** `/api/documentos/tipos`
Obtener tipos de documento disponibles

### **GET** `/api/documentos/formatos`
Obtener formatos de archivo soportados

### **GET** `/api/documentos/persona/:rut`
Obtener documentos de una persona específica

---

## 🏢 Servicios (`/api/servicios`)

### **Carteras**

#### **GET** `/api/servicios/carteras`
Listar carteras

#### **GET** `/api/servicios/carteras/:id`
Obtener cartera específica

#### **POST** `/api/servicios/carteras`
Crear nueva cartera

#### **PUT** `/api/servicios/carteras/:id`
Actualizar cartera

#### **DELETE** `/api/servicios/carteras/:id`
Eliminar cartera

### **Clientes**

#### **GET** `/api/servicios/clientes`
Listar clientes

#### **GET** `/api/servicios/clientes/:id`
Obtener cliente específico

#### **POST** `/api/servicios/clientes`
Crear nuevo cliente

#### **PUT** `/api/servicios/clientes/:id`
Actualizar cliente

#### **DELETE** `/api/servicios/clientes/:id`
Eliminar cliente

### **Nodos**

#### **GET** `/api/servicios/nodos`
Listar nodos

#### **GET** `/api/servicios/nodos/:id`
Obtener nodo específico

#### **POST** `/api/servicios/nodos`
Crear nuevo nodo

#### **PUT** `/api/servicios/nodos/:id`
Actualizar nodo

#### **DELETE** `/api/servicios/nodos/:id`
Eliminar nodo

### **Mínimo Personal**

#### **GET** `/api/servicios/minimo-personal`
Listar mínimos de personal
**Query Parameters:**
- `cartera_id` (opcional): Filtrar por cartera
- `cliente_id` (opcional): Filtrar por cliente
- `nodo_id` (opcional): Filtrar por nodo
- `limit` (opcional): Número de registros (default: 50)
- `offset` (opcional): Registros a saltar (default: 0)

#### **GET** `/api/servicios/minimo-personal/:id`
Obtener mínimo específico

#### **POST** `/api/servicios/minimo-personal`
Crear nuevo mínimo de personal
```json
{
  "cartera_id": 1,
  "cliente_id": 5,
  "nodo_id": 12,
  "minimo_base": 10,
  "descripcion": "Mínimo de personal para mantenimiento"
}
```

#### **PUT** `/api/servicios/minimo-personal/:id`
Actualizar mínimo de personal

#### **DELETE** `/api/servicios/minimo-personal/:id`
Eliminar mínimo de personal

#### **GET** `/api/servicios/minimo-personal/:id/calcular`
Calcular mínimo real con acuerdos aplicados

### **Acuerdos**

#### **GET** `/api/servicios/acuerdos`
Listar acuerdos
**Query Parameters:**
- `minimo_personal_id` (opcional): Filtrar por mínimo de personal
- `tipo_acuerdo` (opcional): Filtrar por tipo (incremento/reduccion)
- `estado` (opcional): Filtrar por estado (default: activo)
- `fecha_desde` (opcional): Filtrar desde fecha
- `fecha_hasta` (opcional): Filtrar hasta fecha
- `limit` (opcional): Número de registros (default: 50)
- `offset` (opcional): Registros a saltar (default: 0)

#### **GET** `/api/servicios/acuerdos/:id`
Obtener acuerdo específico

#### **POST** `/api/servicios/acuerdos`
Crear nuevo acuerdo
```json
{
  "minimo_personal_id": 1,
  "tipo_acuerdo": "incremento",
  "valor_modificacion": 5,
  "fecha_inicio": "2024-01-15",
  "fecha_fin": "2024-02-15",
  "motivo": "Incremento temporal por alta demanda",
  "aprobado_por": "Gerente de Operaciones"
}
```

#### **PUT** `/api/servicios/acuerdos/:id`
Actualizar acuerdo

#### **DELETE** `/api/servicios/acuerdos/:id`
Eliminar acuerdo

#### **GET** `/api/servicios/acuerdos/vencer`
Obtener acuerdos próximos a vencer
**Query Parameters:**
- `dias` (opcional): Días de anticipación (default: 30)

#### **POST** `/api/servicios/acuerdos/:id/activar`
Activar acuerdo

#### **POST** `/api/servicios/acuerdos/:id/desactivar`
Desactivar acuerdo

---

## 📅 Programación Semanal (`/api/programacion`)

### **GET** `/api/programacion`
Obtener programación por cartera y semana
**Query Parameters:**
- `cartera_id` (requerido): ID de la cartera
- `semana` (opcional): Fecha de inicio de semana (YYYY-MM-DD)
- `fecha` (opcional): Fecha específica para obtener su semana

### **POST** `/api/programacion`
Crear programación semanal
```json
{
  "rut": "12345678-9",
  "cartera_id": 1,
  "cliente_id": 5,
  "nodo_id": 12,
  "semana_inicio": "2024-01-15",
  "lunes": true,
  "martes": true,
  "miercoles": false,
  "jueves": true,
  "viernes": true,
  "sabado": false,
  "domingo": false,
  "horas_estimadas": 8,
  "observaciones": "Programación semanal",
  "estado": "programado"
}
```

### **PUT** `/api/programacion/:id`
Actualizar programación

### **DELETE** `/api/programacion/:id`
Eliminar programación

---

## 🎯 Programación Optimizada (`/api/programacion-optimizada`)

### **GET** `/api/programacion-optimizada`
**Obtener programación por cartera y rango de fechas**

**Query Parameters:**
- `cartera_id` (requerido): ID de la cartera
- `fecha_inicio` (opcional): Fecha de inicio del rango
- `fecha_fin` (opcional): Fecha de fin del rango
- `semana` (opcional): Fecha de inicio de semana (YYYY-MM-DD)
- `fecha` (opcional): Fecha específica para obtener su semana

**Ejemplo:**
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
      "nombre": "SNACK"
    },
    "periodo": {
      "inicio": "2024-01-15",
      "fin": "2024-01-19"
    },
    "programacion": [
      {
        "id": 1,
        "rut": "12345678-9",
        "nombre_persona": "Juan Pérez",
        "cargo": "Técnico",
        "cartera_id": 1,
        "nombre_cartera": "SNACK",
        "cliente_id": 5,
        "nombre_cliente": "Cliente A",
        "nodo_id": 12,
        "nombre_nodo": "Nodo A",
        "fecha_trabajo": "2024-01-15",
        "dia_semana": "lunes",
        "horas_estimadas": 8,
        "horas_reales": null,
        "observaciones": "Trabajo programado",
        "estado": "programado",
        "created_at": "2024-01-15T10:00:00.000Z",
        "updated_at": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

### **GET** `/api/programacion-optimizada/persona/:rut`
**Obtener programación de una persona específica**

**Path Parameters:**
- `rut` (requerido): RUT de la persona

**Query Parameters:**
- `dias` (opcional): Días a consultar (default: 30)

**Ejemplo:**
```http
GET /api/programacion-optimizada/persona/12345678-9?dias=15
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "persona": {
      "rut": "12345678-9",
      "nombre": "Juan Pérez",
      "cargo": "Técnico"
    },
    "programacion": [
      {
        "id": 1,
        "rut": "12345678-9",
        "fecha_trabajo": "2024-01-15",
        "dia_semana": "lunes",
        "horas_estimadas": 8,
        "estado": "programado"
      }
    ]
  }
}
```

### **POST** `/api/programacion-optimizada`
**Crear programación para fechas específicas**

**Body:**
```json
{
  "rut": "12345678-9",
  "cartera_id": 1,
  "cliente_id": 5,
  "nodo_id": 12,
  "fechas_trabajo": ["2024-01-15", "2024-01-17", "2024-01-19"],
  "horas_estimadas": 8,
  "observaciones": "Trabajo en días específicos",
  "estado": "programado"
}
```

**Características:**
- ✅ **Actualización inteligente** - Si la fecha ya existe, actualiza el registro
- ✅ **Creación múltiple** - Crea programación para múltiples fechas
- ✅ **Validaciones completas** - Verifica persona, cartera, cliente y nodo

**Respuesta:**
```json
{
  "success": true,
  "message": "Programación procesada: 2 fechas creadas, 1 fechas actualizadas",
  "data": {
    "programacion": [
      {
        "id": 1,
        "rut": "12345678-9",
        "fecha_trabajo": "2024-01-15",
        "dia_semana": "lunes",
        "horas_estimadas": 8,
        "estado": "programado"
      }
    ],
    "resumen": {
      "total": 3,
      "creadas": 2,
      "actualizadas": 1,
      "fechas_creadas": ["2024-01-17", "2024-01-19"],
      "fechas_actualizadas": ["2024-01-15"]
    }
  }
}
```

### **POST** `/api/programacion-optimizada/semana`
**Crear programación para una semana completa**

**Body:**
```json
{
  "rut": "12345678-9",
  "cartera_id": 1,
  "cliente_id": 5,
  "nodo_id": 12,
  "semana_inicio": "2024-01-15",
  "dias_trabajo": ["lunes", "martes", "jueves", "viernes"],
  "horas_estimadas": 8,
  "observaciones": "Semana completa",
  "estado": "programado"
}
```

**Características:**
- ✅ **Programación semanal** - Crea programación para días específicos de la semana
- ✅ **Flexibilidad** - Permite elegir qué días programar
- ✅ **Cálculo automático** - Calcula fechas automáticamente

**Respuesta:**
```json
{
  "success": true,
  "message": "Programación creada exitosamente para 4 días",
  "data": [
    {
      "id": 1,
      "rut": "12345678-9",
      "fecha_trabajo": "2024-01-15",
      "dia_semana": "lunes",
      "horas_estimadas": 8,
      "estado": "programado"
    },
    {
      "id": 2,
      "rut": "12345678-9",
      "fecha_trabajo": "2024-01-16",
      "dia_semana": "martes",
      "horas_estimadas": 8,
      "estado": "programado"
    }
  ]
}
```

### **GET** `/api/programacion-optimizada/calendario`
**Vista de calendario mensual**

**Query Parameters:**
- `cartera_id` (requerido): ID de la cartera
- `mes` (opcional): Mes (1-12, default: mes actual)
- `año` (opcional): Año (default: año actual)

**Ejemplo:**
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
      "nombre": "SNACK"
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
        "trabajadores": [
          {
            "id": 1,
            "rut": "12345678-9",
            "nombre_persona": "Juan Pérez",
            "cargo": "Técnico",
            "horas_estimadas": 8,
            "estado": "programado"
          }
        ]
      }
    ]
  }
}
```

### **GET** `/api/programacion-optimizada/:id`
**Obtener programación específica por ID**

**Path Parameters:**
- `id` (requerido): ID de la programación

**Ejemplo:**
```http
GET /api/programacion-optimizada/123
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "rut": "12345678-9",
    "nombre_persona": "Juan Pérez",
    "cartera_id": 1,
    "nombre_cartera": "SNACK",
    "fecha_trabajo": "2024-01-15",
    "dia_semana": "lunes",
    "horas_estimadas": 8,
    "horas_reales": null,
    "observaciones": "Trabajo programado",
    "estado": "programado"
  }
}
```

### **PUT** `/api/programacion-optimizada/:id`
**Actualizar programación específica**

**Path Parameters:**
- `id` (requerido): ID de la programación

**Body:**
```json
{
  "cliente_id": 5,
  "nodo_id": 12,
  "horas_estimadas": 6,
  "horas_reales": 8,
  "observaciones": "Actualización de programación",
  "estado": "completado"
}
```

**Características:**
- ✅ **Actualización parcial** - Solo actualiza campos proporcionados
- ✅ **Historial automático** - Registra cambios en el historial
- ✅ **Validaciones** - Verifica cliente y nodo si se proporcionan

**Respuesta:**
```json
{
  "success": true,
  "message": "Programación actualizada exitosamente",
  "data": {
    "id": 123,
    "rut": "12345678-9",
    "cliente_id": 5,
    "nodo_id": 12,
    "horas_estimadas": 6,
    "horas_reales": 8,
    "observaciones": "Actualización de programación",
    "estado": "completado",
    "updated_at": "2024-01-15T15:30:00.000Z"
  }
}
```

### **DELETE** `/api/programacion-optimizada/:id`
**Eliminar programación específica**

**Path Parameters:**
- `id` (requerido): ID de la programación

**Ejemplo:**
```http
DELETE /api/programacion-optimizada/123
```

**Características:**
- ✅ **Eliminación segura** - Registra en historial antes de eliminar
- ✅ **Auditoría completa** - Mantiene registro de eliminaciones

**Respuesta:**
```json
{
  "success": true,
  "message": "Programación eliminada exitosamente"
}
```

---

## 📁 Carpetas Personal (`/api/carpetas-personal`)

### **GET** `/api/carpetas-personal`
Listar carpetas de personal

### **GET** `/api/carpetas-personal/:id`
Obtener carpeta específica

### **POST** `/api/carpetas-personal`
Crear nueva carpeta

### **PUT** `/api/carpetas-personal/:id`
Actualizar carpeta

### **DELETE** `/api/carpetas-personal/:id`
Eliminar carpeta

---

## 🔍 Auditoría (`/api/auditoria`)

### **GET** `/api/auditoria`
Listar registros de auditoría

### **GET** `/api/auditoria/:id`
Obtener registro específico

---

## 🏗️ Área Servicio (`/api/area-servicio`)

### **GET** `/api/area-servicio`
Listar áreas de servicio

### **GET** `/api/area-servicio/:id`
Obtener área específica

### **POST** `/api/area-servicio`
Crear nueva área

### **PUT** `/api/area-servicio/:id`
Actualizar área

### **DELETE** `/api/area-servicio/:id`
Eliminar área

---

## ⚙️ Servicio (`/api/servicio`)

### **GET** `/api/servicio`
Listar servicios

### **GET** `/api/servicio/:id`
Obtener servicio específico

### **POST** `/api/servicio`
Crear nuevo servicio

### **PUT** `/api/servicio/:id`
Actualizar servicio

### **DELETE** `/api/servicio/:id`
Eliminar servicio

---

## 📋 Asignaciones (`/api/asignaciones`)

### **GET** `/api/asignaciones`
Listar asignaciones

### **GET** `/api/asignaciones/:id`
Obtener asignación específica

### **POST** `/api/asignaciones`
Crear nueva asignación

### **PUT** `/api/asignaciones/:id`
Actualizar asignación

### **DELETE** `/api/asignaciones/:id`
Eliminar asignación

---

## 🖼️ Imágenes de Perfil (`/api/personal`)

### **GET** `/api/personal/:rut/imagen`
Obtener imagen de perfil

### **POST** `/api/personal/:rut/imagen`
Subir imagen de perfil

### **DELETE** `/api/personal/:rut/imagen`
Eliminar imagen de perfil

---

## 📚 Prerrequisitos (`/api/prerrequisitos`)

### **GET** `/api/prerrequisitos`
Listar prerrequisitos

### **GET** `/api/prerrequisitos/:id`
Obtener prerrequisito específico

### **POST** `/api/prerrequisitos`
Crear nuevo prerrequisito

### **PUT** `/api/prerrequisitos/:id`
Actualizar prerrequisito

### **DELETE** `/api/prerrequisitos/:id`
Eliminar prerrequisito

---

## 🔄 Migración (`/api/migration`)

### **GET** `/api/migration`
Obtener estado de migraciones

### **POST** `/api/migration`
Ejecutar migración

---

## 💾 Backup (`/api/backup`)

### **GET** `/api/backup`
Listar backups disponibles

### **POST** `/api/backup`
Crear nuevo backup

### **GET** `/api/backup/:id/download`
Descargar backup específico

---

## 🏢 Belray (`/api/belray`)

### **GET** `/api/belray`
Obtener información de Belray

### **POST** `/api/belray`
Crear registro de Belray

---

## 🏥 Health Check

### **GET** `/api/health`
Verificar estado del servidor
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

---

## 📊 Endpoint Raíz

### **GET** `/`
Obtener información general del API
```json
{
  "message": "API de Gestión de Personal",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "personal": "/api/personal-disponible",
    "estados": "/api/estados",
    "cursos": "/api/cursos",
    "documentos": "/api/documentos",
    "servicios": "/api/servicios",
    "programacion": "/api/programacion",
    "programacionOptimizada": "/api/programacion-optimizada",
    "carpetas": "/api/carpetas-personal",
    "auditoria": "/api/auditoria"
  }
}
```

---

## 🔧 Códigos de Estado HTTP

- **200**: OK - Operación exitosa
- **201**: Created - Recurso creado exitosamente
- **400**: Bad Request - Datos inválidos
- **401**: Unauthorized - No autenticado
- **403**: Forbidden - Sin permisos
- **404**: Not Found - Recurso no encontrado
- **500**: Internal Server Error - Error del servidor

---

## 📝 Notas Importantes

1. **Autenticación**: Algunos endpoints requieren token JWT en el header `Authorization: Bearer <token>`
2. **Paginación**: Los endpoints de listado soportan `limit` y `offset` para paginación
3. **Filtros**: Muchos endpoints soportan filtros opcionales via query parameters
4. **CORS**: Habilitado para localhost y redes locales (192.168.x.x)
5. **Formato de Fechas**: ISO 8601 (YYYY-MM-DD)
6. **Límites**: Máximo 100MB por request, 5 archivos por request de documentos

---

## 🚀 Sistema de Programación Optimizado

El nuevo sistema de programación optimizada (`/api/programacion-optimizada`) ofrece:

- **Fechas específicas** en lugar de días booleanos
- **Filtros por rango de fechas** exactas
- **Vista de calendario mensual**
- **Programación flexible** para días específicos
- **Mejor administración** y seguimiento
- **Compatibilidad** con el sistema anterior

### 🎯 **Características Principales del Sistema Optimizado:**

#### **✅ Ventajas sobre el Sistema Anterior:**
1. **📅 Fechas específicas** - Cada día tiene una fecha exacta
2. **🔍 Filtros avanzados** - Consultas por rango de fechas
3. **📊 Vista de calendario** - Programación mensual visual
4. **⏰ Seguimiento de horas** - Reales vs estimadas
5. **🔄 Flexibilidad total** - Días específicos fuera de semana estándar
6. **📋 Auditoría completa** - Historial por fecha específica

#### **🛡️ Validaciones y Seguridad:**
- ✅ **Validación de personas** - Verifica que el RUT existe
- ✅ **Validación de carteras** - Verifica que la cartera existe
- ✅ **Validación de clientes** - Verifica cliente si se proporciona
- ✅ **Validación de nodos** - Verifica nodo si se proporciona
- ✅ **Restricción única** - No duplicados por RUT + cartera + fecha
- ✅ **Historial completo** - Registra todas las operaciones

#### **📊 Respuestas Mejoradas:**
- ✅ **Mensajes informativos** - Indica fechas creadas vs actualizadas
- ✅ **Resumen detallado** - Estadísticas de operaciones
- ✅ **Datos completos** - Información de persona, cartera, cliente y nodo
- ✅ **Ordenamiento lógico** - Por fecha y nombre de persona

#### **🔧 Funcionalidades Avanzadas:**
- ✅ **Actualización inteligente** - Si la fecha ya existe, actualiza el registro
- ✅ **Creación múltiple** - Crea programación para múltiples fechas
- ✅ **Programación semanal** - Crea programación para días específicos de la semana
- ✅ **Vista de calendario** - Programación mensual agrupada por fecha
- ✅ **Seguimiento de horas** - Horas estimadas vs reales trabajadas
- ✅ **Estados de programación** - programado, completado, cancelado, etc.

#### **📋 Ejemplos de Uso Común:**

**1. Programar días específicos:**
```javascript
POST /api/programacion-optimizada
{
  "rut": "12345678-9",
  "cartera_id": 1,
  "fechas_trabajo": ["2024-01-15", "2024-01-17", "2024-01-19"],
  "horas_estimadas": 8
}
```

**2. Consultar programación por fechas:**
```javascript
GET /api/programacion-optimizada?cartera_id=1&fecha_inicio=2024-01-15&fecha_fin=2024-01-19
```

**3. Vista de calendario mensual:**
```javascript
GET /api/programacion-optimizada/calendario?cartera_id=1&mes=1&año=2024
```

**4. Programar semana completa:**
```javascript
POST /api/programacion-optimizada/semana
{
  "rut": "12345678-9",
  "cartera_id": 1,
  "semana_inicio": "2024-01-15",
  "dias_trabajo": ["lunes", "martes", "jueves", "viernes"]
}
```

**5. Actualizar horas reales:**
```javascript
PUT /api/programacion-optimizada/123
{
  "horas_reales": 8,
  "estado": "completado"
}
```

#### **🔄 Migración del Sistema Anterior:**
- ✅ **Compatibilidad total** - El sistema anterior sigue funcionando
- ✅ **Vista de compatibilidad** - `programacion_semanal_vista` para transición
- ✅ **Migración automática** - Scripts para migrar datos existentes
- ✅ **Transición gradual** - Puede usarse ambos sistemas simultáneamente

El sistema de programación optimizada está **completamente funcional** y ofrece todas las funcionalidades necesarias para una gestión eficiente de la programación de personal.

---

**Última actualización**: 24 de Octubre, 2024
**Versión del API**: 1.0.0
