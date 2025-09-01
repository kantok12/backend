# 🔧 Configuración de CORS - Sistema de Gestión de Personal

## 📋 Problema Resuelto

Se ha actualizado la configuración de CORS en el backend para permitir conexiones desde el frontend que se ejecuta en el puerto 3002.

## 🔄 Cambios Realizados

### 1. Actualización en `server.js`

```javascript
// Middleware CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 2. Actualización en `config.env`

```env
# Configuración CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3002,https://tu-frontend-gcp.appspot.com
```

## 🚀 Configuración Completa de CORS

### Opción 1: Configuración Básica (Recomendada)
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Opción 2: Configuración Avanzada
```javascript
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://tu-frontend-gcp.appspot.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 horas
}));
```

### Opción 3: Configuración para Desarrollo
```javascript
// Solo para desarrollo - NO usar en producción
app.use(cors({
  origin: true, // Permite todos los orígenes
  credentials: true
}));
```

## 🔍 Verificación de CORS

### 1. Verificar Headers de Respuesta
```bash
curl -H "Origin: http://localhost:3002" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     http://localhost:3000/api/auth/login
```

### 2. Verificar desde el Navegador
Abre las herramientas de desarrollador (F12) y verifica en la pestaña Network:
- Headers de respuesta incluyen `Access-Control-Allow-Origin`
- No hay errores de CORS en la consola

## 🛠️ Solución de Problemas Comunes

### Error: "Access to fetch at 'http://localhost:3000/api/auth/login' from origin 'http://localhost:3002' has been blocked by CORS policy"

**Solución:**
1. Verificar que el backend esté ejecutándose en el puerto 3000
2. Verificar que la configuración de CORS incluya `http://localhost:3002`
3. Reiniciar el servidor backend después de los cambios

### Error: "Request header field Authorization is not allowed by Access-Control-Allow-Headers"

**Solución:**
Asegurar que `Authorization` esté incluido en `allowedHeaders`:
```javascript
allowedHeaders: ['Content-Type', 'Authorization']
```

### Error: "The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'"

**Solución:**
No usar `origin: '*'` cuando `credentials: true`. Usar orígenes específicos:
```javascript
origin: ['http://localhost:3000', 'http://localhost:3002']
```

## 📱 Configuración para Diferentes Entornos

### Desarrollo Local
```javascript
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### Producción
```javascript
const corsOptions = {
  origin: ['https://tu-frontend-gcp.appspot.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### Múltiples Entornos
```javascript
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://tu-frontend-gcp.appspot.com']
  : ['http://localhost:3000', 'http://localhost:3002'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 🔄 Reinicio del Servidor

Después de hacer cambios en la configuración de CORS:

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar
npm run dev
```

## ✅ Verificación Final

1. **Backend ejecutándose**: `http://localhost:3000`
2. **Frontend ejecutándose**: `http://localhost:3002`
3. **Health check**: `http://localhost:3000/api/health`
4. **Sin errores de CORS** en la consola del navegador
5. **Requests exitosos** desde el frontend al backend

## 🚨 Notas de Seguridad

- **Nunca usar `origin: '*'`** en producción
- **Siempre especificar orígenes permitidos** explícitamente
- **Usar HTTPS** en producción
- **Validar orígenes** en el servidor cuando sea posible

---

**¡CORS configurado correctamente! 🎉**

El backend ahora acepta conexiones desde el frontend en el puerto 3002.








