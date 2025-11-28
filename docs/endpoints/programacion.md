# Programación — Endpoints

Base path: `/api/programacion` (o rutas relacionadas en `routes/programacion.js`)

Propósito: crear, consultar y gestionar programaciones semanales o temporales de personal.

Endpoints comunes:

- `GET /api/programacion` — Listar programaciones (filtros: `semana`, `rut`, `cliente_id`).
- `GET /api/programacion/:id` — Detalle de una programación.
- `POST /api/programacion` — Crear programación (payload con `rut`, `servicio_id`, `semana_inicio`, `semana_fin`, `horas`, `rol`).
- `PUT /api/programacion/:id` — Actualizar programación.
- `DELETE /api/programacion/:id` — Eliminar/archivar programación.

Notas:
- `crear-programacion-ejemplo.js` contiene ejemplo de payload y creación programática.

## Request / Response

### POST /api/programacion
- Request body (JSON):

```json
{
	"rut": "12345678-9",
	"servicio_id": 456,
	"semana_inicio": "2025-12-01",
	"semana_fin": "2025-12-07",
	"horas": 40,
	"rol": "operador"
}
```

- Response (201): objeto con `id` y detalle de la programación.

### GET /api/programacion?semana=2025-12-01
- Response (200):

```json
{
	"count": 10,
	"rows": [
		{ "id": 101, "rut": "12.345.678-9", "servicio_id": 456, "semana_inicio": "2025-12-01" }
	]
}
```

Errors: 400 invalid payload, 409 conflicts/overlap, 500 server error.
