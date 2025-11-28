# Asignaciones — Endpoints

Base path: `/api/asignaciones`

Propósito: crear y consultar asignaciones de personal a servicios/turnos; valida prerrequisitos (MACH) antes de crear cuando aplica.

Endpoints principales:

- `POST /api/asignaciones`
  - Descripción: crear una nueva asignación.
  - Body (ejemplo):
    ```json
    {
      "rut": "12.345.678-9",
      "cliente_id": 123,
      "servicio_id": 456,
      "fecha_inicio": "2025-12-01",
      "fecha_fin": "2025-12-07",
      "rol": "operador"
    }
    ```
  - Validaciones: debe pasar `mach` si la configuración del cliente lo requiere.
  - Respuesta: objeto con `id` de la asignación y estado.

- `GET /api/asignaciones/:id`
  - Obtener detalle de una asignación.

- `GET /api/asignaciones?rut=...&cliente_id=...` — lista/filtrado.

- `PUT /api/asignaciones/:id` — actualización parcial/completa.

- `DELETE /api/asignaciones/:id` — eliminar/archivar asignación (según política).

CRUD mapping: Create (POST), Read (GET), Update (PUT), Delete (DELETE). Guardar auditoría de cambios.

## Request / Response

### POST /api/asignaciones
- Request body (JSON):

```json
{
  "rut": "12345678-9",
  "cliente_id": 123,
  "servicio_id": 456,
  "fecha_inicio": "2025-12-01",
  "fecha_fin": "2025-12-07",
  "rol": "operador",
  "metadata": { "turno": "noche" }
}
```

- Response (201):

```json
{
  "id": 987,
  "rut": "12.345.678-9",
  "cliente_id": 123,
  "servicio_id": 456,
  "fecha_inicio": "2025-12-01",
  "fecha_fin": "2025-12-07",
  "rol": "operador",
  "status": "created"
}
```

### GET /api/asignaciones/:id
- Response (200):

```json
{
  "id": 987,
  "rut": "12.345.678-9",
  "cliente_id": 123,
  "servicio_id": 456,
  "fecha_inicio": "2025-12-01",
  "fecha_fin": "2025-12-07",
  "rol": "operador",
  "created_at": "2025-11-27T10:00:00Z"
}
```

### GET /api/asignaciones?rut=...&cliente_id=...
- Response (200): array de asignaciones (mismo esquema que GET por id).

### PUT /api/asignaciones/:id
- Request body: campos a actualizar (p. ej. `fecha_fin`, `rol`).
- Response (200): asignación actualizada.

### DELETE /api/asignaciones/:id
- Response (204) o (200) con objeto `archivado: true` según implementación.

Errors: 400 invalid input, 404 not found, 409 conflict (si cruza reglas de negocio), 500 server error.
