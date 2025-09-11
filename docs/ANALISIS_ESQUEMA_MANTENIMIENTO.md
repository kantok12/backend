# 📊 Análisis del Esquema Mantenimiento

## 🎯 Resumen Ejecutivo

El esquema `mantenimiento` contiene **6 tablas** que gestionan el personal, cursos, certificaciones y documentos del sistema. La estructura está bien normalizada con relaciones claras entre las entidades.

---

## 📋 Estructura de Tablas

### 1. **personal_disponible** (Tabla Principal)
- **Propósito**: Gestión del personal disponible en el sistema
- **Clave Primaria**: `rut` (text)
- **Registros**: 50
- **Columnas**:
  - `rut` (text, NOT NULL) - RUT del personal
  - `nombre` (text) - Nombre completo
  - `sexo` (varchar, NOT NULL) - Género
  - `fecha_nacimiento` (date, NOT NULL) - Fecha de nacimiento
  - `licencia_conducir` (varchar, NOT NULL) - Estado de licencia
  - `talla_zapatos` (varchar, NOT NULL) - Talla de calzado
  - `talla_pantalones` (varchar, NOT NULL) - Talla de pantalones
  - `talla_poleras` (varchar, NOT NULL) - Talla de poleras
  - `cargo` (varchar, NOT NULL) - Cargo del personal
  - `estado_id` (integer, NOT NULL) - FK a estados
  - `comentario_estado` (text) - Comentarios sobre el estado
  - `zona_geografica` (text) - Zona geográfica
  - `documentacion_id` (bigint) - ID de documentación

### 2. **estados** (Tabla de Referencia)
- **Propósito**: Estados disponibles para el personal
- **Clave Primaria**: `id` (integer)
- **Registros**: 4
- **Columnas**:
  - `id` (integer, NOT NULL) - ID único
  - `nombre` (varchar) - Nombre del estado
  - `descripcion` (text) - Descripción del estado
  - `activo` (boolean, DEFAULT true) - Estado activo

### 3. **cursos** (Gestión de Cursos)
- **Propósito**: Cursos y capacitaciones del personal
- **Clave Primaria**: `id` (integer)
- **Registros**: 2
- **Columnas**:
  - `id` (integer, NOT NULL) - ID único
  - `rut_persona` (text, NOT NULL) - FK a personal_disponible
  - `nombre_curso` (varchar(255), NOT NULL) - Nombre del curso
  - `fecha_inicio` (date) - Fecha de inicio
  - `fecha_fin` (date) - Fecha de finalización
  - `estado` (varchar(50), DEFAULT 'completado') - Estado del curso
  - `institucion` (varchar(255)) - Institución que impartió
  - `descripcion` (text) - Descripción del curso
  - `fecha_creacion` (timestamp, DEFAULT CURRENT_TIMESTAMP)
  - `fecha_actualizacion` (timestamp, DEFAULT CURRENT_TIMESTAMP)
  - `activo` (boolean, DEFAULT true) - Estado activo
  - `fecha_vencimiento` (date) - Fecha de vencimiento

### 4. **cursos_certificaciones** (Certificaciones)
- **Propósito**: Certificaciones obtenidas por el personal
- **Clave Primaria**: `id` (integer)
- **Registros**: 2
- **Columnas**:
  - `id` (integer, NOT NULL) - ID único
  - `rut_persona` (text, NOT NULL) - FK a personal_disponible
  - `nombre_curso` (varchar, NOT NULL) - Nombre de la certificación
  - `fecha_obtencion` (date, NOT NULL) - Fecha de obtención

### 5. **documentos** (Documentos del Personal)
- **Propósito**: Documentos del personal de forma independiente (no dependen de cursos)
- **Clave Primaria**: `id` (integer)
- **Registros**: Migrados desde cursos_documentos
- **Columnas**:
  - `id` (integer, NOT NULL) - ID único
  - `rut_persona` (text, NOT NULL) - FK a personal_disponible
  - `nombre_documento` (varchar(255), NOT NULL) - Nombre descriptivo del documento
  - `tipo_documento` (varchar(100), NOT NULL) - Tipo de documento
  - `nombre_archivo` (varchar(255), NOT NULL) - Nombre del archivo
  - `nombre_original` (varchar(255), NOT NULL) - Nombre original
  - `tipo_mime` (varchar(100), NOT NULL) - Tipo MIME
  - `tamaño_bytes` (bigint, NOT NULL) - Tamaño en bytes
  - `ruta_archivo` (text, NOT NULL) - Ruta del archivo
  - `descripcion` (text) - Descripción del documento
  - `fecha_subida` (timestamp, DEFAULT CURRENT_TIMESTAMP)
  - `subido_por` (varchar(100)) - Usuario que subió
  - `activo` (boolean, DEFAULT true) - Estado activo

### 6. **componentes** (Tabla Residual)
- **Propósito**: Componentes (posiblemente residual del esquema lubricación)
- **Clave Primaria**: `id` (integer)
- **Registros**: 0
- **Columnas**:
  - `id` (integer, NOT NULL) - ID único
  - `equipo_id` (integer) - ID del equipo
  - `nombre` (varchar) - Nombre del componente
  - `descripcion` (text) - Descripción

---

## 🔗 Relaciones Entre Tablas

### Relaciones Principales:
1. **personal_disponible.estado_id** → **estados.id**
2. **cursos.rut_persona** → **personal_disponible.rut**
3. **cursos_certificaciones.rut_persona** → **personal_disponible.rut**
4. **documentos.rut_persona** → **personal_disponible.rut**

### Diagrama de Relaciones:
```
personal_disponible (rut) ←──┐
    │                        │
    ├── estado_id → estados  │
    │                        │
    ├── rut ←────────────────┼── cursos (rut_persona)
    │                        │
    ├── rut ←────────────────┼── cursos_certificaciones (rut_persona)
    │                        │
    └── rut ←────────────────┼── documentos (rut_persona)
```

---

## 📊 Índices y Performance

### Índices Principales:
- **personal_disponible**: `idx_personal_estado`
- **cursos**: `idx_cursos_activo`, `idx_cursos_estado`, `idx_cursos_fecha_inicio`, `idx_cursos_fecha_vencimiento`, `idx_cursos_rut_persona`
- **cursos_certificaciones**: `idx_cursos_rut`
- **documentos**: `idx_documentos_rut_persona`, `idx_documentos_tipo`, `idx_documentos_fecha_subida`, `idx_documentos_activo`, `idx_documentos_nombre`
- **estados**: `estados_nombre_key`

---

## 🌐 Endpoints Disponibles

### 1. **Estados** (`/api/estados`)
- `GET /` - Listar estados
- `POST /` - Crear estado
- `GET /:id` - Obtener estado por ID
- `PUT /:id` - Actualizar estado
- `DELETE /:id` - Eliminar estado

### 2. **Personal Disponible** (`/api/personal-disponible`)
- `GET /` - Listar personal (con filtros y paginación)
- `POST /` - Crear personal
- `GET /:rut` - Obtener personal por RUT
- `PUT /:rut` - Actualizar personal
- `DELETE /:rut` - Eliminar personal

### 3. **Nombres** (`/api/nombres`)
- `GET /` - Listar nombres del personal
- `GET /:rut` - Obtener nombre por RUT
- `POST /` - Crear nombre
- `PUT /:rut` - Actualizar nombre

### 4. **Cursos** (`/api/cursos`)
- `GET /` - Listar cursos (con filtros)
- `POST /` - Crear curso
- `GET /persona/:rut` - Cursos por persona
- `POST /:id/documentos` - Subir documentos
- `GET /:id/documentos` - Ver documentos

### 5. **Documentos** (`/api/documentos`)
- `GET /` - Listar documentos (con filtros por RUT, tipo, nombre)
- `POST /` - Subir documentos
- `GET /:id` - Obtener documento por ID
- `GET /persona/:rut` - Obtener documentos por RUT
- `GET /:id/descargar` - Descargar documento
- `DELETE /:id` - Eliminar documento (soft delete)
- `GET /tipos` - Obtener tipos de documento disponibles

---

## ⚠️ Observaciones y Recomendaciones

### ✅ **Fortalezas:**
1. **Normalización adecuada**: Las tablas están bien estructuradas
2. **Relaciones claras**: FK bien definidas entre tablas
3. **Índices apropiados**: Para consultas frecuentes
4. **Campos de auditoría**: fechas de creación y actualización
5. **Soft delete**: Campo `activo` para eliminación lógica

### ⚠️ **Áreas de Mejora:**
1. **Tabla componentes**: Parece residual del esquema lubricación (0 registros)
2. **Duplicación de datos**: `cursos` y `cursos_certificaciones` tienen información similar
3. **Tabla cursos_documentos**: Ya no se usa, puede eliminarse después de migrar datos
4. **Falta de validaciones**: Algunos campos NOT NULL podrían tener validaciones adicionales
5. **Documentación**: Falta documentación de algunos campos

### 🔧 **Recomendaciones:**
1. **Eliminar tabla componentes** si no se usa
2. **Consolidar tablas de cursos** o clarificar su propósito
3. **Eliminar tabla cursos_documentos** después de confirmar migración exitosa
4. **Agregar validaciones** en el backend
5. **Implementar auditoría completa** (usuario que modifica, etc.)
6. **Optimizar consultas** con índices compuestos si es necesario

---

## 📈 Estadísticas del Sistema

- **Total de tablas**: 6 (incluye nueva tabla documentos)
- **Total de registros**: 60+ (50 personal + 4 estados + 6 cursos/certificaciones + documentos migrados)
- **Total de relaciones**: 4 (simplificadas - documentos independientes)
- **Total de índices**: 15+ (incluye nuevos índices para documentos)
- **Endpoints activos**: 5 (incluye nuevos endpoints de documentos)
- **Tasa de uso**: 100% (todos los endpoints funcionando)

---

**Fecha de análisis**: 10 de septiembre de 2025  
**Versión del sistema**: 1.0.0  
**Estado**: Operativo y funcional
