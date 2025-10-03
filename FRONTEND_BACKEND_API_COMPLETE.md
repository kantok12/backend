# 🚀 API Backend - Guía Completa para Frontend

## 🌐 Información General

### URL Base del Backend
```
http://192.168.10.194:3000/api
```

### 🔐 Autenticación
**❌ NO hay autenticación implementada**
- No se requiere Bearer token
- No se requieren cookies
- Las peticiones son públicas
- No hay middleware de autenticación

### 🌐 Configuración CORS
```javascript
// Orígenes permitidos
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'http://192.168.10.194:3000',
  'http://192.168.10.194:3001',
  'http://192.168.10.194:3002'
];
```

---

## 📋 API de Cursos

### 🎯 Endpoints de Cursos

#### 1. Crear Curso
```
POST http://192.168.10.194:3000/api/cursos
```

**Estructura de Datos:**
```typescript
interface CursoData {
  rut_persona: string;           // REQUERIDO
  nombre_curso: string;          // REQUERIDO
  fecha_inicio?: string;         // OPCIONAL (YYYY-MM-DD)
  fecha_fin?: string;            // OPCIONAL (YYYY-MM-DD)
  fecha_vencimiento?: string;    // OPCIONAL (YYYY-MM-DD)
  estado?: string;               // OPCIONAL (default: 'completado')
  institucion?: string;          // OPCIONAL
  descripcion?: string;          // OPCIONAL
}
```

**Respuesta de Éxito (201):**
```json
{
  "success": true,
  "message": "Curso creado exitosamente",
  "data": {
    "id": 123,
    "rut_persona": "12345678-9",
    "nombre_curso": "Seguridad Industrial",
    "fecha_inicio": "2025-01-15",
    "fecha_fin": "2025-01-20",
    "fecha_vencimiento": "2026-01-20",
    "estado": "completado",
    "institucion": "Instituto de Seguridad",
    "descripcion": "Curso básico de seguridad industrial",
    "fecha_creacion": "2025-10-01T17:30:00.000Z",
    "activo": true
  }
}
```

#### 2. Obtener Cursos de una Persona
```
GET http://192.168.10.194:3000/api/cursos/persona/{rut}
```

**Respuesta de Éxito (200):**
```json
{
  "success": true,
  "data": {
    "persona": {
      "rut": "12345678-9",
      "nombre": "Juan Pérez",
      "cargo": "Ingeniero de Servicios",
      "zona_geografica": "Santiago"
    },
    "cursos": [
      {
        "id": 1,
        "nombre_curso": "Seguridad Industrial",
        "fecha_inicio": "2025-01-15",
        "fecha_fin": "2025-01-20",
        "fecha_vencimiento": "2026-01-20",
        "estado": "completado",
        "estado_vencimiento": "vigente",
        "institucion": "Instituto de Seguridad",
        "descripcion": "Curso básico de seguridad industrial",
        "fecha_creacion": "2025-10-01T17:30:00.000Z"
      }
    ]
  }
}
```

#### 3. Obtener Todos los Cursos
```
GET http://192.168.10.194:3000/api/cursos
```

#### 4. Actualizar Curso
```
PUT http://192.168.10.194:3000/api/cursos/{id}
```

#### 5. Eliminar Curso (Soft Delete)
```
DELETE http://192.168.10.194:3000/api/cursos/{id}
```

---

## 📁 API de Documentos

### 🎯 Endpoints de Documentos

#### 1. Subir Documento
```
POST http://192.168.10.194:3000/api/documentos
Content-Type: multipart/form-data
```

**FormData Requerido:**
```typescript
interface DocumentoFormData {
  archivo: File;                 // REQUERIDO (máximo 100MB)
  rut_persona: string;           // REQUERIDO
  nombre_documento: string;      // REQUERIDO
  tipo_documento: string;        // REQUERIDO
  descripcion?: string;          // OPCIONAL
}
```

**Tipos de Documento Válidos:**
```javascript
const tiposDocumento = [
  { label: 'Certificado de Curso', value: 'certificado_curso' },
  { label: 'Diploma', value: 'diploma' },
  { label: 'Certificado Laboral', value: 'certificado_laboral' },
  { label: 'Certificado Médico', value: 'certificado_medico' },
  { label: 'Licencia de Conducir', value: 'licencia_conducir' },
  { label: 'Certificado de Seguridad', value: 'certificado_seguridad' },
  { label: 'Certificado de Vencimiento', value: 'certificado_vencimiento' },
  { label: 'Otro', value: 'otro' }
];
```

**Respuesta de Éxito (201):**
```json
{
  "success": true,
  "message": "Documento subido exitosamente",
  "data": {
    "id": 123,
    "rut_persona": "12345678-9",
    "nombre_documento": "Certificado de Seguridad",
    "tipo_documento": "certificado_seguridad",
    "nombre_archivo": "archivo-1234567890-123456789.pdf",
    "nombre_original": "certificado_seguridad.pdf",
    "tipo_mime": "application/pdf",
    "tamaño_bytes": 2048576,
    "ruta_archivo": "/uploads/archivo-1234567890-123456789.pdf",
    "descripcion": "Certificado de seguridad industrial",
    "fecha_subida": "2025-10-01T17:30:00.000Z",
    "subido_por": "sistema"
  }
}
```

#### 2. Obtener Documentos de una Persona
```
GET http://192.168.10.194:3000/api/documentos/persona/{rut}
```

**Respuesta de Éxito (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "nombre_documento": "Certificado de Seguridad",
      "tipo_documento": "certificado_seguridad",
      "nombre_archivo": "archivo-1234567890-123456789.pdf",
      "nombre_original": "certificado_seguridad.pdf",
      "tipo_mime": "application/pdf",
      "tamaño_bytes": 2048576,
      "descripcion": "Certificado de seguridad industrial",
      "fecha_subida": "2025-10-01T17:30:00.000Z",
      "subido_por": "sistema"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

#### 3. Descargar Documento
```
GET http://192.168.10.194:3000/api/documentos/{id}/descargar
```

**⚠️ Importante:** Este endpoint devuelve el archivo directamente (no JSON)

#### 4. Obtener Tipos de Documento
```
GET http://192.168.10.194:3000/api/documentos/tipos
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

#### 5. Eliminar Documento
```
DELETE http://192.168.10.194:3000/api/documentos/{id}
```

---

## 👥 API de Personal Disponible

### 🎯 Endpoints de Personal

#### 1. Obtener Personal (con paginación)
```
GET http://192.168.10.194:3000/api/personal-disponible?limit=10&offset=0
```

#### 2. Obtener Personal por RUT
```
GET http://192.168.10.194:3000/api/personal-disponible/{rut}
```

#### 3. Crear Personal
```
POST http://192.168.10.194:3000/api/personal-disponible
```

**Estructura de Datos:**
```typescript
interface PersonalData {
  rut: string;                   // REQUERIDO
  sexo: string;                  // REQUERIDO
  fecha_nacimiento: string;      // REQUERIDO (YYYY-MM-DD)
  licencia_conducir: string;     // REQUERIDO (formato: 1-2 letras + números)
  talla_zapatos?: string;        // OPCIONAL
  talla_pantalones?: string;     // OPCIONAL
  talla_poleras?: string;        // OPCIONAL
  cargo: string;                 // REQUERIDO
  estado_id: number;             // REQUERIDO
  zona_geografica?: string;      // OPCIONAL
  nombres?: string;              // OPCIONAL (nombre completo)
}
```

#### 4. Actualizar Personal
```
PUT http://192.168.10.194:3000/api/personal-disponible/{rut}
```

---

## 🔧 Implementación en React/TypeScript

### API Service Base
```typescript
class BackendAPI {
  private baseURL = 'http://192.168.10.194:3000/api';

  // Método genérico para peticiones
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en la petición');
    }

    return response.json();
  }

  // Cursos
  async createCurso(data: CursoData) {
    return this.request('/cursos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCursosByRut(rut: string) {
    return this.request(`/cursos/persona/${rut}`);
  }

  // Documentos
  async uploadDocumento(formData: FormData) {
    const response = await fetch(`${this.baseURL}/documentos`, {
      method: 'POST',
      body: formData, // No incluir Content-Type para FormData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al subir documento');
    }

    return response.json();
  }

  async getDocumentosByRut(rut: string) {
    return this.request(`/documentos/persona/${rut}`);
  }

  async downloadDocumento(id: number) {
    const response = await fetch(`${this.baseURL}/documentos/${id}/descargar`);
    
    if (!response.ok) {
      throw new Error('Error al descargar documento');
    }
    
    return response.blob();
  }

  async getDocumentoTipos() {
    return this.request('/documentos/tipos');
  }

  // Personal
  async getPersonal(limit = 10, offset = 0) {
    return this.request(`/personal-disponible?limit=${limit}&offset=${offset}`);
  }

  async getPersonalByRut(rut: string) {
    return this.request(`/personal-disponible/${rut}`);
  }

  async createPersonal(data: PersonalData) {
    return this.request('/personal-disponible', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePersonal(rut: string, data: Partial<PersonalData>) {
    return this.request(`/personal-disponible/${rut}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new BackendAPI();
```

### Hooks Personalizados
```typescript
// Hook para cursos
export const useCursos = (rut: string) => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCursos = async () => {
    if (!rut) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.getCursosByRut(rut);
      setCursos(result.data.cursos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, [rut]);

  return { cursos, loading, error, refetch: fetchCursos };
};

// Hook para documentos
export const useDocumentos = (rut: string) => {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentos = async () => {
    if (!rut) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.getDocumentosByRut(rut);
      setDocumentos(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, [rut]);

  return { documentos, loading, error, refetch: fetchDocumentos };
};
```

---

## ⚠️ Limitaciones y Consideraciones

### Archivos
- **Tamaño máximo:** 100MB por archivo
- **Cantidad máxima:** 5 archivos por petición
- **Tipos permitidos:** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF, JPG, JPEG, PNG, TIFF, BMP
- **Campo de formulario:** `archivo` (singular, no `archivos`)
- **Almacenamiento:** Archivos se guardan en `./uploads/` del servidor
- **Timeout:** 30 segundos recomendado para archivos grandes

### Validaciones
- **RUT:** Debe existir en la tabla `personal_disponible`
- **Licencia de Conducir:** Formato 1-2 letras + números (ej: B, A1, B2, C1)
- **Fechas:** Formato ISO (YYYY-MM-DD)
- **Campos requeridos:** Se especifican en cada endpoint

### Estados de Vencimiento (Cursos)
- `"sin_vencimiento"` - No tiene fecha de vencimiento
- `"vencido"` - Ya venció
- `"por_vencer"` - Vence en los próximos 30 días
- `"vigente"` - Válido por más de 30 días

---

## 🚨 Códigos de Error Comunes

### 400 Bad Request
```json
{
  "success": false,
  "message": "Campos requeridos faltantes"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Recurso no encontrado"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Recurso ya existe"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "Detalles del error"
}
```

---

## 💡 Mejores Prácticas

1. **Manejo de Errores:** Siempre verificar `response.ok` antes de procesar
2. **Loading States:** Mostrar indicadores de carga durante las peticiones
3. **Validación Local:** Validar datos antes de enviar al backend
4. **FormData:** No incluir `Content-Type` header para archivos
5. **Paginación:** Usar los parámetros `limit` y `offset` para listas grandes
6. **Refetch:** Implementar funciones de actualización para datos dinámicos
7. **Archivos Grandes:** Usar timeout de 30+ segundos para archivos > 10MB
8. **Progress Indicators:** Mostrar progreso de subida para archivos grandes
9. **Compresión:** Considerar comprimir archivos antes de subir
10. **Validación de Tamaño:** Verificar tamaño del archivo antes de enviar

---

## 📁 Manejo de Archivos Grandes

### Configuración Recomendada para Frontend

```typescript
// Configuración de Axios para archivos grandes
const uploadLargeFile = async (formData: FormData, onProgress?: (progress: number) => void) => {
  return axios.post('/api/documentos', formData, {
    headers: {
      ...formData.getHeaders(),
    },
    timeout: 60000, // 60 segundos para archivos grandes
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    }
  });
};

// Ejemplo de uso con indicador de progreso
const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('rut_persona', '12345678-9');
  formData.append('nombre_documento', file.name);
  formData.append('tipo_documento', 'otro');

  try {
    setUploading(true);
    setProgress(0);
    
    await uploadLargeFile(formData, (progress) => {
      setProgress(progress);
    });
    
    console.log('Archivo subido exitosamente');
  } catch (error) {
    console.error('Error al subir archivo:', error);
  } finally {
    setUploading(false);
    setProgress(0);
  }
};
```

### Validación de Tamaño en Frontend

```typescript
const validateFileSize = (file: File): boolean => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    alert(`El archivo es demasiado grande. Máximo permitido: 100MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    return false;
  }
  return true;
};

// Uso en componente
const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file && validateFileSize(file)) {
    setSelectedFile(file);
  }
};
```

### Tipos de Archivo Soportados

```typescript
const SUPPORTED_FILE_TYPES = {
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/rtf'
  ],
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
    'image/bmp'
  ]
};

const SUPPORTED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
  '.ppt', '.pptx', '.txt', '.rtf', 
  '.jpg', '.jpeg', '.png', '.tiff', '.bmp'
];
```

---

## 🖼️ API de Imágenes de Perfil

### 🎯 Endpoints de Imágenes de Perfil

#### 1. Subir Imagen de Perfil
```
POST http://192.168.10.194:3000/api/personal/{rut}/profile-image
Content-Type: multipart/form-data
```

**FormData Requerido:**
```typescript
interface ProfileImageFormData {
  file: File;                 // REQUERIDO (máximo 5MB, solo imágenes)
}
```

**Tipos de Imagen Válidos:**
- JPG, JPEG
- PNG
- GIF
- WEBP

**Respuesta de Éxito (200):**
```json
{
  "success": true,
  "message": "Imagen de perfil actualizada exitosamente",
  "data": {
    "profile_image_url": "http://192.168.10.194:3000/uploads/profiles/15338132-1.jpg",
    "rut": "15338132-1",
    "filename": "15338132-1.jpg",
    "size": 2048576,
    "mimetype": "image/jpeg"
  }
}
```

#### 2. Obtener Imagen de Perfil
```
GET http://192.168.10.194:3000/api/personal/{rut}/profile-image
```

**Respuesta de Éxito (200):**
```json
{
  "success": true,
  "data": {
    "profile_image_url": "http://192.168.10.194:3000/uploads/profiles/15338132-1.jpg",
    "rut": "15338132-1"
  }
}
```

**Respuesta si no existe (404):**
```json
{
  "success": false,
  "message": "No se encontró imagen de perfil para este usuario"
}
```

#### 3. Descargar Imagen de Perfil
```
GET http://192.168.10.194:3000/api/personal/{rut}/profile-image/download
```

**⚠️ Importante:** Este endpoint devuelve la imagen directamente (no JSON)

#### 4. Eliminar Imagen de Perfil
```
DELETE http://192.168.10.194:3000/api/personal/{rut}/profile-image
```

**Respuesta de Éxito (200):**
```json
{
  "success": true,
  "message": "Imagen de perfil eliminada exitosamente",
  "data": {
    "rut": "15338132-1"
  }
}
```

### 🔧 Implementación en React/TypeScript

```typescript
// API Service para imágenes de perfil
class ProfileImageAPI {
  private baseURL = 'http://192.168.10.194:3000/api';

  async uploadProfileImage(rut: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/personal/${rut}/profile-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al subir imagen');
    }

    return response.json();
  }

  async getProfileImage(rut: string) {
    const response = await fetch(`${this.baseURL}/personal/${rut}/profile-image`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener imagen');
    }

    return response.json();
  }

  async downloadProfileImage(rut: string) {
    const response = await fetch(`${this.baseURL}/personal/${rut}/profile-image/download`);
    
    if (!response.ok) {
      throw new Error('Error al descargar imagen');
    }
    
    return response.blob();
  }

  async deleteProfileImage(rut: string) {
    const response = await fetch(`${this.baseURL}/personal/${rut}/profile-image`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar imagen');
    }

    return response.json();
  }
}

export const profileImageAPI = new ProfileImageAPI();
```

### Hook Personalizado para Imágenes de Perfil

```typescript
import { useState, useEffect } from 'react';

export const useProfileImage = (rut: string) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileImage = async () => {
    if (!rut) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await profileImageAPI.getProfileImage(rut);
      setProfileImage(result.data.profile_image_url);
    } catch (err) {
      if (err instanceof Error && err.message.includes('No se encontró')) {
        setProfileImage(null); // No hay imagen
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await profileImageAPI.uploadProfileImage(rut, file);
      setProfileImage(result.data.profile_image_url);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await profileImageAPI.deleteProfileImage(rut);
      setProfileImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar imagen');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileImage();
  }, [rut]);

  return { 
    profileImage, 
    loading, 
    error, 
    uploadImage, 
    deleteImage, 
    refetch: fetchProfileImage 
  };
};
```

### Componente de Ejemplo

```typescript
import React, { useRef } from 'react';
import { useProfileImage } from './hooks/useProfileImage';

interface ProfileImageUploaderProps {
  rut: string;
}

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({ rut }) => {
  const { profileImage, loading, error, uploadImage, deleteImage } = useProfileImage(rut);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten imágenes: JPG, PNG, GIF, WEBP');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB.');
      return;
    }

    try {
      await uploadImage(file);
    } catch (error) {
      console.error('Error al subir imagen:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar la imagen de perfil?')) {
      try {
        await deleteImage();
      } catch (error) {
        console.error('Error al eliminar imagen:', error);
      }
    }
  };

  return (
    <div className="profile-image-uploader">
      {loading && <div>Cargando...</div>}
      {error && <div className="error">{error}</div>}
      
      {profileImage ? (
        <div>
          <img 
            src={profileImage} 
            alt="Imagen de perfil" 
            style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: '50%' }}
          />
          <div>
            <button onClick={() => fileInputRef.current?.click()}>
              Cambiar Imagen
            </button>
            <button onClick={handleDelete} style={{ marginLeft: 10 }}>
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ width: 150, height: 150, border: '2px dashed #ccc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Sin imagen
          </div>
          <button onClick={() => fileInputRef.current?.click()}>
            Subir Imagen
          </button>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
};
```

### ⚠️ Limitaciones de Imágenes de Perfil

- **Tamaño máximo:** 5MB por imagen
- **Tipos permitidos:** JPG, JPEG, PNG, GIF, WEBP únicamente
- **Una imagen por usuario:** Al subir una nueva imagen, se reemplaza la anterior
- **Almacenamiento:** Imágenes se guardan en `./uploads/profiles/`
- **Naming:** `{rut}.{extension}` (ej: `15338132-1.jpg`)
- **Validación:** El RUT debe existir en `personal_disponible`

---

## 🔗 Endpoints Adicionales

### Health Check
```
GET http://192.168.10.194:3000/api/health
```

### Carteras
```
GET http://192.168.10.194:3000/api/servicio/carteras
```

### Estados
```
GET http://192.168.10.194:3000/api/personal-estados
```

---

**📞 Contacto:** Para dudas o problemas con la API, contactar al equipo de backend.
