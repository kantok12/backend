# 📋 API ENDPOINTS - TABLA NOMBRES

Esta documentación describe los endpoints disponibles para la tabla `mantenimiento.nombre` que contiene la información de nombres del personal.

---

## 📊 ENDPOINTS DISPONIBLES

### 1. **GET /api/nombres** - Obtener todos los nombres

Obtiene todos los registros de nombres del personal.

**Método:** `GET`  
**URL:** `http://localhost:3000/api/nombres`  
**Autenticación:** No requerida

#### Respuesta Exitosa (200):
```json
{
  "success": true,
  "data": [
    {
      "rut": "12345678-9",
      "nombre": "Juan Carlos Pérez González",
      "sexo": "M",
      "fecha_nacimiento": "1985-07-12",
      "licencia_conducir": "B",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 150
}
```

---

### 2. **GET /api/nombres/stats** - Estadísticas de nombres

Obtiene estadísticas completas de la tabla nombres.

**Método:** `GET`  
**URL:** `http://localhost:3000/api/nombres/stats`  
**Autenticación:** No requerida

#### Respuesta Exitosa (200):
```json
{
  "success": true,
  "data": {
    "total_registros": 150,
    "nombres_llenos": 148,
    "nombres_vacios": 2,
    "porcentaje_nombres_llenos": 98.67,
    "distribucion_sexo": {
      "masculinos": 95,
      "femeninos": 55
    },
    "tipos_licencia": 4,
    "rango_fechas": {
      "fecha_minima": "1975-03-15",
      "fecha_maxima": "2000-12-25"
    }
  }
}
```

---

### 3. **GET /api/nombres/search?q=termino** - Buscar nombres

Busca nombres por nombre completo o RUT.

**Método:** `GET`  
**URL:** `http://localhost:3000/api/nombres/search?q=juan`  
**Parámetros de consulta:**
- `q` (requerido): Término de búsqueda (nombre o RUT)

#### Ejemplo de uso:
```
GET /api/nombres/search?q=juan
GET /api/nombres/search?q=12345678
GET /api/nombres/search?q=pérez
```

#### Respuesta Exitosa (200):
```json
{
  "success": true,
  "data": [
    {
      "rut": "12345678-9",
      "nombre": "Juan Carlos Pérez González",
      "sexo": "M",
      "fecha_nacimiento": "1985-07-12",
      "licencia_conducir": "B"
    }
  ],
  "total": 1,
  "search_term": "juan"
}
```

#### Error 400 - Parámetro faltante:
```json
{
  "success": false,
  "message": "Parámetro de búsqueda \"q\" es requerido"
}
```

---

### 4. **GET /api/nombres/:rut** - Obtener nombre por RUT

Obtiene un registro específico por su RUT.

**Método:** `GET`  
**URL:** `http://localhost:3000/api/nombres/12345678-9`  
**Parámetros de ruta:**
- `rut`: RUT del registro a buscar

#### Respuesta Exitosa (200):
```json
{
  "success": true,
  "data": {
    "rut": "12345678-9",
    "nombre": "Juan Carlos Pérez González",
    "sexo": "M",
    "fecha_nacimiento": "1985-07-12",
    "licencia_conducir": "B",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error 404 - No encontrado:
```json
{
  "success": false,
  "message": "No se encontró registro para el RUT: 12345678-9"
}
```

---

### 5. **POST /api/nombres** - Crear nuevo nombre

Crea un nuevo registro de nombre.

**Método:** `POST`  
**URL:** `http://localhost:3000/api/nombres`  
**Content-Type:** `application/json`

#### Cuerpo de la petición:
```json
{
  "rut": "98765432-1",
  "nombre": "María Elena Fernández Torres",
  "sexo": "F",
  "fecha_nacimiento": "1992-03-25",
  "licencia_conducir": "A"
}
```

**Campos requeridos:**
- `rut`: RUT de la persona (único)
- `nombre`: Nombre completo

**Campos opcionales:**
- `sexo`: M o F
- `fecha_nacimiento`: Fecha en formato YYYY-MM-DD
- `licencia_conducir`: Tipo de licencia

#### Respuesta Exitosa (201):
```json
{
  "success": true,
  "message": "Nombre creado exitosamente",
  "data": {
    "rut": "98765432-1",
    "nombre": "María Elena Fernández Torres",
    "sexo": "F",
    "fecha_nacimiento": "1992-03-25",
    "licencia_conducir": "A",
    "created_at": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Error 400 - Datos faltantes:
```json
{
  "success": false,
  "message": "RUT y nombre son requeridos"
}
```

#### Error 409 - RUT ya existe:
```json
{
  "success": false,
  "message": "Ya existe un registro para el RUT: 98765432-1"
}
```

---

### 6. **PUT /api/nombres/:rut** - Actualizar nombre

Actualiza un registro existente.

**Método:** `PUT`  
**URL:** `http://localhost:3000/api/nombres/12345678-9`  
**Content-Type:** `application/json`

#### Cuerpo de la petición:
```json
{
  "nombre": "Juan Carlos Pérez González (Actualizado)",
  "sexo": "M",
  "fecha_nacimiento": "1985-07-12",
  "licencia_conducir": "B"
}
```

#### Respuesta Exitosa (200):
```json
{
  "success": true,
  "message": "Nombre actualizado exitosamente",
  "data": {
    "rut": "12345678-9",
    "nombre": "Juan Carlos Pérez González (Actualizado)",
    "sexo": "M",
    "fecha_nacimiento": "1985-07-12",
    "licencia_conducir": "B",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:30:00.000Z"
  }
}
```

#### Error 404 - No encontrado:
```json
{
  "success": false,
  "message": "No se encontró registro para el RUT: 12345678-9"
}
```

---

### 7. **DELETE /api/nombres/:rut** - Eliminar nombre

Elimina un registro por su RUT.

**Método:** `DELETE`  
**URL:** `http://localhost:3000/api/nombres/12345678-9`

#### Respuesta Exitosa (200):
```json
{
  "success": true,
  "message": "Nombre eliminado exitosamente",
  "data": {
    "rut": "12345678-9",
    "nombre": "Juan Carlos Pérez González",
    "sexo": "M",
    "fecha_nacimiento": "1985-07-12",
    "licencia_conducir": "B",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🧪 TESTING CON POSTMAN

### Configuración inicial:
1. **Base URL:** `http://localhost:3000`
2. **Content-Type:** `application/json` (para POST/PUT)

### Colección de pruebas sugeridas:

#### 1. **Verificar estadísticas:**
```
GET {{base_url}}/api/nombres/stats
```

#### 2. **Listar todos los nombres:**
```
GET {{base_url}}/api/nombres
```

#### 3. **Buscar nombres:**
```
GET {{base_url}}/api/nombres/search?q=juan
GET {{base_url}}/api/nombres/search?q=12345678
```

#### 4. **Obtener por RUT específico:**
```
GET {{base_url}}/api/nombres/12345678-9
```

#### 5. **Crear nuevo nombre:**
```
POST {{base_url}}/api/nombres
Body (JSON):
{
  "rut": "99999999-9",
  "nombre": "Persona de Prueba",
  "sexo": "M",
  "fecha_nacimiento": "1990-01-01",
  "licencia_conducir": "B"
}
```

#### 6. **Actualizar nombre:**
```
PUT {{base_url}}/api/nombres/99999999-9
Body (JSON):
{
  "nombre": "Persona de Prueba Actualizada"
}
```

#### 7. **Eliminar nombre:**
```
DELETE {{base_url}}/api/nombres/99999999-9
```

---

## 🌐 INTEGRACIÓN CON FRONTEND

### Funciones JavaScript de ejemplo:

#### 1. **Obtener todas las estadísticas:**
```javascript
async function obtenerEstadisticasNombres() {
  try {
    const response = await fetch('http://localhost:3000/api/nombres/stats');
    const data = await response.json();
    
    if (data.success) {
      console.log('Estadísticas:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}
```

#### 2. **Buscar nombres:**
```javascript
async function buscarNombres(termino) {
  try {
    const response = await fetch(`http://localhost:3000/api/nombres/search?q=${encodeURIComponent(termino)}`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`Encontrados ${data.total} resultados`);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error buscando nombres:', error);
    throw error;
  }
}
```

#### 3. **Obtener nombre por RUT:**
```javascript
async function obtenerNombrePorRut(rut) {
  try {
    const response = await fetch(`http://localhost:3000/api/nombres/${rut}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else if (response.status === 404) {
      return null; // No encontrado
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error obteniendo nombre:', error);
    throw error;
  }
}
```

#### 4. **Crear nuevo nombre:**
```javascript
async function crearNombre(datosNombre) {
  try {
    const response = await fetch('http://localhost:3000/api/nombres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosNombre)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Nombre creado exitosamente');
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error creando nombre:', error);
    throw error;
  }
}

// Ejemplo de uso:
// crearNombre({
//   rut: "99999999-9",
//   nombre: "Nuevo Empleado",
//   sexo: "M",
//   fecha_nacimiento: "1990-01-01"
// });
```

#### 5. **Actualizar nombre:**
```javascript
async function actualizarNombre(rut, datosActualizados) {
  try {
    const response = await fetch(`http://localhost:3000/api/nombres/${rut}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosActualizados)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Nombre actualizado exitosamente');
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error actualizando nombre:', error);
    throw error;
  }
}
```

---

## 🔍 CASOS DE USO COMUNES

### 1. **Verificar si existe un RUT:**
```javascript
async function existeRut(rut) {
  const nombre = await obtenerNombrePorRut(rut);
  return nombre !== null;
}
```

### 2. **Autocompletar nombres:**
```javascript
async function autocompletarNombres(terminoBusqueda) {
  if (terminoBusqueda.length < 2) return [];
  
  const resultados = await buscarNombres(terminoBusqueda);
  return resultados.map(persona => ({
    rut: persona.rut,
    nombre: persona.nombre,
    display: `${persona.nombre} (${persona.rut})`
  }));
}
```

### 3. **Validar datos antes de crear:**
```javascript
function validarDatosNombre(datos) {
  const errores = [];
  
  if (!datos.rut || datos.rut.trim().length === 0) {
    errores.push('RUT es requerido');
  }
  
  if (!datos.nombre || datos.nombre.trim().length === 0) {
    errores.push('Nombre es requerido');
  }
  
  if (datos.sexo && !['M', 'F'].includes(datos.sexo)) {
    errores.push('Sexo debe ser M o F');
  }
  
  return errores;
}
```

---

## ⚠️ CÓDIGOS DE ERROR

| Código | Descripción | Solución |
|--------|-------------|----------|
| 400 | Datos faltantes o inválidos | Verificar campos requeridos |
| 404 | RUT no encontrado | Verificar que el RUT exista |
| 409 | RUT ya existe | Usar PUT para actualizar |
| 500 | Error interno del servidor | Revisar logs del servidor |

---

## 📝 NOTAS IMPORTANTES

1. **Sin autenticación:** Los endpoints están configurados sin middleware de autenticación para desarrollo.

2. **Validación de RUT:** La API no valida el formato del RUT chileno, solo verifica que sea único.

3. **Fechas:** Las fechas deben enviarse en formato ISO (YYYY-MM-DD).

4. **Búsqueda:** La búsqueda es case-insensitive y busca coincidencias parciales.

5. **Límites:** La búsqueda está limitada a 50 resultados máximo.

6. **Logs:** Todas las operaciones se registran en la consola del servidor para debugging.

---

¡Los endpoints de la tabla `nombres` están listos para usar! 🚀

