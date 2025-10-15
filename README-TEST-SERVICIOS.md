# 🧪 Script de Pruebas para Endpoints de Servicios

Este script automatiza las pruebas de todos los endpoints relacionados con **mínimo personal** y **acuerdos** del sistema de gestión de personal.

## 📋 Endpoints Probados

### Mínimo Personal
- ✅ `GET /api/servicios/minimo-personal` - Listar mínimos de personal
- ✅ `POST /api/servicios/minimo-personal` - Crear nuevo mínimo de personal
- ✅ `GET /api/servicios/minimo-personal/:id` - Obtener mínimo específico
- ✅ `PUT /api/servicios/minimo-personal/:id` - Actualizar mínimo de personal
- ✅ `DELETE /api/servicios/minimo-personal/:id` - Eliminar mínimo de personal
- ✅ `GET /api/servicios/minimo-personal/:id/calcular` - Calcular mínimo real

### Acuerdos
- ✅ `GET /api/servicios/acuerdos` - Listar acuerdos
- ✅ `POST /api/servicios/acuerdos` - Crear nuevo acuerdo
- ✅ `GET /api/servicios/acuerdos/:id` - Obtener acuerdo específico
- ✅ `PUT /api/servicios/acuerdos/:id` - Actualizar acuerdo
- ✅ `DELETE /api/servicios/acuerdos/:id` - Eliminar acuerdo
- ✅ `GET /api/servicios/acuerdos/vencer` - Obtener acuerdos próximos a vencer
- ✅ `POST /api/servicios/acuerdos/:id/activar` - Activar acuerdo
- ✅ `POST /api/servicios/acuerdos/:id/desactivar` - Desactivar acuerdo

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Verificar que el Servidor esté Ejecutándose
```bash
# Opción 1: Servidor local
npm run dev

# Opción 2: Servidor en red
npm run dev:network
```

## 🧪 Ejecutar Pruebas

### Pruebas Locales (Servidor en localhost:3000)
```bash
npm run test:servicios
```

### Pruebas en Servidor Remoto
```bash
# Cambiar la URL por la de tu servidor
API_URL=https://tu-servidor.com npm run test:servicios

# O usar el script predefinido (editar la URL en package.json)
npm run test:servicios:remote
```

### Ejecución Directa
```bash
# Local
node test-servicios-endpoints.js

# Remoto
API_URL=https://tu-servidor.com node test-servicios-endpoints.js
```

## 📊 Qué Hace el Script

### 1. **Configuración de Datos de Prueba**
- Crea una cartera de prueba
- Crea un cliente de prueba
- Crea un nodo de prueba

### 2. **Pruebas de Mínimo Personal**
- Crea un mínimo de personal
- Lista todos los mínimos
- Obtiene un mínimo específico
- Calcula el mínimo real
- Actualiza el mínimo
- Verifica la actualización

### 3. **Pruebas de Acuerdos**
- Crea un acuerdo de incremento
- Lista todos los acuerdos
- Obtiene un acuerdo específico
- Actualiza el acuerdo
- Desactiva y activa el acuerdo
- Consulta acuerdos próximos a vencer

### 4. **Pruebas de Validación**
- Prueba datos inválidos
- Verifica manejo de errores 400/404
- Valida respuestas de error

### 5. **Pruebas de Filtros**
- Filtros por cartera, cliente, nodo
- Filtros por tipo de acuerdo y estado
- Paginación

### 6. **Limpieza Automática**
- Elimina todos los datos de prueba creados
- Mantiene la base de datos limpia

## 🎨 Salida del Script

El script muestra información detallada con colores:

- 🟢 **Verde**: Operaciones exitosas
- 🔴 **Rojo**: Errores
- 🔵 **Azul**: Información general
- 🟡 **Amarillo**: Advertencias

### Ejemplo de Salida:
```
🚀 INICIANDO PRUEBAS DE ENDPOINTS DE SERVICIOS

📍 URL Base: http://localhost:3000/api/servicios

🔧 CONFIGURANDO DATOS DE PRUEBA...

1. Creando cartera de prueba...
✅ POST /carteras - Status: 201
   Cartera creada con ID: 123

🧪 PROBANDO ENDPOINTS DE MÍNIMO PERSONAL

1. POST /minimo-personal - Crear mínimo de personal
✅ POST /minimo-personal - Status: 201
   Mínimo de personal creado con ID: 456

🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE
⏱️  Tiempo total: 15.23 segundos
```

## ⚙️ Configuración Avanzada

### Variables de Entorno
```bash
# URL del servidor (por defecto: http://localhost:3000)
API_URL=http://192.168.1.100:3000

# Ejecutar con timeout personalizado
TIMEOUT=30000 node test-servicios-endpoints.js
```

### Personalización del Script
Puedes modificar el archivo `test-servicios-endpoints.js` para:

- Cambiar los datos de prueba
- Agregar más validaciones
- Modificar los tiempos de espera
- Personalizar los mensajes de salida

## 🐛 Solución de Problemas

### Error de Conexión
```
❌ No se puede conectar al servidor
```
**Solución**: Verificar que el servidor esté ejecutándose y la URL sea correcta.

### Error de Dependencias
```
Error: Cannot find module 'axios'
```
**Solución**: Ejecutar `npm install` para instalar las dependencias.

### Error de Base de Datos
```
Error interno del servidor
```
**Solución**: Verificar la conexión a PostgreSQL y que las tablas existan.

### Timeout en Pruebas
```
Error: timeout of 5000ms exceeded
```
**Solución**: El servidor puede estar lento. El script incluye delays automáticos.

## 📝 Notas Importantes

1. **Datos de Prueba**: El script crea y elimina automáticamente todos los datos de prueba
2. **Base de Datos**: Asegúrate de que las tablas del esquema `servicios` existan
3. **Permisos**: El script necesita permisos de lectura/escritura en la base de datos
4. **Red**: Para pruebas remotas, verifica que el servidor sea accesible desde tu red

## 🔧 Mantenimiento

### Agregar Nuevas Pruebas
1. Abrir `test-servicios-endpoints.js`
2. Agregar nueva función de prueba
3. Llamar la función en `runTests()`

### Modificar Datos de Prueba
Editar las variables en las funciones `setupTestData()` y las funciones de prueba.

### Cambiar Configuración
Modificar las constantes al inicio del archivo:
```javascript
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/servicios`;
```

## 📞 Soporte

Si encuentras problemas:
1. Verificar que el servidor esté funcionando
2. Revisar los logs del servidor
3. Verificar la conectividad de red
4. Comprobar la configuración de la base de datos

---

**¡Disfruta probando tus endpoints! 🚀**
