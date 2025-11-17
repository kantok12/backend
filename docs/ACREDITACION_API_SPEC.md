# Especificación API — Sistema de Acreditación

Este documento describe los endpoints y el contrato necesario para que el frontend implemente la funcionalidad de acreditación de personas por cliente. Está pensado para enviarlo al equipo backend.

---

**Propósito**
- Permitir al frontend mostrar por cliente una lista de personas clasificadas por su estado de cumplimiento de prerrequisitos: "no cumple ninguno" (`none`), "cumple algunos" (`some`), "cumple todos" (`all`).
- Permitir seleccionar personas y abrir su ficha (`/personal`) mostrando al lateral derecho qué documentos faltan para acreditar.
- Evitar trabajo de deduplicación/calculo en el frontend: el backend devolverá datos ya agregados y listos para mostrar.

---

## Endpoints requeridos

### 1) GET /api/acreditacion/cliente/:cliente_id

- Propósito: devolver lista deduplicada de personas del cliente con estado de acreditación y documentos faltantes.
- Método: GET
- Path params:
  - `cliente_id` (number) — id del cliente
- Query params (opcionales):
  - `limit` (number), `offset` (number)
  - `search` (string) — nombre, RUT
- Autenticación: usar el mismo esquema que el resto de la API (header `Authorization: Bearer <token>`) si aplica.

#### Respuesta (200)
```json
{
  "success": true,
  "message": "Acreditación por cliente",
  "count": 123,
  "data": [
    {
      "person_id": 123,
      "nombre": "Marcos Moreno Pavez",
      "rut": "12.345.678-9",
      "estado_acreditacion": "some", // one of "none" | "some" | "all"
      "required_count": 3,
      "provided_count": 1,
      "missing_docs": [
        { "value": "carnet_identidad", "label": "Carnet de Identidad" },
        { "value": "contrato_de_trabajo", "label": "Contrato de Trabajo" }
      ]
    }
  ]
}
```

#### Reglas de negocio / notas
- `required_count` = número total de prerrequisitos (obligatorios) aplicables a ese cliente (incluye prerrequisitos globales y específicos del cliente).
- `provided_count` = número de prerrequisitos que la persona ya tiene (existencia de documentos válidos en su ficha).
- `estado_acreditacion`:
  - `all` cuando `provided_count >= required_count` (o si no hay prerrequisitos, acordar política: recomendamos `all` si no hay requisitos obligatorios o `none` si se considera que falta contexto).
  - `some` cuando `0 < provided_count < required_count`.
  - `none` cuando `provided_count === 0`.
- `missing_docs` debe devolver los `value` que coinciden con `GET /api/documentos/tipos` y las `label` legibles.
- Si existen múltiples documentos del mismo tipo, contar como "proporcionado" si al menos uno cumple (por fechas/validez si aplica).
- Debe poder paginar y buscar (limit/offset/search).

---

### 2) GET /api/personal/:person_id/missing-docs

- Propósito: endpoint para la ficha de persona; devuelve detalle de qué documentos faltan y cuáles están presentes (para renderizar checklist lateral y botones de upload/editar).
- Método: GET
- Path params: `person_id` (number)

#### Respuesta (200)
```json
{
  "success": true,
  "data": {
    "person_id": 123,
    "provided_docs": [
      { "document_id": 987, "tipo": "carnet_identidad", "uploaded_at": "2025-11-12T12:34:56Z", "expires_at": null }
    ],
    "missing_docs": [
      { "value":"contrato_de_trabajo", "label":"Contrato de Trabajo", "required": true },
      { "value":"certificado_medico", "label":"Certificado Médico", "required": false }
    ],
    "required_count": 3,
    "provided_count": 1
  }
}
```

- `required` indica si el prerrequisito es obligatorio para el cliente (boolean).
- `provided_docs` incluye metadata útil: `document_id`, `uploaded_at`, `expires_at`, `drive_file_id` (si aplica), etc.
- UI: el frontend mostrará `provided_docs` como items completados y `missing_docs` como checklist faltante con botones para subir.

---

### 3) (Opcional) POST /api/acreditacion/acciones

- Propósito: ejecutar acciones masivas relacionadas a acreditación (ej. marcar personas como revisadas, iniciar workflow de acreditación manual, enviar notificaciones).
- Payload ejemplo:
```json
{
  "action": "marcar_revisado",
  "person_ids": [123, 456],
  "metadata": { "usuario": "admin" }
}
```

- Respuesta: `{ success: true, message: 'Acción ejecutada' }`

---

## Modelos / campos esperados
- Persona (resumen): `person_id`, `nombre`, `rut`, `cliente_id`
- Prerrequisito: `value` (string), `label` (string), `required` (boolean)
- Documento: `document_id`, `person_id`, `tipo` (value), `uploaded_at`, `expires_at`, `drive_file_id`, `estado_documento`

---

## Ejemplo de flujo de cálculo (implementación sugerida)
- Obtener prerrequisitos aplicables al `cliente_id`: combinar `prerrequisitos globales` + `prerrequisitos del cliente`.
- Obtener lista de personas del cliente (con filtros/paginación si aplica).
- Para todas las personas en el page, obtener en batch (JOIN) los documentos presentes por tipo.
- Calcular `provided_count` y `missing_docs` por persona en la consulta (SQL con agregados) o en una única consulta de agregación para evitar N+1.

**SQL sugerido (esbozo):**
```sql
-- Pseudocódigo SQL para obtener provided_count y missing types por persona
WITH req AS (
  SELECT tipo_documento
  FROM prerrequisitos
  WHERE (cliente_id = :cliente_id OR cliente_id IS NULL) AND activo = true
), docs AS (
  SELECT p.person_id, pd.tipo_documento
  FROM personal p
  LEFT JOIN documentos pd ON pd.person_id = p.person_id AND pd.estado_documento = 'valido'
  WHERE p.cliente_id = :cliente_id
)
SELECT
  p.person_id,
  p.nombre,
  p.rut,
  COALESCE(COUNT(DISTINCT d.tipo_documento) FILTER (WHERE d.tipo_documento IN (SELECT tipo_documento FROM req)), 0) as provided_count,
  (SELECT COUNT(*) FROM req) as required_count
  -- missing types pueden calcularse con array_agg de req - array_agg de docs
FROM personal p
LEFT JOIN docs d ON d.person_id = p.person_id
GROUP BY p.person_id;
```

---

## Rendimiento y consideraciones operativas
- Evitar N+1: preferir una query con JOIN y agregación para la página de personas (batch para el page actual).
- Índices recomendados: `person(cliente_id)`, `documentos(person_id)`, `documentos(tipo_documento)`, `prerrequisitos(cliente_id, tipo_documento)`.
- Paginación y búsqueda: soportar `limit`/`offset` y `search` por nombre/RUT.
- Cache/TTL: las respuestas pueden cachearse en frontend (React Query); invalidar al subir un documento o al ejecutar acciones que afecten documentos.

---

## Seguridad y permisos
- Verificar que el usuario que llama tenga permisos para ver la lista de personas y documentos del cliente.
- Redactar o limitar campos sensibles en la respuesta según roles.

---

## Códigos de error y comportamiento
- 200 OK: éxito.
- 400 Bad Request: parámetros inválidos.
- 401/403: no autenticado / no autorizado.
- 404: cliente/persona no encontrada.
- 500: error interno (responder con mensaje genérico y loggear detalle en backend).

---

## Tests / QA
- Backend debe tener tests que cubran:
  - cliente sin prerrequisitos
  - persona con todos los documentos
  - persona con algunos documentos
  - persona sin documentos
  - documentos duplicados del mismo tipo
- Proveer ejemplos estáticos/Fixture que frontend pueda usar durante integración.

---

## Entregables para el equipo backend
- Implementar `GET /api/acreditacion/cliente/:cliente_id` y `GET /api/personal/:person_id/missing-docs` (y opcionalmente `POST /api/acreditacion/acciones`).
- Documentar contractos (ejemplos de respuesta) y actualizar el swagger/openapi si existe.
- Confirmar nombres de campos (`minimo_real`, `provided_count`, `required_count`) y devolver `missing_docs` con `value` y `label`.

---

Si quieren, puedo también:
- generar el hook frontend `useAcreditacion` y el mock UI (sin backend), o
- preparar la consulta SQL más optimizada para el motor de BD que usen (Postgres / MySQL), o
- añadir el OpenAPI / swagger spec para estos endpoints.

Indiquen qué prefieren y lo preparo.
