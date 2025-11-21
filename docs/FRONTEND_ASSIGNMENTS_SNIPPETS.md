**Snippets para Frontend**

Archivo objetivo: `api.ts` (línea ~1328) — ejemplo para manejar la respuesta 409 y la 201 de `POST /api/asignaciones/persona/:rut/clientes`.

1) Snippet Axios / TypeScript para `assignClienteToPersona`

```ts
// Tipos auxiliares
type MissingItem = { type: string; label: string; required: boolean };
type AssignPayload = { cliente_id: number; rut: string; required_count: number; provided_count: number; missing: MissingItem[] };

export async function assignClienteToPersona(rut: string, cliente_id: number) {
  try {
    const res = await axios.post(`/api/asignaciones/persona/${encodeURIComponent(rut)}/clientes`, { cliente_id });
    // Éxito: devuelve payload consistente
    return { ok: true, payload: res.data.payload as AssignPayload };
  } catch (err: any) {
    // Manejo de 409 (prerrequisitos no cumplidos)
    if (err.response?.status === 409) {
      const body = err.response.data;
      const payload: AssignPayload | undefined = body.payload;
      const message: string = body.message || 'No es posible asignar el cliente por requisitos no cumplidos.';

      // Construir una cadena legible para mostrar en modal
      const missing = payload?.missing ?? [];
      const listText = missing.length > 0
        ? missing.map(m => `• ${m.label} ${m.required ? '(obligatorio)' : ''}`).join('\n')
        : 'No hay documentos listados.';

      const userMessage = `${message}\n\nDocumentos faltantes (${payload?.provided_count ?? 0} presentes de ${payload?.required_count ?? missing.length} requeridos):\n${listText}`;

      return { ok: false, code: body.code, message: userMessage, payload };
    }

    // Otros errores: relanzar para manejo superior
    throw err;
  }
}
```

2) Snippet de uso (pre-validación + asignación)

```ts
export async function preValidateAndAssign(rut: string, cliente_id: number) {
  // Pre-validate: evita hacer asignación si ya faltan documentos
  const normalized = rut.replace(/\./g, '');
  const matchRes = await axios.post(`/api/prerrequisitos/clientes/${cliente_id}/match`, { ruts: [rut, normalized] });
  const data = matchRes.data.data as any[];
  const info = data.find(x => x.rut.replace(/\./g,'') === normalized);
  if (info && info.faltantes && info.faltantes.length > 0) {
    // Mapear faltantes a labels si es necesario
    const missing = info.faltantes.map((f: string) => ({ type: f, label: f, required: true }));
    return { ok: false, reason: 'faltantes', details: { provided_count: info.provided_count, required_count: info.required_count, missing } };
  }

  // Intentar asignar
  return assignClienteToPersona(rut, cliente_id);
}
```

3) Componente React/TSX de modal de ejemplo (puedes adaptarlo a tu librería de UI)

```tsx
import React from 'react';

type MissingItem = { type: string; label: string; required: boolean };

interface AssignValidationModalProps {
  open: boolean;
  title?: string;
  message: string;
  missing: MissingItem[];
  onClose: () => void;
  onUpload: () => void; // ir al uploader
  onForce?: () => void; // opcional: forzar asignación
}

export const AssignValidationModal: React.FC<AssignValidationModalProps> = ({ open, title = 'No se puede asignar el cliente', message, missing, onClose, onUpload, onForce }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <ul>
          {missing.map(m => (
            <li key={m.type}>{m.label} {m.required ? '(obligatorio)' : ''}</li>
          ))}
        </ul>
        <div className="actions">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={onUpload}>Ir a subir documentos</button>
          {onForce && <button onClick={onForce}>Forzar asignación</button>}
        </div>
      </div>
    </div>
  );
};
```

4) Instrucciones rápidas para integrar en `api.ts`

- Reemplaza la lógica actual en `assignClienteToPersona` por el snippet anterior. Asegúrate de importar `axios` y exportar la función.
- En el componente de la pantalla donde llamas a la asignación (`ServiciosPage.tsx`), usa el resultado para abrir `AssignValidationModal` cuando `ok === false` y mostrar `result.payload.missing`.

---
Archivo: `docs/FRONTEND_ASSIGNMENTS_SNIPPETS.md` creado con ejemplos listos para pegar.
