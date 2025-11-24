**API de Prerrequisitos — Guía para Frontend**

Este documento describe los endpoints nuevos y actualizados para consultar prerrequisitos, realizar matching y obtener quiénes cumplen. Incluye ejemplos de consumo (`axios` / PowerShell), manejo de errores y recomendaciones de rendimiento.

Resumen rápido
- Base URL de la API en desarrollo: `http://localhost:3000`
- Endpoints principales que afectan al frontend:
  - `GET  /api/prerrequisitos/clientes` — lista todos los prerrequisitos agrupados por cliente (incluye globales)
  - `GET  /api/prerrequisitos/clientes/:clienteId/match?rut=...` — alias de conveniencia para un solo RUT
  - `POST /api/prerrequisitos/clientes/:clienteId/match` — body `{ ruts: [...] }`, devuelve array de `matchResult` (hasta 250 ruts)
  - `GET  /api/prerrequisitos/clientes/:clienteId/cumplen` — devuelve personas que cumplen TODOS los requisitos (nota: implementación naive)
  - `POST /api/asignaciones/persona/:rut/clientes` — al intentar asignar, si faltan requisitos devuelve `409` con `payload` y `data` (`matchResult`)

Formato de `matchResult` (por persona)
- `rut` (string)
- `clienteId` (int)
- `cumple` (boolean)
- `required_count` (int)
- `provided_count` (int)
- `faltantes` (array[string]) — tipos normalizados faltantes
- `missing_docs` (array[{ tipo, label }]) — para mostrar en UI
- `documentos_validos` (array) — documentos usados para el match
- `timestamp` (ISO string)

1) GET /api/prerrequisitos/clientes
- Qué hace: devuelve todos los prerrequisitos agrupados por `cliente_id`. Los prerrequisitos globales (cliente_id = NULL) vienen agrupados bajo la clave `global`.
- Ejemplo respuesta:
```
{ "success": true, "data": { "global": [...], "28": [...], "42": [...] } }
```
- Uso en frontend: útil para construir un catálogo de requisitos, formularios de administración o selectores.

2) POST /api/prerrequisitos/clientes/:clienteId/match
- Body: `{ "ruts": ["20.011.078-1", "20011078-1"] }`
- Límite: máximo 250 RUTs por petición. Si se excede, la API responde `413 Payload Too Large`.
- Qué devuelve: `200 OK` con `{ success: true, data: [matchResult,...] }`.
- Prioridad de tipos: el servicio prioriza `tipo_normalizado` en la tabla `mantenimiento.documentos`; si no existe, normaliza `tipo_documento` on-read.
- Filtrado de vencidos: los documentos con `vencido=true` o `fecha_vencimiento < now()` se descartan antes de comparar.

Ejemplo axios (batch / pre-validación):
```ts
const body = { ruts: [rut, normalizedRut] };
const res = await axios.post(`/api/prerrequisitos/clientes/${clienteId}/match`, body);
const results = res.data.data; // array de matchResult
const me = results.find(x => x.rut.replace(/\./g,'') === normalizedRut.replace(/\./g,''));
if (me && me.cumple) { /* permitir acción */ } else { /* mostrar faltantes */ }
```

3) GET /api/prerrequisitos/clientes/:clienteId/match?rut=...
- Alias conveniente para llamadas desde UI cuando sólo se necesita 1 RUT. Equivalente a POST con `ruts=[rut]`.

4) GET /api/prerrequisitos/clientes/:clienteId/cumplen
- Qué hace: devuelve `data: [matchResult,...]` únicamente con personas que cumplen TODOS los requisitos.
- Nota importante: la implementación actual itera `mantenimiento.personal_disponible` y ejecuta el matching por RUT — funcional pero `O(N)` en número de personas y puede ser lento en producción.
- Alternativa recomendada para UI: en lugar de llamar `/cumplen` para todo el personal, el frontend debería enviar listas de RUTs relevantes a `POST /.../match` y filtrar `result.cumple === true`.

5) POST /api/asignaciones/persona/:rut/clientes
- Al crear una asignación, el backend valida prerrequisitos. Si faltan documentos obligatorios devuelve `409 Conflict`.
- Estructura del 409: contiene `payload` legible y `data` con el `matchResult` completo:
```
{
  success: false,
  code: 'PREREQUISITOS_INCOMPATIBLES',
  message: 'No es posible asignar...',
  payload: { cliente_id, rut, required_count, provided_count, missing: [...] },
  data: { /* matchResult */ },
  validacion: { /* compat */ }
}
```

Frontend: cómo manejar el 409 (ejemplo axios)
```ts
try {
  await axios.post(`/api/asignaciones/persona/${rut}/clientes`, { cliente_id });
  // éxito
} catch (err:any) {
  if (err.response?.status === 409) {
    const { message, payload, data } = err.response.data;
    // Mostrar modal con payload.missing (lista legible) y usar data (matchResult) si quieres más detalle
  } else {
    // otro error
  }
}
```

Normalización de RUTs y tipos
- RUT: envía siempre ambas variantes cuando sea posible: con puntos (`20.011.078-1`) y sin puntos (`20011078-1`), o normaliza a la forma sin puntos antes de enviar.
- Tipos de documento: la API usa `tipo_normalizado` si está poblado en la BD. Recomendamos ejecutar el backfill (`scripts/backfill_tipo_normalizado.js` o la migración SQL incluida) para mejorar la precisión.

Pautas de UX
- Antes de intentar una asignación, pre-valida con `POST /.../match`. Si hay faltantes mostrar un modal con:
  - `message` del servidor (texto legible)
  - lista `payload.missing` o `matchResult.missing_docs` con `label`
  - acciones: "Cancelar", "Ir a subir documentos", (opcional) "Forzar asignación" si la política lo permite.

Rendimiento y operaciones
- Para consultas ad-hoc sobre pequeños conjuntos de RUTs: usar `POST /.../match` (máx 250 ruts) — rápido y recomendado.
- Para obtener la lista completa de personas que cumplen en producción: implementar la versión SQL/materializada y backfill `tipo_normalizado`, o usar cache (Redis) con TTL 30-60s. La implementación actual de `/cumplen` es naive y puede ser lenta.

Pruebas y QA
- Ejemplos de PowerShell (sin `jq`):
  - POST batch:
```powershell
$body = @{ ruts = @('20.011.078-1','20011078-1') } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/prerrequisitos/clientes/28/match" -Method Post -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10
```
  - GET all requisitos por cliente:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/prerrequisitos/clientes" | ConvertTo-Json -Depth 10
```

Notas finales
- El backend se ha actualizado para ser la fuente de verdad del matching de prerrequisitos. El frontend debe preferir `POST /.../match` para pre-validación y usar el 409 de `POST /asignaciones/...` sólo como última defensa.
- Si queréis, puedo generar snippets React/TSX para el modal de faltantes (ya hay uno en `docs/FRONTEND_ASSIGNMENTS_SNIPPETS.md`).

---
Archivo: `docs/FRONTEND_PREREQUISITOS_API.md`
