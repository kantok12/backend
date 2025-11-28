# Estructura — Endpoints

Base path: `/api/estructura`

Propósito: exponer la jerarquía de carteras → clientes → nodos y sus relaciones para la UI.

Endpoints:

- `GET /api/estructura/carteras` — listar carteras.
- `GET /api/estructura/carteras/:id/clientes` — listar clientes de una cartera.
- `GET /api/estructura/clientes/:id/nodos` — listar nodos de un cliente.

Notas:
- Usado por vistas que muestran árbol jerárquico y para selección en creaciones de asignaciones.

## Request / Response

### GET /api/estructura/carteras
- Response (200):

```json
[
	{ "id": 1, "nombre": "Cartera Norte" },
	{ "id": 2, "nombre": "Cartera Sur" }
]
```

### GET /api/estructura/carteras/:id/clientes
- Response (200):

```json
[
	{ "id": 10, "cartera_id": 1, "nombre": "Cliente A", "codigo_cliente": "A-01" }
]
```

### GET /api/estructura/clientes/:id/nodos
- Response (200): lista de nodos con `id`, `nombre`, `tipo`, `direccion`.

Errors: 400/404/500 según caso.
