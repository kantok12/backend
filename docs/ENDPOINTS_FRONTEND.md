# 📋 **ENDPOINTS REALES PARA FRONTEND**

## 🌐 **URL Base**
```
http://localhost:3000/api
```

---

## 🔐 **AUTENTICACIÓN**

### **Registro de Usuario**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "nombre": "Juan",
  "apellido": "Pérez"
}
```

**Respuesta:**
```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "usuario"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Inicio de Sesión**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta:**
```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "usuario"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Obtener Usuario Actual**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "usuario",
    "email_verificado": false,
    "ultimo_login": "2025-10-21T11:47:58.262Z"
  }
}
```

### **Renovar Token**
```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

### **Cambiar Contraseña**
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}
```

### **Cerrar Sesión**
```http
POST /api/auth/logout
```

### **Verificar Usuarios (Debug)**
```http
GET /api/auth/check-users
```

---

## 👥 **GESTIÓN DE USUARIOS**

### **Listar Usuarios**
```http
GET /api/users?page=1&limit=20&search=texto
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "message": "Usuarios obtenidos exitosamente",
  "users": [
    {
      "id": 1,
      "email": "admin@sistema.com",
      "nombre": "Administrador",
      "apellido": "Sistema",
      "rol": "admin",
      "activo": true,
      "email_verificado": true,
      "ultimo_login": "2025-10-21T11:47:58.262Z",
      "created_at": "2025-10-21T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### **Obtener Usuario por ID**
```http
GET /api/users/1
Authorization: Bearer <token>
```

### **Crear Usuario (Solo Admin)**
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "nuevo@ejemplo.com",
  "password": "contraseña123",
  "nombre": "Nuevo",
  "apellido": "Usuario",
  "rol": "usuario"
}
```

### **Actualizar Usuario**
```http
PUT /api/users/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Nombre Actualizado",
  "apellido": "Apellido Actualizado",
  "rol": "supervisor"
}
```

### **Eliminar Usuario (Solo Admin)**
```http
DELETE /api/users/1
Authorization: Bearer <token>
```

### **Resetear Contraseña (Solo Admin)**
```http
POST /api/users/1/reset-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "newPassword": "nueva_contraseña"
}
```

### **Estadísticas de Usuarios**
```http
GET /api/users/stats
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "message": "Estadísticas de usuarios obtenidas exitosamente",
  "stats": {
    "total": 5,
    "porRol": {
      "admins": 1,
      "supervisors": 1,
      "usuarios": 2,
      "operadores": 1
    },
    "porEstado": {
      "activos": 4,
      "inactivos": 1
    },
    "verificacion": {
      "emailsVerificados": 3,
      "emailsSinVerificar": 2
    },
    "actividad": {
      "activosUltimos30Dias": 3
    }
  }
}
```

---

## 👥 **PERSONAL DISPONIBLE**

### **Listar Personal**
```http
GET /api/personal-disponible?limit=20&offset=0&search=RUT&estado_id=1&cargo=Operador
```

### **Obtener Personal por RUT**
```http
GET /api/personal-disponible/{rut}
```

### **Crear Personal**
```http
POST /api/personal-disponible
Content-Type: application/json

{
  "rut": "12345678-9",
  "sexo": "M",
  "fecha_nacimiento": "1990-01-01",
  "licencia_conducir": "B",
  "talla_zapatos": "42",
  "talla_pantalones": "L",
  "talla_poleras": "M",
  "cargo": "Operador",
  "estado_id": 1,
  "zona_geografica": "Norte"
}
```

### **Actualizar Personal**
```http
PUT /api/personal-disponible/{rut}
Content-Type: application/json

{
  "sexo": "M",
  "fecha_nacimiento": "1990-01-01",
  "licencia_conducir": "B",
  "talla_zapatos": "42",
  "talla_pantalones": "L",
  "talla_poleras": "M",
  "cargo": "Supervisor",
  "estado_id": 2,
  "zona_geografica": "Sur"
}
```

### **Eliminar Personal**
```http
DELETE /api/personal-disponible/{rut}
```

### **Estadísticas por Cargos**
```http
GET /api/personal-disponible/stats/cargos
```

### **Verificar Importación**
```http
GET /api/personal-disponible/verify-import
```

---

## 📄 **DOCUMENTOS**

### **Listar Documentos**
```http
GET /api/documentos?limit=50&offset=0&rut=12345678-9&tipo_documento=certificado_curso&nombre_documento=curso
```

### **Obtener Documento por ID**
```http
GET /api/documentos/{id}
```

### **Subir Documentos**
```http
POST /api/documentos
Content-Type: multipart/form-data

FormData:
- rut_persona: "12345678-9"
- nombre_documento: "Certificado de Seguridad"
- tipo_documento: "certificado_seguridad"
- descripcion: "Certificado de curso de seguridad"
- archivos: [archivo1.pdf, archivo2.jpg]
```

### **Documentos por Persona**
```http
GET /api/documentos/persona/{rut}?limit=50&offset=0&tipo_documento=certificado_curso
```

### **Descargar Documento**
```http
GET /api/documentos/{id}/descargar
```

### **Eliminar Documento**
```http
DELETE /api/documentos/{id}
```

### **Tipos de Documento Disponibles**
```http
GET /api/documentos/tipos
```

### **Formatos Soportados**
```http
GET /api/documentos/formatos
```

---

## 🎓 **CURSOS Y CERTIFICACIONES**

### **Listar Cursos**
```http
GET /api/cursos?limit=50&offset=0&rut=12345678-9&curso=seguridad
```

### **Obtener Curso por ID**
```http
GET /api/cursos/{id}
```

### **Crear Certificación**
```http
POST /api/cursos
Content-Type: application/json

{
  "rut_persona": "12345678-9",
  "nombre_curso": "Curso de Seguridad Industrial",
  "fecha_obtencion": "2024-01-15"
}
```

### **Actualizar Certificación**
```http
PUT /api/cursos/{id}
Content-Type: application/json

{
  "nombre_curso": "Curso de Seguridad Industrial Avanzado",
  "fecha_obtencion": "2024-01-20"
}
```

### **Eliminar Certificación**
```http
DELETE /api/cursos/{id}
```

### **Cursos por Persona**
```http
GET /api/cursos/persona/{rut}
```

### **Estadísticas de Cursos**
```http
GET /api/cursos/stats
```

### **Subir Documentos a Curso**
```http
POST /api/cursos/{id}/documentos
Content-Type: multipart/form-data

FormData:
- descripcion: "Certificado del curso"
- archivos: [certificado.pdf]
```

### **Documentos de Curso**
```http
GET /api/cursos/{id}/documentos
```

### **Descargar Documento de Curso**
```http
GET /api/cursos/documentos/{documentoId}/descargar
```

### **Ver Documento en Navegador**
```http
GET /api/cursos/documentos/{documentoId}/vista
```

### **Eliminar Documento de Curso**
```http
DELETE /api/cursos/documentos/{documentoId}
```

### **Actualizar Documento de Curso**
```http
PUT /api/cursos/documentos/{documentoId}
Content-Type: application/json

{
  "descripcion": "Nueva descripción del documento"
}
```

### **Documentos por Persona y Curso**
```http
GET /api/cursos/persona/{rut}/documentos?limit=50&offset=0&curso_id=1
```

### **Subir Documentos por RUT y Curso**
```http
POST /api/cursos/persona/{rut}/documentos
Content-Type: multipart/form-data

FormData:
- nombre_curso: "Curso de Seguridad Industrial"
- descripcion: "Certificado del curso"
- archivos: [certificado.pdf]
```

---

## 📊 **ESTADOS**

### **Listar Estados**
```http
GET /api/estados?limit=20&offset=0&search=activo
```

### **Obtener Estado por ID**
```http
GET /api/estados/{id}
```

### **Crear Estado**
```http
POST /api/estados
Content-Type: application/json

{
  "nombre": "Disponible",
  "descripcion": "Personal disponible para trabajo",
  "color": "#28a745"
}
```

### **Actualizar Estado**
```http
PUT /api/estados/{id}
Content-Type: application/json

{
  "nombre": "Ocupado",
  "descripcion": "Personal ocupado en trabajo",
  "color": "#ffc107"
}
```

### **Eliminar Estado**
```http
DELETE /api/estados/{id}
```

---

## 🏗️ **ESTRUCTURA JERÁRQUICA**

### **Estructura Completa**
```http
GET /api/estructura
```

### **Estructura de Cartera**
```http
GET /api/estructura/cartera/{id}
```

### **Estructura de Cliente**
```http
GET /api/estructura/cliente/{id}
```

### **Estadísticas de Estructura**
```http
GET /api/estructura/estadisticas
```

---

## 💼 **CARTERAS**

### **Listar Carteras**
```http
GET /api/carteras
```

### **Obtener Cartera por ID**
```http
GET /api/carteras/{id}
```

### **Crear Cartera**
```http
POST /api/carteras
Content-Type: application/json

{
  "name": "Cartera Norte"
}
```

### **Actualizar Cartera**
```http
PUT /api/carteras/{id}
Content-Type: application/json

{
  "name": "Cartera Norte Actualizada"
}
```

### **Eliminar Cartera**
```http
DELETE /api/carteras/{id}
```

### **Estadísticas de Cartera**
```http
GET /api/carteras/{id}/estadisticas
```

---

## 🏢 **CLIENTES**

### **Listar Clientes**
```http
GET /api/clientes?cartera_id=1&region_id=1&limit=50&offset=0
```

### **Obtener Cliente por ID**
```http
GET /api/clientes/{id}
```

### **Crear Cliente**
```http
POST /api/clientes
Content-Type: application/json

{
  "nombre": "Cliente ABC",
  "cartera_id": 1,
  "region_id": 1
}
```

### **Actualizar Cliente**
```http
PUT /api/clientes/{id}
Content-Type: application/json

{
  "nombre": "Cliente ABC Actualizado",
  "cartera_id": 1,
  "region_id": 2
}
```

### **Eliminar Cliente**
```http
DELETE /api/clientes/{id}
```

### **Estadísticas de Cliente**
```http
GET /api/clientes/{id}/estadisticas
```

---

## 🌍 **UBICACIÓN GEOGRÁFICA**

### **Listar Ubicaciones**
```http
GET /api/ubicacion-geografica
```

### **Obtener Ubicación por ID**
```http
GET /api/ubicacion-geografica/{id}
```

### **Crear Ubicación**
```http
POST /api/ubicacion-geografica
Content-Type: application/json

{
  "nombre": "Región Metropolitana",
  "codigo": "RM",
  "descripcion": "Región Metropolitana de Santiago"
}
```

### **Actualizar Ubicación**
```http
PUT /api/ubicacion-geografica/{id}
Content-Type: application/json

{
  "nombre": "Región Metropolitana Actualizada",
  "codigo": "RMA",
  "descripcion": "Región Metropolitana de Santiago actualizada"
}
```

### **Eliminar Ubicación**
```http
DELETE /api/ubicacion-geografica/{id}
```

---

## 🏭 **NODOS**

### **Listar Nodos**
```http
GET /api/nodos?cliente_id=1&limit=50&offset=0
```

### **Obtener Nodo por ID**
```http
GET /api/nodos/{id}
```

### **Crear Nodo**
```http
POST /api/nodos
Content-Type: application/json

{
  "nombre": "Nodo Central",
  "cliente_id": 1,
  "descripcion": "Nodo principal del cliente"
}
```

### **Actualizar Nodo**
```http
PUT /api/nodos/{id}
Content-Type: application/json

{
  "nombre": "Nodo Central Actualizado",
  "cliente_id": 1,
  "descripcion": "Nodo principal del cliente actualizado"
}
```

### **Eliminar Nodo**
```http
DELETE /api/nodos/{id}
```

---

## 💾 **BACKUP**

### **Listar Backups**
```http
GET /api/backup
```

### **Crear Backup**
```http
POST /api/backup
```

### **Descargar Backup**
```http
GET /api/backup/{filename}
```

### **Eliminar Backup**
```http
DELETE /api/backup/{filename}
```

### **Información de Backups**
```http
GET /api/backup/info
```

---

## 🔄 **MIGRACIÓN**

### **Estado de Migración**
```http
GET /api/migration/status
```

### **Estado de Limpieza**
```http
GET /api/migration/cleanup-status
```

### **Ejecutar Limpieza**
```http
POST /api/migration/cleanup
```

### **Estado de Estados**
```http
GET /api/migration/estados-status
```

### **Actualizar Estados**
```http
POST /api/migration/update-estados
```

---

## 🏥 **HEALTH CHECK**

### **Estado del Servidor**
```http
GET /api/health
```

---

## 📝 **NOTAS IMPORTANTES**

### **Autenticación**
- Todos los endpoints requieren token JWT en el header `Authorization: Bearer <token>`
- Excepción: endpoints de auth, health check y algunos endpoints públicos

### **Paginación**
- Parámetros: `limit` (default: 20-50), `offset` (default: 0)
- Respuesta incluye objeto `pagination` con `total`, `hasMore`, etc.

### **Filtros**
- Usar query parameters para filtrar resultados
- Ejemplo: `?search=texto&estado_id=1&cargo=operador`

### **Subida de Archivos**
- Usar `multipart/form-data` para subir archivos
- Máximo 50MB por archivo, 5 archivos por request
- Formatos soportados: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF, JPG, PNG, TIFF, BMP

### **Respuestas**
- Todas las respuestas incluyen `success: boolean`
- Respuestas exitosas: `data` con los datos
- Respuestas de error: `message` y `error` con detalles

### **Códigos de Estado**
- `200`: Éxito
- `201`: Creado exitosamente
- `400`: Error de validación
- `401`: No autenticado
- `404`: No encontrado
- `409`: Conflicto (duplicado)
- `500`: Error interno del servidor

---

## 🚀 **EJEMPLOS DE USO**

### **Flujo Completo de Autenticación**
```javascript
// 1. Registrar usuario
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'contraseña123',
    nombre: 'Juan',
    apellido: 'Pérez'
  })
});

// 2. Iniciar sesión
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'contraseña123'
  })
});

const { token } = await loginResponse.json();

// 3. Usar token en requests
const personalResponse = await fetch('/api/personal-disponible', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### **Subir Documento**
```javascript
const formData = new FormData();
formData.append('rut_persona', '12345678-9');
formData.append('nombre_documento', 'Certificado de Seguridad');
formData.append('tipo_documento', 'certificado_seguridad');
formData.append('descripcion', 'Certificado del curso');
formData.append('archivos', fileInput.files[0]);

const response = await fetch('/api/documentos', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### **Obtener Estructura Completa**
```javascript
const estructuraResponse = await fetch('/api/estructura', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data } = await estructuraResponse.json();
// data contiene: carteras -> clientes -> nodos
```

---

## 🔧 **CONFIGURACIÓN FRONTEND**

### **Base URL**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### **Headers por Defecto**
```javascript
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
};
```

### **Manejo de Errores**
```javascript
const handleApiError = (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      // Token expirado, redirigir a login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
};
```

---

**✅ Todos estos endpoints están funcionando y listos para usar en el frontend.**
