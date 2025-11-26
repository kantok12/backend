**Especificación: Endpoint `mach` (prerrequisitos) — Frontend**

- **Propósito**: Verificar si una persona (RUT) cumple todos los prerrequisitos de un cliente. El frontend usa esta información para habilitar/mostrar acciones (p. ej. botón "Asignar"), mostrar documentos faltantes y guiar al usuario para completar requisitos.

- **Rutas disponibles**:
  - GET `/api/prerrequisitos/clientes/:clienteId/mach?rut=<RUT>&includeGlobal=true`
    - Conveniencia para llamadas rápidas desde frontend.
  - POST `/api/prerrequisitos/clientes/:clienteId/mach`
    - Body JSON: `{ "rut": "<RUT>", "includeGlobal": true }`

- **Parámetros**:
  - `clienteId` (path): ID numérico del cliente.
  - `rut` (query o body): RUT de la persona a verificar.
  - `includeGlobal` (boolean, opcional, default true): si se deben incluir los prerrequisitos globales además de los específicos del cliente.

- **Qué hace el endpoint**:
  1. Carga prerrequisitos del cliente y (opcional) prerrequisitos globales.
  2. Recupera los documentos asociados al `rut` y normaliza `tipo_documento` usando la lógica server-side (`lib/tipoDocumento.normalizeTipo`).
  3. Verifica vigencia de cada documento (fechas y/o reglas de `dias_duracion`).
  4. Devuelve si la persona cumple TODOS los prerrequisitos, y en caso negativo devuelve cuáles faltan y qué documentos tiene (con estado `vencido` si corresponde).

- **Respuesta (esquema)**:

  - HTTP 200 (si la consulta fue procesada):

```json
{
  "success": true,
  "message": "Match completo" | "No match - faltan prerrequisitos",
  "data": {
    "persona": {
      "rut": "20011078-1",
      "nombres": "Nombre disponible o 'Nombre no disponible'",
      "cargo": "Cargo o 'Cargo no disponible'",
      "zona_geografica": "..." | null
    },
    "cumple": true|false,                       // si cumple todos
    "required_count": 3,                        // número de requisitos a cumplir
    "provided_count": 3,                        // cuántos provee actualmente
    "faltantes": ["carnet_identidad","cv"], // array con tipos normalizados faltantes
    "missing_docs": [                           // objetos legibles para UI
      { "value": "carnet_identidad", "label": "Carnet de Identidad", "required": true }
    ],
    "documentos": [                             // documentos encontrados (resumen)
      {
        "id": 55,
        "tipo_original": "carnet de identidad",
        "tipo_normalizado": "carnet_identidad",
        "fecha_vencimiento": "2026-01-07T03:00:00.000Z",
        "fecha_subida": "2025-11-07T12:15:52.612Z",
        "vencido": false
      }
    ],
    "estado_acreditacion": "all"|"some"|"none"
  }
}
```

  - Si ocurre un error interno, el endpoint devuelve HTTP 500 con `success:false`.

- **Códigos y mensajes útiles para el frontend**:
  - `cumple == true` → habilitar acción de asignar (o lo que corresponga).
  - `cumple == false` → mostrar `missing_docs` con `label` y la lista `documentos` para indicar qué falta y qué existe.
  - `estado_acreditacion`:
    - `all` → persona cumple todo.
    - `some` → persona tiene al menos un documento válido, pero no todos.
    - `none` → no tiene ninguno de los requisitos.

- **Flujo de UI recomendado**:
  1. Al elegir cliente y seleccionar persona, llamar a GET `/.../mach?rut=...&includeGlobal=true`.
  2. Si `cumple == true`: mostrar botón `Asignar` activo.
  3. Si `cumple == false`: mostrar tarjeta con lista de `missing_docs` (label + acción para subir documento). También mostrar `documentos` existentes con `vencido` marcado.
  4. Al subir documento nuevo (o marcar como renovado), volver a llamar `mach` para validar.

- **Ejemplo de manejo en JS (fetch)**:

```javascript
// Obtener match (GET)
async function checkMatch(clienteId, rut) {
  const url = `/api/prerrequisitos/clientes/${clienteId}/mach?rut=${encodeURIComponent(rut)}&includeGlobal=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al verificar prerrequisitos');
  return await res.json();
}

// Uso
const result = await checkMatch(28, '20011078-1');
if (result.success && result.data.cumple) {
  // habilitar asignación
} else {
  // mostrar result.data.missing_docs y result.data.documentos
}
```

- **POST (server-side) — verificar y devolver estructura igual**:

```javascript
const res = await fetch(`/api/prerrequisitos/clientes/${clienteId}/mach`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rut: '20011078-1', includeGlobal: true })
});
const json = await res.json();
```

- **Integración con endpoint de asignación**:
  - Endpoint: POST `/api/asignaciones/:clienteId`
    - Body: `{ "rut": "20011078-1" }`
    - Respuestas esperadas (según implementación actual):
      - 200 con message si asignación OK.
      - 400 con message si prerrequisitos no cumplidos (devuelve `message` y opcional `details`).
      - 500 si error interno.

- **Manejo de errores y UX**:
  - Si `mach` devuelve `cumple:false`, muestra modal con `missing_docs` y enlaces a subir los documentos necesarios.
  - Si la petición POST asignación devuelve 400 con `details`, muestra detalles y evita la acción.
  - Si 500, mostrar mensaje genérico y opción de reintentar.

- **Recomendaciones de performance y UX**:
  - Cachea la respuesta de `mach` por algunos segundos (p. ej. 30–60s) mientras el usuario no suba nuevos documentos.
  - Si haces verificaciones masivas (lista de personas), usa el POST `/clientes/:clienteId/match` con body `{ ruts: [..] }` porque es más eficiente (consulta batch en backend).

- **Campos importantes a mostrar en UI**:
  - `data.cumple` → booleano central.
  - `data.missing_docs` → mostrar label y botón para subir.
  - `data.documentos` → mostrar lista de documentos actuales (nombre, fecha_vencimiento, vencido).
  - `data.estado_acreditacion` → mostrar indicador visual (All / Some / None).
  - `data.required_count` / `data.provided_count` → barra de progreso opcional.

- **Ejemplo real (respuesta del servidor)**

```json
{
  "success": true,
  "message": "No match - faltan prerrequisitos",
  "data": {
    "persona": { "rut": "20011078-1", "nombres":"Nombre no disponible" },
    "cumple": false,
    "required_count": 1,
    "provided_count": 0,
    "faltantes":["carnet_identidad"],
    "missing_docs":[{"value":"carnet_identidad","label":"carnet_identidad","required":true}],
    "documentos": [],
    "estado_acreditacion": "none"
  }
}
```

- **Notas finales**:
  - La normalización de tipos de documento se hace server-side (usa `lib/tipoDocumento`). El frontend debe confiar en el `label` devuelto en `missing_docs` para mostrar texto amigable.
  - Para listas grandes de RUTs, usa el endpoint de batch (`POST /clientes/:clienteId/match`) para evitar N+1.

---

Documento creado por el equipo backend — archivo: `docs/FRONTEND_MACH_ENDPOINT.md`.
