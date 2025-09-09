# 📋 Estructura Completa del Proyecto - Sistema de Gestión de Personal y Mantenimiento

## 🎯 **Resumen Ejecutivo**

Este es un **backend completo** desarrollado con **Node.js** y **Express.js** que gestiona un sistema integral de personal y mantenimiento industrial. El proyecto está diseñado para manejar la jerarquía organizacional completa de una empresa industrial, desde faenas hasta puntos de lubricación específicos, junto con la gestión de personal, cursos, certificaciones y tareas de mantenimiento.

---

## 🏗️ **Arquitectura General del Sistema**

### **🔧 Stack Tecnológico Principal**
- **Runtime**: Node.js v16+
- **Framework**: Express.js v4.18.2
- **Base de Datos**: PostgreSQL (via Supabase)
- **Autenticación**: JWT (JSON Web Tokens)
- **Seguridad**: Helmet, CORS, bcrypt
- **Gestión de Procesos**: PM2

### **📐 Patrón Arquitectónico**
```
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR EXPRESS                         │
├─────────────────────────────────────────────────────────────┤
│  🌐 server.js (Entry Point + Middleware + Routing)         │
├─────────────────────────────────────────────────────────────┤
│  📁 routes/ (Controllers - 17 módulos)                     │
│  📁 middleware/ (Auth, Validation, Error Handling)         │
│  📁 config/ (Database, Environment)                        │
│  📁 scripts/ (Utilities, Migrations, Data Import)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 **Estructura Detallada del Proyecto**

### **🌐 Archivo Principal: `server.js`**
```javascript
// Configuración del servidor Express
- Puerto: 3000 (configurable)
- Host: 0.0.0.0 (acceso desde red local)
- Middleware: Helmet, CORS, Morgan, JSON parsing
- CORS: Configurado para red local (192.168.x.x)
- Health Check: /api/health
```

### **📂 Carpeta `routes/` - Controllers (17 módulos)**

#### **🔐 Autenticación (3 módulos)**
1. **`auth.js`** - Sistema completo JWT
   - Registro de usuarios
   - Login con JWT
   - Verificación de tokens
   - Gestión de roles

2. **`auth-simple.js`** - Autenticación simplificada
   - Endpoints básicos de testing
   - Registro simple sin validaciones

3. **`auth-temp.js`** - Autenticación temporal
   - Sistema temporal para desarrollo
   - Endpoints de prueba

#### **👥 Gestión de Personal (2 módulos)**
4. **`personal-disponible.js`** - CRUD completo personal
   - Crear, leer, actualizar, eliminar personal
   - Filtros por RUT, nombre, cargo, zona
   - Paginación y búsqueda avanzada
   - Estadísticas de personal
   - Validaciones completas

5. **`nombres.js`** - Gestión de nombres
   - Acceso a nombres del personal
   - Estadísticas de nombres
   - Filtros por sexo, licencia

#### **🎓 Cursos y Certificaciones (1 módulo)**
6. **`cursos.js`** - Sistema completo de cursos
   - CRUD cursos y certificaciones
   - Asociación con personal
   - Filtros por RUT y curso
   - Estadísticas de certificaciones
   - JOIN con datos personales

#### **🏭 Jerarquía Organizacional (5 módulos - PENDIENTES)**
7. **`faenas.js`** - ⚠️ Solo estructura, sin lógica
8. **`plantas.js`** - ⚠️ Solo estructura, sin lógica
9. **`lineas.js`** - ⚠️ Solo estructura, sin lógica
10. **`equipos.js`** - ⚠️ Solo estructura, sin lógica
11. **`componentes.js`** - ⚠️ Solo estructura, sin lógica

#### **🛢️ Sistema de Mantenimiento (4 módulos)**
12. **`lubricantes.js`** - ✅ CRUD completo lubricantes
13. **`punto-lubricacion.js`** - ✅ Puntos de lubricación
14. **`estados.js`** - ✅ Estados del sistema
15. **`tareas-ejecutadas.js`** - ✅ Tareas completadas

#### **📋 Sistema de Tareas (2 módulos - PENDIENTES)**
16. **`tareas-programadas.js`** - ⚠️ Solo estructura, sin lógica
17. **`tareas-proyectadas.js`** - ⚠️ Solo estructura, sin lógica

### **📂 Carpeta `middleware/` - Lógica de Negocio**

#### **🔐 `auth.js` - Sistema de Autenticación**
```javascript
- authenticateToken()    // Verificación JWT
- requireRole()          // Control de roles
- requireOwnership()     // Verificación de propiedad
```

#### **⚠️ `errorHandler.js` - Manejo de Errores**
```javascript
- errorHandler()         // Middleware global de errores
- AppError              // Clase personalizada de errores
- asyncHandler()        // Wrapper para funciones async
```

#### **✅ `validation.js` - Validaciones**
```javascript
- validateLogin()        // Validación de login
- validateRegister()     // Validación de registro
- Validaciones personalizadas
```

### **📂 Carpeta `config/` - Configuración**

#### **🗄️ `database.js` - Conexión Supabase**
```javascript
- Cliente Supabase normal
- Cliente Supabase admin
- testConnection()       // Verificación de conexión
- getSupabaseClient()    // Obtener cliente
- getSupabaseAdminClient() // Obtener cliente admin
```

#### **🔌 `postgresql.js` - Driver PostgreSQL**
```javascript
- Conexión directa PostgreSQL
- query()               // Ejecutar consultas SQL
- Configuración de pool de conexiones
```

#### **📋 `tabla-nombres.js` - Configuración de Tablas**
```javascript
- Configuración específica de tablas
- Mapeo de nombres de tablas
```

### **📂 Carpeta `scripts/` - Utilidades (20+ archivos)**

#### **🔍 Scripts de Verificación**
- `check-cursos-table.js` - Verificar tabla cursos
- `check-estados.js` - Verificar estados
- `check-nombre-table.js` - Verificar tabla nombres
- `check-personal.js` - Verificar personal

#### **📊 Scripts de Importación**
- `import-excel.js` - Importar desde Excel
- `import-personal-disponible.js` - Importar personal
- `generate-sql-import.js` - Generar SQL de importación

#### **🔧 Scripts de Utilidad**
- `inspect-database.js` - Inspeccionar base de datos
- `test-connection-simple.js` - Probar conexión
- `json-to-csv.js` - Convertir JSON a CSV

---

## 🗄️ **Sistema de Base de Datos**

### **🔌 Configuración de Conexión**
- **Tecnología**: PostgreSQL via Supabase
- **Schema Principal**: `mantenimiento`
- **Drivers**: Supabase client + pg nativo
- **Configuración**: Dual (cliente normal + admin)

### **📊 Estructura Jerárquica del Sistema**
```
🏭 FAENAS
  └── 🏢 PLANTAS
      └── 📏 LÍNEAS
          └── ⚙️ EQUIPOS
              └── 🔧 COMPONENTES
                  └── 🛢️ PUNTOS LUBRICACIÓN
```

### **📋 Tablas Principales Identificadas**
```sql
-- Schema: mantenimiento
- personal_disponible      ✅ Implementada
- cursos_certificaciones   ✅ Implementada
- estados                 ✅ Implementada
- lubricantes             ✅ Implementada
- punto_lubricacion       ✅ Implementada
- tareas_ejecutadas       ✅ Implementada
- faenas                  ⚠️ Pendiente
- plantas                 ⚠️ Pendiente
- lineas                  ⚠️ Pendiente
- equipos                 ⚠️ Pendiente
- componentes             ⚠️ Pendiente
- tareas_programadas      ⚠️ Pendiente
- tareas_proyectadas      ⚠️ Pendiente
```

---

## 🔐 **Sistema de Seguridad**

### **🛡️ Middleware de Seguridad**
- **Helmet**: Protección HTTP headers
- **CORS**: Configurado para red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- **JWT**: Autenticación basada en tokens
- **bcrypt**: Hashing de contraseñas
- **Validaciones**: Express-validator

### **👤 Sistema de Autenticación**
```javascript
✅ JWT Authentication        # middleware/auth.js
✅ Role-based Access Control # requireRole()
✅ Resource Ownership        # requireOwnership()
✅ Token Validation          # authenticateToken()
✅ Password Hashing          # bcryptjs
```

### **🔒 Configuración de CORS**
```javascript
// Orígenes permitidos:
- http://localhost:3000, 3001, 3002
- http://[IP_LOCAL]:3000, 3001, 3002
- Cualquier IP de red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
```

---

## 📊 **Estado de Implementación**

### **✅ MÓDULOS COMPLETAMENTE FUNCIONALES (10)**
1. **Autenticación** - Sistema JWT completo
2. **Personal Disponible** - CRUD completo con filtros
3. **Nombres** - Gestión de nombres del personal
4. **Cursos** - Sistema de cursos y certificaciones
5. **Estados** - Estados del sistema
6. **Lubricantes** - Gestión de lubricantes
7. **Punto Lubricación** - Puntos de lubricación
8. **Tareas Ejecutadas** - Tareas completadas
9. **Middleware de Seguridad** - Auth, validación, errores
10. **Configuración de Base de Datos** - Conexiones y drivers

### **⚠️ MÓDULOS CON ESTRUCTURA, SIN LÓGICA (7)**
1. **Faenas** - Solo endpoints placeholder
2. **Plantas** - Solo endpoints placeholder
3. **Líneas** - Solo endpoints placeholder
4. **Equipos** - Solo endpoints placeholder
5. **Componentes** - Solo endpoints placeholder
6. **Tareas Programadas** - Solo endpoints placeholder
7. **Tareas Proyectadas** - Solo endpoints placeholder

---

## 🌐 **Endpoints Disponibles**

### **🔐 Autenticación**
```
POST /api/auth/register          # Registro de usuarios
POST /api/auth/login             # Login con JWT
GET  /api/auth/test              # Test de rutas
GET  /api/auth/check-users       # Verificar usuarios
POST /api/auth-simple/*          # Auth simplificada
POST /api/auth-temp/*            # Auth temporal
```

### **👥 Personal y Recursos Humanos**
```
GET    /api/personal-disponible     # Listar personal
POST   /api/personal-disponible     # Crear personal
PUT    /api/personal-disponible/:id # Actualizar personal
DELETE /api/personal-disponible/:id # Eliminar personal
GET    /api/personal-disponible/stats # Estadísticas

GET    /api/nombres                 # Listar nombres
GET    /api/nombres/stats           # Estadísticas nombres
GET    /api/nombres/search/:term    # Buscar nombres

GET    /api/cursos                  # Listar cursos
POST   /api/cursos                  # Crear curso
PUT    /api/cursos/:id              # Actualizar curso
DELETE /api/cursos/:id              # Eliminar curso
GET    /api/cursos/stats            # Estadísticas cursos
GET    /api/cursos/persona/:rut     # Cursos por persona
```

### **🛢️ Sistema de Mantenimiento**
```
GET    /api/estados                 # Estados del sistema
GET    /api/lubricantes             # Listar lubricantes
POST   /api/lubricantes             # Crear lubricante
PUT    /api/lubricantes/:id         # Actualizar lubricante
DELETE /api/lubricantes/:id         # Eliminar lubricante

GET    /api/punto-lubricacion       # Puntos de lubricación
POST   /api/punto-lubricacion       # Crear punto
PUT    /api/punto-lubricacion/:id   # Actualizar punto
DELETE /api/punto-lubricacion/:id   # Eliminar punto

GET    /api/tareas-ejecutadas       # Tareas completadas
POST   /api/tareas-ejecutadas       # Crear tarea ejecutada
PUT    /api/tareas-ejecutadas/:id   # Actualizar tarea
DELETE /api/tareas-ejecutadas/:id   # Eliminar tarea
```

### **⚠️ Endpoints Pendientes (Solo estructura)**
```
/api/faenas/*                      # Gestión de faenas
/api/plantas/*                     # Gestión de plantas
/api/lineas/*                      # Gestión de líneas
/api/equipos/*                     # Gestión de equipos
/api/componentes/*                 # Gestión de componentes
/api/tareas-programadas/*          # Tareas programadas
/api/tareas-proyectadas/*          # Tareas proyectadas
```

### **🏥 Sistema y Utilidades**
```
GET    /api/health                  # Health check
GET    /                           # Información de la API
```

---

## 📦 **Dependencias del Proyecto**

### **🔧 Dependencias Principales**
```json
{
  "express": "4.18.2",                    // Framework web
  "@supabase/supabase-js": "2.21.0",      // Cliente Supabase
  "pg": "8.16.3",                         // Driver PostgreSQL
  "jsonwebtoken": "9.0.2",                // JWT authentication
  "bcryptjs": "2.4.3",                    // Hash passwords
  "helmet": "7.0.0",                      // Security headers
  "cors": "2.8.5",                        // Cross-origin requests
  "morgan": "1.10.0",                     // HTTP logging
  "express-validator": "7.0.1",           // Input validation
  "dotenv": "16.3.1",                     // Environment variables
  "xlsx": "0.18.5"                        // Excel file processing
}
```

### **🧪 Dependencias de Desarrollo**
```json
{
  "jest": "29.7.0",                       // Testing framework
  "supertest": "6.3.3",                   // HTTP testing
  "nodemon": "3.0.1"                      // Development server
}
```

---

## ⚙️ **Configuración del Entorno**

### **📄 Archivo `config.env`**
```env
# Base de datos
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# PostgreSQL directo
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tu_database
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_jwt_secret
JWT_EXPIRES_IN=24h

# Servidor
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```

### **🔧 Archivo `ecosystem.config.js` (PM2)**
```javascript
// Configuración para producción con PM2
- Instancias: 1
- Modo: cluster
- Restart automático
- Logs centralizados
- Variables de entorno
```

---

## 🚀 **Comandos de Ejecución**

### **🛠️ Desarrollo**
```bash
npm start              # Iniciar servidor
npm run dev            # Desarrollo con nodemon
npm test               # Ejecutar tests
```

### **📦 Producción**
```bash
npm run build          # Construir para producción
pm2 start ecosystem.config.js  # Iniciar con PM2
pm2 logs               # Ver logs
pm2 restart all        # Reiniciar todos los procesos
```

---

## 📊 **Métricas y Monitoreo**

### **🏥 Health Check**
- **Endpoint**: `/api/health`
- **Respuesta**: Estado del servidor, timestamp, ambiente
- **Uso**: Monitoreo de salud del sistema

### **📝 Logging**
- **Morgan**: Logging HTTP requests
- **Console**: Logs de aplicación
- **PM2**: Logs centralizados en producción

### **🔍 Debugging**
- **Endpoint**: `/api/debug/frontend` (para debugging frontend)
- **Logs detallados**: En modo desarrollo
- **Stack traces**: En errores de desarrollo

---

## 🎯 **Funcionalidades Clave Implementadas**

### **👥 Gestión de Personal**
- ✅ CRUD completo con validaciones
- ✅ Filtros avanzados (RUT, nombre, cargo, zona)
- ✅ Paginación y búsqueda
- ✅ Estadísticas detalladas
- ✅ Importación desde Excel

### **🎓 Sistema de Cursos**
- ✅ Gestión de cursos y certificaciones
- ✅ Asociación con personal
- ✅ Filtros por persona y curso
- ✅ Estadísticas de certificaciones
- ✅ JOIN con datos personales

### **🔐 Autenticación Robusta**
- ✅ JWT con expiración
- ✅ Roles y permisos
- ✅ Verificación de propiedad
- ✅ Middleware de seguridad
- ✅ Hash seguro de contraseñas

### **🛢️ Mantenimiento Básico**
- ✅ Gestión de lubricantes
- ✅ Puntos de lubricación
- ✅ Estados del sistema
- ✅ Tareas ejecutadas

---

## 🚧 **Áreas de Desarrollo Pendientes**

### **🏭 Jerarquía Organizacional (CRÍTICO)**
- Implementar CRUD para faenas
- Implementar CRUD para plantas
- Implementar CRUD para líneas
- Implementar CRUD para equipos
- Implementar CRUD para componentes
- Establecer relaciones entre niveles

### **📋 Sistema de Tareas (IMPORTANTE)**
- Implementar tareas programadas
- Implementar tareas proyectadas
- Sistema de programación automática
- Notificaciones de tareas pendientes

### **📄 Gestión de Documentos (NUEVO)**
- Subida de archivos PDF/imágenes
- Almacenamiento de certificados
- Validación de documentos
- Sistema de versionado

### **📊 Dashboard y Reportes (MEJORA)**
- Métricas de personal
- Estadísticas de mantenimiento
- Reportes de cursos
- Gráficos y visualizaciones

---

## 🔧 **Configuración de Red**

### **🌐 Acceso Local**
- **URL Local**: `http://localhost:3000`
- **URL Red**: `http://[IP_LOCAL]:3000`
- **Health Check**: `http://[IP_LOCAL]:3000/api/health`

### **🔒 CORS Configurado Para**
- Redes locales (192.168.x.x)
- Redes privadas (10.x.x.x)
- Redes privadas (172.16-31.x.x)
- Localhost (127.0.0.1)

---

## 📚 **Documentación Adicional**

### **📁 Archivos de Documentación en `docs/`**
- `API_ENDPOINTS.md` - Documentación completa de endpoints
- `RESUMEN_ENDPOINTS.md` - Resumen ejecutivo
- `MANTENIMIENTO_ENDPOINTS.md` - Sistema de mantenimiento
- `CURSOS_ENDPOINTS.md` - Sistema de cursos
- `NOMBRES_ENDPOINTS.md` - Gestión de nombres
- `FRONTEND_API_INTEGRATION.md` - Integración frontend
- `CORS_SETUP.md` - Configuración CORS
- `NETWORK_SETUP.md` - Configuración de red
- `PRESENTACION_BACKEND.md` - Presentación del backend
- `SOLUCION_ERRORES_FRONTEND.md` - Solución de errores

---

## 🎯 **Conclusión**

Este backend representa un **sistema sólido y bien estructurado** para la gestión de personal y mantenimiento industrial. La arquitectura es **escalable**, la seguridad está **bien implementada**, y los módulos principales están **completamente funcionales**.

### **✅ Fortalezas**
- Arquitectura limpia y modular
- Sistema de autenticación robusto
- Gestión completa de personal
- Sistema de cursos funcional
- Documentación extensa
- Configuración de seguridad adecuada

### **⚠️ Áreas de Oportunidad**
- Completar jerarquía organizacional
- Implementar sistema de tareas
- Agregar gestión de documentos
- Desarrollar dashboard de métricas

El proyecto está **listo para producción** en sus módulos implementados y tiene una **base sólida** para continuar el desarrollo de las funcionalidades pendientes.
