# Documentación - Endpoints de Documentos y Cursos

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Endpoint POST /api/documentos](#endpoint-post-apidocumentos)
3. [Endpoint POST /api/documentos/registrar-existente](#endpoint-post-apidocumentosregistrar-existente)
4. [Lógica de Carpetas en Google Drive](#lógica-de-carpetas-en-google-drive)
5. [Ejemplos de Implementación](#ejemplos-de-implementación)
6. [Tipos de Archivo Soportados](#tipos-de-archivo-soportados)
7. [Notas Importantes](#notas-importantes)

---

## Introducción

Este documento describe los endpoints del backend para subir y registrar documentos, con especial atención a la diferenciación entre documentos generales y cursos/certificaciones.

**Características principales:**
- Soporte para subir nuevos documentos
- Registro de documentos existentes en Google Drive
- Guardado automático en carpetas específicas según tipo de documento
- Cursos/certificaciones se guardan en carpeta separada `cursos_certificaciones`

---

## Endpoint POST /api/documentos

### Descripción
Sube uno o más archivos nuevos y los registra en la base de datos. Los archivos se guardan tanto en el servidor local como en Google Drive.

### URL
```
POST http://localhost:3000/api/documentos
```

### Tipo de Request
`multipart/form-data` (para subir archivos)

### Headers
```javascript
{
  'Content-Type': 'multipart/form-data',
  // Si tienes autenticación:
  'Authorization': 'Bearer <token>'
}
```

### Body (FormData)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `rut_persona` o `personal_id` | string | Sí | RUT de la persona (ej: "20.320.662-3") |
| `nombre_documento` | string | Sí | Nombre descriptivo del documento |
| `tipo_documento` | string | Sí | Tipo de documento. **Si es 'certificado_curso', 'diploma', se guarda en carpeta `cursos_certificaciones`**. Valores permitidos: `certificado_curso`, `diploma`, `certificado_laboral`, `certificado_medico`, `licencia_conducir`, `certificado_seguridad`, `certificado_vencimiento`, `otro` |
| `archivo` | File/Array | Sí | Archivo(s) a subir (soporta múltiples archivos con el mismo nombre 'archivo') |
| `descripcion` | string | No | Descripción adicional del documento |
| `fecha_emision` | string | No | Fecha de emisión (formato: YYYY-MM-DD) |
| `fecha_vencimiento` | string | No | Fecha de vencimiento (formato: YYYY-MM-DD) |
| `dias_validez` | number | No | Días de validez del documento |
| `institucion_emisora` | string | No | Institución que emitió el documento |

### Ejemplo de Request
```javascript
const formData = new FormData();
formData.append('rut_persona', '20.320.662-3');
formData.append('nombre_documento', 'Prevención de Riesgos Laborales');
formData.append('tipo_documento', 'certificado_curso'); // ← Se guardará en cursos_certificaciones
formData.append('descripcion', 'Curso de prevención de riesgos');
formData.append('fecha_emision', '2025-01-15');
formData.append('fecha_vencimiento', '2026-01-15');
formData.append('dias_validez', '365');
formData.append('institucion_emisora', 'Ministerio del Trabajo');
formData.append('archivo', archivoFile); // Archivo desde input file
```

### Respuesta Exitosa (201)
```javascript
{
  "success": true,
  "message": "1 documento(s) subido(s) exitosamente",
  "data": {
    "persona": {
      "rut": "20.320.662-3",
      "nombre": "Dilhan Jasson Saavedra Gonzalez",
      "cargo": "Guardia"
    },
    "documentos": [
      {
        "id": 123,
        "nombre_archivo": "documento_1730856000.pdf",
        "nombre_original": "certificado.pdf",
        "tipo_mime": "application/pdf",
        "tamaño_bytes": 524288,
        "fecha_subida": "2025-11-05T10:30:00.000Z"
      }
    ]
  }
}
```

### Respuestas de Error

#### 400 - Bad Request (Faltan campos requeridos)
```javascript
{
  "success": false,
  "message": "El RUT de la persona es requerido"
}
```

#### 404 - Not Found (Persona no existe)
```javascript
{
  "success": false,
  "message": "No se encontró personal con RUT: 20.320.662-3"
}
```

#### 500 - Internal Server Error
```javascript
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "Detalle del error"
}
```

---

## Endpoint POST /api/documentos/registrar-existente

### Descripción
Registra en la base de datos un documento que ya existe en Google Drive. El archivo se copia desde Google Drive al servidor local y se guarda en la carpeta correspondiente según su tipo.

### URL
```
POST http://localhost:3000/api/documentos/registrar-existente
```

### Tipo de Request
`application/json`

### Headers
```javascript
{
  'Content-Type': 'application/json',
  // Si tienes autenticación:
  'Authorization': 'Bearer <token>'
}
```

### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `rut_persona` | string | Sí | RUT de la persona |
| `nombre_archivo` | string | Sí | Nombre del archivo en Google Drive |
| `ruta_local` | string | Sí | Ruta completa del archivo en Google Drive |
| `nombre_documento` | string | Sí | Nombre descriptivo del documento |
| `tipo_documento` | string | Sí | Tipo de documento. **Si es 'curso', 'certificacion', 'certificación', 'curso/certificacion', o 'curso/certificación', se copia a carpeta `cursos_certificaciones`** |
| `descripcion` | string | No | Descripción adicional |
| `fecha_emision` | string | No | Fecha de emisión (formato: YYYY-MM-DD) |
| `fecha_vencimiento` | string | No | Fecha de vencimiento (formato: YYYY-MM-DD) |
| `dias_validez` | number | No | Días de validez |
| `institucion_emisora` | string | No | Institución emisora |

### Ejemplo de Request
```javascript
{
  "rut_persona": "20.320.662-3",
  "nombre_archivo": "certificado_original.pdf",
  "ruta_local": "G:/Unidades compartidas/Unidad de Apoyo/Personal/DILHAN - 20.320.662-3/documentos/certificado_original.pdf",
  "nombre_documento": "Prevención de Riesgos Laborales",
  "tipo_documento": "curso", // ← Se copiará a cursos_certificaciones
  "descripcion": "Curso de prevención",
  "fecha_emision": "2025-01-15",
  "fecha_vencimiento": "2026-01-15",
  "dias_validez": 365,
  "institucion_emisora": "Ministerio del Trabajo"
}
```

### Respuesta Exitosa (201)
```javascript
{
  "success": true,
  "message": "Documento registrado exitosamente",
  "data": {
    "id": 124,
    "persona": {
      "rut": "20.320.662-3",
      "nombre": "Dilhan Jasson Saavedra Gonzalez",
      "cargo": "Guardia"
    },
    "documento": {
      "nombre_documento": "Prevención de Riesgos Laborales",
      "tipo_documento": "curso",
      "nombre_archivo": "certificado_original_1730856000.pdf",
      "fecha_subida": "2025-11-05T10:30:00.000Z"
    }
  }
}
```

### Respuestas de Error

#### 400 - Bad Request
```javascript
{
  "success": false,
  "message": "RUT, nombre de archivo y ruta local son requeridos"
}
```

#### 404 - Not Found (Persona no existe)
```javascript
{
  "success": false,
  "message": "No se encontró personal con RUT: 20.320.662-3"
}
```

#### 404 - Not Found (Archivo no existe)
```javascript
{
  "success": false,
  "message": "El archivo no existe en la ruta especificada"
}
```

#### 500 - Internal Server Error
```javascript
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "Detalle del error"
}
```

---

## Lógica de Carpetas en Google Drive

### Estructura de Carpetas

```
G:/Unidades compartidas/Unidad de Apoyo/Personal/
└── {NOMBRE - RUT}/
    ├── documentos/              ← Documentos generales
    └── cursos_certificaciones/  ← Cursos y certificaciones
```

**Ejemplo:**
```
G:/Unidades compartidas/Unidad de Apoyo/Personal/
└── DILHAN JASSON SAAVEDRA GONZALEZ - 20.320.662-3/
    ├── documentos/
    │   ├── contrato_laboral.pdf
    │   ├── licencia_conducir.pdf
    │   └── antecedentes_penales.pdf
    └── cursos_certificaciones/
        ├── prevencion_riesgos.pdf
        ├── primeros_auxilios.pdf
        └── manipulacion_alimentos.pdf
```

### Regla de Guardado

El campo `tipo_documento` determina en qué carpeta se guarda el archivo:

#### Se guarda en `cursos_certificaciones/` si `tipo_documento` es (case-insensitive):
- `'certificado_curso'` ⭐ (Recomendado para cursos)
- `'diploma'`
- `'curso'` (acepta pero no está en BD, usar certificado_curso)
- `'certificacion'` (acepta pero no está en BD, usar certificado_curso)
- `'certificación'` (acepta pero no está en BD, usar certificado_curso)

#### Se guarda en `documentos/` para cualquier otro valor:
- `'certificado_laboral'`
- `'certificado_medico'`
- `'licencia_conducir'`
- `'certificado_seguridad'`
- `'certificado_vencimiento'`
- `'otro'`
- Cualquier otro tipo

### Creación Automática de Carpetas

El backend crea automáticamente las siguientes carpetas si no existen:
- `{NOMBRE - RUT}/documentos/`
- `{NOMBRE - RUT}/cursos_certificaciones/`

---

## Ejemplos de Implementación

### React - Subir Nuevo Documento

```javascript
const subirDocumento = async (rut, archivo, datosCurso) => {
  const formData = new FormData();
  formData.append('rut_persona', rut);
  formData.append('nombre_documento', datosCurso.nombre);
  formData.append('tipo_documento', 'curso'); // ← Guarda en cursos_certificaciones
  formData.append('fecha_emision', datosCurso.fechaEmision);
  formData.append('fecha_vencimiento', datosCurso.fechaVencimiento);
  formData.append('dias_validez', datosCurso.diasValidez);
  formData.append('institucion_emisora', datosCurso.institucionEmisora);
  formData.append('files', archivo);

  try {
    const response = await fetch('http://localhost:3000/api/documentos', {
      method: 'POST',
      body: formData,
      // NO incluir 'Content-Type' para multipart/form-data
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Documento subido:', data.data);
      return data.data;
    } else {
      console.error('❌ Error:', data.message);
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Error subiendo documento:', error);
    throw error;
  }
};

// Uso del componente
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const archivo = e.target.files[0]; // Del input file
  const datosCurso = {
    nombre: 'Prevención de Riesgos Laborales',
    fechaEmision: '2025-01-15',
    fechaVencimiento: '2026-01-15',
    diasValidez: 365,
    institucionEmisora: 'Ministerio del Trabajo'
  };
  
  try {
    const resultado = await subirDocumento('20.320.662-3', archivo, datosCurso);
    alert('Documento subido exitosamente');
  } catch (error) {
    alert('Error al subir documento: ' + error.message);
  }
};
```

### React - Registrar Documento Existente

```javascript
const registrarDocumentoExistente = async (rut, archivoGoogleDrive, datosCurso) => {
  const body = {
    rut_persona: rut,
    nombre_archivo: archivoGoogleDrive.nombre_archivo,
    ruta_local: archivoGoogleDrive.ruta_local,
    nombre_documento: datosCurso.nombre,
    tipo_documento: 'curso', // ← Copia a cursos_certificaciones
    fecha_emision: datosCurso.fechaEmision,
    fecha_vencimiento: datosCurso.fechaVencimiento,
    dias_validez: datosCurso.diasValidez,
    institucion_emisora: datosCurso.institucionEmisora,
  };

  try {
    const response = await fetch('http://localhost:3000/api/documentos/registrar-existente', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Documento registrado:', data.data);
      return data.data;
    } else {
      console.error('❌ Error:', data.message);
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Error registrando documento:', error);
    throw error;
  }
};

// Uso del componente
const handleRegistrar = async (archivoSeleccionado) => {
  const datosCurso = {
    nombre: 'Prevención de Riesgos Laborales',
    fechaEmision: '2025-01-15',
    fechaVencimiento: '2026-01-15',
    diasValidez: 365,
    institucionEmisora: 'Ministerio del Trabajo'
  };
  
  try {
    const resultado = await registrarDocumentoExistente(
      '20.320.662-3', 
      archivoSeleccionado, 
      datosCurso
    );
    alert('Documento registrado exitosamente');
  } catch (error) {
    alert('Error al registrar documento: ' + error.message);
  }
};
```

### JavaScript Vanilla - Subir Documento

```javascript
// HTML
<form id="uploadForm">
  <input type="text" id="rut" placeholder="RUT" required>
  <input type="text" id="nombreDocumento" placeholder="Nombre del Documento" required>
  <select id="tipoDocumento" required>
    <option value="">Seleccione tipo</option>
    <option value="curso">Curso</option>
    <option value="certificacion">Certificación</option>
    <option value="contrato">Contrato</option>
    <option value="licencia">Licencia</option>
  </select>
  <input type="date" id="fechaEmision">
  <input type="date" id="fechaVencimiento">
  <input type="number" id="diasValidez" placeholder="Días de validez">
  <input type="text" id="institucion" placeholder="Institución Emisora">
  <input type="file" id="archivo" required>
  <button type="submit">Subir Documento</button>
</form>

// JavaScript
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('rut_persona', document.getElementById('rut').value);
  formData.append('nombre_documento', document.getElementById('nombreDocumento').value);
  formData.append('tipo_documento', document.getElementById('tipoDocumento').value);
  formData.append('fecha_emision', document.getElementById('fechaEmision').value);
  formData.append('fecha_vencimiento', document.getElementById('fechaVencimiento').value);
  formData.append('dias_validez', document.getElementById('diasValidez').value);
  formData.append('institucion_emisora', document.getElementById('institucion').value);
  formData.append('files', document.getElementById('archivo').files[0]);
  
  try {
    const response = await fetch('http://localhost:3000/api/documentos', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Documento subido exitosamente');
      console.log(data);
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    alert('Error al subir documento: ' + error.message);
  }
});
```

---

## Tipos de Archivo Soportados

### Formatos Permitidos

| Categoría | Extensiones | MIME Types |
|-----------|-------------|------------|
| **PDF** | `.pdf` | `application/pdf` |
| **Imágenes** | `.jpg`, `.jpeg`, `.png`, `.tiff`, `.bmp` | `image/jpeg`, `image/png`, `image/tiff`, `image/bmp` |
| **Microsoft Office** | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` | `application/msword`, `application/vnd.openxmlformats-officedocument.*` |
| **Texto** | `.txt`, `.rtf`, `.odt` | `text/plain`, `application/rtf`, `application/vnd.oasis.opendocument.text` |

### Límites

- **Tamaño máximo por archivo:** 100 MB
- **Número de archivos:** Sin límite (en una sola petición)

---

## Notas Importantes

### 1. Campo `tipo_documento` Crítico
El valor de este campo determina **automáticamente** en qué carpeta se guarda el archivo:
- ✅ **Cursos/Certificaciones** → `cursos_certificaciones/`
- 📄 **Otros documentos** → `documentos/`

### 2. Formato de Fechas
Siempre usar formato ISO: `YYYY-MM-DD`
```javascript
// ✅ Correcto
fecha_emision: '2025-11-05'

// ❌ Incorrecto
fecha_emision: '05/11/2025'
fecha_emision: '05-11-2025'
```

### 3. RUT del Personal
- Acepta formato con puntos y guión: `20.320.662-3`
- Acepta formato sin puntos: `20320662-3`
- El endpoint de subida acepta tanto `rut_persona` como `personal_id`

### 4. Múltiples Archivos
El endpoint `POST /api/documentos` soporta subir **múltiples archivos** en una sola petición:
```javascript
formData.append('files', archivo1);
formData.append('files', archivo2);
formData.append('files', archivo3);
```

### 5. Archivos en Google Drive
El endpoint `GET /api/documentos/persona/:rut` devuelve:
- **`documentos`**: Documentos registrados en la BD
- **`documentos_locales`**: Archivos en Google Drive que **aún no están registrados** en la BD

### 6. Backup Automático
Todos los documentos se guardan en **dos ubicaciones**:
1. **Servidor local**: `uploads/documentos/`
2. **Google Drive**: Carpeta del usuario según tipo de documento

### 7. Validaciones Backend
El backend valida automáticamente:
- ✅ Existencia de la persona en la BD
- ✅ Tipo de archivo permitido
- ✅ Tamaño del archivo
- ✅ Campos requeridos
- ✅ Existencia del archivo en Google Drive (para registrar existente)

### 8. Manejo de Errores
Siempre verificar el campo `success` en la respuesta:
```javascript
if (data.success) {
  // Todo OK
} else {
  // Manejar error con data.message
}
```

---

## Resumen de Cambios Implementados

### ✅ Endpoints Modificados
1. **POST /api/documentos**: Ahora guarda cursos en `cursos_certificaciones/`
2. **POST /api/documentos/registrar-existente**: Copia archivos a la carpeta correspondiente

### ✅ Lógica de Carpetas
- Detección automática del tipo de documento
- Creación automática de carpetas si no existen
- Separación clara entre documentos generales y cursos/certificaciones

### ✅ Compatibilidad
- Mantiene compatibilidad con documentos existentes
- No afecta endpoints GET existentes
- Funciona con frontend actual sin cambios obligatorios

---

## Contacto y Soporte

Para dudas o problemas con estos endpoints, contactar al equipo de desarrollo.

**Última actualización:** 5 de noviembre de 2025
