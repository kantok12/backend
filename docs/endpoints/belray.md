# Belray — Endpoints (Empresas y Documentación)

Base path: `/api/belray`

Propósito: CRUD de empresas Belray y gestión de documentos asociados en disco.

Endpoints:

- `GET /api/belray` — Listar empresas, con paginación y búsqueda.
- `GET /api/belray/:id` — Detalle de empresa.
- `POST /api/belray` — Crear empresa.
- `PUT /api/belray/:id` — Actualizar empresa.
- `DELETE /api/belray/:id` — Eliminar/archivar empresa.

Documentos (carpeta en disco: `G:/Unidades compartidas/Unidad de Apoyo/Belray/Documentacion_Empresa/Belray_{ID}`):

- `GET /api/belray/:id/documentos` — Listar archivos.
- `POST /api/belray/:id/documentos/subir` — Subir archivo (multipart/form-data).
- `GET /api/belray/:id/documentos/descargar/:archivo` — Descargar archivo.
- `DELETE /api/belray/:id/documentos/:archivo` — Eliminar archivo.
- `POST /api/belray/:id/documentos/crear-carpeta` — Crear carpeta dentro del storage.
- `POST /api/belray/documentos/crear-carpetas-todas` — Script: crear carpetas para todas las empresas (batch).

Notas operativas:
- Asegurar que el proceso que escribe a disco tenga permisos en la unidad de red.
- Mantener sincronía entre base de datos y estructura de carpetas.

## Request / Response

### GET /api/belray
- Query params: `q` (search), `limit`, `offset`.
- Response (200):

```json
{
	"count": 2,
	"rows": [
		{ "id": 1, "nombre": "Empresa X", "giro": "Servicios", "telefono": "+56 2 2345 6789" }
	]
}
```

### POST /api/belray
- Request body (JSON):

```json
{
	"nombre": "Empresa X",
	"descripcion": "Descripción",
	"giro": "Servicios",
	"numero_telefono": "+56 2 2345 6789",
	"direccion": "Dirección 123"
}
```

- Response (201): objeto creado con `id`.

### Documentos — GET /api/belray/:id/documentos
- Response (200):

```json
[
	{ "archivo": "contrato.pdf", "ruta": "Belray_1/contrato.pdf", "size": 123456, "uploaded_at": "2025-11-01T09:00:00Z" }
]
```

### POST /api/belray/:id/documentos/subir
- Request: `multipart/form-data` con campo `file`.
- Response (201): `{ "archivo": "contrato.pdf", "status": "uploaded" }`.

Errors: 400 bad input, 413 payload too large, 500 file system or DB error.
