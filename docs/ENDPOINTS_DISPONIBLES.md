# 🌐 Endpoints Disponibles - API Sistema de Mantenimiento

## 📋 Resumen General

**Versión**: 1.1.0  
**Base URL**: `http://localhost:3000`  
**Estado**: Desarrollo (sin autenticación)  
**Descripción**: Sistema de gestión de personal, cursos y documentos

---

## 🔐 Autenticación

### `/api/auth-temp`
- **Descripción**: Autenticación temporal para desarrollo
- **Métodos**: `GET`, `POST`

### `/api/auth`
- **Descripción**: Autenticación principal
- **Métodos**: `GET`, `POST`

---

## 👥 Gestión de Personal

### `/api/estados`
- **Descripción**: Gestión de estados del personal
- **Métodos**: `GET`, `POST`, `PUT`, `DELETE`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Listar todos los estados |
| `POST` | `/` | Crear nuevo estado |
| `GET` | `/:id` | Obtener estado por ID |
| `PUT` | `/:id` | Actualizar estado |
| `DELETE` | `/:id` | Eliminar estado |

### `/api/personal-disponible`
- **Descripción**: Gestión del personal disponible
- **Métodos**: `GET`, `POST`, `PUT`, `DELETE`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Listar personal (con filtros y paginación) |
| `POST` | `/` | Crear nuevo personal |
| `GET` | `/:rut` | Obtener personal por RUT |
| `PUT` | `/:rut` | Actualizar personal |
| `DELETE` | `/:rut` | Eliminar personal |

### `/api/nombres`
- **Descripción**: Gestión de nombres del personal
- **Métodos**: `GET`, `POST`, `PUT`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Listar nombres del personal |
| `GET` | `/:rut` | Obtener nombre por RUT |
| `POST` | `/` | Crear nombre |
| `PUT` | `/:rut` | Actualizar nombre |

---

## 📚 Gestión de Cursos

### `/api/cursos`
- **Descripción**: Gestión de cursos y certificaciones
- **Métodos**: `GET`, `POST`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Listar cursos (con filtros) |
| `POST` | `/` | Crear curso |
| `GET` | `/persona/:rut` | Cursos por persona |
| `POST` | `/:id/documentos` | Subir documentos a curso |
| `GET` | `/:id/documentos` | Ver documentos de curso |

---

## 🏢 Área de Servicio

### `/api/area-servicio`
- **Descripción**: Gestión especializada del área de servicio y personal disponible
- **Métodos**: `GET`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Listar personal del área de servicio (con filtros) |
| `GET` | `/stats` | Estadísticas del área de servicio |
| `GET` | `/cargos` | Listar cargos disponibles |
| `GET` | `/zonas` | Listar zonas geográficas |
| `GET` | `/cargo/:cargo` | Personal por cargo específico |
| `GET` | `/zona/:zona` | Personal por zona geográfica |
| `GET` | `/disponibles` | Personal disponible para servicio |

#### Ejemplos de Uso:
```bash
# Listar personal del área de servicio
GET /api/area-servicio?cargo=operador&estado_id=1

# Estadísticas del área de servicio
GET /api/area-servicio/stats

# Personal por cargo específico
GET /api/area-servicio/cargo/operador

# Personal por zona geográfica
GET /api/area-servicio/zona/norte

# Personal disponible para servicio
GET /api/area-servicio/disponibles?cargo=supervisor

# Listar cargos disponibles
GET /api/area-servicio/cargos

# Listar zonas geográficas
GET /api/area-servicio/zonas
```

---

#### Ejemplos de Uso - Cursos:
```bash
# Listar cursos
GET /api/cursos?rut=12345678-9&curso=seguridad

# Cursos por persona
GET /api/cursos/persona/12345678-9

# Subir documentos a curso
POST /api/cursos/1/documentos
Content-Type: multipart/form-data
```

---

## 📄 Gestión de Documentos (NUEVO)

### `/api/documentos`
- **Descripción**: Gestión independiente de documentos
- **Métodos**: `GET`, `POST`, `DELETE`
- **Características**: Documentos no limitados a cursos específicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Listar documentos (con filtros) |
| `POST` | `/` | Subir documentos |
| `GET` | `/:id` | Obtener documento por ID |
| `GET` | `/persona/:rut` | Documentos por persona |
| `GET` | `/:id/descargar` | Descargar documento |
| `DELETE` | `/:id` | Eliminar documento (soft delete) |
| `GET` | `/tipos` | Tipos de documento disponibles |

#### Filtros Disponibles:
- `rut`: Filtrar por RUT de persona
- `tipo_documento`: Filtrar por tipo de documento
- `nombre_documento`: Filtrar por nombre del documento
- `limit`: Límite de resultados (default: 50)
- `offset`: Offset para paginación (default: 0)

#### Tipos de Documento Soportados:
- `certificado_curso` - Certificado de Curso
- `diploma` - Diploma
- `certificado_laboral` - Certificado Laboral
- `certificado_medico` - Certificado Médico
- `licencia_conducir` - Licencia de Conducir
- `certificado_seguridad` - Certificado de Seguridad
- `certificado_vencimiento` - Certificado de Vencimiento
- `otro` - Otro

#### Ejemplos de Uso:
```bash
# Listar documentos
GET /api/documentos?rut=12345678-9&tipo_documento=certificado_curso

# Subir documentos
POST /api/documentos
Content-Type: multipart/form-data
{
  "rut_persona": "12345678-9",
  "nombre_documento": "Certificado de Seguridad",
  "tipo_documento": "certificado_seguridad",
  "descripcion": "Certificado vigente hasta 2025",
  "archivos": [archivo1.pdf, archivo2.jpg]
}

# Documentos por persona
GET /api/documentos/persona/12345678-9?tipo_documento=diploma

# Descargar documento
GET /api/documentos/1/descargar

# Obtener tipos disponibles
GET /api/documentos/tipos
```

---

## 🔧 Herramientas de Migración

### `/api/migration`
- **Descripción**: Herramientas de migración de base de datos
- **Métodos**: `GET`, `POST`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/status` | Verificar estado de migración |
| `POST` | `/run` | Ejecutar migración de documentos |

#### Ejemplos de Uso:
```bash
# Verificar estado
GET /api/migration/status

# Ejecutar migración
POST /api/migration/run
```

---

## 🏥 Estado del Sistema

### `/api/health`
- **Descripción**: Estado del servidor
- **Métodos**: `GET`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Estado del servidor y timestamp |

#### Respuesta:
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2025-01-10T10:30:00.000Z",
  "environment": "development"
}
```

---

## 🆕 Nuevas Características v1.1.0

### 📄 Documentos Independientes
- **Beneficio**: Documentos no limitados a cursos específicos
- **Características**:
  - Gestión independiente de documentos
  - Tipos de documento claramente definidos
  - Filtros avanzados de búsqueda
  - Subida múltiple de archivos
  - Soft delete para eliminación segura

### 🔧 Herramientas de Migración
- **Beneficio**: Migración segura de datos existentes
- **Características**:
  - Verificación de estado de migración
  - Rollback automático en caso de error
  - Migración de datos desde estructura anterior

---

## 📊 Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| `200` | OK - Solicitud exitosa |
| `201` | Created - Recurso creado exitosamente |
| `400` | Bad Request - Error en la solicitud |
| `404` | Not Found - Recurso no encontrado |
| `500` | Internal Server Error - Error interno del servidor |

---

## 🔍 Formato de Respuestas

### Respuesta Exitosa:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

### Respuesta con Paginación:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Respuesta de Error:
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos del error"
}
```

---

## 🚀 Próximos Pasos

1. **Ejecutar migración**: `POST /api/migration/run`
2. **Verificar estado**: `GET /api/migration/status`
3. **Probar nuevos endpoints**: `GET /api/documentos/tipos`
4. **Subir documentos**: `POST /api/documentos`

---

**Última actualización**: 10 de enero de 2025  
**Versión**: 1.1.0  
**Estado**: ✅ Funcional y listo para uso
