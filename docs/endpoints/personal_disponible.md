# Personal Disponible — Endpoints

Base path: `/api/personal-disponible`

Propósito: CRUD sobre el catálogo de personal disponible para asignaciones.

Endpoints:

- `GET /api/personal-disponible` — Listar personal (filtros: `zona`, `cargo`, `activo`, `limit`, `offset`).

- `GET /api/personal-disponible/:rut` — Obtener detalle por RUT.

- `POST /api/personal-disponible` — Crear nuevo registro de personal.
  - Body: campos como `rut`, `nombres`, `apellido`, `cargo`, `zona_geografica`, `email`, `telefono`.

- `PUT /api/personal-disponible/:rut` — Actualizar fields del personal.

- `DELETE /api/personal-disponible/:rut` — Marcar como inactivo o eliminar según política.

Notas:
- `documentos` relacionados están en `mantenimiento.documentos` y se pueden consultar por `rut_persona`.
- Validar unicidad de `rut` al crear.

## Request / Response

### GET /api/personal-disponible
- Query params: `zona`, `cargo`, `activo`, `limit`, `offset`.
- Response (200):

```json
{
  "success": true,
  "message": "Personal disponible obtenido exitosamente",
  "data": [
    {
      "rut": "12345678-9",
      "sexo": "M",
      "fecha_nacimiento": "1985-04-12",
      "licencia_conducir": "B",
      "talla_zapatos": null,
      "talla_pantalones": null,
      "talla_poleras": null,
      "talla_ropa": "M",
      "talla_pantalon": "32",
      "talla_zapato": "41",
      "cargo": "Técnico",
      "estado_id": 1,
      "zona_geografica": "RM",
      "nombres": "Juan",
      "comentario_estado": null,
      "documentacion_id": 101,
      "estado_civil": "Soltero",
      "pais": "Chile",
      "region": "RM",
      "comuna": "Santiago",
      "ciudad": "Santiago",
      "telefono": "+56912345678",
      "correo_electronico": "juan.perez@example.com",
      "correo_personal": null,
      "contacto_emergencia": "María Pérez - +56987654321",
      "id_centro_costo": "CC-01",
      "centro_costo": "Centro Norte",
      "sede": "Sede A",
      "id": 1001,
      "profesion": "Electricista",
      "telefono_2": null,
      "fecha_inicio_contrato": "2023-08-01",
      "id_area": "A1",
      "area": "Mantención",
      "supervisor": "Carlos Gómez",
      "nombre_contacto_emergencia": "María Pérez",
      "vinculo_contacto_emergencia": "Hermana",
      "telefono_contacto_emergencia": "+56987654321",
      "tipo_asistencia": "Presencial",
      "created_at": "2024-11-01T09:30:00",
      "estado_nombre": "Disponible"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 123,
    "hasMore": true
  }
}
```

### GET /api/personal-disponible/:rut
- Response (200): objeto con campos del personal.

### POST /api/personal-disponible
- Request body (JSON):

### POST /api/personal-disponible
- Request body (JSON): el endpoint acepta los campos del registro `mantenimiento.personal_disponible`. Muchos son opcionales; `rut` y `cargo` suelen ser requeridos por validación de negocio. No envíes `id` ni `created_at` (los gestiona la BD).

Ejemplo completo (sintético):

```json
{
  "rut": "12345678-9",
  "nombres": "Juan",
  "apellido": "Pérez",
  "sexo": "M",
  "fecha_nacimiento": "1985-04-12",
  "licencia_conducir": "B",
  "cargo": "Técnico",
  "estado_id": 2,
  "documentacion_id": 101,
  "estado_civil": "Soltero",
  "pais": "Chile",
  "region": "RM",
  "comuna": "Santiago",
  "ciudad": "Santiago",
  "telefono": "+56912345678",
  "telefono_2": null,
  "correo_electronico": "juan.perez@example.com",
  "contacto_emergencia": "María Pérez - +56987654321",
  "talla_ropa": "M",
  "talla_pantalon": "32",
  "talla_zapato": "41",
  "id_centro_costo": "CC-01",
  "centro_costo": "Centro Norte",
  "sede": "Sede A",
  "fecha_inicio_contrato": "2023-08-01",
  "profesion": "Electricista",
  "id_area": "A1",
  "area": "Mantención",
  "supervisor": "Carlos Gómez",
  "nombre_contacto_emergencia": "María Pérez",
  "vinculo_contacto_emergencia": "Hermana",
  "telefono_contacto_emergencia": "+56987654321",
  "tipo_asistencia": "Presencial"
}
```

- Response (201): objeto creado con los campos persistidos por la BD (incluye `id` si la tabla lo genera). Ejemplo de respuesta:

```json
{
  "rut": "12345678-9",
  "nombres": "Juan",
  "apellido": "Pérez",
  "cargo": "Técnico",
  "id": 1001,
  "created_at": "2025-11-28T08:00:00Z"
}
```

Notas de validación y seguridad:
- `rut` debe ser único; validar formato antes de insertar.
- Campos como `estado_id` deben referenciar `mantenimiento.estados`.
- `documentacion_id` referencia a `mantenimiento.documentos` cuando aplique.
- No confundir `correo_electronico` con `correo_personal` (si existe en tablas backup).
- Antes de aceptar la carga masiva de datos, validar y sanitizar los strings para evitar inyección.

### PUT /api/personal-disponible/:rut
- Request body: campos a actualizar.
- Response (200): objeto actualizado.

### DELETE /api/personal-disponible/:rut
- Response (204) o (200) con `activo: false` si se marca como inactivo.

Errors: 400/409/404/500 según caso.
