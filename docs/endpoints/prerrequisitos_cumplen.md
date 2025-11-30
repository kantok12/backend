**Prerrequisitos — Endpoint `cumplen` (Resumen para Frontend)**

- **Endpoint:** `GET /api/prerrequisitos/clientes/:clienteId/cumplen`
- **Propósito:** Obtener personas que cumplen (o no) los prerrequisitos de un cliente, con soporte de filtros en backend para facilitar la UI.

**Query Params principales**
- `onlyCompletos` : `true|1` — Devuelve sólo personas que cumplen todos los requisitos (equivalente a `missing_count === 0`).
- `max_missing` : `N` — Devuelve personas con `missing_count <= N` (por ejemplo `max_missing=1` devuelve quienes faltan 0 o 1 documento).
- `includeGlobal` : `true|false` — (existente) incluir prerrequisitos globales (por defecto `true`).
- `limit`, `offset` : paginación (opcional).

Ejemplos de llamadas
- Obtener sólo completos:
```
GET /api/prerrequisitos/clientes/1/cumplen?onlyCompletos=true
```
- Obtener con máximo 1 faltante:
```
GET /api/prerrequisitos/clientes/1/cumplen?max_missing=1
```

**Forma de la respuesta (JSON)**
- Respuesta superior:
  - `success`: `true|false`
  - `message`: texto
  - `data`: objeto con los siguientes campos
    - `total_before_filter`: número de coincidencias calculadas por el servicio antes de aplicar filtros del backend.
    - `total`: número de coincidencias después de aplicar los filtros (`onlyCompletos` / `max_missing`).
    - `completos_count`: cantidad de items en `completos`.
    - `parciales_count`: cantidad de items en `parciales`.
    - `completos`: array de objetos (personas que cumplen todos los requisitos después del filtro aplicado).
    - `parciales`: array de objetos (personas con faltantes después del filtro aplicado).

- Cada elemento de `completos` / `parciales` incluye (entre otros):
  - `rut`: string
  - `matchesAll`: boolean (si el match estaba marcado como completo por el servicio)
  - `required_count`: número de requisitos esperados
  - `provided_count`: número de requisitos satisfechos (según matching)
  - `faltantes`: array de `tipo_normalizado` (strings) que faltan
  - `missing_docs`: array con objetos `{ value, label, required }` (compatibilidad)
  - `documentos`: array con los documentos del usuario (cada doc puede contener `id`, `tipo_original`, `tipo_normalizado`, `fecha_vencimiento`, `fecha_subida`, `vencido`)
  - `persona`: objeto `{ rut, nombres, cargo, zona_geografica }` (nota: `zona_geografica` se rellena desde `sede` si la columna `zona_geografica` no existe)
  - `missing_count`: número entero (nº de faltantes calculado por el backend)
  - `classification`: string `all` o `missing_N` para etiquetas rápidas

Pequeño ejemplo de `data.completos[0]` (resumido):
```
{
  "rut": "10978973-9",
  "matchesAll": true,
  "required_count": 2,
  "provided_count": 2,
  "documentos": [ { "id": 179, "tipo_normalizado": "carnet_identidad", "vencido": false }, ... ],
  "persona": { "rut": "10978973-9", "nombres": "Nombre Apellido", "cargo": "...", "zona_geografica": null },
  "missing_count": 0,
  "classification": "all"
}
```

**Recomendaciones de frontend (qué cambiar o cómo consumir)**
- Rellenar el select de “personas que cumplen” usando `data.completos` (evita lógica local en frontend para decidir "cumple").
- Mostrar `data.parciales` en una lista/tabla secundaria y usar `missing_count` para etiquetar cada fila (ej.: "Faltan 2").
- Usar `data.total_before_filter` si quieres mostrar el número de coincidencias calculadas por el servicio sin filtrar.
- Si quieres permitir toggles de UX (ej.: "Mostrar también parciales con 1 faltante"), llama al endpoint con `max_missing=1`.

**Notas importantes / Consideraciones**
- La propiedad `documentos[].vencido` está presente: si necesitas que documentos vencidos no se cuenten como válidos, solicítalo para que implementemos `ignore_vencidos=true` en el backend (actualmente el matching puede contar documentos vencidos dependiendo de la regla aplicada en el servicio).
- Algunos `tipo_normalizado` tienen valor `"otro"`. Si no quieres que `otro` satisfaga requisitos concretos, pídelo y lo ajustamos en la lógica de matching (por ejemplo, excluir `otro` salvo mapeo explícito).
- Se hizo un ajuste en la consulta para rellenar `persona.zona_geografica` usando `sede as zona_geografica` cuando la columna `zona_geografica` no existe.

**Cambios implementados en backend (resumen técnico)**
- `routes/prerrequisitos.js`:
  - Nuevo formato de respuesta con `completos` / `parciales`.
  - Soporta query params `onlyCompletos` y `max_missing` para filtrar en backend.
  - `zona_geografica` se obtiene desde `sede` si corresponde.
- No se cambiaron, por ahora, las reglas de matching internas (si quieres que ignore vencidos o que trate `otro` de forma especial, solicitar y lo implemento en `services/prerrequisitosService.js`).

**Solicitudes que puedo aplicar ahora (elige una)**
- Implementar `ignore_vencidos=true` para que el backend ignore documentos con `vencido: true` al calcular `provided_count`.
- Excluir `tipo_normalizado === 'otro'` como satisfactor por defecto.
- Añadir `documentos_usados` por persona (lista de docs que realmente cumplieron requisitos).

Archivo creado: `docs/endpoints/prerrequisitos_cumplen.md`

Si quieres que lo amplíe con ejemplos de UI (snippets React/Vue) o que implemente alguna de las solicitudes técnicas, dime cuál y lo hago.