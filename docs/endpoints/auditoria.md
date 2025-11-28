# Auditoría — Endpoints

Base path: `/api/auditoria`

Propósito: centralizar logs de auditoría, notificaciones y dashboard de actividad.

Endpoints:

- `GET /api/auditoria/dashboard` — Ver actividad (filtros: `tabla`, `operacion`, `usuario`, `es_critico`, `desde`, `hasta`, `limit`, `offset`).
- `GET /api/auditoria/notificaciones` — Listar notificaciones.
- `POST /api/auditoria/notificaciones` — Crear notificación.
- `PUT /api/auditoria/notificaciones/:id/marcar-leida` — Marcar notificación como leída.
- `GET /api/auditoria/historial/:tabla/:id` — Historial de cambios por registro.
- `GET /api/auditoria/estadisticas` — KPIs y métricas agregadas (por periodo).
- `POST /api/auditoria/limpiar-logs` — Limpieza de logs antiguos (procedimiento administrado).

Notas:
- Las entradas de auditoría deben provenir de triggers o de llamadas explícitas desde la aplicación.
- Asegurar políticas de retención antes de ejecutar `limpiar-logs`.

## Request / Response

### GET /api/auditoria/dashboard
- Query params: `tabla`, `operacion`, `usuario`, `es_critico`, `desde`, `hasta`, `limit`, `offset`.
- Response (200):

```json
{
	"count": 2,
	"rows": [
		{ "id": 1, "tabla": "personal_disponible", "operacion": "UPDATE", "usuario": "admin", "detalle": "cambios en cargo", "created_at": "2025-11-27T10:00:00Z" }
	]
}
```

### POST /api/auditoria/notificaciones
- Request body:

```json
{
	"tipo": "warning",
	"titulo": "Operación crítica",
	"mensaje": "Se detectó un evento",
	"usuario_destino": "admin",
	"es_critico": true
}
```

- Response (201): `{ "id": 55, "status": "created" }`.

### PUT /api/auditoria/notificaciones/:id/marcar-leida
- Response (200): `{ "id": 55, "leida": true }`.

Errors: 400 invalid params, 403 permission denied, 500 server error.
