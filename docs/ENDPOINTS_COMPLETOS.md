# 📋 Documentación Completa de Endpoints API

## 🔐 **Autenticación y Usuarios**

### **POST /api/auth/register**
Registrar nuevo usuario en el sistema.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "rut": "12.345.678-9",
  "cargo": "Ingeniero",
  "cartera_id": 1
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rut": "12.345.678-9",
    "cargo": "Ingeniero",
    "cartera_id": 1,
    "rol": "usuario",
    "activo": true
  }
}
```

### **POST /api/auth/login**
Iniciar sesión en el sistema.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "jwt_token_aqui",
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "nombre": "Juan",
      "apellido": "Pérez",
      "rut": "12.345.678-9",
      "cargo": "Ingeniero",
      "cartera_id": 1,
      "cartera_nombre": "SNACK",
      "rol": "usuario",
      "activo": true,
      "profile_image_url": "http://192.168.10.194:3000/uploads/profiles/12.345.678-9.jpg"
    }
  }
}
```

### **GET /api/auth/me**
Obtener información del usuario autenticado.

**Headers:**
```
Authorization: Bearer jwt_token_aqui
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rut": "12.345.678-9",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "email": "usuario@ejemplo.com",
    "cargo": "Ingeniero",
    "cartera_id": 1,
    "cartera_nombre": "SNACK",
    "activo": true,
    "fecha_creacion": "2024-01-15T10:30:00.000Z",
    "ultimo_acceso": "2024-01-15T10:30:00.000Z",
    "profile_image_url": "http://192.168.10.194:3000/uploads/profiles/12.345.678-9.jpg"
  }
}
```

### **POST /api/auth/logout**
Cerrar sesión del usuario.

**Headers:**
```
Authorization: Bearer jwt_token_aqui
```

### **POST /api/auth/refresh-token**
Renovar token de autenticación.

**Headers:**
```
Authorization: Bearer jwt_token_aqui
```

### **POST /api/auth/change-password**
Cambiar contraseña del usuario.

**Headers:**
```
Authorization: Bearer jwt_token_aqui
```

**Body:**
```json
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}
```

---

## 👥 **Gestión de Usuarios**

### **GET /api/users**
Listar todos los usuarios del sistema.

**Query Parameters:**
- `limit` (opcional): Número de registros por página (default: 50)
- `offset` (opcional): Número de registros a saltar (default: 0)
- `search` (opcional): Búsqueda por nombre, email o RUT
- `rol` (opcional): Filtrar por rol (admin, supervisor, usuario, operador)
- `cartera_id` (opcional): Filtrar por cartera

**Ejemplo:**
```
GET /api/users?limit=10&offset=0&search=Juan&rol=usuario&cartera_id=1
```

### **GET /api/users/:id**
Obtener usuario específico por ID.

### **POST /api/users**
Crear nuevo usuario (solo administradores).

### **PUT /api/users/:id**
Actualizar usuario existente.

### **DELETE /api/users/:id**
Eliminar usuario (solo administradores).

---

## 📅 **Programación (Recomendado: Optimizada)**

### **GET /api/programacion-optimizada** ⭐ **RECOMENDADO**
Obtener programación por cartera y rango de fechas.

**Query Parameters:**
- `cartera_id` (requerido): ID de la cartera
- `fecha_inicio` (opcional): Fecha de inicio (YYYY-MM-DD)
- `fecha_fin` (opcional): Fecha de fin (YYYY-MM-DD)
- `semana` (opcional): Fecha de lunes de la semana (YYYY-MM-DD)
- `fecha` (opcional): Cualquier fecha, calcula la semana automáticamente

**Ejemplos:**
```
GET /api/programacion-optimizada?cartera_id=6&fecha_inicio=2025-10-27&fecha_fin=2025-11-02
GET /api/programacion-optimizada?cartera_id=6&semana=2025-10-27
GET /api/programacion-optimizada?cartera_id=6&fecha=2025-10-27
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rut": "20.320.662-3",
      "nombre_persona": "Dilhan Jasson Saavedra Gonzalez",
      "cargo": "Ingeniero de Servicio",
      "cartera_id": 6,
      "nombre_cartera": "BAKERY - CARNES",
      "cliente_id": 28,
      "nombre_cliente": "ACONCAGUA FOODS - BUIN",
      "nodo_id": 15,
      "nombre_nodo": "ACONCAGUA FOODS - BUIN",
      "fecha_trabajo": "2025-10-27T00:00:00.000Z",
      "dia_semana": "lunes",
      "horas_estimadas": 8,
      "horas_reales": null,
      "observaciones": "Mantenimiento preventivo",
      "estado": "activo",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### **POST /api/programacion-optimizada**
Crear programación para fechas específicas.

**Body:**
```json
{
  "rut": "20.320.662-3",
  "cartera_id": 6,
  "cliente_id": 28,
  "nodo_id": 15,
  "fechas_trabajo": ["2025-01-15", "2025-01-16", "2025-01-17"],
  "horas_estimadas": 8,
  "observaciones": "Mantenimiento preventivo",
  "estado": "programado"
}
```

### **PUT /api/programacion-optimizada/:id**
Actualizar programación existente.

### **DELETE /api/programacion-optimizada/:id**
Eliminar programación.

---

## 📅 **Programación Semanal (Sistema Antiguo)**

### **GET /api/programacion-semanal**
Obtener programación por cartera y rango de fechas (sistema antiguo).

**Query Parameters:**
- `cartera_id` (requerido): ID de la cartera
- `fecha_inicio` (requerido): Fecha de inicio (YYYY-MM-DD)
- `fecha_fin` (requerido): Fecha de fin (YYYY-MM-DD)

**Limitaciones:**
- Rango máximo de 7 días
- Solo estados activos
- Agrupado por día

### **POST /api/programacion-semanal**
Crear programación semanal.

### **PUT /api/programacion-semanal/:id**
Actualizar programación semanal.

### **DELETE /api/programacion-semanal/:id**
Eliminar programación semanal.

---

## 📅 **Programación Básica**

### **GET /api/programacion**
Obtener programación por cartera y semana.

**Query Parameters:**
- `cartera_id` (requerido): ID de la cartera
- `semana` (opcional): Fecha de lunes de la semana (YYYY-MM-DD)
- `fecha` (opcional): Cualquier fecha, calcula la semana

### **POST /api/programacion**
Crear programación para una persona.

### **PUT /api/programacion/:id**
Actualizar programación.

### **DELETE /api/programacion/:id**
Eliminar programación.

### **GET /api/programacion/semana/:fecha**
Obtener programación de toda la semana (todas las carteras).

---

## 🏢 **Clientes**

### **GET /api/clientes**
Listar todos los clientes.

**Query Parameters:**
- `cartera_id` (opcional): Filtrar por cartera
- `region_id` (opcional): Filtrar por región
- `limit` (opcional): Registros por página (default: 50)
- `offset` (opcional): Registros a saltar (default: 0)

**Ejemplo:**
```
GET /api/clientes?cartera_id=6&limit=10&offset=0
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Clientes obtenidos exitosamente",
  "data": [
    {
      "id": 28,
      "nombre": "ACONCAGUA FOODS - BUIN",
      "cartera_id": 6,
      "region_id": 1,
      "created_at": "2024-01-15T10:30:00.000Z",
      "cartera_nombre": "BAKERY - CARNES",
      "region_nombre": "Región Metropolitana",
      "total_nodos": 1
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### **GET /api/clientes/:id**
Obtener cliente específico.

### **POST /api/clientes**
Crear nuevo cliente.

### **PUT /api/clientes/:id**
Actualizar cliente.

### **DELETE /api/clientes/:id**
Eliminar cliente.

---

## 🎯 **Asignaciones**

### **GET /api/asignaciones/persona/:rut**
Obtener todas las asignaciones de una persona.

**Ejemplo:**
```
GET /api/asignaciones/persona/20.320.662-3
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "carteras": [
      {
        "id": 6,
        "nombre": "BAKERY - CARNES",
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "clientes": [
      {
        "id": 28,
        "nombre": "ACONCAGUA FOODS - BUIN",
        "created_at": "2024-01-15T10:30:00.000Z",
        "cartera_id": 6
      }
    ],
    "nodos": [
      {
        "id": 15,
        "nombre": "ACONCAGUA FOODS - BUIN",
        "created_at": "2024-01-15T10:30:00.000Z",
        "cliente_id": 28
      }
    ]
  }
}
```

### **POST /api/asignaciones/persona/:rut/carteras**
Asignar cartera a persona.

**Body:**
```json
{
  "cartera_id": 6
}
```

### **DELETE /api/asignaciones/persona/:rut/carteras/:cartera_id**
Desasignar cartera.

### **POST /api/asignaciones/persona/:rut/clientes**
Asignar cliente a persona.

**Body:**
```json
{
  "cliente_id": 28
}
```

### **DELETE /api/asignaciones/persona/:rut/clientes/:cliente_id**
Desasignar cliente.

### **POST /api/asignaciones/persona/:rut/nodos**
Asignar nodo a persona.

**Body:**
```json
{
  "nodo_id": 15
}
```

### **DELETE /api/asignaciones/persona/:rut/nodos/:nodo_id**
Desasignar nodo.

---

## 👤 **Personal Disponible**

### **GET /api/personal-disponible**
Listar personal disponible.

**Query Parameters:**
- `limit` (opcional): Registros por página
- `offset` (opcional): Registros a saltar
- `search` (opcional): Búsqueda por nombre o RUT
- `cargo` (opcional): Filtrar por cargo

### **GET /api/personal-disponible/:rut**
Obtener persona específica por RUT.

### **POST /api/personal-disponible**
Crear nuevo personal.

### **PUT /api/personal-disponible/:rut**
Actualizar personal.

### **DELETE /api/personal-disponible/:rut**
Eliminar personal.

---

## 🖼️ **Imágenes de Perfil (Sistema Unificado)**

### **POST /api/profile-photos/:rut/upload** ⭐ **RECOMENDADO**
Subir imagen de perfil (usuarios y personal).

**Content-Type:** `multipart/form-data`

**Body:**
```
file: [archivo de imagen]
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Imagen de perfil actualizada exitosamente",
  "data": {
    "profile_image_url": "http://192.168.10.194:3000/uploads/profiles/20.320.662-3.jpg",
    "rut": "20.320.662-3",
    "filename": "20.320.662-3.jpg",
    "size": 156789,
    "mimetype": "image/jpeg"
  }
}
```

### **GET /api/profile-photos/:rut/image**
Obtener URL de imagen de perfil.

### **HEAD /api/profile-photos/:rut/image**
Verificar si existe imagen de perfil.

### **DELETE /api/profile-photos/:rut/image**
Eliminar imagen de perfil.

### **GET /api/profile-photos/:rut/image/download**
Descargar imagen de perfil.

---

## 🖼️ **Imágenes de Perfil (Sistema Original)**

### **POST /api/personal/:rut/profile-image**
Subir imagen de perfil (solo personal).

### **GET /api/personal/:rut/profile-image**
Obtener imagen de perfil.

### **GET /api/personal/:rut/profile-image/download**
Descargar imagen de perfil.

### **DELETE /api/personal/:rut/profile-image**
Eliminar imagen de perfil.

---

## 📊 **Auditoría y Logs**

### **GET /api/auditoria/dashboard**
Obtener dashboard de actividad.

**Query Parameters:**
- `fecha_inicio` (opcional): Fecha de inicio
- `fecha_fin` (opcional): Fecha de fin
- `usuario_id` (opcional): Filtrar por usuario
- `accion` (opcional): Filtrar por acción

### **GET /api/auditoria/notificaciones**
Obtener notificaciones del usuario.

### **POST /api/auditoria/notificaciones**
Crear notificación.

### **PUT /api/auditoria/notificaciones/:id/marcar-leida**
Marcar notificación como leída.

### **GET /api/auditoria/historial/:tabla/:id**
Obtener historial de cambios de un registro.

### **GET /api/auditoria/estadisticas**
Obtener estadísticas del sistema.

### **POST /api/auditoria/limpiar-logs**
Limpiar logs antiguos.

---

## 🏗️ **Estructura y Servicios**

### **GET /api/estructura**
Obtener estructura organizacional.

### **GET /api/servicios**
Listar servicios disponibles.

### **GET /api/area-servicio**
Obtener áreas de servicio.

### **GET /api/nodos**
Listar nodos disponibles.

### **GET /api/ubicacion-geografica**
Obtener ubicaciones geográficas.

---

## 📚 **Cursos y Capacitación**

### **GET /api/cursos**
Listar cursos disponibles.

### **GET /api/cursos/:id**
Obtener curso específico.

### **POST /api/cursos**
Crear nuevo curso.

### **PUT /api/cursos/:id**
Actualizar curso.

### **DELETE /api/cursos/:id**
Eliminar curso.

---

## 📄 **Documentos**

### **GET /api/documentos**
Listar documentos.

### **POST /api/documentos/upload**
Subir documento.

### **GET /api/documentos/:id/download**
Descargar documento.

### **DELETE /api/documentos/:id**
Eliminar documento.

---

## 🔧 **Estados y Configuración**

### **GET /api/estados**
Obtener estados disponibles.

### **GET /api/estado-unificado**
Obtener estado unificado del sistema.

### **GET /api/minimo-personal**
Obtener configuración de personal mínimo.

---

## 🏢 **Carteras**

### **GET /api/carteras**
Listar carteras disponibles.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "SNACK",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 6,
      "name": "BAKERY - CARNES",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 🔄 **Migración y Backup**

### **POST /api/migration/run**
Ejecutar migración de base de datos.

### **GET /api/backup/create**
Crear backup de la base de datos.

### **GET /api/backup/list**
Listar backups disponibles.

### **POST /api/backup/restore**
Restaurar backup.

---

## 📋 **Nombres y Referencias**

### **GET /api/nombres**
Obtener lista de nombres.

### **GET /api/prerrequisitos**
Obtener prerrequisitos.

---

## 🏭 **Belray (Sistema Específico)**

### **GET /api/belray**
Obtener datos de Belray.

### **POST /api/belray**
Crear registro Belray.

---

## 📁 **Carpetas de Personal**

### **GET /api/carpetas-personal**
Obtener carpetas de personal.

### **POST /api/carpetas-personal**
Crear carpeta de personal.

---

## 🔍 **Códigos de Estado HTTP**

- **200** - OK (Éxito)
- **201** - Created (Creado exitosamente)
- **400** - Bad Request (Solicitud incorrecta)
- **401** - Unauthorized (No autorizado)
- **403** - Forbidden (Prohibido)
- **404** - Not Found (No encontrado)
- **409** - Conflict (Conflicto)
- **422** - Unprocessable Entity (Entidad no procesable)
- **500** - Internal Server Error (Error interno del servidor)

---

## 🔐 **Autenticación**

La mayoría de endpoints requieren autenticación mediante JWT token en el header:

```
Authorization: Bearer jwt_token_aqui
```

## 📝 **Formato de Respuesta Estándar**

### **Éxito:**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **Error:**
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos del error",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🎯 **Endpoints Recomendados por Funcionalidad**

### **Programación:**
- ⭐ **`/api/programacion-optimizada`** - Sistema nuevo y optimizado

### **Imágenes de Perfil:**
- ⭐ **`/api/profile-photos`** - Sistema unificado para usuarios y personal

### **Autenticación:**
- ⭐ **`/api/auth/me`** - Información completa del usuario con imagen de perfil

### **Asignaciones:**
- ⭐ **`/api/asignaciones/persona/:rut`** - Gestión completa de asignaciones

---

## 📞 **Soporte**

Para más información sobre el uso de los endpoints, consulta la documentación técnica o contacta al equipo de desarrollo.

**Base URL:** `http://localhost:3000` (desarrollo)  
**Versión API:** 1.0  
**Última actualización:** Enero 2024
