# 🏗️ Nueva Estructura: Cursos y Documentos Separados

## 🎯 **Resumen**
Se ha reestructurado completamente el sistema para separar **cursos** y **documentos** en **2 tablas independientes**, ambas asociadas al RUT de la persona de la tabla `personal_disponible`.

---

## 📊 **Nueva Estructura de Base de Datos**

### **1. Tabla `mantenimiento.cursos`**
```sql
- id: integer (PK, auto-increment)
- rut_persona: text (RUT del personal) [FK a personal_disponible]
- nombre_curso: varchar(255) (Nombre del curso)
- fecha_inicio: date (Fecha de inicio del curso)
- fecha_fin: date (Fecha de finalización del curso)
- estado: varchar(50) (pendiente, en_progreso, completado, cancelado)
- institucion: varchar(255) (Institución que impartió el curso)
- descripcion: text (Descripción adicional del curso)
- fecha_creacion: timestamp (Fecha de creación del registro)
- fecha_actualizacion: timestamp (Fecha de última actualización)
- activo: boolean (Estado del registro)
```

### **2. Tabla `mantenimiento.documentos`**
```sql
- id: integer (PK, auto-increment)
- rut_persona: text (RUT del personal) [FK a personal_disponible]
- nombre_documento: varchar(255) (Nombre descriptivo del documento)
- tipo_documento: varchar(100) (certificado_curso, diploma, certificado_laboral, etc.)
- nombre_archivo: varchar(255) (Nombre del archivo en el sistema)
- nombre_original: varchar(255) (Nombre original del archivo)
- tipo_mime: varchar(100) (Tipo MIME del archivo)
- tamaño_bytes: bigint (Tamaño en bytes)
- ruta_archivo: text (Ruta completa del archivo)
- descripcion: text (Descripción opcional)
- fecha_subida: timestamp (Fecha de subida)
- subido_por: varchar(100) (Usuario que subió)
- activo: boolean (Estado del documento)
```

---

## 🔄 **Cambios Realizados**

### **✅ Completado:**
1. **Eliminada tabla antigua:** `cursos_certificaciones`
2. **Creadas nuevas tablas:** `cursos` y `documentos`
3. **Migrados datos existentes:** 2 registros migrados exitosamente
4. **Creados nuevos endpoints:** Para ambas tablas
5. **Actualizado servidor:** Para incluir las nuevas rutas

### **📁 Archivos Creados/Modificados:**
- `scripts/create-tables-simple.js` - Script para crear las nuevas tablas
- `scripts/migrate-data.js` - Script para migrar datos existentes
- `routes/cursos-new.js` - Endpoints para gestión de cursos
- `routes/documentos.js` - Endpoints para gestión de documentos
- `middleware/upload-documentos.js` - Middleware para subida de documentos
- `server.js` - Actualizado para incluir nuevas rutas

---

## 🚀 **Nuevos Endpoints Disponibles**

### **📚 CURSOS (`/api/cursos`)**

#### **GET /api/cursos**
- Listar todos los cursos con filtros
- Parámetros: `limit`, `offset`, `rut`, `curso`, `estado`

#### **GET /api/cursos/persona/:rut**
- Obtener cursos de una persona específica

#### **POST /api/cursos**
- Crear nuevo curso
- Body: `rut_persona`, `nombre_curso`, `fecha_inicio`, `fecha_fin`, `estado`, `institucion`, `descripcion`

#### **PUT /api/cursos/:id**
- Actualizar curso existente

#### **DELETE /api/cursos/:id**
- Eliminar curso (eliminación lógica)

---

### **📄 DOCUMENTOS (`/api/documentos`)**

#### **GET /api/documentos**
- Listar todos los documentos con filtros
- Parámetros: `limit`, `offset`, `rut`, `tipo_documento`

#### **GET /api/documentos/persona/:rut**
- Obtener documentos de una persona específica

#### **POST /api/documentos/persona/:rut**
- Subir documentos para una persona
- Body: `multipart/form-data` con `documentos`, `nombre_documento`, `tipo_documento`, `descripcion`

#### **GET /api/documentos/:id/descargar**
- Descargar documento específico

#### **GET /api/documentos/:id/vista**
- Ver documento en el navegador

#### **PUT /api/documentos/:id**
- Actualizar información del documento

#### **DELETE /api/documentos/:id**
- Eliminar documento (eliminación lógica)

---

## 📋 **Tipos de Documentos Soportados**

### **Tipos permitidos:**
- `certificado_curso` - Certificado de curso
- `diploma` - Diploma académico
- `certificado_laboral` - Certificado laboral
- `certificado_medico` - Certificado médico
- `licencia_conducir` - Licencia de conducir
- `certificado_seguridad` - Certificado de seguridad
- `otro` - Otros tipos de documentos

### **Formatos de archivo:**
- **PDFs:** `.pdf`
- **Imágenes:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`
- **Office:** `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`

### **Límites:**
- **Tamaño máximo:** 50 MB por archivo
- **Máximo archivos:** 5 por request

---

## 🗂️ **Estructura de Almacenamiento**

```
📂 backend/
├── 📁 uploads/
│   ├── 📁 cursos/          # Archivos de cursos (legacy)
│   └── 📁 documentos/      # Archivos de documentos (nuevo)
├── 📁 routes/
│   ├── cursos-new.js       # Endpoints de cursos
│   └── documentos.js       # Endpoints de documentos
└── 📁 middleware/
    └── upload-documentos.js # Middleware para documentos
```

---

## 🧪 **Ejemplos de Uso**

### **Crear un curso:**
```http
POST /api/cursos
Content-Type: application/json

{
  "rut_persona": "18539810-2",
  "nombre_curso": "Seguridad Industrial",
  "fecha_inicio": "2023-11-01",
  "fecha_fin": "2023-12-01",
  "estado": "completado",
  "institucion": "Instituto de Seguridad",
  "descripcion": "Curso de seguridad industrial básica"
}
```

### **Subir un documento:**
```http
POST /api/documentos/persona/18539810-2
Content-Type: multipart/form-data

- documentos: [archivo.pdf]
- nombre_documento: "Certificado de Seguridad Industrial"
- tipo_documento: "certificado_curso"
- descripcion: "Certificado de finalización del curso"
```

### **Obtener cursos de una persona:**
```http
GET /api/cursos/persona/18539810-2
```

### **Obtener documentos de una persona:**
```http
GET /api/documentos/persona/18539810-2
```

---

## 🔗 **Relaciones**

### **Cursos ↔ Personal:**
- `cursos.rut_persona` → `personal_disponible.rut`
- Un personal puede tener múltiples cursos
- Eliminación en cascada si se elimina el personal

### **Documentos ↔ Personal:**
- `documentos.rut_persona` → `personal_disponible.rut`
- Un personal puede tener múltiples documentos
- Eliminación en cascada si se elimina el personal

### **Cursos ↔ Documentos:**
- **NO hay relación directa** entre las tablas
- Los documentos se asocian directamente al RUT de la persona
- Un documento puede referenciar un curso por nombre en la descripción

---

## ⚠️ **Consideraciones Importantes**

1. **Independencia:** Cursos y documentos son completamente independientes
2. **Flexibilidad:** Un documento puede asociarse a cualquier curso de la persona
3. **Escalabilidad:** Fácil agregar nuevos tipos de documentos
4. **Mantenimiento:** Estructura más simple y clara
5. **Performance:** Consultas más eficientes con índices optimizados

---

## 🎉 **Beneficios de la Nueva Estructura**

- ✅ **Separación clara** entre cursos y documentos
- ✅ **Flexibilidad** para diferentes tipos de documentos
- ✅ **Escalabilidad** para futuras funcionalidades
- ✅ **Mantenimiento** más sencillo
- ✅ **Performance** optimizada con índices
- ✅ **Integridad** referencial con personal_disponible

---

**Última actualización:** 2025-09-09  
**Versión:** 2.0  
**Estado:** ✅ IMPLEMENTADO Y FUNCIONAL
