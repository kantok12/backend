# 📚 Documentación del Sistema de Gestión de Personal y Mantenimiento

Bienvenido a la documentación completa del backend del Sistema de Gestión de Personal y Mantenimiento Industrial.

## 📋 Índice de Documentación

### 🔗 Documentación de API

#### **[API_ENDPOINTS.md](API_ENDPOINTS.md)**
📖 **Documentación completa de la API**
- Todos los endpoints disponibles
- Ejemplos de peticiones y respuestas
- Códigos de estado HTTP
- Guía completa de autenticación
- Validaciones y formatos de datos

#### **[RESUMEN_ENDPOINTS.md](RESUMEN_ENDPOINTS.md)**
⚡ **Resumen ejecutivo de endpoints**
- Lista rápida de todos los endpoints disponibles
- Estado actual de cada módulo
- Estadísticas de uso y performance
- Endpoints más utilizados

#### **[MANTENIMIENTO_ENDPOINTS.md](MANTENIMIENTO_ENDPOINTS.md)**
🔧 **Sistema de Mantenimiento Industrial**
- Gestión de faenas, plantas, líneas y equipos
- Puntos de lubricación y mantenimiento
- Tareas proyectadas y programadas
- Jerarquía organizacional completa

#### **[CURSOS_ENDPOINTS.md](CURSOS_ENDPOINTS.md)**
🎓 **Cursos y Certificaciones**
- Gestión de cursos y certificaciones
- Endpoints específicos para el módulo de capacitación
- Ejemplos con Postman
- Relaciones con personal disponible

#### **[NOMBRES_ENDPOINTS.md](NOMBRES_ENDPOINTS.md)**
👤 **Gestión de Nombres (Legacy)**
- Sistema legacy de gestión de nombres
- Operaciones CRUD básicas
- Compatibilidad con sistemas anteriores

### 🌐 Configuración y Despliegue

#### **[NETWORK_SETUP.md](NETWORK_SETUP.md)**
🌐 **Configuración de Red Local**
- Configuración para acceso desde red local
- Scripts de inicio para diferentes plataformas
- Configuración de firewall
- Resolución de problemas de conectividad

#### **[CORS_SETUP.md](CORS_SETUP.md)**
🛡️ **Configuración de CORS**
- Configuración detallada de CORS
- Solución de problemas comunes
- Configuración para diferentes entornos
- Seguridad y orígenes permitidos

### 🚀 Integración y Desarrollo

#### **[FRONTEND_API_INTEGRATION.md](FRONTEND_API_INTEGRATION.md)**
📱 **Guía de Integración Frontend**
- Guía completa para integrar con frontend
- Hooks React personalizados
- Ejemplos de código JavaScript/TypeScript
- Configuración con Axios
- Componentes de ejemplo
- Estilos CSS sugeridos

#### **[PRESENTACION_BACKEND.md](PRESENTACION_BACKEND.md)**
📊 **Resumen Ejecutivo**
- Arquitectura del sistema
- Tecnologías utilizadas
- Características principales
- Métricas de performance
- Estado actual del proyecto

## 🎯 Guía de Navegación por Casos de Uso

### 🆕 Si eres nuevo en el proyecto
1. Lee **[PRESENTACION_BACKEND.md](PRESENTACION_BACKEND.md)** para una vista general
2. Revisa **[API_ENDPOINTS.md](API_ENDPOINTS.md)** para entender la API
3. Consulta **[NETWORK_SETUP.md](NETWORK_SETUP.md)** para configurar el entorno

### 🔧 Si vas a desarrollar frontend
1. Comienza con **[FRONTEND_API_INTEGRATION.md](FRONTEND_API_INTEGRATION.md)**
2. Consulta **[API_ENDPOINTS.md](API_ENDPOINTS.md)** para endpoints específicos
3. Revisa **[CORS_SETUP.md](CORS_SETUP.md)** si tienes problemas de CORS

### 📊 Si necesitas información específica de módulos
- **Personal**: [API_ENDPOINTS.md](API_ENDPOINTS.md) (sección Personal)
- **Mantenimiento**: [MANTENIMIENTO_ENDPOINTS.md](MANTENIMIENTO_ENDPOINTS.md)
- **Cursos**: [CURSOS_ENDPOINTS.md](CURSOS_ENDPOINTS.md)
- **Nombres**: [NOMBRES_ENDPOINTS.md](NOMBRES_ENDPOINTS.md)

### 🌐 Si tienes problemas de conectividad
1. **[NETWORK_SETUP.md](NETWORK_SETUP.md)** para configuración de red
2. **[CORS_SETUP.md](CORS_SETUP.md)** para problemas de CORS
3. **[API_ENDPOINTS.md](API_ENDPOINTS.md)** para verificar health check

### 📈 Si necesitas un resumen rápido
1. **[RESUMEN_ENDPOINTS.md](RESUMEN_ENDPOINTS.md)** - Vista general de endpoints
2. **[PRESENTACION_BACKEND.md](PRESENTACION_BACKEND.md)** - Resumen ejecutivo

## 🔍 Búsqueda Rápida

### Endpoints por Categoría
- **👥 Personal**: `/api/personal-disponible`
- **🎓 Cursos**: `/api/cursos`
- **⚙️ Estados**: `/api/estados`
- **🏭 Faenas**: `/api/faenas`
- **🔧 Equipos**: `/api/equipos`, `/api/componentes`
- **🛠️ Mantenimiento**: `/api/lubricantes`, `/api/punto-lubricacion`
- **📋 Tareas**: `/api/tareas-proyectadas`, `/api/tareas-programadas`

### URLs Importantes
- **Servidor Local**: `http://localhost:3000`
- **Health Check**: `http://localhost:3000/api/health`
- **API Base**: `http://localhost:3000/api`

### Scripts de Inicio
- **Desarrollo Local**: `npm run dev`
- **Desarrollo con Red**: `npm run dev:network`
- **Producción**: `npm start`

## 📞 Información de Contacto

- **Estado del Sistema**: ✅ Operativo
- **URL Actual**: `http://192.168.10.196:3000`
- **Performance**: ⚡ 140-150ms promedio
- **Disponibilidad**: 🌐 Red local configurada

---

**Última actualización**: $(date)  
**Versión del Sistema**: v1.0.0

Para más información, consulta el [README principal](../README.md) del proyecto.









