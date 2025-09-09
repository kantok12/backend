# 📄 Endpoints de Gestión de Documentos - Cursos

## 🎯 **Resumen**
Nuevos endpoints para subir, consultar, descargar y gestionar documentos asociados a cursos y certificaciones.

---

## ⚙️ **Configuración**
- **URL Base:** `http://localhost:3000/api/cursos`
- **Tipos permitidos:** PDF, imágenes (JPG, PNG, GIF), documentos Office
- **Tamaño máximo:** 50 MB por archivo
- **Máximo archivos:** 5 por request

---

## 📋 **Lista de Endpoints**

### **📤 SUBIR DOCUMENTOS**

#### **1. Subir por ID de curso**
```http
POST /api/cursos/{curso_id}/documentos
```
**Body:** `multipart/form-data`
- `documentos`: Archivo(s)
- `descripcion`: Descripción (opcional)

#### **2. Subir por RUT y nombre de curso**
```http
POST /api/cursos/persona/{rut}/documentos
```
**Body:** `multipart/form-data`
- `documentos`: Archivo(s)
- `nombre_curso`: Nombre exacto del curso
- `descripcion`: Descripción (opcional)

---

### **📋 CONSULTAR DOCUMENTOS**

#### **3. Ver documentos de un curso**
```http
GET /api/cursos/{curso_id}/documentos
```

#### **4. Ver documentos de una persona**
```http
GET /api/cursos/persona/{rut}/documentos
```

#### **5. Listar cursos (con conteo de documentos)**
```http
GET /api/cursos
```
**Nuevo campo:** `total_documentos`

---

### **📥 DESCARGAR Y VER**

#### **6. Descargar documento**
```http
GET /api/cursos/documentos/{documento_id}/descargar
```

#### **7. Ver documento en navegador**
```http
GET /api/cursos/documentos/{documento_id}/vista
```

---

### **✏️ GESTIONAR**

#### **8. Actualizar documento**
```http
PUT /api/cursos/documentos/{documento_id}
```
**Body:** `JSON`
```json
{
  "descripcion": "Nueva descripción",
  "activo": true
}
```

#### **9. Eliminar documento**
```http
DELETE /api/cursos/documentos/{documento_id}
```

---

## 🧪 **Ejemplos de Uso**

### **Subir documento (React)**
```javascript
const formData = new FormData();
formData.append('documentos', archivo);
formData.append('nombre_curso', 'Seguridad Industrial');
formData.append('descripcion', 'Certificado');

fetch('/api/cursos/persona/18539810-2/documentos', {
  method: 'POST',
  body: formData
});
```

### **Descargar documento**
```javascript
window.open('/api/cursos/documentos/2/descargar');
```

### **Ver en navegador**
```javascript
window.open('/api/cursos/documentos/2/vista', '_blank');
```

---

## ❌ **Errores Comunes**

- **400:** Archivo muy grande (>50MB)
- **400:** Tipo de archivo no permitido
- **400:** Nombre de curso requerido
- **404:** Curso no encontrado
- **404:** Documento no encontrado

---

## 📝 **Notas Importantes**

1. **Nombres de curso:** Deben coincidir exactamente
2. **RUTs:** Formato con guión (ej: "18539810-2")
3. **Eliminación:** Es lógica (no física)
4. **Archivos:** Nombres únicos automáticos

---

**Última actualización:** 2025-09-09  
**Versión:** 1.0
