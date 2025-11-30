# Endpoints: Prerrequisitos (cliente y globales)

Este documento describe los endpoints disponibles para gestionar y consultar los prerrequisitos por cliente y globales. Incluye ejemplos de uso, parámetros y la forma de respuesta JSON que devuelve el backend.

**Base path**: `/api/prerrequisitos`

---

## Listado agrupado por cliente

- Ruta: `GET /api/prerrequisitos/clientes`
- Descripción: Devuelve *todos* los prerrequisitos de la tabla `mantenimiento.cliente_prerrequisitos` agrupados por `cliente_id`. Las entradas que tienen `cliente_id = null` aparecen bajo la clave `"global"`.
- Uso típico: construir panel administrativo o exportar por cliente.

Respuesta (ejemplo):

```json
{
  "success": true,
  "data": {
    "global": [ { "id": 16, "tipo_documento": "Carnet de Identidad" } ],
    "24": [ { "id": 60, "tipo_documento": "Charla IRL PVSA" } ],
    "28": [ { "id": 20, "tipo_documento": "Anexo asociado" } ]
  }
}
```

---

## Prerrequisitos de un cliente (incluye globales)

- Ruta: `GET /api/prerrequisitos/cliente/:cliente_id`
- Descripción: Devuelve los prerrequisitos que aplican al cliente `:cliente_id` *y* los prerrequisitos globales (`cliente_id IS NULL`).
- Parámetros URL: `:cliente_id` (entero)

Respuesta (ejemplo):

```json
{
  "success": true,
  "message": "Prerrequisitos obtenidos exitosamente",
  "data": [
    { "id": 20, "cliente_id": 28, "tipo_documento": "Anexo asociado" },
    { "id": 16, "cliente_id": null, "tipo_documento": "Carnet de Identidad" }
  ]
}
```

---

## Prerrequisitos sólo del cliente (excluye globales)

- Ruta: `GET /api/prerrequisitos/cliente/:cliente_id/solo`
- Descripción: Devuelve únicamente las filas con `cliente_id = :cliente_id` (no incluye `NULL`).
- Uso recomendado: cuando la UI desea mostrar sólo los requisitos específicos del cliente y separarlos de los globales.

Respuesta (ejemplo):

```json
{
  "success": true,
  "message": "Prerrequisitos específicos del cliente 28 obtenidos exitosamente",
  "data": [ { "id": 20, "cliente_id": 28, "tipo_documento": "Anexo asociado" } ]
}
```

---

## Prerrequisitos globales

- Ruta: `GET /api/prerrequisitos/globales`
- Descripción: Devuelve sólo los prerrequisitos globales (`cliente_id IS NULL`).

Respuesta: array simple de prerrequisitos globales.

---

## Endpoints de matching / cumplimiento (útiles para comprobar personas frente a un cliente)

- `GET /api/prerrequisitos/clientes/:clienteId/cumplen`
  - Devuelve personas (con `rut`, `nombres`, `cargo`, etc.) que cumplen *todos* los prerrequisitos del cliente.
  - Query params: `includeGlobal` (por omisión `true`), `limit`, `offset`.

- `GET /api/prerrequisitos/clientes/:clienteId/parciales`
  - Devuelve personas que cumplen algunos (parciales) prerrequisitos. Implementado en el servicio `prerrequisitosService`.

- `POST /api/prerrequisitos/clientes/:clienteId/match` (o GET alias con query `?rut=`)
  - Realiza matching para uno o varios RUTs. `POST` acepta body `{ ruts: ["109...", "..."], requireAll: true|false, includeGlobal: true|false }`.
  - `GET` alias permite `?rut=a&rut=b` y es práctico para la UI.

Respuesta típica de match (resumen por RUT):

```json
{
  "rut": "10978973-9",
  "cumple": true,
  "matchesAll": true,
  "missing": []
}
```

---

## CRUD de prerrequisitos

- `POST /api/prerrequisitos` — crear prerrequisito (body: `cliente_id` opcional, `tipo_documento`, `descripcion`, `dias_duracion`).
- `PUT /api/prerrequisitos/:id` — actualizar.
- `DELETE /api/prerrequisitos/:id` — borrar.

Notas de validación y errores:
- `POST` y `PUT` validan `tipo_documento` obligatorio; `cliente_id` si viene debe ser entero.
- Si existe una violación de unicidad se devuelve `409` con mensaje claro.

---

## Observaciones y recomendaciones para la UI

- Si la interfaz desea mostrar sólo lo que aplica a un cliente en su modal, llame a `GET /api/prerrequisitos/cliente/:cliente_id/solo` y, si lo desea, obtenga los globales con `GET /api/prerrequisitos/globales` para mostrarlos por separado.
- Alternativa: usar `GET /api/prerrequisitos/cliente/:cliente_id` (devuelve ambos) y filtrar del lado cliente si necesita separar.
- Para comprobar si una persona cumple, usar el `match` (GET/POST) o los endpoints `cumplen`/`parciales` según caso.

---

Archivo: `routes/prerrequisitos.js` — la implementación está en este archivo y el servicio de lógica está en `services/prerrequisitosService.js`.

Si quieres, actualizo también `docs/endpoints/minimo_personal.md` para añadir un enlace a este documento.
