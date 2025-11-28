# Mínimo Personal — Endpoint

Base path: `/api/minimo-personal`

Propósito: calcular mínimos de personal requeridos para una cartera/servicio usando la función DB `servicios.calcular_minimo_real`.

Endpoint:

- `GET /api/minimo-personal?cartera_id=...&periodo=...` — Devuelve el cálculo de mínimos para la cartera/periodo solicitado.

Notas:
- Requiere permisos y acceso a la función `servicios.calcular_minimo_real` en la base de datos.
- Validar parámetros `cartera_id` y formato de `periodo`.

## Request / Response

### GET /api/minimo-personal?cartera_id=...&periodo=2025-12
- Response (200):

```json
{
	"cartera_id": 12,
	"periodo": "2025-12",
	"minimos": [
		{ "servicio_id": 456, "minimo_requerido": 3, "minimo_real": 2 }
	],
	"generated_at": "2025-11-27T12:00:00Z"
}
```

Errors: 400 invalid params, 500 db error.
