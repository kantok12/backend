# Prerrequisitos (MACH) — Endpoints

Purpose: evaluar si un conjunto de requisitos (MACH) se cumple para un cliente o una asignación.

Base path: `/api/prerrequisitos/clientes/:clienteId/mach`

Endpoints:

- `GET /api/prerrequisitos/clientes/:clienteId/mach`
  - Descripción: recuperar requisitos ya evaluados o configuración por cliente.
  - Parámetros URL: `:clienteId`
  - Query params (opc): `desde`, `hasta`, `limit`, `offset`
  - Respuesta: lista de requisitos y estado por persona/registro.

- `POST /api/prerrequisitos/clientes/:clienteId/mach`
  - Descripción: enviar payload con datos (personas, documentos, cursos) para evaluar MACH.
  - Body (ejemplo):
    ```json
    {
      "personas": [{ "rut": "12.345.678-9", "nombre": "Juan" }],
      "requisitos": ["documento_identidad", "curso_seguridad"]
    }
    ```
  - Respuesta: objeto con resultados por persona: `aprobado: true|false`, `detalles: []`.
  - Errores comunes: 400 Bad Request (payload inválido), 500 internal error.

CRUD mapping: Este endpoint es un proceso de evaluación (Read + Create para ejecuciones). Las ejecuciones pueden almacenarse para auditoría.

## Request / Response

### GET /api/prerrequisitos/clientes/:clienteId/mach
- Request: URL params: `:clienteId`, opcionales `desde`, `hasta`, `limit`, `offset`.
- Response (200):

```json
[
  {
    "execution_id": "e8f6...",
    "cliente_id": 123,
    "created_at": "2025-11-27T12:34:56Z",
    "results": [
      { "rut": "12.345.678-9", "aprobado": true, "detalles": [] }
    ]
  }
]
```

### POST /api/prerrequisitos/clientes/:clienteId/mach
- Request body (JSON):

```json
{
  "personas": [{ "rut": "12345678-9", "nombres": "Juan Perez" }],
  "requisitos": ["documento_identidad", "curso_seguridad"]
}
```

- Response (200):

```json
{
  "execution_id": "e8f6...",
  "cliente_id": 123,
  "created_at": "2025-11-27T12:35:00Z",
  "results": [
    {
      "rut": "12.345.678-9",
      "aprobado": false,
      "detalles": [
        { "requisito": "documento_identidad", "estado": "missing" },
        { "requisito": "curso_seguridad", "estado": "ok" }
      ]
    }
  ]
}
```

Errors: 400 for invalid payload, 500 for server/DB errors.
