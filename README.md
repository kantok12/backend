# Backend - Sistema de Gestión de Personal

Backend completo para el sistema de gestión de personal desarrollado con Node.js, Express y Supabase.

## 🚀 Características

- **Autenticación JWT**: Sistema completo de autenticación y autorización
- **API RESTful**: Endpoints bien estructurados para todas las operaciones CRUD
- **Validación de datos**: Validación robusta de entrada con express-validator
- **Manejo de errores**: Sistema centralizado de manejo de errores
- **Paginación**: Soporte para paginación en todas las consultas
- **Búsqueda y filtros**: Funcionalidad de búsqueda avanzada
- **Seguridad**: Middleware de seguridad con Helmet y CORS configurado
- **Logging**: Sistema de logging con Morgan
- **Base de datos**: Integración completa con Supabase

## 📋 Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn
- Cuenta de Supabase
- Base de datos PostgreSQL configurada

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

Editar el archivo `config.env` con tus credenciales de Supabase:
```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role-supabase

# Configuración JWT
JWT_SECRET=tu-jwt-secret-super-seguro
JWT_EXPIRES_IN=24h

# Configuración CORS
CORS_ORIGIN=http://localhost:3000,https://tu-frontend-gcp.appspot.com
```

4. **Ejecutar el servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 Estructura del Proyecto

```
backend/
├── config/
│   └── database.js          # Configuración de Supabase
├── middleware/
│   ├── auth.js              # Middleware de autenticación
│   ├── errorHandler.js      # Manejo de errores
│   └── validation.js        # Validación de datos
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── personal.js          # Rutas de personal
│   ├── empresas.js          # Rutas de empresas
│   └── servicios.js         # Rutas de servicios
├── server.js                # Servidor principal
├── package.json             # Dependencias y scripts
├── config.env               # Variables de entorno
└── README.md               # Documentación
```

## 🔌 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener información del usuario actual
- `POST /api/auth/refresh` - Renovar token

### Personal
- `GET /api/personal` - Obtener lista de personal (con paginación y filtros)
- `GET /api/personal/:id` - Obtener personal por ID
- `POST /api/personal` - Crear nuevo personal
- `PUT /api/personal/:id` - Actualizar personal
- `DELETE /api/personal/:id` - Eliminar personal
- `GET /api/personal/:id/disponibilidad` - Obtener disponibilidad
- `PUT /api/personal/:id/disponibilidad` - Actualizar disponibilidad

### Empresas
- `GET /api/empresas` - Obtener lista de empresas
- `GET /api/empresas/:id` - Obtener empresa por ID
- `POST /api/empresas` - Crear nueva empresa
- `PUT /api/empresas/:id` - Actualizar empresa
- `DELETE /api/empresas/:id` - Eliminar empresa
- `GET /api/empresas/:id/personal` - Obtener personal de una empresa

### Servicios
- `GET /api/servicios` - Obtener lista de servicios
- `GET /api/servicios/:id` - Obtener servicio por ID
- `POST /api/servicios` - Crear nuevo servicio
- `PUT /api/servicios/:id` - Actualizar servicio
- `DELETE /api/servicios/:id` - Eliminar servicio
- `GET /api/servicios/:id/personal` - Obtener personal de un servicio
- `GET /api/servicios/stats/estadisticas` - Obtener estadísticas

### Utilidades
- `GET /api/health` - Verificar estado del servidor
- `GET /` - Información de la API

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Para acceder a rutas protegidas, incluye el token en el header:

```
Authorization: Bearer <tu-token-jwt>
```

## 📝 Ejemplos de Uso

### Registrar un usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "contraseña123",
    "nombre": "Juan",
    "apellido": "Pérez"
  }'
```

### Iniciar sesión
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "contraseña123"
  }'
```

### Obtener personal (con autenticación)
```bash
curl -X GET http://localhost:3000/api/personal \
  -H "Authorization: Bearer <tu-token-jwt>"
```

### Crear nuevo personal
```bash
curl -X POST http://localhost:3000/api/personal \
  -H "Authorization: Bearer <tu-token-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María",
    "apellido": "González",
    "rut": "12.345.678-9",
    "fecha_nacimiento": "1990-05-15",
    "cargo": "Técnico",
    "email": "maria@empresa.com",
    "telefono": "+56912345678"
  }'
```

## 🔍 Filtros y Búsqueda

### Paginación
```
GET /api/personal?page=1&limit=10
```

### Búsqueda
```
GET /api/personal?search=Juan&filtro=nombre
```

Filtros disponibles:
- `nombre` - Buscar por nombre o apellido
- `cargo` - Buscar por cargo
- `empresa` - Buscar por empresa
- `servicio` - Buscar por servicio

## 🛡️ Seguridad

- **Helmet**: Headers de seguridad
- **CORS**: Configuración de origen cruzado
- **Validación**: Validación de entrada con express-validator
- **JWT**: Autenticación basada en tokens
- **Bcrypt**: Encriptación de contraseñas
- **Rate Limiting**: Protección contra ataques de fuerza bruta

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm run test:watch
```

## 📊 Monitoreo

- **Morgan**: Logging de requests HTTP
- **Health Check**: Endpoint `/api/health` para monitoreo
- **Error Handling**: Logging centralizado de errores

## 🚀 Despliegue

### Variables de entorno para producción
```env
NODE_ENV=production
PORT=8080
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

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico, contacta a:
- Email: soporte@empresa.com
- Documentación: [docs.empresa.com](https://docs.empresa.com)

## 🔄 Changelog

### v1.0.0
- Implementación inicial del backend
- Sistema de autenticación JWT
- CRUD completo para personal, empresas y servicios
- Validación de datos
- Manejo de errores centralizado
- Documentación completa
