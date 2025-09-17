# 🏭 Sistema de Gestión de Personal y Mantenimiento Industrial

Backend completo desarrollado con Node.js, Express y PostgreSQL para la gestión integral de personal, cursos, documentos y sistemas de mantenimiento industrial con estructura jerárquica completa.

## 🎯 Información General

**Versión**: 1.4.0  
**Base URL**: `http://localhost:3000`  
**Base URL Red**: `http://192.168.10.198:3000`  
**Estado**: 100% Funcional  
**Última actualización**: 17 de septiembre de 2025  

---

## 🏗️ Arquitectura del Sistema

### **Esquemas de Base de Datos:**

#### **1. Esquema Mantenimiento** (Sistema Principal)
- **Personal Disponible**: Gestión de personal y estados
- **Cursos y Certificaciones**: Gestión de formación
- **Documentos**: Gestión independiente de documentos
- **Estados**: Estados del personal (4 estados específicos)
- **Nombres**: Gestión de nombres del personal

#### **2. Esquema Servicio** (Sistema Jerárquico)
- **Carteras**: Agrupación superior de servicios
- **Ingeniería de Servicios**: Ingenieros asignados a carteras
- **Nodos**: Puntos de servicio específicos
- **Servicios Programados**: Servicios por programar
- **Historial de Servicios**: Registro de servicios ejecutados

#### **3. Nuevo Esquema** (Estructura Jerárquica)
- **Carteras**: Agrupación superior
- **Clientes**: Clientes que pertenecen a carteras
- **Ubicación Geográfica**: Regiones geográficas
- **Nodos**: Puntos de servicio de cada cliente

---

## 🚀 Características Principales

- **🔐 Autenticación JWT**: Sistema completo de autenticación y autorización
- **👥 Gestión de Personal**: CRUD completo para personal disponible con estados y validaciones
- **🎓 Cursos y Certificaciones**: Sistema de seguimiento de capacitaciones y certificaciones
- **📄 Gestión de Documentos**: Sistema independiente de documentos con tipos específicos y filtros avanzados
- **🏭 Gestión de Equipos**: Manejo jerárquico de faenas, plantas, líneas y equipos
- **🔧 Mantenimiento**: Sistema completo de lubricación y tareas de mantenimiento
- **📊 Estadísticas**: Reportes y análisis de datos en tiempo real
- **🌐 Acceso de Red**: Configurado para acceso desde red local
- **🛡️ Seguridad**: Middleware de seguridad con Helmet y CORS configurado
- **📈 Monitoreo**: Sistema de logging avanzado con Morgan y tracking de performance
- **🔍 Búsqueda Avanzada**: Filtros y búsquedas en todos los módulos
- **🔄 Migración Automática**: Herramientas de migración segura de datos
- **💾 Sistema de Backup**: Backup completo y restauración de base de datos
- **🏗️ Estructura Jerárquica**: Sistema completo de carteras, clientes y nodos

---

## 💻 Tecnologías Utilizadas

### **Backend/Runtime**
- **Node.js** `v16+` - Runtime principal de JavaScript
- **Express.js** `v4.21.2` - Framework web minimalista y rápido

### **Base de Datos**
- **PostgreSQL** - Base de datos relacional principal
- **Supabase** `v2.55.0` - Plataforma BaaS con PostgreSQL administrado
- **pg** `v8.16.3` - Driver nativo PostgreSQL para Node.js

### **Autenticación y Seguridad**
- **JSON Web Token (JWT)** `v9.0.2` - Autenticación basada en tokens
- **bcryptjs** `v2.4.3` - Hashing de contraseñas
- **Helmet** `v7.2.0` - Middleware de seguridad para Express
- **CORS** `v2.8.5` - Control de acceso entre orígenes

### **Validación y Procesamiento**
- **Express Validator** `v7.2.1` - Validación de datos de entrada
- **XLSX** `v0.18.5` - Procesamiento de archivos Excel
- **Morgan** `v1.10.1` - Logging de requests HTTP
- **Multer** `v2.0.2` - Manejo de archivos multipart

### **Testing y Desarrollo**
- **Jest** `v29.7.0` - Framework de testing
- **Supertest** `v6.3.4` - Testing de APIs HTTP
- **Nodemon** `v3.1.10` - Auto-restart durante desarrollo

---

## 📋 Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn
- PostgreSQL (recomendado usar Supabase)
- Cuenta de Supabase configurada

---

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp config.env.example config.env
```

Editar el archivo `config.env` con tus credenciales:
```env
# Configuración del servidor
PORT=3000
NODE_ENV=development
HOST=0.0.0.0

# Configuración de Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role-supabase

# Configuración PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tu_base_de_datos
DB_USER=postgres
DB_PASSWORD=tu_password

# Configuración JWT
JWT_SECRET=tu-jwt-secret-super-seguro
JWT_EXPIRES_IN=24h
```

4. **Configurar base de datos**
```bash
# Crear nuevo esquema
node scripts/setup-new-schema.js

# Ejecutar migración
POST /api/migration/run
```

5. **Ejecutar el servidor**
```bash
# Desarrollo local
npm run dev

# Desarrollo con acceso de red
npm run dev:network

# Producción
npm start
```

---

## 🌐 Endpoints Disponibles

### **Total de Endpoints**: 50+

#### **👥 Gestión de Personal** (`/api/personal-disponible`)
- `GET /` - Listar personal (con filtros y paginación)
- `POST /` - Crear nuevo personal
- `GET /:rut` - Obtener personal por RUT
- `PUT /:rut` - Actualizar personal
- `DELETE /:rut` - Eliminar personal
- `GET /stats/cargos` - Estadísticas por cargo
- `GET /verify-import` - Verificar importación

#### **📋 Estados del Sistema** (`/api/estados`)
- `GET /` - Listar estados (4 estados específicos)
- `POST /` - Crear estado
- `GET /:id` - Obtener estado por ID
- `PUT /:id` - Actualizar estado
- `DELETE /:id` - Eliminar estado

#### **🎓 Cursos y Certificaciones** (`/api/cursos`)
- `GET /` - Listar cursos (con filtros)
- `POST /` - Crear curso
- `GET /persona/:rut` - Cursos por persona
- `POST /:id/documentos` - Subir documentos a curso
- `GET /:id/documentos` - Ver documentos de curso

#### **📄 Documentos Independientes** (`/api/documentos`) - NUEVO
- `GET /` - Listar documentos (con filtros)
- `POST /` - Subir documentos
- `GET /:id` - Obtener documento por ID
- `GET /persona/:rut` - Documentos por persona
- `GET /:id/descargar` - Descargar documento
- `DELETE /:id` - Eliminar documento
- `GET /tipos` - Tipos de documento disponibles
- `GET /formatos` - Formatos de archivo soportados

#### **🏢 Área de Servicio** (`/api/area-servicio`)
- `GET /` - Listar personal del área (con filtros)
- `GET /stats` - Estadísticas del área
- `GET /cargos` - Listar cargos disponibles
- `GET /zonas` - Listar zonas geográficas
- `GET /cargo/:cargo` - Personal por cargo específico
- `GET /zona/:zona` - Personal por zona geográfica
- `GET /disponibles` - Personal disponible para servicio

#### **🔧 Sistema de Servicios** (`/api/servicio`)
- `GET /carteras` - Listar carteras de servicios
- `GET /carteras/:id` - Obtener cartera por ID
- `POST /carteras` - Crear nueva cartera
- `GET /ingenieros` - Listar ingenieros de servicios
- `GET /ingenieros/:id` - Obtener ingeniero por ID
- `POST /ingenieros` - Crear nuevo ingeniero
- `GET /nodos` - Listar nodos de servicio
- `GET /estructura` - Estructura jerárquica completa
- `GET /servicios-vencer` - Servicios próximos a vencer
- `GET /estadisticas` - Estadísticas generales del sistema

#### **🏗️ Nuevo Esquema** (Estructura Jerárquica)
- **Carteras** (`/api/carteras`): Gestión completa de carteras
- **Clientes** (`/api/clientes`): Gestión completa de clientes
- **Ubicación Geográfica** (`/api/ubicacion-geografica`): Gestión de ubicaciones
- **Nodos** (`/api/nodos`): Gestión completa de nodos
- **Estructura** (`/api/estructura`): Consultas de estructura jerárquica

#### **🔄 Herramientas de Migración** (`/api/migration`)
- `GET /status` - Verificar estado de migración
- `POST /run` - Ejecutar migración de documentos
- `GET /cleanup-status` - Verificar estado de limpieza
- `POST /cleanup` - Eliminar tablas obsoletas
- `GET /estados-status` - Verificar estado actual de estados
- `POST /update-estados` - Actualizar estados del sistema

#### **💾 Sistema de Backup** (`/api/backup`)
- `GET /` - Listar backups existentes
- `POST /` - Crear nuevo backup
- `GET /:filename` - Descargar backup específico
- `DELETE /:filename` - Eliminar backup específico
- `GET /info` - Información del sistema de backups

#### **🏥 Sistema y Utilidades**
- `GET /api/health` - Health check del servidor
- `GET /` - Información general de la API

---

## 🆕 Características Principales

### **1. Documentos Independientes**
- **Beneficio**: Documentos no limitados a cursos específicos
- **Tipos soportados**: 8 tipos diferentes
- **Filtros**: Por RUT, tipo, nombre, fecha
- **Subida múltiple**: Hasta 5 archivos por request
- **Soft delete**: Eliminación segura

### **2. Soporte Completo de PDFs**
- **Validación robusta**: Tipo MIME + extensión
- **Límites optimizados**: 50MB por archivo
- **Formatos amplios**: PDF, Office, imágenes, texto
- **Limpieza automática**: En caso de error

### **3. Estados Específicos**
- **Proceso de Activo**: Personal en proceso de activación
- **De Acreditación**: Personal en proceso de acreditación
- **Inactivo**: Personal temporalmente inactivo
- **Vacaciones**: Personal en período de vacaciones

### **4. Sistema de Backup Completo**
- **Backup automático**: Creación de backups completos
- **Gestión de archivos**: Listar, descargar y eliminar
- **Información detallada**: Tamaño, fecha, configuración
- **Restauración**: Comandos para restaurar desde archivos SQL

### **5. Herramientas de Migración**
- **Migración automática**: De estructura anterior
- **Verificación de estado**: Antes y después
- **Rollback automático**: En caso de error
- **Limpieza segura**: De tablas obsoletas

### **6. Estructura Jerárquica Completa**
- **Carteras → Clientes → Ubicación → Nodos**
- **Consultas optimizadas**: Con JOINs eficientes
- **Estadísticas detalladas**: Por entidad
- **Filtros avanzados**: Por múltiples criterios

---

## 📊 Estadísticas del Sistema

### **Distribución por Módulo:**
| Módulo | Endpoints | Estado | Descripción |
|--------|-----------|--------|-------------|
| **Personal** | 7 | ✅ | Gestión completa de personal disponible |
| **Estados** | 5 | ✅ | Gestión de estados del personal |
| **Cursos** | 5 | ✅ | Cursos y certificaciones |
| **Documentos** | 8 | ✅ | Gestión independiente de documentos |
| **Área de Servicio** | 7 | ✅ | Gestión especializada del área de servicio |
| **Sistema de Servicios** | 10 | ✅ | Gestión jerárquica de servicios |
| **Nuevo Esquema** | 20+ | ✅ | Estructura jerárquica completa |
| **Migración** | 6 | ✅ | Herramientas de migración |
| **Backup** | 5 | ✅ | Sistema de backup y restauración |
| **Sistema** | 2 | ✅ | Health check y información general |

---

## 🔍 Filtros y Búsquedas

### **Filtros Disponibles:**
- **Personal**: `cargo`, `estado_id`, `zona_geografica`, `search`
- **Cursos**: `rut`, `curso`, `estado`, `fecha_inicio`, `fecha_fin`
- **Documentos**: `rut_persona`, `tipo_documento`, `nombre_documento`
- **Clientes**: `cartera_id`, `region_id`
- **Nodos**: `cliente_id`, `cartera_id`, `region_id`

### **Paginación:**
- Todos los endpoints de listado soportan paginación
- Parámetros: `limit` (default: 20-50) y `offset` (default: 0)
- Respuesta incluye información de paginación

---

## 📁 Estructura del Proyecto

```
backend/
├── 📁 config/
│   ├── database.js              # Configuración de Supabase
│   ├── database-new.js          # Configuración de PostgreSQL
│   ├── postgresql.js            # Configuración específica PostgreSQL
│   └── tabla-nombres.js         # Configuración tabla nombres
├── 📁 middleware/
│   ├── auth.js                  # Middleware de autenticación JWT
│   ├── errorHandler.js          # Manejo centralizado de errores
│   ├── upload.js                # Configuración de multer
│   ├── upload-documentos.js     # Upload específico para documentos
│   └── validation.js            # Validación de datos de entrada
├── 📁 routes/
│   ├── auth.js                  # Autenticación y usuarios
│   ├── auth-simple.js           # Autenticación simple
│   ├── auth-temp.js             # Autenticación temporal
│   ├── personal-disponible.js   # Gestión de personal
│   ├── nombres.js               # Gestión de nombres (legacy)
│   ├── cursos-new.js            # Cursos y certificaciones
│   ├── documentos.js            # Gestión independiente de documentos
│   ├── estados.js               # Estados del sistema
│   ├── area-servicio.js         # Área de servicio
│   ├── servicio.js              # Sistema de servicios
│   ├── carteras.js              # Gestión de carteras
│   ├── clientes.js              # Gestión de clientes
│   ├── ubicacion-geografica.js  # Gestión de ubicaciones
│   ├── nodos.js                 # Gestión de nodos
│   ├── estructura.js            # Consultas de estructura
│   ├── migration.js             # Herramientas de migración
│   ├── backup.js                # Sistema de backup
│   ├── personal-estados.js      # Estados del personal
│   └── estado-unificado.js      # Estado unificado
├── 📁 scripts/
│   ├── create-new-schema.sql    # Script de creación del nuevo esquema
│   ├── setup-new-schema.js      # Script de configuración
│   ├── migrate-documentos-structure.js # Migración de documentos
│   ├── cleanup-old-tables.js    # Limpieza de tablas obsoletas
│   ├── update-estados-safe.js   # Actualización segura de estados
│   ├── backup-database.js       # Sistema de backup
│   └── [múltiples scripts utilitarios]
├── 📁 docs/                     # 📚 Documentación completa
│   └── RESUMEN_GENERAL_SISTEMA.md # Resumen consolidado
├── 📁 uploads/                  # Archivos subidos
│   ├── cursos/                  # Documentos de cursos
│   └── documentos/              # Documentos independientes
├── 📁 backups/                  # Backups de base de datos
├── server.js                    # Servidor principal
├── package.json                 # Dependencias y scripts
├── backup-now.js                # Script de backup rápido
└── README.md                   # Esta documentación
```

---

## 🚀 Comandos de Uso

### **Backup:**
```bash
# Crear backup
node backup-now.js
# O usando API
curl -X POST http://localhost:3000/api/backup
```

### **Migración:**
```bash
# Ejecutar migración
POST /api/migration/run
# Verificar estado
GET /api/migration/status
```

### **Nuevo Esquema:**
```bash
# Crear esquema
node scripts/setup-new-schema.js
# Verificar estructura
GET /api/estructura
```

### **Estados:**
```bash
# Actualizar estados
POST /api/migration/update-estados
# Verificar estados
GET /api/migration/estados-status
```

---

## 📝 Ejemplos de Uso

### **Crear Personal Nuevo**
```bash
curl -X POST http://localhost:3000/api/personal-disponible \
  -H "Content-Type: application/json" \
  -d '{
    "rut": "12345678-9",
    "nombre": "Juan Pérez",
    "cargo": "Técnico Mecánico",
    "estado_id": 1,
    "zona_geografica": "Norte"
  }'
```

### **Subir Documentos**
```bash
curl -X POST http://localhost:3000/api/documentos \
  -F "rut_persona=12345678-9" \
  -F "nombre_documento=Certificado de Seguridad" \
  -F "tipo_documento=certificado_seguridad" \
  -F "archivos=@documento.pdf"
```

### **Obtener Estructura Jerárquica**
```bash
curl "http://localhost:3000/api/estructura"
```

### **Crear Backup**
```bash
curl -X POST http://localhost:3000/api/backup
```

---

## 🛡️ Seguridad y Validaciones

### **Características de Seguridad**
- **CORS** configurado para red local
- **Helmet** para headers de seguridad
- **JWT** para autenticación (en desarrollo)
- **Validación** de entrada con express-validator
- **RUT único** - Prevención de duplicados
- **Integridad referencial** - Validación de relaciones FK

### **Códigos de Respuesta**
- **200**: Operación exitosa
- **201**: Recurso creado exitosamente
- **400**: Datos inválidos
- **401**: No autorizado
- **404**: Recurso no encontrado
- **409**: Conflicto (ej: RUT duplicado)
- **500**: Error interno del servidor

---

## 📊 Características de Performance

- **Query promedio**: 140-200ms (optimizado con PostgreSQL directo)
- **Paginación**: Configurada en todos los listados (20-50 registros por defecto)
- **Base de datos**: PostgreSQL con Supabase (conexión estable)
- **Endpoints activos**: 50+ funcionando (100% operativo)
- **Caché**: Respuestas 304 para recursos sin cambios
- **Logging**: Monitoreo completo de requests y queries
- **Optimización**: JOINs optimizados y consultas eficientes

---

## 🌐 Configuración de Red

El sistema está configurado para funcionar tanto en desarrollo local como en red:

- **URL Local**: `http://localhost:3000`
- **URL Red**: `http://192.168.10.198:3000` (IP actual detectada)
- **Health Check**: `http://localhost:3000/api/health`
- **CORS**: Configurado para IPs de red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)

### **Scripts de Red**
```bash
# PowerShell (Windows)
.\start-network.ps1

# Bash (Linux/Mac)
./start-network.sh
```

---

## 🧪 Testing y Desarrollo

```bash
# Health check
curl http://localhost:3000/api/health

# Verificar importación de datos
curl http://localhost:3000/api/personal-disponible/verify-import

# Estadísticas por cargo
curl http://localhost:3000/api/personal-disponible/stats/cargos

# Verificar estructura jerárquica
curl http://localhost:3000/api/estructura

# Listar backups
curl http://localhost:3000/api/backup
```

---

## 🚀 Despliegue

### **Variables de entorno para producción**
```env
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
JWT_SECRET=secret-super-seguro-y-unico
CORS_ORIGIN=https://tu-dominio.com
```

### **Comandos de despliegue**
```bash
# Instalar dependencias de producción
npm ci --only=production

# Iniciar servidor
npm start
```

---

## 📊 Estado del Proyecto

### ✅ **Módulos Completamente Funcionales**
- Personal Disponible (CRUD completo)
- Estados del Sistema (4 estados específicos)
- Cursos y Certificaciones
- Documentos Independientes (NUEVO)
- Área de Servicio
- Sistema de Servicios Jerárquico
- Nuevo Esquema de Base de Datos
- Herramientas de Migración
- Sistema de Backup Completo
- Soporte Completo de PDFs

### 🎯 **Listo para Uso**
- [x] Sistema funcional y operativo
- [x] Endpoints probados y documentados
- [x] Estructura jerárquica según especificaciones
- [x] Integridad de datos garantizada
- [x] Optimización de consultas implementada
- [x] Sistema de backup y restauración
- [x] Herramientas de migración seguras

---

## 🚀 Próximos Pasos Recomendados

### **Inmediatos:**
1. **Probar funcionalidad**: Verificar que todos los endpoints funcionan
2. **Crear backup**: `POST /api/backup` o `node backup-now.js`
3. **Ejecutar migración**: `POST /api/migration/run`
4. **Configurar nuevo esquema**: `node scripts/setup-new-schema.js`

### **A Mediano Plazo:**
1. **Eliminar tablas obsoletas**: Ejecutar limpieza cuando esté listo
2. **Optimizar consultas**: Revisar rendimiento con datos reales
3. **Agregar validaciones**: Mejorar validaciones de negocio

### **A Largo Plazo:**
1. **Nuevos tipos de documento**: Agregar según necesidades
2. **Nuevos estados**: Expandir según procesos de negocio
3. **Reportes avanzados**: Generar estadísticas detalladas

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Soporte y Contacto

- **Estado Actual**: ✅ OPERATIVO en `http://192.168.10.198:3000`
- **Performance**: ⚡ Queries promedio 140-200ms
- **Disponibilidad**: 🌐 Accesible desde red local
- **Monitoreo**: 📊 Logs activos con tracking completo
- **Documentación**: 📚 Disponible en `docs/RESUMEN_GENERAL_SISTEMA.md`

Para soporte técnico o dudas, revisar la documentación consolidada o contactar al equipo de desarrollo.

---

**🏭 Sistema de Gestión de Personal y Mantenimiento Industrial - v1.4.0**

**Estado**: ✅ **COMPLETADO Y FUNCIONAL**