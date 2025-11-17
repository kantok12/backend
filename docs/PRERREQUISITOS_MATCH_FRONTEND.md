# Frontend: usar `POST /api/prerrequisitos/clientes/:clienteId/match`

Este documento muestra cómo el frontend puede llamar al endpoint de matching y cómo interpretar la respuesta para clasificar personal en `all` / `some` / `none`.

## Endpoint
- `POST /api/prerrequisitos/clientes/:clienteId/match`
- Body: `{ ruts: string[], requireAll?: boolean, includeGlobal?: boolean }`

## Ejemplo de petición (fetch)
```javascript
// Asumiendo API_CONFIG.BASE_URL = 'http://localhost:3000/api'
const clienteId = 12;
const url = `${API_CONFIG.BASE_URL}/prerrequisitos/clientes/${clienteId}/match`;
const payload = {
  ruts: ['12.345.678-9', '11.222.333-4'],
  requireAll: true, // default
  includeGlobal: true // default
};

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
const json = await res.json();
if (!json.success) throw new Error('Matching failed');

// json.data -> array de resultados por RUT
```

## Ejemplo de respuesta (estructura por item)
- Cada elemento en `json.data` tendrá ahora la forma:
```json
{
  "rut": "12.345.678-9",
  "matchesAll": true,
  "required_count": 3,
  "provided_count": 3,
  "estado_acreditacion": "all", // one of 'all'|'some'|'none'
  "missing_docs": [],
  "documentos": [ /* resumen de documentos del rut */ ]
}
```

## Cómo clasificar en el frontend
- `estado_acreditacion` ya viene calculado por el backend y puede usarse directamente.
- Si prefieres calcularlo en cliente (redundante), usa:
  - `all` if provided_count >= required_count
  - `none` if provided_count === 0
  - `some` otherwise

## Ejemplo de uso (React + map)
```javascript
function classifyResults(results) {
  return results.map(r => ({
    rut: r.rut,
    estado: r.estado_acreditacion,
    required: r.required_count,
    provided: r.provided_count,
    missing: r.missing_docs
  }));
}

// Render simple
const items = classifyResults(json.data);
items.forEach(i => console.log(i.rut, i.estado, i.missing.map(m => m.label).join(', ')));
```

## Notas
- `missing_docs` contiene `value` y `label` (label proviene de la `descripcion` del prerrequisito si está disponible).
- `documentos` incluye metadatos (id, fecha_subida, fecha_vencimiento, tipo_normalizado, vencido) útiles para la ficha lateral.
- Recomendación: paginar las requests si el número de RUTs es muy grande; hacer batches de 200-500 RUTs para evitar timeouts.

