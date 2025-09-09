# 📄 Gestión de Documentos para Cursos y Certificaciones

## 🎯 **Descripción**

Sistema completo para la gestión de documentos asociados a cursos y certificaciones del personal. Permite subir, visualizar, descargar y gestionar archivos PDF, imágenes y documentos de Office como justificativos de cursos y certificaciones.

---

## 🏗️ **Arquitectura del Sistema**

### **📊 Estructura de Base de Datos**

#### **Tabla Principal: `mantenimiento.cursos_certificaciones`**
```sql
- id: integer (PK, auto-increment)
- rut_persona: text (RUT del personal)
- nombre_curso: varchar (Nombre del curso/certificación)
- fecha_obtencion: date (Fecha de obtención)
```

#### **Nueva Tabla: `mantenimiento.cursos_documentos`**
```sql
- id: SERIAL PRIMARY KEY
- curso_id: INTEGER (FK a cursos_certificaciones)
- nombre_archivo: VARCHAR(255) (Nombre en el sistema)
- nombre_original: VARCHAR(255) (Nombre original del usuario)
- tipo_mime: VARCHAR(100) (Tipo MIME del archivo)
- tamaño_bytes: BIGINT (Tamaño en bytes)
- ruta_archivo: TEXT (Ruta completa del archivo)
- descripcion: TEXT (Descripción opcional)
- fecha_subida: TIMESTAMP (Fecha de subida)
- subido_por: VARCHAR(100) (Usuario que subió)
- activo: BOOLEAN (Estado del documento)
```

### **📁 Estructura de Archivos**
```
📂 backend/
├── 📁 uploads/
│   └── 📁 cursos/          # Archivos de cursos
├── 📁 middleware/
│   └── upload.js           # Middleware de subida
└── 📁 routes/
    └── cursos.js           # Endpoints extendidos
```

---

## 🚀 **Endpoints Disponibles**

### **📤 Subir Documentos**
```http
POST /api/cursos/:id/documentos
Content-Type: multipart/form-data

Parámetros:
- documentos: File[] (máximo 5 archivos)
- descripcion: string (opcional)

Respuesta:
{
  "success": true,
  "message": "2 documento(s) subido(s) exitosamente",
  "data": {
    "curso": { ... },
    "documentos": [ ... ]
  }
}
```

### **📋 Listar Documentos de un Curso**
```http
GET /api/cursos/:id/documentos

Respuesta:
{
  "success": true,
  "data": {
    "curso": { ... },
    "documentos": [
      {
        "id": 1,
        "nombre_archivo": "1703123456789_123456789.pdf",
        "nombre_original": "certificado_seguridad.pdf",
        "tipo_mime": "application/pdf",
        "tamaño_bytes": 1024000,
        "descripcion": "Certificado de curso de seguridad",
        "fecha_subida": "2023-12-21T10:30:00Z",
        "subido_por": "sistema"
      }
    ]
  }
}
```

### **📥 Descargar Documento**
```http
GET /api/cursos/documentos/:documentoId/descargar

Respuesta: Archivo binario con headers de descarga
```

### **👁️ Visualizar Documento en Navegador**
```http
GET /api/cursos/documentos/:documentoId/vista

Respuesta: Archivo binario con headers de visualización inline
```

### **🗑️ Eliminar Documento**
```http
DELETE /api/cursos/documentos/:documentoId

Respuesta:
{
  "success": true,
  "message": "Documento eliminado exitosamente",
  "data": { ... }
}
```

### **📝 Actualizar Información del Documento**
```http
PUT /api/cursos/documentos/:documentoId
Content-Type: application/json

{
  "descripcion": "Nueva descripción del documento"
}
```

---

## 🔧 **Configuración y Setup**

### **1. Instalar Dependencias**
```bash
npm install multer
```

### **2. Crear Tabla de Base de Datos**
```bash
node scripts/setup-documentos.js
```

### **3. Verificar Estructura de Directorios**
```
📁 uploads/
└── 📁 cursos/    # Se crea automáticamente
```

---

## 📋 **Tipos de Archivo Soportados**

### **📄 Documentos**
- **PDF**: `application/pdf`
- **Word**: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Excel**: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **PowerPoint**: `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`

### **🖼️ Imágenes**
- **JPEG**: `image/jpeg`, `image/jpg`
- **PNG**: `image/png`
- **GIF**: `image/gif`
- **WebP**: `image/webp`

### **⚙️ Límites**
- **Tamaño máximo**: 10MB por archivo
- **Cantidad máxima**: 5 archivos por solicitud
- **Total por curso**: Sin límite (solo limitado por espacio en disco)

---

## 🛡️ **Seguridad y Validaciones**

### **🔒 Validaciones de Archivo**
- ✅ Verificación de tipo MIME
- ✅ Validación de extensión
- ✅ Límite de tamaño (10MB)
- ✅ Límite de cantidad (5 archivos)
- ✅ Nombres de archivo únicos (timestamp + random)

### **🗂️ Gestión de Archivos**
- ✅ Eliminación lógica (no física por defecto)
- ✅ Verificación de existencia antes de operaciones
- ✅ Limpieza automática en caso de errores
- ✅ Nombres seguros sin caracteres especiales

### **🔐 Control de Acceso**
- ✅ Verificación de existencia del curso
- ✅ Validación de permisos (preparado para autenticación)
- ✅ Headers de seguridad para descargas

---

## 📊 **Funcionalidades Extendidas**

### **📈 Conteo de Documentos en Lista de Cursos**
El endpoint `GET /api/cursos` ahora incluye el conteo de documentos:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rut_persona": "12345678-9",
      "nombre_curso": "Seguridad Industrial",
      "fecha_obtencion": "2023-12-01",
      "nombre_persona": "Juan Pérez",
      "cargo": "Operador",
      "zona_geografica": "Norte",
      "total_documentos": 3
    }
  ]
}
```

### **🔄 Integración con Sistema Existente**
- ✅ **Sin afectar endpoints existentes**
- ✅ **Retrocompatibilidad total**
- ✅ **Extensión transparente**
- ✅ **Misma estructura de respuesta**

---

## 🧪 **Ejemplos de Uso**

### **📤 Subir Múltiples Documentos**
```javascript
const formData = new FormData();
formData.append('documentos', file1);
formData.append('documentos', file2);
formData.append('descripcion', 'Certificados del curso de seguridad');

fetch('/api/cursos/123/documentos', {
  method: 'POST',
  body: formData
});
```

### **📋 Obtener Documentos de un Curso**
```javascript
fetch('/api/cursos/123/documentos')
  .then(response => response.json())
  .then(data => {
    console.log(`Curso: ${data.data.curso.nombre_curso}`);
    console.log(`Documentos: ${data.data.documentos.length}`);
  });
```

### **📥 Descargar Documento**
```javascript
// Descarga directa
window.open('/api/cursos/documentos/456/descargar');

// O con fetch para manejo personalizado
fetch('/api/cursos/documentos/456/descargar')
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificado.pdf';
    a.click();
  });
```

### **👁️ Visualizar en Navegador**
```html
<!-- Para PDFs e imágenes -->
<iframe src="/api/cursos/documentos/456/vista" width="100%" height="600px"></iframe>

<!-- Para imágenes -->
<img src="/api/cursos/documentos/456/vista" alt="Certificado" />
```

---

## 🔧 **Configuración Avanzada**

### **📁 Personalizar Directorio de Uploads**
```javascript
// En middleware/upload.js
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/cursos');
    // Personalizar ruta aquí
    cb(null, uploadPath);
  }
});
```

### **📏 Ajustar Límites**
```javascript
// En middleware/upload.js
const upload = multer({
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 10 // 10 archivos máximo
  }
});
```

### **🎯 Agregar Tipos de Archivo**
```javascript
// En middleware/upload.js
const allowedMimes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  // Agregar nuevos tipos aquí
  'text/plain',
  'application/zip'
];
```

---

## 🚨 **Manejo de Errores**

### **❌ Errores Comunes**

#### **Archivo Demasiado Grande**
```json
{
  "success": false,
  "message": "El archivo es demasiado grande. Tamaño máximo: 10MB"
}
```

#### **Tipo de Archivo No Permitido**
```json
{
  "success": false,
  "message": "Tipo de archivo no permitido: video/mp4. Tipos permitidos: PDF, imágenes, documentos de Office"
}
```

#### **Curso No Encontrado**
```json
{
  "success": false,
  "message": "No se encontró curso con ID: 123"
}
```

#### **Documento No Encontrado**
```json
{
  "success": false,
  "message": "No se encontró documento con ID: 456"
}
```

---

## 📈 **Métricas y Monitoreo**

### **📊 Logs del Sistema**
```
📄 POST /api/cursos/123/documentos - Subiendo documentos
✅ 2 documentos subidos para curso ID: 123
📄 GET /api/cursos/123/documentos - Obteniendo documentos
✅ Encontrados 3 documentos para curso ID: 123
📥 GET /api/cursos/documentos/456/descargar - Descargando documento
✅ Documento descargado: certificado_seguridad.pdf
```

### **🔍 Verificación de Estado**
```bash
# Verificar tabla creada
psql -d tu_database -c "SELECT * FROM mantenimiento.cursos_documentos LIMIT 5;"

# Verificar directorio de uploads
ls -la uploads/cursos/

# Verificar logs del servidor
tail -f logs/app.log
```

---

## 🎯 **Próximas Mejoras**

### **🔮 Funcionalidades Futuras**
- [ ] **Compresión automática** de imágenes
- [ ] **Miniaturas** para imágenes
- [ ] **Búsqueda de texto** en PDFs
- [ ] **Versionado** de documentos
- [ ] **Firma digital** de certificados
- [ ] **Notificaciones** de vencimiento
- [ ] **Backup automático** de documentos
- [ ] **Integración con cloud storage** (AWS S3, Google Drive)

### **🔐 Mejoras de Seguridad**
- [ ] **Antivirus scanning** de archivos
- [ ] **Encriptación** de archivos sensibles
- [ ] **Auditoría** de accesos a documentos
- [ ] **Watermarking** automático
- [ ] **Control de acceso** granular por usuario

---

## ✅ **Resumen**

El sistema de gestión de documentos para cursos y certificaciones está **completamente implementado** y **listo para producción**. Proporciona:

- ✅ **Subida múltiple** de archivos
- ✅ **Validación robusta** de tipos y tamaños
- ✅ **Visualización y descarga** segura
- ✅ **Gestión completa** (CRUD) de documentos
- ✅ **Integración transparente** con el sistema existente
- ✅ **Eliminación lógica** para preservar historial
- ✅ **Logging detallado** para monitoreo
- ✅ **Manejo de errores** comprehensivo

El sistema mantiene **total retrocompatibilidad** y extiende las funcionalidades existentes sin afectar el comportamiento actual de la API.
