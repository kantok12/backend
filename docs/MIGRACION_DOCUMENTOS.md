# 🔄 Migración de Estructura de Documentos

## 📋 Resumen

Se ha realizado una migración importante en la estructura de la base de datos para **separar los documentos de los cursos**, permitiendo que los documentos se relacionen directamente con `personal_disponible` en lugar de depender de `cursos_certificaciones`.

## 🎯 Objetivo

**Antes**: `cursos_documentos` → `cursos_certificaciones` → `personal_disponible`  
**Después**: `documentos` → `personal_disponible`

Esta mejora permite:
- ✅ Gestión independiente de documentos
- ✅ Documentos no limitados a cursos específicos
- ✅ Mayor flexibilidad en la organización de documentos
- ✅ Estructura más simple y clara

## 🏗️ Cambios Realizados

### 1. Nueva Tabla `documentos`

```sql
CREATE TABLE mantenimiento.documentos (
    id SERIAL PRIMARY KEY,
    rut_persona TEXT NOT NULL,
    nombre_documento VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(100) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamaño_bytes BIGINT NOT NULL,
    ruta_archivo TEXT NOT NULL,
    descripcion TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subido_por VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT fk_documento_persona FOREIGN KEY (rut_persona) 
        REFERENCES mantenimiento.personal_disponible(rut) ON DELETE CASCADE
);
```

### 2. Tipos de Documento Soportados

- `certificado_curso` - Certificado de Curso
- `diploma` - Diploma
- `certificado_laboral` - Certificado Laboral
- `certificado_medico` - Certificado Médico
- `licencia_conducir` - Licencia de Conducir
- `certificado_seguridad` - Certificado de Seguridad
- `certificado_vencimiento` - Certificado de Vencimiento
- `otro` - Otro

### 3. Migración de Datos

Los datos existentes en `cursos_documentos` se migran automáticamente a la nueva tabla `documentos` con:
- `rut_persona` obtenido del curso relacionado
- `nombre_documento` generado como "Nombre del Curso - Documento"
- `tipo_documento` establecido como "certificado_curso"

## 🚀 Nuevos Endpoints

### Documentos (`/api/documentos`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Listar documentos (con filtros) |
| `POST` | `/` | Subir documentos |
| `GET` | `/:id` | Obtener documento por ID |
| `GET` | `/persona/:rut` | Obtener documentos por RUT |
| `GET` | `/:id/descargar` | Descargar documento |
| `DELETE` | `/:id` | Eliminar documento (soft delete) |
| `GET` | `/tipos` | Obtener tipos de documento disponibles |

### Ejemplos de Uso

#### Subir Documentos
```bash
POST /api/documentos
Content-Type: multipart/form-data

{
  "rut_persona": "12345678-9",
  "nombre_documento": "Certificado de Seguridad Industrial",
  "tipo_documento": "certificado_seguridad",
  "descripcion": "Certificado vigente hasta 2025",
  "archivos": [archivo1.pdf, archivo2.jpg]
}
```

#### Obtener Documentos por Persona
```bash
GET /api/documentos/persona/12345678-9?tipo_documento=certificado_curso&limit=10
```

#### Filtrar Documentos
```bash
GET /api/documentos?rut=12345678-9&tipo_documento=diploma&nombre_documento=seguridad
```

## 📁 Archivos Creados/Modificados

### Scripts de Migración
- `scripts/migrate-documentos-structure.sql` - Script SQL de migración
- `scripts/migrate-documentos-structure.js` - Script JavaScript de migración

### Nuevas Rutas
- `routes/documentos.js` - Endpoints para gestión de documentos

### Documentación Actualizada
- `docs/ANALISIS_ESQUEMA_MANTENIMIENTO.md` - Esquema actualizado
- `docs/MIGRACION_DOCUMENTOS.md` - Este archivo

## 🔧 Cómo Ejecutar la Migración

### Opción 1: Script JavaScript (Recomendado)
```bash
# Ejecutar migración
node scripts/migrate-documentos-structure.js

# Verificar estado
node scripts/migrate-documentos-structure.js check
```

### Opción 2: Script SQL
```bash
# Ejecutar en PostgreSQL
psql -d tu_base_de_datos -f scripts/migrate-documentos-structure.sql
```

## ⚠️ Consideraciones Importantes

### Antes de la Migración
1. **Backup**: Hacer respaldo de la base de datos
2. **Verificar**: Confirmar que no hay aplicaciones usando `cursos_documentos`
3. **Notificar**: Informar a usuarios sobre el mantenimiento

### Después de la Migración
1. **Probar**: Verificar que todos los endpoints funcionan
2. **Validar**: Confirmar que los datos se migraron correctamente
3. **Limpiar**: Eliminar tablas obsoletas `cursos_documentos` y `cursos_certificaciones`

### Eliminar Tablas Obsoletas
```bash
# Verificar estado de limpieza
GET /api/migration/cleanup-status

# Ejecutar limpieza
POST /api/migration/cleanup

# O usando script directo
node scripts/execute-cleanup.js
```

## 🔍 Verificación Post-Migración

### 1. Verificar Datos Migrados
```sql
SELECT 
  'documentos' as tabla,
  COUNT(*) as registros
FROM mantenimiento.documentos
UNION ALL
SELECT 
  'cursos_documentos' as tabla,
  COUNT(*) as registros
FROM mantenimiento.cursos_documentos
WHERE activo = true;
```

### 2. Probar Endpoints
```bash
# Listar documentos
curl http://localhost:3000/api/documentos

# Obtener tipos de documento
curl http://localhost:3000/api/documentos/tipos

# Obtener documentos por persona
curl http://localhost:3000/api/documentos/persona/12345678-9
```

### 3. Verificar Funcionalidad
- ✅ Subir documentos
- ✅ Listar documentos con filtros
- ✅ Descargar documentos
- ✅ Eliminar documentos
- ✅ Obtener documentos por persona

## 📊 Beneficios de la Nueva Estructura

### Para Desarrolladores
- **Código más simple**: Menos JOINs en consultas
- **Endpoints independientes**: Mejor organización de la API
- **Flexibilidad**: Fácil agregar nuevos tipos de documento

### Para Usuarios
- **Gestión independiente**: Documentos no limitados a cursos
- **Mejor organización**: Tipos de documento claramente definidos
- **Búsqueda mejorada**: Filtros más específicos

### Para el Sistema
- **Performance**: Consultas más eficientes
- **Escalabilidad**: Estructura más preparada para crecimiento
- **Mantenimiento**: Código más fácil de mantener

## 🎉 Conclusión

La migración ha sido exitosa y la nueva estructura de documentos proporciona:
- ✅ Mayor flexibilidad
- ✅ Mejor organización
- ✅ Código más limpio
- ✅ Endpoints más intuitivos
- ✅ Mejor experiencia de usuario

La tabla `cursos_documentos` puede eliminarse de forma segura una vez confirmado que todo funciona correctamente.

---

**Fecha de migración**: 10 de septiembre de 2025  
**Versión**: 1.1.0  
**Estado**: ✅ Completada y funcional
