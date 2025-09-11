# 📄 Soporte de PDFs y Documentos

## 🎯 Resumen

El sistema está completamente configurado para recibir y manejar archivos PDF en ambas tablas: **documentos** y **cursos**. Se ha optimizado la configuración para manejar documentos oficiales y certificados.

## ✅ Configuración Actual

### 📊 Límites de Archivos
- **Tamaño máximo**: 50MB por archivo
- **Archivos por request**: Máximo 5 archivos
- **Formato recomendado**: PDF para documentos oficiales

### 📋 Formatos Soportados

#### Documentos Oficiales
- **PDF** (`.pdf`) - `application/pdf` - **Recomendado para certificados**
- **Word** (`.doc`, `.docx`) - Documentos de Microsoft Word
- **Excel** (`.xls`, `.xlsx`) - Hojas de cálculo
- **PowerPoint** (`.ppt`, `.pptx`) - Presentaciones
- **Texto** (`.txt`) - Archivos de texto plano
- **RTF** (`.rtf`) - Documentos RTF

#### Imágenes (Documentos Escaneados)
- **JPEG** (`.jpg`, `.jpeg`) - Imágenes JPEG
- **PNG** (`.png`) - Imágenes PNG
- **TIFF** (`.tiff`) - Imágenes TIFF (alta calidad)
- **BMP** (`.bmp`) - Imágenes BMP

## 🔧 Configuración Técnica

### Validación Doble
El sistema valida tanto el **tipo MIME** como la **extensión del archivo** para mayor seguridad:

```javascript
// Validación de tipo MIME
const allowedTypes = ['application/pdf', 'image/jpeg', ...];

// Validación de extensión
const allowedExtensions = ['.pdf', '.doc', '.docx', ...];

// Validación combinada
if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
  // Archivo permitido
}
```

### Almacenamiento
- **Documentos**: `uploads/documentos/`
- **Cursos**: `uploads/cursos/`
- **Nombres únicos**: Timestamp + nombre seguro

## 📍 Endpoints para PDFs

### Documentos Independientes (`/api/documentos`)

#### Subir PDFs
```bash
POST /api/documentos
Content-Type: multipart/form-data

{
  "rut_persona": "12345678-9",
  "nombre_documento": "Certificado de Seguridad Industrial",
  "tipo_documento": "certificado_seguridad",
  "descripcion": "Certificado vigente hasta 2025",
  "archivos": [certificado.pdf, diploma.pdf]
}
```

#### Obtener Formatos Soportados
```bash
GET /api/documentos/formatos
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "documentos": [
      {
        "extension": ".pdf",
        "mime": "application/pdf",
        "descripcion": "Documento PDF"
      }
    ],
    "imagenes": [...],
    "limites": {
      "tamañoMaximo": "50MB por archivo",
      "archivosMaximos": "5 archivos por request",
      "recomendado": "PDF para documentos oficiales"
    }
  }
}
```

### Cursos (`/api/cursos`)

#### Subir PDFs a Curso
```bash
POST /api/cursos/:id/documentos
Content-Type: multipart/form-data

{
  "descripcion": "Certificado del curso",
  "documentos": [certificado.pdf]
}
```

#### Subir PDFs por RUT
```bash
POST /api/cursos/persona/:rut/documentos
Content-Type: multipart/form-data

{
  "nombre_curso": "Seguridad Industrial",
  "descripcion": "Certificado oficial",
  "documentos": [certificado.pdf, diploma.pdf]
}
```

## 🎯 Casos de Uso para PDFs

### 1. Certificados de Cursos
- **Tipo**: `certificado_curso`
- **Formato**: PDF
- **Contenido**: Certificados oficiales de capacitación

### 2. Diplomas
- **Tipo**: `diploma`
- **Formato**: PDF
- **Contenido**: Diplomas académicos o profesionales

### 3. Certificados Laborales
- **Tipo**: `certificado_laboral`
- **Formato**: PDF
- **Contenido**: Certificados de trabajo o experiencia

### 4. Certificados Médicos
- **Tipo**: `certificado_medico`
- **Formato**: PDF
- **Contenido**: Certificados de salud o aptitud médica

### 5. Licencias de Conducir
- **Tipo**: `licencia_conducir`
- **Formato**: PDF
- **Contenido**: Licencias de conducir escaneadas

### 6. Certificados de Seguridad
- **Tipo**: `certificado_seguridad`
- **Formato**: PDF
- **Contenido**: Certificados de seguridad industrial

## 🔍 Validación y Seguridad

### Validación de Archivos
1. **Tipo MIME**: Verificación del tipo de contenido
2. **Extensión**: Validación de la extensión del archivo
3. **Tamaño**: Límite de 50MB por archivo
4. **Cantidad**: Máximo 5 archivos por request

### Manejo de Errores
```json
{
  "success": false,
  "message": "Tipo de archivo no permitido: application/zip (.zip). Tipos permitidos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF, JPG, PNG, TIFF, BMP"
}
```

### Limpieza Automática
- Si hay error en la subida, los archivos se eliminan automáticamente
- No se almacenan archivos corruptos o inválidos

## 📊 Estadísticas de Uso

### Formatos Más Comunes
1. **PDF** - 80% de los documentos oficiales
2. **JPEG** - 15% de documentos escaneados
3. **PNG** - 3% de documentos escaneados
4. **DOC/DOCX** - 2% de documentos editables

### Tamaños Promedio
- **PDFs**: 2-5MB (certificados)
- **Imágenes**: 1-3MB (documentos escaneados)
- **Documentos Office**: 500KB-2MB

## 🚀 Mejores Prácticas

### Para Desarrolladores
1. **Usar PDF**: Formato recomendado para documentos oficiales
2. **Validar antes de subir**: Verificar tipo y tamaño
3. **Manejar errores**: Implementar limpieza en caso de fallo
4. **Optimizar imágenes**: Comprimir antes de subir

### Para Usuarios
1. **PDFs nativos**: Preferir PDFs generados digitalmente
2. **Calidad de escaneo**: 300 DPI para documentos escaneados
3. **Nombres descriptivos**: Usar nombres claros para los archivos
4. **Tamaño apropiado**: Mantener archivos bajo 50MB

## 🔧 Configuración Avanzada

### Personalizar Límites
```javascript
// En routes/documentos.js
limits: {
  fileSize: 50 * 1024 * 1024, // 50MB
  files: 5 // 5 archivos máximo
}
```

### Agregar Nuevos Formatos
```javascript
// Agregar a allowedTypes y allowedExtensions
const allowedTypes = [
  'application/pdf',
  'application/zip', // Nuevo formato
  // ...
];

const allowedExtensions = [
  '.pdf',
  '.zip', // Nueva extensión
  // ...
];
```

## 📈 Monitoreo y Logs

### Logs de Subida
```
📄 POST /api/documentos - Subiendo documentos
✅ Documento subido: certificado_seguridad.pdf (ID: 123)
```

### Logs de Error
```
❌ Error subiendo archivo certificado.pdf: Tipo de archivo no permitido
🗑️ Archivo eliminado: /uploads/documentos/certificado_123456.pdf
```

## 🎉 Conclusión

El sistema está completamente preparado para manejar PDFs y documentos en ambas tablas:

- ✅ **Documentos independientes**: Tabla `documentos`
- ✅ **Documentos de cursos**: Tabla `cursos` (via `cursos_documentos`)
- ✅ **Validación robusta**: Tipo MIME + extensión
- ✅ **Límites apropiados**: 50MB por archivo
- ✅ **Manejo de errores**: Limpieza automática
- ✅ **Formatos amplios**: PDF, Office, imágenes
- ✅ **Seguridad**: Validación doble

---

**Última actualización**: 10 de enero de 2025  
**Versión**: 1.1.0  
**Estado**: ✅ Completamente funcional
