# 📚 Documentación de la API - Sistema de Gestión de Personal

## 🔗 Información General

- **Base URL**: `http://localhost:3000`
- **Versión**: 1.0.0
- **Formato de respuesta**: JSON
- **Autenticación**: JWT Bearer Token

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Para acceder a rutas protegidas, incluye el token en el header:

```
Authorization: Bearer <tu-token-jwt>
```

---

## 📋 Endpoints Disponibles

### 🔑 Autenticación (`/api/auth`)

#### 1. Registrar Usuario
- **URL**: `POST /api/auth/register`
- **Descripción**: Crear una nueva cuenta de usuario
- **Autenticación**: No requerida
- **Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "nombre": "Juan",
  "apellido": "Pérez"
}
```
- **Respuesta exitosa** (201):
```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "usuario"
  },
  "token": "jwt-token"
}
```

#### 2. Iniciar Sesión
- **URL**: `POST /api/auth/login`
- **Descripción**: Autenticar usuario y obtener token
- **Autenticación**: No requerida
- **Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```
- **Respuesta exitosa** (200):
```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "usuario"
  },
  "token": "jwt-token"
}
```

#### 3. Cerrar Sesión
- **URL**: `POST /api/auth/logout`
- **Descripción**: Cerrar sesión del usuario
- **Autenticación**: No requerida
- **Respuesta exitosa** (200):
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

#### 4. Obtener Usuario Actual
- **URL**: `GET /api/auth/me`
- **Descripción**: Obtener información del usuario autenticado
- **Autenticación**: JWT Token requerido
- **Respuesta exitosa** (200):
```json
{
  "user": {
    "id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "usuario"
  }
}
```

#### 5. Renovar Token
- **URL**: `POST /api/auth/refresh`
- **Descripción**: Renovar el token JWT
- **Autenticación**: JWT Token requerido
- **Respuesta exitosa** (200):
```json
{
  "message": "Token renovado exitosamente",
  "user": {
    "id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "usuario"
  },
  "token": "nuevo-jwt-token"
}
```

---

### 👥 Personal (`/api/personal`)

#### 1. Obtener Lista de Personal
- **URL**: `GET /api/personal`
- **Descripción**: Obtener lista paginada de personal con filtros
- **Autenticación**: JWT Token requerido
- **Query Parameters**:
  - `page` (opcional): Número de página (default: 1)
  - `limit` (opcional): Elementos por página (default: 10, max: 100)
  - `search` (opcional): Término de búsqueda
  - `filtro` (opcional): Tipo de filtro (`nombre`, `cargo`, `empresa`, `servicio`)
- **Ejemplo**: `GET /api/personal?page=1&limit=10&search=Juan&filtro=nombre`
- **Respuesta exitosa** (200):
```json
{
  "data": [
    {
      "id": "uuid-del-personal",
      "nombre": "Juan",
      "apellido": "Pérez",
      "rut": "12.345.678-9",
      "fecha_nacimiento": "1990-05-15",
      "cargo": "Técnico",
      "empresa_id": "uuid-empresa",
      "servicio_id": "uuid-servicio",
      "activo": true,
      "ubicacion": {...},
      "contacto": {...},
      "disponibilidad": {...}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### 2. Obtener Personal por ID
- **URL**: `GET /api/personal/:id`
- **Descripción**: Obtener información detallada de un personal específico
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID del personal)
- **Respuesta exitosa** (200):
```json
{
  "data": {
    "id": "uuid-del-personal",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rut": "12.345.678-9",
    "fecha_nacimiento": "1990-05-15",
    "cargo": "Técnico",
    "empresa_id": "uuid-empresa",
    "servicio_id": "uuid-servicio",
    "activo": true,
    "ubicacion": {...},
    "contacto": {...},
    "contacto_emergencia": {...},
    "formacion": {...},
    "licencias": {...},
    "condicion_salud": {...},
    "disponibilidad": {...}
  }
}
```

#### 3. Crear Nuevo Personal
- **URL**: `POST /api/personal`
- **Descripción**: Crear un nuevo registro de personal
- **Autenticación**: JWT Token requerido
- **Body**:
```json
{
  "nombre": "María",
  "apellido": "González",
  "rut": "12.345.678-9",
  "fecha_nacimiento": "1990-05-15",
  "cargo": "Técnico",
  "empresa_id": "uuid-empresa",
  "servicio_id": "uuid-servicio",
  "email": "maria@empresa.com",
  "telefono": "+56912345678"
}
```
- **Respuesta exitosa** (201):
```json
{
  "message": "Personal creado exitosamente",
  "data": {
    "id": "uuid-del-personal",
    "nombre": "María",
    "apellido": "González",
    // ... resto de datos
  }
}
```

#### 4. Actualizar Personal
- **URL**: `PUT /api/personal/:id`
- **Descripción**: Actualizar información de un personal
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID del personal)
- **Body**: Mismos campos que crear, pero opcionales
- **Respuesta exitosa** (200):
```json
{
  "message": "Personal actualizado exitosamente",
  "data": {
    // Datos actualizados del personal
  }
}
```

#### 5. Eliminar Personal
- **URL**: `DELETE /api/personal/:id`
- **Descripción**: Eliminar un registro de personal
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID del personal)
- **Respuesta exitosa** (200):
```json
{
  "message": "Personal eliminado exitosamente"
}
```

#### 6. Obtener Disponibilidad
- **URL**: `GET /api/personal/:id/disponibilidad`
- **Descripción**: Obtener disponibilidad de un personal
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID del personal)
- **Respuesta exitosa** (200):
```json
{
  "data": {
    "disponible": true,
    "horario_inicio": "08:00",
    "horario_fin": "18:00",
    "dias_semana": "Lunes,Martes,Miércoles,Jueves,Viernes"
  }
}
```

#### 7. Actualizar Disponibilidad
- **URL**: `PUT /api/personal/:id/disponibilidad`
- **Descripción**: Actualizar disponibilidad de un personal
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID del personal)
- **Body**:
```json
{
  "disponible": true,
  "horario_inicio": "08:00",
  "horario_fin": "18:00",
  "dias_semana": "Lunes,Martes,Miércoles,Jueves,Viernes"
}
```
- **Respuesta exitosa** (200):
```json
{
  "message": "Disponibilidad actualizada exitosamente",
  "data": {
    // Datos de disponibilidad actualizados
  }
}
```

---

### 🏢 Empresas (`/api/empresas`)

#### 1. Obtener Lista de Empresas
- **URL**: `GET /api/empresas`
- **Descripción**: Obtener lista paginada de empresas con filtros
- **Autenticación**: JWT Token requerido
- **Query Parameters**:
  - `page` (opcional): Número de página (default: 1)
  - `limit` (opcional): Elementos por página (default: 10, max: 100)
  - `search` (opcional): Término de búsqueda
  - `filtro` (opcional): Tipo de filtro (`nombre`, `rut`)
- **Respuesta exitosa** (200):
```json
{
  "data": [
    {
      "id": "uuid-empresa",
      "nombre": "Empresa Ejemplo",
      "rut_empresa": "12.345.678-9",
      "direccion": "Av. Principal 123",
      "email": "contacto@empresa.com",
      "telefono": "+56912345678"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### 2. Obtener Empresa por ID
- **URL**: `GET /api/empresas/:id`
- **Descripción**: Obtener información de una empresa específica
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID de la empresa)
- **Respuesta exitosa** (200):
```json
{
  "data": {
    "id": "uuid-empresa",
    "nombre": "Empresa Ejemplo",
    "rut_empresa": "12.345.678-9",
    "direccion": "Av. Principal 123",
    "email": "contacto@empresa.com",
    "telefono": "+56912345678"
  }
}
```

#### 3. Crear Nueva Empresa
- **URL**: `POST /api/empresas`
- **Descripción**: Crear una nueva empresa
- **Autenticación**: JWT Token requerido
- **Body**:
```json
{
  "nombre": "Nueva Empresa",
  "rut_empresa": "98.765.432-1",
  "direccion": "Calle Nueva 456",
  "email": "info@nuevaempresa.com",
  "telefono": "+56987654321"
}
```
- **Respuesta exitosa** (201):
```json
{
  "message": "Empresa creada exitosamente",
  "data": {
    "id": "uuid-empresa",
    "nombre": "Nueva Empresa",
    // ... resto de datos
  }
}
```

#### 4. Actualizar Empresa
- **URL**: `PUT /api/empresas/:id`
- **Descripción**: Actualizar información de una empresa
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID de la empresa)
- **Body**: Mismos campos que crear, pero opcionales
- **Respuesta exitosa** (200):
```json
{
  "message": "Empresa actualizada exitosamente",
  "data": {
    // Datos actualizados de la empresa
  }
}
```

#### 5. Eliminar Empresa
- **URL**: `DELETE /api/empresas/:id`
- **Descripción**: Eliminar una empresa
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID de la empresa)
- **Respuesta exitosa** (200):
```json
{
  "message": "Empresa eliminada exitosamente"
}
```

#### 6. Obtener Personal de una Empresa
- **URL**: `GET /api/empresas/:id/personal`
- **Descripción**: Obtener lista de personal asociado a una empresa
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID de la empresa)
- **Query Parameters**:
  - `page` (opcional): Número de página (default: 1)
  - `limit` (opcional): Elementos por página (default: 10)
- **Respuesta exitosa** (200):
```json
{
  "empresa": {
    "id": "uuid-empresa",
    "nombre": "Empresa Ejemplo"
  },
  "data": [
    {
      "id": "uuid-personal",
      "nombre": "Juan",
      "apellido": "Pérez",
      "cargo": "Técnico"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

### 🎓 Cursos/Certificaciones (`/api/cursos`)

#### 1. Obtener Lista de Cursos
- **URL**: `GET /api/cursos`
- **Descripción**: Obtener lista paginada de cursos/certificaciones con filtros
- **Autenticación**: JWT Token requerido
- **Query Parameters**:
  - `limit` (opcional): Elementos por página (default: 20)
  - `offset` (opcional): Número de registros a omitir (default: 0)
- **Respuesta exitosa** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre_curso": "Seguridad Industrial",
      "descripcion": "Curso básico de seguridad",
      "duracion_horas": 40,
      "tipo_certificacion": "Básico",
      "nivel_requerido": "Sin experiencia",
      "vigencia_meses": 12,
      "fecha_creacion": "2024-01-15T10:00:00.000Z",
      "personal_disponible": {
        "rut": "12345678-9",
        "cargo": "Operario",
        "zona_geografica": "Norte"
      }
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "count": 1
  }
}
```

#### 2. Obtener Curso por ID
- **URL**: `GET /api/cursos/:id`
- **Descripción**: Obtener información detallada de un curso específico
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (ID del curso)
- **Respuesta exitosa** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre_curso": "Seguridad Industrial",
    "descripcion": "Curso básico de seguridad",
    "duracion_horas": 40,
    "tipo_certificacion": "Básico",
    "nivel_requerido": "Sin experiencia",
    "vigencia_meses": 12,
    "fecha_creacion": "2024-01-15T10:00:00.000Z",
    "personal_disponible": {
      "rut": "12345678-9",
      "cargo": "Operario"
    }
  }
}
```

#### 3. Crear Nuevo Curso
- **URL**: `POST /api/cursos`
- **Descripción**: Crear un nuevo curso/certificación
- **Autenticación**: JWT Token requerido
- **Body**:
```json
{
  "nombre_curso": "Primeros Auxilios",
  "descripcion": "Curso de primeros auxilios básicos",
  "duracion_horas": 20,
  "tipo_certificacion": "Básico",
  "nivel_requerido": "Sin experiencia",
  "vigencia_meses": 12,
  "rut_personal": "12345678-9"
}
```
- **Respuesta exitosa** (201):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "nombre_curso": "Primeros Auxilios",
    "descripcion": "Curso de primeros auxilios básicos",
    "duracion_horas": 20,
    "tipo_certificacion": "Básico",
    "nivel_requerido": "Sin experiencia",
    "vigencia_meses": 12,
    "rut_personal": "12345678-9",
    "fecha_creacion": "2024-01-20T14:30:00.000Z"
  },
  "message": "Curso creado exitosamente"
}
```

#### 4. Actualizar Curso
- **URL**: `PUT /api/cursos/:id`
- **Descripción**: Actualizar información de un curso
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (ID del curso)
- **Body**: Mismos campos que crear, pero opcionales
- **Respuesta exitosa** (200):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "nombre_curso": "Primeros Auxilios Avanzados",
    "descripcion": "Curso avanzado de primeros auxilios",
    "duracion_horas": 30,
    // ... resto de datos actualizados
  },
  "message": "Curso actualizado exitosamente"
}
```

#### 5. Eliminar Curso
- **URL**: `DELETE /api/cursos/:id`
- **Descripción**: Eliminar un curso/certificación
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (ID del curso)
- **Respuesta exitosa** (200):
```json
{
  "success": true,
  "message": "Curso eliminado exitosamente"
}
```

---

### 🛠️ Servicios (`/api/servicios`)

#### 1. Obtener Lista de Servicios
- **URL**: `GET /api/servicios`
- **Descripción**: Obtener lista paginada de servicios con filtros
- **Autenticación**: JWT Token requerido
- **Query Parameters**:
  - `page` (opcional): Número de página (default: 1)
  - `limit` (opcional): Elementos por página (default: 10, max: 100)
  - `search` (opcional): Término de búsqueda
  - `filtro` (opcional): Tipo de filtro (`nombre`, `descripcion`)
- **Respuesta exitosa** (200):
```json
{
  "data": [
    {
      "id": "uuid-servicio",
      "nombre": "Mantenimiento Industrial",
      "descripcion": "Servicios de mantenimiento preventivo y correctivo",
      "precio": 50000,
      "duracion_horas": 8,
      "activo": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 20,
    "totalPages": 2
  }
}
```

#### 2. Obtener Servicio por ID
- **URL**: `GET /api/servicios/:id`
- **Descripción**: Obtener información de un servicio específico
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID del servicio)
- **Respuesta exitosa** (200):
```json
{
  "data": {
    "id": "uuid-servicio",
    "nombre": "Mantenimiento Industrial",
    "descripcion": "Servicios de mantenimiento preventivo y correctivo",
    "precio": 50000,
    "duracion_horas": 8,
    "activo": true
  }
}
```

#### 3. Crear Nuevo Servicio
- **URL**: `POST /api/servicios`
- **Descripción**: Crear un nuevo servicio
- **Autenticación**: JWT Token requerido
- **Body**:
```json
{
  "nombre": "Nuevo Servicio",
  "descripcion": "Descripción del nuevo servicio",
  "precio": 30000,
  "duracion_horas": 4
}
```
- **Respuesta exitosa** (201):
```json
{
  "message": "Servicio creado exitosamente",
  "data": {
    "id": "uuid-servicio",
    "nombre": "Nuevo Servicio",
    // ... resto de datos
  }
}
```

#### 4. Actualizar Servicio
- **URL**: `PUT /api/servicios/:id`
- **Descripción**: Actualizar información de un servicio
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID del servicio)
- **Body**: Mismos campos que crear, pero opcionales
- **Respuesta exitosa** (200):
```json
{
  "message": "Servicio actualizado exitosamente",
  "data": {
    // Datos actualizados del servicio
  }
}
```

#### 5. Eliminar Servicio
- **URL**: `DELETE /api/servicios/:id`
- **Descripción**: Eliminar un servicio
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID del servicio)
- **Respuesta exitosa** (200):
```json
{
  "message": "Servicio eliminado exitosamente"
}
```

#### 6. Obtener Personal de un Servicio
- **URL**: `GET /api/servicios/:id/personal`
- **Descripción**: Obtener lista de personal asociado a un servicio
- **Autenticación**: JWT Token requerido
- **Parámetros**: `id` (UUID del servicio)
- **Query Parameters**:
  - `page` (opcional): Número de página (default: 1)
  - `limit` (opcional): Elementos por página (default: 10)
- **Respuesta exitosa** (200):
```json
{
  "servicio": {
    "id": "uuid-servicio",
    "nombre": "Mantenimiento Industrial"
  },
  "data": [
    {
      "id": "uuid-personal",
      "nombre": "Juan",
      "apellido": "Pérez",
      "cargo": "Técnico"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1
  }
}
```

#### 7. Obtener Estadísticas de Servicios
- **URL**: `GET /api/servicios/stats/estadisticas`
- **Descripción**: Obtener estadísticas generales de servicios
- **Autenticación**: JWT Token requerido
- **Respuesta exitosa** (200):
```json
{
  "estadisticas": {
    "totalServicios": 20,
    "precioPromedio": 35000,
    "precioMinimo": 15000,
    "precioMaximo": 80000,
    "serviciosPopulares": [
      {
        "id": "uuid-servicio",
        "nombre": "Mantenimiento Industrial",
        "personal_servicio": {
          "count": 5
        }
      }
    ]
  }
}
```

---

### 🏥 Utilidades

#### 1. Health Check
- **URL**: `GET /api/health`
- **Descripción**: Verificar estado del servidor
- **Autenticación**: No requerida
- **Respuesta exitosa** (200):
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

#### 2. Información de la API
- **URL**: `GET /`
- **Descripción**: Obtener información general de la API
- **Autenticación**: No requerida
- **Respuesta exitosa** (200):
```json
{
  "message": "API de Gestión de Personal",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "personal": "/api/personal",
    "empresas": "/api/empresas",
    "servicios": "/api/servicios",
    "cursos": "/api/cursos",
    "health": "/api/health"
  }
}
```

---

## 📝 Códigos de Respuesta

### Códigos de Éxito
- **200**: OK - Operación exitosa
- **201**: Created - Recurso creado exitosamente
- **204**: No Content - Operación exitosa sin contenido

### Códigos de Error del Cliente
- **400**: Bad Request - Datos de entrada inválidos
- **401**: Unauthorized - Autenticación requerida o fallida
- **403**: Forbidden - Acceso denegado
- **404**: Not Found - Recurso no encontrado
- **409**: Conflict - Conflicto (ej: RUT duplicado)
- **422**: Unprocessable Entity - Datos válidos pero no procesables

### Códigos de Error del Servidor
- **500**: Internal Server Error - Error interno del servidor
- **502**: Bad Gateway - Error de gateway
- **503**: Service Unavailable - Servicio no disponible

---

## 🔍 Ejemplos de Uso

### Ejemplo 1: Registro y Login
```bash
# 1. Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "contraseña123",
    "nombre": "Juan",
    "apellido": "Pérez"
  }'

# 2. Iniciar sesión
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "contraseña123"
  }'
```

### Ejemplo 2: Crear Personal
```bash
# Crear nuevo personal (requiere token)
curl -X POST http://localhost:3000/api/personal \
  -H "Authorization: Bearer <tu-token-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María",
    "apellido": "González",
    "rut": "12.345.678-9",
    "fecha_nacimiento": "1990-05-15",
    "cargo": "Técnico",
    "email": "maria@empresa.com",
    "telefono": "+56912345678"
  }'
```

### Ejemplo 3: Búsqueda con Filtros
```bash
# Buscar personal por nombre
curl -X GET "http://localhost:3000/api/personal?search=Juan&filtro=nombre&page=1&limit=10" \
  -H "Authorization: Bearer <tu-token-jwt>"
```

---

## 🛡️ Validaciones

### Personal
- **nombre**: 2-50 caracteres
- **apellido**: 2-50 caracteres
- **rut**: Formato XX.XXX.XXX-X
- **fecha_nacimiento**: Fecha válida
- **cargo**: 2-100 caracteres
- **email**: Email válido (opcional)
- **telefono**: Formato válido (opcional)

### Empresas
- **nombre**: 2-100 caracteres
- **rut_empresa**: Formato XX.XXX.XXX-X
- **direccion**: 5-200 caracteres
- **email**: Email válido (opcional)
- **telefono**: Formato válido (opcional)

### Servicios
- **nombre**: 2-100 caracteres
- **descripcion**: 10-500 caracteres
- **precio**: Número positivo
- **duracion_horas**: Número entero positivo (opcional)

### Autenticación
- **email**: Email válido
- **password**: Mínimo 6 caracteres
- **nombre**: 2-50 caracteres
- **apellido**: 2-50 caracteres

---

## 📊 Paginación

Todos los endpoints que devuelven listas soportan paginación:

- **page**: Número de página (default: 1)
- **limit**: Elementos por página (default: 10, max: 100)

La respuesta incluye información de paginación:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

## 🔍 Búsqueda y Filtros

Los endpoints de listado soportan búsqueda y filtros:

- **search**: Término de búsqueda (mínimo 2 caracteres)
- **filtro**: Tipo de filtro específico

### Filtros Disponibles

#### Personal
- `nombre`: Buscar por nombre o apellido
- `cargo`: Buscar por cargo
- `empresa`: Buscar por empresa
- `servicio`: Buscar por servicio

#### Empresas
- `nombre`: Buscar por nombre
- `rut`: Buscar por RUT

#### Servicios
- `nombre`: Buscar por nombre
- `descripcion`: Buscar por descripción

---

## 🚀 Notas Importantes

1. **Autenticación**: Todas las rutas excepto `/api/auth/*`, `/api/health` y `/` requieren autenticación JWT.

2. **CORS**: La API está configurada para aceptar peticiones desde orígenes específicos.

3. **Rate Limiting**: Se recomienda implementar límites de tasa para prevenir abuso.

4. **Validación**: Todos los datos de entrada son validados antes de ser procesados.

5. **Errores**: Los errores devuelven información detallada en formato JSON.

6. **Logging**: Todas las peticiones son registradas para monitoreo.

---


---

