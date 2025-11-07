# Guía de Funcionalidad: Prerrequisitos de Cliente (Globales y Específicos)

Este documento detalla la implementación y el uso del sistema de prerrequisitos de documentos por cliente. Esta funcionalidad permite definir qué documentos son obligatorios para el personal, ya sea de forma **global** (para todos) o **específica** para un cliente.

---

## 1. Base de Datos

La tabla `mantenimiento.cliente_prerrequisitos` ha sido actualizada para soportar prerrequisitos globales.

- **Tabla**: `mantenimiento.cliente_prerrequisitos`
- **Descripción**: Almacena los tipos de documentos requeridos. La columna `cliente_id` determina el alcance del prerrequisito.

### Lógica de `cliente_id`
- **Si `cliente_id` tiene un valor (ej: 1, 5):** El prerrequisito es **específico** para ese cliente.
- **Si `cliente_id` es `NULL`:** El prerrequisito es **global** y aplica a todo el personal, sin importar el cliente.

### Estructura de la Tabla

| Columna         | Tipo      | Descripción                                                                 |
|-----------------|-----------|-----------------------------------------------------------------------------|
| `id`            | `SERIAL`  | Identificador único del prerrequisito (Llave Primaria).                     |
| `cliente_id`    | `INTEGER` | ID del cliente. **Puede ser `NULL` para prerrequisitos globales.**          |
| `tipo_documento`| `VARCHAR` | Nombre o tipo del documento requerido (Ej: "Cédula de Identidad").          |
| `descripcion`   | `TEXT`    | Descripción opcional del prerrequisito.                                     |
| `dias_duracion` | `INTEGER` | Duración de la validez del documento en días. `NULL` si no aplica.          |
| `created_at`    | `TIMESTAMPTZ` | Fecha de creación del registro.                                             |
| `updated_at`    | `TIMESTAMPTZ` | Fecha de la última actualización del registro.                              |

**Restricciones de Unicidad**:
1.  Un `tipo_documento` no puede repetirse para el mismo `cliente_id`.
2.  Un `tipo_documento` no puede repetirse en los prerrequisitos globales (donde `cliente_id` es `NULL`).

---

## 2. API Endpoints

Se ha actualizado la lógica de los endpoints y se han añadido nuevos para gestionar los prerrequisitos globales. La ruta base sigue siendo `/api/prerrequisitos`.

### Listar Prerrequisitos (Globales + Específicos de Cliente)

Este es el endpoint principal para consultar qué se le debe exigir a una persona para un cliente determinado.

- **Endpoint**: `GET /api/prerrequisitos/cliente/:cliente_id`
- **Descripción**: Obtiene una lista **combinada** que incluye todos los prerrequisitos **globales** y todos los prerrequisitos **específicos** del cliente solicitado.
- **Nuevo Campo en Respuesta**: La respuesta ahora incluye un campo booleano `es_global` para diferenciar el origen de cada prerrequisito.
- **Ejemplo de uso con `curl`**:
  ```bash
  curl http://localhost:3000/api/prerrequisitos/cliente/1
  ```
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Prerrequisitos obtenidos exitosamente",
    "data": [
      {
        "id": 10,
        "cliente_id": null,
        "tipo_documento": "Contrato de Trabajo",
        "descripcion": "Contrato firmado y vigente.",
        "dias_duracion": null,
        "es_global": true
      },
      {
        "id": 1,
        "cliente_id": 1,
        "tipo_documento": "Certificado de Antecedentes",
        "descripcion": "Válido por 90 días.",
        "dias_duracion": 90,
        "es_global": false
      }
    ]
  }
  ```

### Listar Prerrequisitos Globales (Solo Globales)

- **Endpoint**: `GET /api/prerrequisitos/globales`
- **Descripción**: Obtiene únicamente la lista de prerrequisitos globales. Útil para la administración.
- **Ejemplo de uso con `curl`**:
  ```bash
  curl http://localhost:3000/api/prerrequisitos/globales
  ```

### Crear un Nuevo Prerrequisito (Global o Específico)

- **Endpoint**: `POST /api/prerrequisitos`
- **Descripción**: Crea un nuevo prerrequisito. La presencia o ausencia de `cliente_id` determina si es específico o global.
- **Cuerpo para Prerrequisito Específico**:
  ```json
  {
    "cliente_id": 1,
    "tipo_documento": "Licencia de Conducir Clase B",
    "dias_duracion": 1460
  }
  ```
- **Cuerpo para Prerrequisito Global** (simplemente omite `cliente_id`):
  ```json
  {
    "tipo_documento": "Cédula de Identidad",
    "descripcion": "Documento de identidad chileno.",
    "dias_duracion": null
  }
  ```
- **Respuesta Exitosa (201 Created)**: Devuelve el objeto del prerrequisito recién creado.

### Actualizar un Prerrequisito

- **Endpoint**: `PUT /api/prerrequisitos/:id`
- **Descripción**: Actualiza la información de un prerrequisito existente (sea global o específico).
- **Nota**: No se puede cambiar un prerrequisito de global a específico o viceversa. Para ello, se debe eliminar y crear de nuevo.
- **Ejemplo de uso con `curl`**:
  ```bash
  curl -X PUT -H "Content-Type: application/json" \
  -d '{
        "tipo_documento": "Licencia de Conducir (Actualizado)",
        "dias_duracion": 1500
      }' \
  http://localhost:3000/api/prerrequisitos/2
  ```

### Eliminar un Prerrequisito

- **Endpoint**: `DELETE /api/prerrequisitos/:id`
- **Descripción**: Elimina un prerrequisito por su ID (sea global o específico).
- **Ejemplo de uso con `curl`**:
  ```bash
  curl -X DELETE http://localhost:3000/api/prerrequisitos/2
  ```
