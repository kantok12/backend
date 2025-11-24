**Prerrequisitos Parciales Endpoint**

Descripción
- **Qué hace**: Devuelve, por cliente, el personal que cumple al menos uno de los prerrequisitos pero no todos (es decir, cumple parciales de los requisitos requeridos).
- **Ruta**: `GET /api/prerrequisitos/clientes/:clienteId/parciales`

**Parámetros**
- **Path**: `:clienteId` (required) — ID numérico del cliente a consultar.
- **Query**:
  - `includeGlobal` (optional, default: `true`) — si `true`, incluye prerrequisitos globales además de los específicos del cliente; si `false`, sólo los prerrequisitos del cliente.
  - `limit` (optional, default: `1000`) — número máximo de personas a evaluar (se usa para paginar y limitar la carga sobre la base de datos).
  - `offset` (optional, default: `0`) — desplazamiento para paginación.

**Comportamiento y reglas de negocio**
- El servicio carga los prerrequisitos del cliente desde `mantenimiento.cliente_prerrequisitos`. Si no existen prerrequisitos (ni globales ni del cliente) la respuesta indica que no hay prerrequisitos definidos.
- El personal evaluado se obtiene desde `mantenimiento.personal_disponible` filtrando por `estado_id = 1` (personal activo). Si necesitas incluir personal en otros estados, hay que ajustar la consulta en el servicio.
- Los documentos se leen desde `mantenimiento.documentos`. Cada documento se normaliza con la función de normalización existente (`normalizeTipo`) para emparejarlo con los tipos requeridos.
- Los documentos vencidos no cuentan como satisfechos. La detección de vencimiento usa `fecha_vencimiento` si está presente; si no, usa `dias_duracion` del prerrequisito y la `fecha_subida` del documento.

**Respuesta**
- `200 OK` — Formato JSON:

```
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "persona": {
        "rut": "20.011.078-1",
        "nombres": "Claudio Nicolas Muñoz Herrera",
        "cargo": "Ingeniero en confiablidad",
        "zona_geografica": "Valparaiso"
      },
      "provided_count": 2,
      "required_count": 3,
      "faltantes": ["certificado_seguridad"],
      "documentos": [
        { "id": 98, "tipo_original": "cv", "tipo_normalizado": "otro", "fecha_vencimiento": "2025-11-15T03:00:00.000Z", "vencido": true },
        { "id": 71, "tipo_original": "otro", "tipo_normalizado": "otro", "fecha_vencimiento": "2025-11-27T03:00:00.000Z", "vencido": false }
      ]
    }
  ]
}
```

- Campos clave explicados:
  - `persona`: objeto con información básica del personal (`rut`, `nombres`, `cargo`, `zona_geografica`).
  - `provided_count`: cuántos de los prerrequisitos requeridos están satisfechos (documentos válidos).
  - `required_count`: número total de prerrequisitos considerados para el cliente (incluye globales si `includeGlobal=true`).
  - `faltantes`: array de strings con los tipos normalizados que faltan.
  - `documentos`: lista de documentos asociados a la persona, cada uno con `vencido: true|false`.

**Códigos de error y respuestas**
- `400 Bad Request` — Parámetro `clienteId` inválido o mal formado.
- `500 Internal Server Error` — Error inesperado en servidor (consulta BD, normalización, etc.). Respuesta con `error` y `message` describiendo el problema.

**Ejemplos de uso**
- PowerShell (recomendado en Windows):

```
Invoke-RestMethod -Uri "http://localhost:3000/api/prerrequisitos/clientes/28/parciales" | ConvertTo-Json -Depth 10
```

- curl (Linux/macOS o `curl.exe` en Windows):

```
curl -s "http://localhost:3000/api/prerrequisitos/clientes/28/parciales"
```

**Notas de rendimiento y operativas**
- El endpoint realiza lecturas sobre `mantenimiento.personal_disponible` y `mantenimiento.documentos`. Para carteras grandes se recomienda:
  - usar `limit`/`offset` para paginar (no devolver todo en una sola llamada),
  - habilitar un cache (por ejemplo Redis) con TTL corto para respuestas por `clienteId`,
  - o implementar una consulta SQL más eficiente que compute los resultados en la base de datos usando `tipo_normalizado` si está poblado.
- Asegúrate de que la columna `tipo_normalizado` (o la lógica de `normalizeTipo`) cubra las variantes de nombres que uses en los prerrequisitos para evitar falsos negativos.

**Siguientes mejoras recomendadas**
- Añadir filtros por `zona_geografica` y `cargo` (query params) para reducir la población a evaluar.
- Incluir un resumen en la respuesta (por ejemplo `totales: { parciales: X, completos: Y, none: Z }`) para evitar llamadas adicionales.
- Añadir tests unitarios e integración para `getPersonasQueCumplenAlgunos`.

Archivo relacionado
- Servicio: `services/prerrequisitosService.js` (función `getPersonasQueCumplenAlgunos`).
- Ruta: `routes/prerrequisitos.js` (endpoint `GET /clientes/:clienteId/parciales`).

Fecha de creación: 2025-11-23
