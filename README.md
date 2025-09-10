# 🏭 Sistema de Gestión de Personal y Mantenimiento Industrial

Backend completo desarrollado con Node.js, Express y PostgreSQL para la gestión integral de personal y sistemas de mantenimiento industrial.

## 🎯 Descripción del Proyecto

Este sistema está diseñado para gestionar de manera integral el personal disponible, cursos/certificaciones, y todo el ecosistema de mantenimiento industrial incluyendo faenas, plantas, equipos, componentes y puntos de lubricación. El proyecto maneja la jerarquía organizacional completa:

```
Faenas → Plantas → Líneas → Equipos → Componentes → Puntos de Lubricación
```

## 🚀 Características Principales

- **🔐 Autenticación JWT**: Sistema completo de autenticación y autorización
- **👥 Gestión de Personal**: CRUD completo para personal disponible con estados y validaciones
- **🎓 Cursos y Certificaciones**: Sistema de seguimiento de capacitaciones y certificaciones con gestión de documentos
- **🏭 Gestión de Equipos**: Manejo jerárquico de faenas, plantas, líneas y equipos
- **🔧 Mantenimiento**: Sistema completo de lubricación y tareas de mantenimiento
- **📊 Estadísticas**: Reportes y análisis de datos en tiempo real
- **🌐 Acceso de Red**: Configurado para acceso desde red local
- **🛡️ Seguridad**: Middleware de seguridad con Helmet y CORS configurado
- **📈 Monitoreo**: Sistema de logging avanzado con Morgan y tracking de performance
- **🔍 Búsqueda Avanzada**: Filtros y búsquedas en todos los módulos

## 💻 Tecnologías y Lenguajes Utilizados

### 🔧 **Backend/Runtime**
- **Node.js** `v16+` - Runtime principal de JavaScript
- **Express.js** `v4.18.2` - Framework web minimalista y rápido

### 🗄️ **Base de Datos**
- **PostgreSQL** - Base de datos relacional principal
- **Supabase** `v2.21.0` - Plataforma BaaS con PostgreSQL administrado
- **pg** `v8.16.3` - Driver nativo PostgreSQL para Node.js

### 🔐 **Autenticación y Seguridad**
- **JSON Web Token (JWT)** `v9.0.2` - Autenticación basada en tokens
- **bcryptjs** `v2.4.3` - Hashing de contraseñas
- **Helmet** `v7.0.0` - Middleware de seguridad para Express
- **CORS** `v2.8.5` - Control de acceso entre orígenes

### 📊 **Validación y Procesamiento**
- **Express Validator** `v7.0.1` - Validación de datos de entrada
- **XLSX** `v0.18.5` - Procesamiento de archivos Excel
- **Morgan** `v1.10.0` - Logging de requests HTTP

### 🌐 **Configuración y Entorno**
- **dotenv** `v16.3.1` - Gestión de variables de entorno
- **PM2** - Gestión de procesos en producción (configurado)

### 🧪 **Testing y Desarrollo**
- **Jest** `v29.7.0` - Framework de testing
- **Supertest** `v6.3.3` - Testing de APIs HTTP
- **Nodemon** `v3.0.1` - Auto-restart durante desarrollo

### 📋 **Lenguajes de Programación**
- **JavaScript (ES6+)** - Lenguaje principal del backend
- **SQL** - Consultas y estructuras de base de datos
- **JSON** - Formato de intercambio de datos
- **Markdown** - Documentación

### 🔨 **Herramientas de Desarrollo**
- **npm** - Gestión de dependencias
- **Git** - Control de versiones
- **PowerShell/Bash** - Scripts de automatización

### 📁 **Archivos de Configuración**
- **package.json** - Configuración de dependencias y scripts
- **ecosystem.config.js** - Configuración PM2 para producción
- **.env** - Variables de entorno (local)
- **.gitignore** - Control de archivos en Git

### 🏗️ **Arquitectura y Patrones**
- **REST API** - Arquitectura de servicios web
- **MVC Pattern** - Modelo-Vista-Controlador (adaptado)
- **Middleware Pattern** - Para autenticación, validación y logging
- **Repository Pattern** - Abstracción de acceso a datos
- **Environment-based Config** - Configuración por entornos

### 🔄 **Integraciones**
- **Supabase API** - Cliente oficial para PostgreSQL administrado
- **Network Configuration** - Acceso local y red configurado
- **Cross-platform** - Compatible con Windows, Linux, macOS

## 📋 Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn
- PostgreSQL (recomendado usar Supabase)
- Cuenta de Supabase configurada

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

# Configuración JWT
JWT_SECRET=tu-jwt-secret-super-seguro
JWT_EXPIRES_IN=24h

# Configuración CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3002,https://tu-frontend.com
```

4. **Ejecutar el servidor**
```bash
# Desarrollo local
npm run dev

# Desarrollo con acceso de red
npm run dev:network

# Producción
npm start

# Producción con acceso de red
npm run start:network
```

## 📚 Estructura del Proyecto

```
backend/
├── 📁 config/
│   ├── database.js              # Configuración de Supabase
│   ├── postgresql.js            # Configuración específica PostgreSQL
│   └── tabla-nombres.js         # Configuración tabla nombres
├── 📁 middleware/
│   ├── auth.js                  # Middleware de autenticación JWT
│   ├── errorHandler.js          # Manejo centralizado de errores
│   └── validation.js            # Validación de datos de entrada
├── 📁 routes/
│   ├── auth.js                  # Autenticación y usuarios
│   ├── personal-disponible.js   # Gestión de personal
│   ├── nombres.js               # Gestión de nombres (legacy)
│   ├── cursos.js                # Cursos y certificaciones
│   ├── estados.js               # Estados del sistema
│   ├── faenas.js                # Gestión de faenas
│   ├── plantas.js               # Gestión de plantas
│   ├── lineas.js                # Líneas de producción
│   ├── equipos.js               # Equipos industriales
│   ├── componentes.js           # Componentes de equipos
│   ├── lubricantes.js           # Gestión de lubricantes
│   ├── punto-lubricacion.js     # Puntos de lubricación
│   ├── tareas-programadas.js    # Tareas programadas
│   └── tareas-proyectadas.js    # Tareas proyectadas
├── 📁 scripts/
│   └── [múltiples scripts utilitarios]
├── 📁 docs/                     # 📚 Documentación completa
│   ├── API_ENDPOINTS.md         # Documentación completa de endpoints
│   ├── CURSOS_ENDPOINTS.md      # Endpoints específicos de cursos
│   ├── NOMBRES_ENDPOINTS.md     # Endpoints de gestión de nombres
│   ├── MANTENIMIENTO_ENDPOINTS.md # Endpoints de mantenimiento
│   ├── FRONTEND_API_INTEGRATION.md # Guía de integración frontend
│   ├── CORS_SETUP.md            # Configuración de CORS
│   ├── NETWORK_SETUP.md         # Configuración de red
│   ├── PRESENTACION_BACKEND.md  # Resumen ejecutivo
│   ├── RESUMEN_ENDPOINTS.md     # Resumen de todos los endpoints
│   ├── GESTION_DOCUMENTOS_CURSOS.md # **NUEVO**: Gestión de documentos
│   ├── ENDPOINTS_DOCUMENTOS_CURSOS.md # **NUEVO**: Documentación completa para frontend
│   └── ESTRUCTURA_COMPLETA_PROYECTO.md # Estructura completa del proyecto
├── server.js                    # Servidor principal
├── package.json                 # Dependencias y scripts
└── README.md                   # Esta documentación
```

## 🔌 Módulos y Endpoints Principales

### 👥 Gestión de Personal (`/api/personal-disponible`)
- **GET** `/` - Listado con paginación, filtros y búsqueda
- **POST** `/` - Crear nuevo personal
- **GET** `/:rut` - Obtener personal por RUT
- **PUT** `/:rut` - Actualizar personal
- **DELETE** `/:rut` - Eliminar personal
- **GET** `/stats/cargos` - Estadísticas por cargo
- **GET** `/verify-import` - Verificación de importación

### 🎓 Cursos y Certificaciones (`/api/cursos`)
- **GET** `/` - Listado de cursos con paginación y conteo de documentos
- **POST** `/` - Crear nuevo curso
- **GET** `/persona/:rut` - Cursos de una persona específica
- **PUT** `/:id` - Actualizar curso
- **DELETE** `/:id` - Eliminar curso
- **POST** `/:id/documentos` - **NUEVO**: Subir documentos al curso
- **GET** `/:id/documentos` - **NUEVO**: Listar documentos del curso
- **GET** `/documentos/:id/descargar` - **NUEVO**: Descargar documento
- **GET** `/documentos/:id/vista` - **NUEVO**: Visualizar documento
- **DELETE** `/documentos/:id` - **NUEVO**: Eliminar documento

### ⚙️ Estados del Sistema (`/api/estados`)
- **GET** `/` - Listado de estados disponibles
- **POST** `/` - Crear nuevo estado
- **GET** `/:id` - Obtener estado por ID
- **PUT** `/:id` - Actualizar estado

### 🏭 Gestión Industrial
- **Faenas** (`/api/faenas`) - Gestión de faenas mineras/industriales
- **Plantas** (`/api/plantas`) - Plantas de procesamiento
- **Líneas** (`/api/lineas`) - Líneas de producción
- **Equipos** (`/api/equipos`) - Equipos industriales
- **Componentes** (`/api/componentes`) - Componentes de equipos

### 🔧 Sistema de Mantenimiento Industrial

#### 📊 **Esquema Mantenimiento** (Personal y Cursos)
- **Personal Disponible** (`/api/personal-disponible`) - ✅ **FUNCIONANDO**
  - `GET /api/personal-disponible` - Listar personal con paginación
  - `POST /api/personal-disponible` - Crear nuevo personal
  - `PUT /api/personal-disponible/:rut` - Actualizar personal
  - `GET /api/personal-disponible/:rut` - Obtener personal por RUT

- **Cursos y Certificaciones** (`/api/cursos`) - ✅ **FUNCIONANDO**
  - `GET /api/cursos` - Listar cursos con filtros
  - `POST /api/cursos` - Crear nuevo curso
  - `GET /api/cursos/persona/:rut` - Cursos por persona
  - `POST /api/cursos/:id/documentos` - Subir documentos
  - `GET /api/cursos/:id/documentos` - Ver documentos
  - `GET /api/documentos` - Documentos generales

- **Estados del Sistema** (`/api/estados`) - ✅ **FUNCIONANDO**
  - `GET /api/estados` - Listar estados disponibles

#### 🏗️ **Esquema Lubricación - Estructura Jerárquica**
- **Faenas** (`/api/faenas`) - ✅ **FUNCIONANDO**
- **Plantas** (`/api/plantas`) - ✅ **FUNCIONANDO**
- **Líneas** (`/api/lineas`) - ✅ **FUNCIONANDO**
- **Equipos** (`/api/equipos`) - ✅ **FUNCIONANDO**
- **Componentes** (`/api/componentes`) - ✅ **FUNCIONANDO**

#### 🔧 **Esquema Lubricación - Sistema de Lubricación**
- **Lubricantes** (`/api/lubricantes`) - ✅ **FUNCIONANDO**
- **Puntos de Lubricación** (`/api/punto-lubricacion`) - ✅ **FUNCIONANDO**

#### 📋 **Esquema Lubricación - Gestión de Tareas**
- **Tareas Proyectadas** (`/api/tareas-proyectadas`) - ✅ **FUNCIONANDO**
- **Tareas Programadas** (`/api/tareas-programadas`) - ✅ **FUNCIONANDO**
- **Tareas Ejecutadas** (`/api/tareas-ejecutadas`) - ⚠️ **EN CORRECCIÓN**

### 🏥 Utilidades
- **GET** `/api/health` - Health check del servidor
- **GET** `/` - Información general de la API

## 📊 Estado Actual del Sistema

### ✅ **Endpoints Funcionando (12/14)**
- **Tasa de éxito: 85.7%**
- **Base de datos**: PostgreSQL conectada correctamente
- **Esquemas**: `mantenimiento` y `lubricacion` operativos
- **Conexión**: Supabase configurada y funcionando

### ⚠️ **Endpoints en Corrección (2/14)**
- `/api/cursos/stats` - Endpoint de estadísticas (pendiente implementación)
- `/api/tareas-ejecutadas` - Error de estructura de tabla (en corrección)

### 🎯 **Funcionalidades Completas**
- ✅ Gestión completa de personal
- ✅ Sistema de cursos y certificaciones
- ✅ Estructura jerárquica industrial (Faenas → Plantas → Líneas → Equipos → Componentes)
- ✅ Sistema de lubricación
- ✅ Gestión de tareas proyectadas y programadas
- ✅ Upload y descarga de documentos
- ✅ Filtros y búsquedas avanzadas
- ✅ Paginación en todos los endpoints

## 🌐 Configuración de Red

El sistema está configurado para funcionar tanto en desarrollo local como en red:

- **URL Local**: `http://localhost:3000`
- **URL Red**: `http://192.168.10.198:3000` (IP actual detectada)
- **Health Check**: `http://localhost:3000/api/health`
- **CORS**: Configurado para IPs de red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)

### Scripts de Red
```bash
# PowerShell (Windows)
.\start-network.ps1

# Bash (Linux/Mac)
./start-network.sh
```

## 🛡️ Seguridad y Validaciones

### Características de Seguridad
- **CORS** configurado para red local
- **Helmet** para headers de seguridad
- **JWT** para autenticación (en desarrollo)
- **Validación** de entrada con express-validator
- **RUT único** - Prevención de duplicados
- **Integridad referencial** - Validación de relaciones FK

### Códigos de Respuesta
- **200**: Operación exitosa
- **201**: Recurso creado exitosamente
- **304**: No modificado (caché)
- **400**: Datos inválidos
- **401**: No autorizado
- **404**: Recurso no encontrado
- **409**: Conflicto (ej: RUT duplicado)
- **500**: Error interno del servidor

## 📊 Características de Performance

- **Query promedio**: 140-200ms (optimizado con PostgreSQL directo)
- **Paginación**: Configurada en todos los listados (20 registros por defecto)
- **Base de datos**: PostgreSQL con Supabase (conexión estable)
- **Esquemas**: Separación lógica entre `mantenimiento` y `lubricacion`
- **Endpoints activos**: 12/14 funcionando (85.7% operativo)
- **Caché**: Respuestas 304 para recursos sin cambios
- **Logging**: Monitoreo completo de requests y queries
- **Optimización**: JOINs optimizados y consultas eficientes

## 🔍 Búsqueda y Filtros

Todos los endpoints de listado soportan:
- **search**: Búsqueda por texto
- **filtros específicos**: Por cargo, estado, zona, etc.
- **paginación**: `limit` y `offset`
- **ordenamiento**: Por diferentes campos

Ejemplo:
```
GET /api/personal-disponible?search=técnico&estado_id=1&limit=20&offset=0
```

## 📝 Ejemplos de Uso

### Crear Personal Nuevo
```bash
curl -X POST http://localhost:3000/api/personal-disponible \
  -H "Content-Type: application/json" \
  -d '{
    "rut": "12345678-9",
    "sexo": "M",
    "fecha_nacimiento": "1990-01-15",
    "licencia_conducir": "B",
    "cargo": "Técnico Mecánico",
    "estado_id": 1,
    "zona_geografica": "Norte",
    "talla_zapatos": "42",
    "talla_pantalones": "L",
    "talla_poleras": "L"
  }'
```

### Buscar Personal
```bash
curl "http://localhost:3000/api/personal-disponible?search=técnico&limit=10"
```

### Obtener Cursos de una Persona
```bash
curl "http://localhost:3000/api/cursos/persona/12345678-9"
```

## 📚 Documentación Completa

Toda la documentación técnica detallada se encuentra en la carpeta `docs/`:

- **[API_ENDPOINTS.md](docs/API_ENDPOINTS.md)** - Documentación completa de todos los endpoints
- **[FRONTEND_API_INTEGRATION.md](docs/FRONTEND_API_INTEGRATION.md)** - Guía completa para integración con frontend
- **[MANTENIMIENTO_ENDPOINTS.md](docs/MANTENIMIENTO_ENDPOINTS.md)** - Endpoints específicos del sistema de mantenimiento
- **[CURSOS_ENDPOINTS.md](docs/CURSOS_ENDPOINTS.md)** - Documentación detallada de cursos y certificaciones
- **[CORS_SETUP.md](docs/CORS_SETUP.md)** - Configuración de CORS para diferentes entornos
- **[NETWORK_SETUP.md](docs/NETWORK_SETUP.md)** - Configuración para acceso en red local
- **[RESUMEN_ENDPOINTS.md](docs/RESUMEN_ENDPOINTS.md)** - Resumen ejecutivo de todos los endpoints
- **[ENDPOINTS_DOCUMENTOS_CURSOS.md](docs/ENDPOINTS_DOCUMENTOS_CURSOS.md)** - **NUEVO**: Documentación completa de endpoints de documentos para frontend

## 🧪 Testing y Desarrollo

```bash
# Health check
curl http://localhost:3000/api/health

# Verificar importación de datos
curl http://localhost:3000/api/personal-disponible/verify-import

# Estadísticas por cargo
curl http://localhost:3000/api/personal-disponible/stats/cargos
```

## 🚀 Despliegue

### Variables de entorno para producción
```env
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
JWT_SECRET=secret-super-seguro-y-unico
CORS_ORIGIN=https://tu-dominio.com
```

### Comandos de despliegue
```bash
# Instalar dependencias de producción
npm ci --only=production

# Iniciar servidor
npm start
```

## 📊 Estado del Proyecto

### ✅ Módulos Completamente Funcionales
- Personal Disponible (CRUD completo)
- Estados del Sistema
- Cursos y Certificaciones
- Nombres (con funcionalidad legacy)
- Gestión de Plantas, Líneas, Equipos
- Sistema de Lubricantes y Puntos de Lubricación

### ⚠️ En Desarrollo
- Autenticación JWT completa
- Tareas Programadas y Ejecutadas (endpoints básicos implementados)
- Reportes avanzados y dashboard

### 🔧 Próximas Mejoras
- Dashboard de métricas en tiempo real
- Sistema de notificaciones
- Reportes PDF/Excel
- API móvil optimizada
- Caché Redis para mejor performance

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request


## 📞 Soporte y Contacto

- **Estado Actual**: ✅ OPERATIVO en `http://192.168.10.196:3000`
- **Performance**: ⚡ Queries promedio 140-150ms
- **Disponibilidad**: 🌐 Accesible desde red local
- **Monitoreo**: 📊 Logs activos con tracking completo

Para soporte técnico o dudas, revisar la documentación en la carpeta `docs/` o contactar al equipo de desarrollo.

---

**🏭 Sistema de Gestión de Personal y Mantenimiento Industrial - v1.0.0**







