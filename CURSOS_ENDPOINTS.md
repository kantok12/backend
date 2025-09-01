# Documentación de Endpoints para Cursos/Certificaciones

## Base URL
```
http://localhost:3000/api/cursos
```

## Autenticación
Todos los endpoints requieren autenticación mediante JWT. Incluye el token en el header:
```
Authorization: Bearer <tu-jwt-token>
```

## Endpoints Disponibles

### 1. Listar Cursos/Certificaciones
**GET** `/api/cursos`

Obtiene una lista paginada de todos los cursos/certificaciones.

**Parámetros de consulta (opcionales):**
- `limit`: Número máximo de resultados (por defecto: 20)
- `offset`: Número de registros a omitir (por defecto: 0)

**Ejemplo de URL:**
```
GET http://localhost:3000/api/cursos?limit=10&offset=0
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre_curso": "Seguridad Industrial",
      "descripcion": "Curso básico de seguridad",
      "duracion_horas": 40,
      "fecha_creacion": "2024-01-15T10:00:00.000Z",
      "personal_disponible": {
        "rut": "12345678-9",
        "cargo": "Operario",
        "zona_geografica": "Norte"
      }
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 10,
    "count": 1
  }
}
```

---

### 2. Obtener Curso por ID
**GET** `/api/cursos/:id`

Obtiene un curso específico por su ID.

**Parámetros de ruta:**
- `id`: ID del curso (requerido)

**Ejemplo de URL:**
```
GET http://localhost:3000/api/cursos/1
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre_curso": "Seguridad Industrial",
    "descripcion": "Curso básico de seguridad",
    "duracion_horas": 40,
    "fecha_creacion": "2024-01-15T10:00:00.000Z",
    "personal_disponible": {
      "rut": "12345678-9",
      "cargo": "Operario"
    }
  }
}
```

**Respuesta de error (404):**
```json
{
  "error": "Curso no encontrado",
  "details": "The result contains 0 rows"
}
```

---

### 3. Crear Nuevo Curso
**POST** `/api/cursos`

Crea un nuevo curso/certificación.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <tu-jwt-token>
```

**Cuerpo de la petición (JSON):**
```json
{
  "nombre_curso": "Primeros Auxilios",
  "descripcion": "Curso de primeros auxilios básicos",
  "duracion_horas": 20,
  "tipo_certificacion": "Básico",
  "nivel_requerido": "Sin experiencia",
  "vigencia_meses": 12,
  "rut_personal": "12345678-9"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "nombre_curso": "Primeros Auxilios",
    "descripcion": "Curso de primeros auxilios básicos",
    "duracion_horas": 20,
    "tipo_certificacion": "Básico",
    "nivel_requerido": "Sin experiencia",
    "vigencia_meses": 12,
    "rut_personal": "12345678-9",
    "fecha_creacion": "2024-01-20T14:30:00.000Z"
  },
  "message": "Curso creado exitosamente"
}
```

**Respuesta de error (400):**
```json
{
  "error": "Error al crear curso",
  "details": "duplicate key value violates unique constraint"
}
```

---

### 4. Actualizar Curso
**PUT** `/api/cursos/:id`

Actualiza un curso existente.

**Parámetros de ruta:**
- `id`: ID del curso a actualizar (requerido)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <tu-jwt-token>
```

**Cuerpo de la petición (JSON):**
```json
{
  "nombre_curso": "Primeros Auxilios Avanzados",
  "descripcion": "Curso avanzado de primeros auxilios",
  "duracion_horas": 30
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "nombre_curso": "Primeros Auxilios Avanzados",
    "descripcion": "Curso avanzado de primeros auxilios",
    "duracion_horas": 30,
    "tipo_certificacion": "Básico",
    "nivel_requerido": "Sin experiencia",
    "vigencia_meses": 12,
    "rut_personal": "12345678-9",
    "fecha_creacion": "2024-01-20T14:30:00.000Z",
    "fecha_actualizacion": "2024-01-21T09:15:00.000Z"
  },
  "message": "Curso actualizado exitosamente"
}
```

**Respuesta de error (404):**
```json
{
  "error": "Curso no encontrado",
  "message": "No se encontró un curso con ID: 999"
}
```

---

### 5. Eliminar Curso
**DELETE** `/api/cursos/:id`

Elimina un curso por su ID.

**Parámetros de ruta:**
- `id`: ID del curso a eliminar (requerido)

**Headers:**
```
Authorization: Bearer <tu-jwt-token>
```

**Ejemplo de URL:**
```
DELETE http://localhost:3000/api/cursos/2
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Curso eliminado exitosamente"
}
```

**Respuesta de error (404):**
```json
{
  "error": "Curso no encontrado",
  "message": "No se encontró un curso con ID: 999"
}
```

---

## Configuración de Postman

### 1. Crear una nueva colección
1. Abre Postman
2. Crea una nueva colección llamada "Cursos API"
3. Añade la variable de entorno `baseUrl` con valor `http://localhost:3000`

### 2. Configurar autenticación
1. Ve a la pestaña "Authorization" de la colección
2. Selecciona "Bearer Token"
3. Añade tu JWT token en el campo "Token"

### 3. Variables de entorno sugeridas
```json
{
  "baseUrl": "http://localhost:3000",
  "token": "tu-jwt-token-aqui"
}
```

### 4. Pruebas de ejemplo

**Secuencia de pruebas recomendada:**

1. **Autenticación** - Obtener JWT token desde `/api/auth/login`
2. **Listar cursos** - `GET /api/cursos`
3. **Crear curso** - `POST /api/cursos`
4. **Obtener curso específico** - `GET /api/cursos/{id}`
5. **Actualizar curso** - `PUT /api/cursos/{id}`
6. **Eliminar curso** - `DELETE /api/cursos/{id}`

---

## Códigos de Error Comunes

- **400 Bad Request**: Datos inválidos o faltantes
- **401 Unauthorized**: Token JWT faltante o inválido
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error del servidor

---

## Notas Importantes

1. **Autenticación obligatoria**: Todos los endpoints requieren un JWT token válido
2. **Relación con personal**: Los cursos están relacionados con la tabla `personal_disponible`
3. **Paginación**: El endpoint GET soporta paginación mediante `limit` y `offset`
4. **Validación**: Se realizan validaciones básicas en el servidor
5. **Service Role**: El backend usa la clave Service Role de Supabase para acceso completo

