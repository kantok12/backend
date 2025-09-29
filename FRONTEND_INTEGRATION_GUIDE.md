# 📋 GUÍA DE INTEGRACIÓN - SISTEMA DE DOCUMENTOS

## 🎯 INFORMACIÓN PARA EL FRONTEND

### **✅ ESTADO ACTUAL:**
- ✅ Backend completamente funcional
- ✅ 12 documentos disponibles en el sistema
- ✅ Todos los endpoints operativos
- ✅ Base de datos conectada y funcionando

---

## 🔗 ENDPOINTS DISPONIBLES

### **1. 📤 SUBIR DOCUMENTOS**
```http
POST /api/documentos
Content-Type: multipart/form-data

Campos del formulario:
- archivo: File (archivo a subir)
- rut_persona: string (RUT de la persona)
- nombre_documento: string (nombre descriptivo)
- tipo_documento: string (tipo válido)
- descripcion: string (descripción opcional)
```

**Tipos de documento válidos:**
- `certificado_curso`
- `diploma`
- `certificado_laboral`
- `certificado_medico`
- `licencia_conducir`
- `certificado_seguridad`
- `certificado_vencimiento`
- `otro`

### **2. 📋 LISTAR DOCUMENTOS**
```http
GET /api/documentos?page=1&limit=10
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "rut_persona": "20227477-3",
      "nombre_documento": "Certificado - Ingeniero de Servicios",
      "tipo_documento": "certificado_curso",
      "nombre_archivo": "certificado_20227477_3_1759146769452.txt",
      "nombre_original": "certificado_Ingeniero_de_Servicios_1759146769414.txt",
      "tipo_mime": "text/plain",
      "tamaño_bytes": 1069,
      "descripcion": "Certificado de capacitación...",
      "fecha_subida": "2025-09-29T11:52:49.453Z",
      "subido_por": "SISTEMA_SERVIDOR",
      "nombre_persona": "Araya Garrido Carlos Daniel",
      "cargo": "Ingeniero de Servicios",
      "zona_geografica": null
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "offset": 0,
    "hasMore": true
  }
}
```

### **3. 🔍 BUSCAR POR RUT**
```http
GET /api/documentos/persona/{RUT}
```

### **4. 📄 OBTENER DOCUMENTO POR ID**
```http
GET /api/documentos/{ID}
```

### **5. 📥 DESCARGAR ARCHIVO**
```http
GET /api/documentos/{ID}/descargar
```

### **6. 🗑️ ELIMINAR DOCUMENTO**
```http
DELETE /api/documentos/{ID}
```

### **7. 📋 OBTENER TIPOS VÁLIDOS**
```http
GET /api/documentos/tipos
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    "certificado_curso",
    "diploma",
    "certificado_laboral",
    "certificado_medico",
    "licencia_conducir",
    "certificado_seguridad",
    "certificado_vencimiento",
    "otro"
  ]
}
```

### **8. 📄 OBTENER FORMATOS SOPORTADOS**
```http
GET /api/documentos/formatos
```

---

## 🎨 EJEMPLOS DE IMPLEMENTACIÓN

### **JavaScript/Fetch - Subir Documento**
```javascript
async function subirDocumento(archivo, rutPersona, nombreDocumento, tipoDocumento, descripcion) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('rut_persona', rutPersona);
  formData.append('nombre_documento', nombreDocumento);
  formData.append('tipo_documento', tipoDocumento);
  formData.append('descripcion', descripcion);

  try {
    const response = await fetch('/api/documentos', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Documento subido exitosamente:', result.data);
      return result;
    } else {
      console.error('Error al subir documento:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error de red:', error);
    return null;
  }
}
```

### **JavaScript/Fetch - Listar Documentos**
```javascript
async function listarDocumentos(page = 1, limit = 10) {
  try {
    const response = await fetch(`/api/documentos?page=${page}&limit=${limit}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      console.error('Error al listar documentos:', result.message);
      return [];
    }
  } catch (error) {
    console.error('Error de red:', error);
    return [];
  }
}
```

### **JavaScript/Fetch - Descargar Archivo**
```javascript
async function descargarDocumento(documentoId) {
  try {
    const response = await fetch(`/api/documentos/${documentoId}/descargar`);
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento_${documentoId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      console.error('Error al descargar documento');
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
}
```

---

## 📊 DATOS DE PRUEBA DISPONIBLES

### **RUTs con Documentos Disponibles:**
- `20227477-3` - Araya Garrido Carlos Daniel
- `20181372-7` - Arrue Pacheco Camilo Ignacio
- `26258374-0` - Bastidas Valbuena Enyelber Gregorio
- `19887445-0` - [Y 8 más...]

### **Documentos Disponibles:**
- **12 documentos** en total
- **11 certificados** de "Ingeniero de Servicios"
- **1 certificado** de "Manejo de Herramientas"

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **1. Validaciones del Frontend:**
- Verificar que el RUT existe en la base de datos antes de subir
- Validar tipos de archivo permitidos
- Límite de tamaño: 50MB por archivo
- Máximo 5 archivos por request

### **2. Tipos de Archivo Permitidos:**
- PDF: `application/pdf`
- Imágenes: `image/jpeg`, `image/png`, `image/tiff`
- Office: `.doc`, `.docx`, `.xls`, `.xlsx`
- Texto: `text/plain`

### **3. Manejo de Errores:**
```javascript
// Ejemplo de manejo de errores
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || 'Error desconocido');
}
```

---

## 🚀 PRÓXIMOS PASOS

1. **Implementar formulario de subida** con validaciones
2. **Crear lista de documentos** con paginación
3. **Implementar búsqueda por RUT**
4. **Agregar funcionalidad de descarga**
5. **Implementar eliminación de documentos**

---

## 📞 SOPORTE

Si necesitas ayuda con la implementación o tienes dudas sobre algún endpoint, el backend está completamente funcional y listo para recibir requests del frontend.

**¡El sistema está 100% operativo!** 🎉
