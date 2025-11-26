**Frontend Asignaciones y MACH**

Resumen rápido:
- El backend expone un endpoint `mach` para verificar si una persona (RUT) cumple los prerrequisitos de un cliente.
- El endpoint de asignación `POST /api/asignaciones/:clienteId` usa `mach` internamente y crea la asignación en la base de datos sólo si la persona cumple.

**Endpoints principales**

- GET /api/prerrequisitos/clientes/:clienteId/mach?rut=<RUT>&includeGlobal=true
  - Propósito: comprobar si el RUT cumple los prerrequisitos de `clienteId`.
  - Query params:
    - `rut` (string) — RUT con o sin puntos (backend normaliza ambos).
    - `includeGlobal` (boolean, opcional) — incluir prerrequisitos globales del sistema.

- POST /api/asignaciones/:clienteId
  - Propósito: asignar una persona al cliente si cumple prerrequisitos.
  - Body JSON:
    - `rut` (string) — RUT de la persona (acepta formatos con o sin puntos).

**Contrato: respuesta `mach` (ejemplo)**

Respuesta HTTP 200 en caso de éxito:

{
  "success": true,
  "message": "Match completo" | "No match - faltan prerrequisitos",
  "data": {
    "persona": { "rut": "20.011.078-1", "nombres": "...", "cargo": "..." },
    "cumple": true|false,
    "required_count": 1,
    "provided_count": 1,
    "faltantes": ["carnet_identidad"],
    "missing_docs": [ { value, label, required } ],
    "documentos": [ { id, tipo_original, tipo_normalizado, fecha_vencimiento, fecha_subida, vencido } ],
    "estado_acreditacion": "all"|"some"|"none"
  }
}

Uso recomendado (frontend):
- Mostrar los `faltantes` y `missing_docs` en la UI antes de intentar asignar
- Si `cumple: true`, habilitar botón "Asignar" que llame al endpoint de asignación

**Contrato: respuesta de asignación (POST /api/asignaciones/:clienteId)**

- 201 Created — Asignación realizada

{
  "success": true,
  "code": "ASSIGNED",
  "message": "El personal ha sido asignado exitosamente."
}

- 409 Conflict — Prerrequisitos no cumplidos

{
  "success": false,
  "code": "PREREQUISITOS_INCOMPATIBLES",
  "message": "El personal no cumple con los requisitos para este cliente.",
  "details": { /* objeto devuelto por mach para ayudar al frontend */ }
}

- 409 Conflict — Ya asignado

{
  "success": false,
  "code": "ALREADY_ASSIGNED",
  "message": "El personal ya tiene una asignación con este cliente."
}

- 500 Internal Server Error — Error del servicio

{
  "success": false,
  "code": "CHECK_FAILED",
  "message": "No se pudo verificar los prerrequisitos para este RUT."
}

**Flujo recomendado para el frontend**

1. Llamar a `GET /api/prerrequisitos/clientes/:clienteId/mach?rut=...&includeGlobal=true`.
2. Si `cumple: false`, mostrar `missing_docs` y deshabilitar la asignación. Ofrecer instructivo para subir documentos.
3. Si `cumple: true`, llamar a `POST /api/asignaciones/:clienteId` con body `{ "rut": "<rut>" }`.
4. Si la respuesta es `ASSIGNED`, mostrar confirmación. Si `ALREADY_ASSIGNED`, mostrar aviso adecuado.

**Ejemplo fetch (JS)**

// 1) Verificar prerrequisitos
fetch(`/api/prerrequisitos/clientes/28/mach?rut=${rut}&includeGlobal=true`)
  .then(r => r.json())
  .then(data => {
    if (!data.success) { /* manejar error */ }
    if (!data.data.cumple) {
      // mostrar data.data.missing_docs y message
    } else {
      // habilitar asignación
    }
  });

// 2) Intentar asignar
fetch(`/api/asignaciones/28`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rut })
})
  .then(r => r.json())
  .then(res => {
    if (res.success && res.code === 'ASSIGNED') {
      // mostrar éxito
    } else if (res.code === 'PREREQUISITOS_INCOMPATIBLES') {
      // mostrar faltantes (res.details)
    } else if (res.code === 'ALREADY_ASSIGNED') {
      // mostrar mensaje de conflicto
    }
  });

**Ejemplo PowerShell**

Invoke-RestMethod -Uri "http://localhost:3000/api/prerrequisitos/clientes/28/mach?rut=12345678-9&includeGlobal=true" -Method GET

Invoke-RestMethod -Uri 'http://localhost:3000/api/asignaciones/28' -Method POST -ContentType 'application/json' -Body '{"rut":"12345678-9"}'

**Notas importantes para integrar**

- RUTs: el backend normaliza RUTs en las comprobaciones `mach` (acepta con/sin puntos). Sin embargo, algunas consultas internas pueden devolver `persona.rut` con puntos. Recomendación: el frontend puede mantener y mostrar el RUT en el formato que prefiera; al enviar al backend, no es necesario normalizar.
- Mensajes legibles: usa `missing_docs[].label` para mostrar texto amigable en la UI.
- Manejo de errores: si recibes `CHECK_FAILED` o HTTP 500, reintenta o muestra mensaje de soporte.
- Audit/auditoría: la asignación se persiste en `servicios.asignacion`. Si necesitas mostrar quién hizo la asignación, podemos agregar un campo `asignado_por` y capturar el usuario autenticado (si hay auth disponible).

**Ejemplo combinado (payload útil para UI)**

Cuando `mach` devuelve:

{
  data: {
    persona: { rut: '12345678-9', nombres: 'Juan' },
    cumple: false,
    faltantes: ['carnet_identidad'],
    missing_docs: [ { value: 'carnet_identidad', label: 'Carnet de identidad', required: true } ]
  }
}

Frontend puede renderizar:
- Título: "No cumple prerrequisitos"
- Lista: "Carnet de identidad (obligatorio)"
- Botón: "Solicitar documento" / "Volver" (no permitir asignar)

Si `cumple:true`, mostrar botón "Asignar" que llama a `POST /api/asignaciones/:clienteId`.

---
Archivo creado por backend para consumo del frontend. Si quieres lo adapto a un formato OpenAPI/Swagger o añado campos (por ejemplo `asignado_por`, `motivo`, `fecha_expiracion`) dímelo y lo agrego.
