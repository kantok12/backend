# Estados — Endpoints

Base path: `/api/estados` (y rutas relacionadas en `routes/` para estados unificados)

Propósito: CRUD y consultas sobre estados (estado de una persona, estados unificados, etc.).

Endpoints:

- `GET /api/estados` — listar tipos de estado y filtros.
- `GET /api/estados/:id` — detalle de un estado.
- `POST /api/estados` — crear tipo de estado.
- `PUT /api/estados/:id` — actualizar estado.
- `DELETE /api/estados/:id` — eliminar/archivar tipo de estado.

- `GET /api/estado-unificado/:rut` — obtener estado consolidado de una persona.

Notas:
- La lógica de consolidación de estados puede residir en `routes/estado-unificado.js`.

## Request / Response

### POST /api/estados
- Request body (JSON):

```json
{
	"codigo": "VAC",
	"descripcion": "Vacaciones",
	"es_activo": true
}
```

- Response (201): objeto creado con `id` y `codigo`.

### GET /api/estado-unificado/:rut
- Response (200):

```json
{
	"rut": "12345678-9",
	"estado_actual": {
		"codigo": "VAC",
		"descripcion": "Vacaciones",
		"desde": "2025-12-01",
		"hasta": "2025-12-10"
	},
	"historial": [ /* array de estados */ ]
}
```

Errors: 400 invalid data, 404 no encontrado, 500 server error.
