# 🚀 Sistema de Gestión de Personal - Backend API

## 📋 Información General

- **Base URL:** `http://localhost:3000`
- **Base URL Red:** `http://192.168.10.196:3000`
- **Health Check:** `http://localhost:3000/api/health`
- **Base de Datos:** PostgreSQL (Supabase)
- **Estado:** ✅ Operativo

## 🎯 Endpoints Principales

### 👥 **Personal**
- `GET /api/personal-disponible` - Listar personal
- `POST /api/personal-disponible` - Crear personal
- `PUT /api/personal-disponible/:rut` - Actualizar personal
- `GET /api/personal-disponible/:rut` - Obtener por RUT

### 🎓 **Cursos y Documentos**
- `GET /api/cursos` - Listar cursos
- `POST /api/cursos` - Crear curso
- `GET /api/cursos/persona/:rut` - Cursos por persona
- `POST /api/cursos/:id/documentos` - Subir documentos
- `GET /api/cursos/:id/documentos` - Ver documentos
- `GET /api/documentos` - Documentos generales

### ⚙️ **Sistema**
- `GET /api/estados` - Estados del sistema
- `GET /api/health` - Estado del servidor

## 🔧 Comandos de Inicio

```bash
# Desarrollo local
npm run dev

# Desarrollo con acceso de red
npm run dev:network

# Producción
npm start
```

## 📊 Configuración de Base de Datos

**Host:** `aws-1-us-east-2.pooler.supabase.com`  
**Puerto:** `5432`  
**Base de datos:** `postgres`  
**Usuario:** `postgres.vmhsbxivyywywfozgixv`  
**Pool mode:** `session`

## 🗂️ Estructura de Tablas

### Cursos
- `mantenimiento.cursos_certificaciones` - Datos básicos
- `mantenimiento.cursos` - Información extendida
- `mantenimiento.cursos_documentos` - Archivos de cursos

### Documentos
- `mantenimiento.documentos` - Documentos generales

### Personal
- `mantenimiento.personal_disponible` - Personal principal
- `mantenimiento.estados` - Estados del sistema

## 📱 Ejemplos de Uso

### Crear Personal
```bash
POST /api/personal-disponible
{
  "rut": "12345678-9",
  "sexo": "M",
  "fecha_nacimiento": "1990-01-15",
  "cargo": "Técnico",
  "estado_id": 1
}
```

### Crear Curso
```bash
POST /api/cursos
{
  "rut_persona": "12345678-9",
  "nombre_curso": "Seguridad Industrial",
  "fecha_obtencion": "2024-01-15"
}
```

### Subir Documento
```bash
POST /api/cursos/1/documentos
Content-Type: multipart/form-data
- documentos: [archivo.pdf]
- descripcion: "Certificado"
```

## 🛡️ Seguridad

- **CORS:** Configurado para localhost y red local
- **Autenticación:** JWT (en desarrollo)
- **Validaciones:** RUT único, campos obligatorios

## 📈 Performance

- **Query promedio:** 140-150ms
- **Paginación:** 5-50 registros por página
- **Caché:** 304 responses activos

---

**Versión:** 1.0.0  
**Última actualización:** 2025-09-09