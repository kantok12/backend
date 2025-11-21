# Frontend — Correcciones necesarias para Prerrequisitos

Este documento contiene instrucciones prácticas y ejemplos para corregir el funcionamiento del flujo de prerrequisitos en el frontend, basadas en la API actual del backend.

Objetivo
- Que la UI muestre correctamente los prerrequisitos, documentos y faltantes para un trabajador puntual o para todos los trabajadores de un cliente.

Resumen del problema detectado
- El frontend estaba llamando varias rutas GET que devolvieron 404 en tu entorno (por ejemplo, `GET /api/prerrequisitos/cliente/28` y `GET /api/documentos/persona/:rut`).
- El endpoint que sí responde y devuelve datos fiables para un trabajador puntual es el POST `POST /api/prerrequisitos/clientes/:clienteId/match` (envía `ruts` en el body). Por eso la corrección principal es usar ese endpoint al evaluar RUTs puntuales.

Recomendaciones principales (qué cambiar en el frontend)

1) Priorizar `POST /api/prerrequisitos/clientes/:clienteId/match` para evaluar RUT puntual
- Motivo: devuelve `required_count`, `provided_count`, `faltantes`, `documentos` y no depende de que `personal_clientes` esté poblada.
- Uso: enviar body JSON con campo `ruts` (array de strings). El endpoint acepta variantes del rut (con o sin puntos) — puedes enviar ambas para mayor robustez.

Ejemplo (fetch / JS):
```js
const body = { ruts: ['20.011.078-1'] };
const res = await fetch(`/api/prerrequisitos/clientes/28/match`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(body)
});
const json = await res.json();
// json.data -> array with one object per rut
```

2) Si necesitas evaluar lista de todos los trabajadores de un cliente
- Preferible flujo backend-driven: usar `GET /api/prerrequisitos/cliente/:clienteId` para obtener prerrequisitos y `GET /api/personal-por-cliente` o el endpoint que exponga las personas asociadas al cliente.
- Si `GET personal_por_cliente` devuelve vacío, puedes:
  - a) poblar `mantenimiento.personal_clientes` (DB) o
  - b) hacer que el frontend reciba y envíe la lista de RUTs manualmente a `POST /match`.

3) Normalizar RUTs en el frontend antes de enviar
- Normaliza a dos formas: con puntos y sin puntos. Ejemplo:
```js
function normalizeRut(rut) {
  return rut.replace(/\./g, '').trim();
}
```
- Recomendación: enviar ambas variantes en `ruts` cuando no estés seguro del formato en BD: `['20.011.078-1', '20011078-1']`.

4) Manejar respuestas y campos clave
- `required_count`: número de tipos de documento requeridos.
- `provided_count`: número de tipos requeridos que el trabajador ya cumplió (cuenta por tipo normalizado).
- `estado_acreditacion`: `completo` / `parcial` / `pendiente` / `some` / `none` (mapear a etiquetas UI claras).
- `faltantes`: array de `tipo_normalizado` faltantes (usar para mostrar badges o botones de acción).
- `documentos`: lista con metadatos (id, tipo_original, tipo_normalizado, fecha_subida, fecha_vencimiento, vencido).

5) UI: mostrar documentos que provengan del `match` antes que llamar al GET /documentos/persona
- La llamada `GET /api/documentos/persona/:rut` puede devolver 404 si la persona no está en `personal_disponible` o no está asociada correctamente; usa los `documentos` que el POST devuelve cuando estés mostrando resultados inmediatos.
- Si el usuario solicita ver la carpeta/archivo real, entonces hacer `GET /api/documentos/:id` o `/api/documentos/:id/descargar`.

6) Gestión de estados y feedback
- Si `POST /match` devuelve datos: renderiza inmediatamente.
- Si `POST /match` devuelve vacío o error 404: mostrar mensaje claro "No hay prerrequisitos o persona no vinculada al cliente" y proporcionar acción alternativa (ingresar RUT manualmente o solicitar asociación en Admin).
- Mostrar badges para documentos vencidos (`vencido === true`) y por vencer (fecha_vencimiento en <30 días) usando el campo `fecha_vencimiento`.

7) Errores y reintentos
- Errores 400: validar payload (asegúrate `ruts` es array).
- Errores 401: interceptor de auth ya debería limpiar token y redirigir a login.
- Errores 403/404: mostrar mensajes diferenciados.

Ejemplos concretos de fetch con manejo de errores
```js
async function matchPrerrequisitos(clienteId, ruts, token) {
  const res = await fetch(`/api/prerrequisitos/clientes/${clienteId}/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ ruts })
  });

  if (res.status === 400) throw new Error('Bad request: revisar body');
  if (res.status === 401) { /* redirect to login */ }
  if (res.status === 404) return { data: [] }; // fallback

  const json = await res.json();
  return json.data || [];
}
```

8) Pruebas locales (instrucciones rápidas para developers/frontend)
- Ejecutar script de verificación creado en el backend (desde la raíz del repo):
```powershell
pwsh .\scripts\check_prereq_for_rut.ps1 -ClientId 28 -Rut '20.011.078-1' -BaseUrl 'http://localhost:3001'
```
- Esto guarda salida en `scripts/check_prereq_for_rut_output.txt` y prueba:
  - GET `/api/prerrequisitos/cliente/28`
  - POST `/api/prerrequisitos/clientes/28/match` con `ruts` (incluye variantes)
  - GET `/api/documentos/persona/:rut` (con y sin puntos)
  - GET `/api/prerrequisitos/clientes/28/cumplen`

9) Si la UI quiere mostrar lista "Documentos totales" para un cliente
- Opciones:
  - A: pedir al backend un endpoint que devuelva `count` y `listado` de documentos por cliente (más eficiente). Pide al backend exponer `/api/prerrequisitos/clientes/:clienteId/documentos-summary`.
  - B: front hace 2 pasos: obtiene lista de RUTs (desde `personal_clientes`) y luego llama `POST /match` en batch (pero requiere que `personal_clientes` esté poblada).

10) Acciones administrativas (cuando la data en BD está incompleta)
- Si `personal_clientes` está vacío para un cliente y quieres que la UI muestre automáticamente los trabajadores, pide a backend o DBA insertar las relaciones. Ejemplo SQL:
```sql
INSERT INTO mantenimiento.personal_clientes (cliente_id, rut)
VALUES (28, '20.011.078-1');
```

Checklist de QA para el frontend (quick)
- [ ] `match` devuelven datos correctos para RUTs de prueba.
- [ ] UI muestra `provided_count` / `required_count` y `faltantes` correctamente.
- [ ] Se manejan documentos vencidos con badge y acción.
- [ ] Si `match` falla con 404, UI sugiere ingresar RUT manualmente o contactar Admin.
- [ ] Tests automáticos: crear test e2e que invoque `POST /match` (mock o entorno de integración).

Notas finales y recomendaciones
- Evita depender exclusivamente de `GET /api/documentos/persona/:rut` para el flujo de evaluación — usa `POST /match` como fuente principal para evaluación puntual.
- Mantén la normalización de RUT en frontend y envía ambas variantes si no estás seguro del formato en BD.
- Si quieres, puedo generar un snippet React (hook + componente) que implemente `match`, muestre resultados y estados de error/loader.

---

Archivo creado: `docs/FRONTEND_PREREQUISITOS_FIXES.md`

¿Quieres que también genere un componente React de ejemplo (hook + UI) que use `POST /match` y muestre los resultados?