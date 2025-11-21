**Frontend - Manejo de Asignaciones (Clientes)**

Propósito: describir cómo debe comportarse el frontend al intentar asignar un cliente a una persona (`POST /api/asignaciones/persona/:rut/clientes`) y cómo presentar errores de validación (409) de forma clara para el usuario.

**Endpoints Relevantes**

- **POST**: `/api/asignaciones/persona/:rut/clientes`
  - Body: `{ cliente_id: number, enforce?: boolean }`
  - Respuestas relevantes:
    - 201 (éxito): JSON con `code: 'PREREQUISITOS_OK'`, `message`, y `payload`:
      ```json
      {
        "success": true,
        "code": "PREREQUISITOS_OK",
        "message": "Cliente asignado correctamente.",
        "payload": {
          "cliente_id": 28,
          "rut": "20.011.078-1",
          "required_count": 3,
          "provided_count": 3,
          "missing": []
        },
        "validacion": { /* compatibilidad */ }
      }
      ```
    - 409 (conflicto / validación): JSON con `code: 'PREREQUISITOS_INCOMPATIBLES'`, `message` legible y `payload` con `missing`:
      ```json
      {
        "success": false,
        "code": "PREREQUISITOS_INCOMPATIBLES",
        "message": "No es posible asignar el cliente porque faltan documentos obligatorios.",
        "payload": {
          "cliente_id": 28,
          "rut": "20.011.078-1",
          "required_count": 3,
          "provided_count": 1,
          "missing": [ { "type": "certificado_seguridad", "label": "Certificado de seguridad", "required": true } ]
        },
        "validacion": { /* compatibilidad */ }
      }
      ```

- **POST (pre-validación)**: `/api/prerrequisitos/clientes/:clienteId/match`
  - Body: `{ ruts: string[] }` — devuelve un array `data` con objetos por RUT, incluyendo `faltantes`, `required_count`, `provided_count`.
  - Recomendación: usarlo antes de intentar asignar para dar mejor UX.

**Reglas / Recomendaciones para Frontend**

- **Normalizar RUTs**: enviar ambos formatos cuando sea posible (`'20.011.078-1'` y `'20011078-1'`) o normalizar a la forma que use el backend (quitar puntos). Esto evita fallos de matching por formato.
- **UX**: antes de llamar a `POST /asignaciones/...`, llamar a `POST /prerrequisitos/.../match` y, si hay faltantes, mostrar un modal explicativo en lugar de intentar la asignación:
  - **Modal sugerido**:
    - **Título**: "No se puede asignar el cliente"
    - **Cuerpo**: usar `message` del servidor y listar `payload.missing` con `label` y si es obligatorio.
    - **Acciones**: "Cancelar", "Ir a subir documentos" (navegar al uploader / perfil), opcional: "Forzar asignación" sólo si el backend soporta `enforce=false` y la política lo permite.

**Cómo consumir las respuestas (ejemplos)**

- Ejemplo `assignClienteToPersona` (axios + TypeScript):

```ts
type MissingItem = { type: string; label: string; required: boolean };
type AssignPayload = { cliente_id: number; rut: string; required_count: number; provided_count: number; missing: MissingItem[] };

async function assignClienteToPersona(rut: string, cliente_id: number) {
  try {
    const res = await axios.post(`/api/asignaciones/persona/${rut}/clientes`, { cliente_id });
    // Éxito: res.data.payload
    return { ok: true, payload: res.data.payload as AssignPayload };
  } catch (err: any) {
    if (err.response?.status === 409) {
      const body = err.response.data;
      const payload = body.payload as AssignPayload | undefined;
      return { ok: false, code: body.code, message: body.message, payload };
    }
    throw err;
  }
}
```

- Ejemplo de pre-validación (recomendado):

```ts
async function preValidateAndAssign(rut: string, cliente_id: number) {
  // 1) Pre-validate
  const matchRes = await axios.post(`/api/prerrequisitos/clientes/${cliente_id}/match`, { ruts: [rut, rut.replace(/\./g,'')] });
  const info = matchRes.data.data.find((x: any) => x.rut.replace(/\./g,'') === rut.replace(/\./g,''));
  if (info && info.faltantes && info.faltantes.length > 0) {
    // Mostrar modal con info.faltantes (o mapping a labels)
    return { ok: false, reason: 'faltantes', details: info };
  }

  // 2) Intentar asignar
  return assignClienteToPersona(rut, cliente_id);
}
```

**Interfaz / Tipos sugeridos (TS)**

```ts
interface ApiAssignResponse {
  success: boolean;
  code?: string;
  message?: string;
  payload?: {
    cliente_id: number;
    rut: string;
    required_count: number;
    provided_count: number;
    missing: { type: string; label: string; required: boolean }[];
  };
  validacion?: any; // legado
}
```

**Mensajes UI recomendados**

- Mostrar el `message` que devuelve el servidor como texto principal del modal.
- Listar `payload.missing` con la `label` y marcar los obligatorios.
- Incluir conteo: "Faltan X de Y documentos obligatorios" (usar `required_count` y `provided_count`).

**Comandos de prueba (PowerShell / curl)**

```powershell
# Pre-validate
$body = @{ ruts = @("20.011.078-1","20011078-1") } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3001/api/prerrequisitos/clientes/28/match' -Method Post -Body $body -ContentType 'application/json'

# Intentar asignar (posible 409)
$assign = @{ cliente_id = 28 } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3001/api/asignaciones/persona/20.011.078-1/clientes' -Method Post -Body $assign -ContentType 'application/json'
```

**Notas operativas**

- El backend fue modificado para devolver `payload` y `code` consistentes en 201 y 409. Si no ves este formato, reinicia el proceso Node (por ejemplo `npm run dev`) para que se apliquen los cambios.
- Mantuvimos el campo `validacion` por compatibilidad con consumidores antiguos.
- Si el producto requiere un flujo de "forzar asignación", coordinar con backend para exponer `enforce=false` o endpoint separado.

---
Archivo creado para referencia de frontend: `docs/FRONTEND_ASSIGNMENTS.md`.
