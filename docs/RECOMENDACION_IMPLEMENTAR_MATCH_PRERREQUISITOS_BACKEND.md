# Recomendación: Implementación del "matching" de prerrequisitos en el backend

Este documento es una recomendación técnica para implementar, mejorar o reemplazar la lógica de matching entre los prerrequisitos (requisitos por cliente + globales) y los documentos que tiene una persona. Debe adaptarse a la estructura, rutas y convenciones de vuestro backend.

---

## Objetivo
Proveer una API backend que, dada una lista de personas (o un solo rut) y un cliente, devuelva si cada persona cumple los prerrequisitos requeridos por ese cliente (incluyendo prerrequisitos globales), cuáles faltan, y un resumen de los documentos vigentes que posee cada persona.

Esto evita hacer N llamadas desde el frontend, centraliza la lógica (normalización, vencimientos, mapeos) y mejora rendimiento y trazabilidad.

---

## Recomendación general (alto nivel)
1. Implementar la normalización y mapeo de tipos de documento en el backend (funciones reutilizables y testeables).
2. Crear un endpoint que acepte uno o más ruts y devuelva el resultado del matching en batch.
3. Asegurar que la lógica tenga en cuenta vigencias (fecha_vencimiento, `dias_duracion` del prerrequisito o `created_at` del documento).
4. Devolver resultados útiles al frontend: `matchesAll: boolean`, `faltantes: string[]`, `documentos`: resumen con `tipo_normalizado`, `vencido: boolean`, `fecha_vencimiento`.

---

## Propuesta de contrato API (sugerencia)
- Endpoint: POST /api/prerequisitos/clientes/:clienteId/match
- Body (ejemplo):
```json
{
  "ruts": ["20011078-1", "11111111-1"],
  "requireAll": true,            // opcional, default true
  "includeGlobal": true          // opcional, default true
}
```
- Response (ejemplo):
```json
{
  "success": true,
  "data": [
    {
      "rut": "20011078-1",
      "matchesAll": false,
      "faltantes": ["certificado_seguridad"],
      "documentos": [
        { "id": 123, "tipo_original": "EPP", "tipo_normalizado": "certificado_seguridad", "vencido": false, "fecha_vencimiento": "2026-02-01" }
      ]
    }
  ]
}
```

---

## Normalización y mapeo (implementación sugerida)
Implementar helpers reutilizables para normalizar y mapear strings:

- normalizeKey(input: string): string
  - transforma a minúsculas
  - quita diacríticos (acentos)
  - elimina caracteres no alfanuméricos (reemplazarlos por espacios)
  - colapsa espacios repetidos

- mapTipo(key: string): string
  - mapea alias comunes a un tipo canonical
  - ejemplo de mapeos:
    - `epp`, `eps`, `implementos de proteccion personal` → `certificado_seguridad`
    - `curso`, `certificacion` → `certificado_curso`
    - `carnet de identidad`, `dni` → `carnet_identidad`
    - `cv` → `cv`
    - `licencia`, `licencia conducir` → `licencia_conducir`

- normalizeTipo(input: string): string
  - aplica `normalizeKey` + `mapTipo`

Sugerencia: mantener la tabla de mapeos en un único sitio (archivo/shared module) para que sea fácil extenderla.

---

## Lógica de vigencia (relevante para "cumple")
- Preferir `fecha_vencimiento` si está en el documento y verificar que sea futura.
- Si el documento no tiene `fecha_vencimiento`, usar `created_at` + `dias_duracion` del prerrequisito (si el prerrequisito define `dias_duracion`).
- Si no hay datos, asumir que el documento es válido (o según la política de la empresa). Esto debe quedar documentado.

---

## Algoritmo (pseudocódigo)

1. Recibir `clienteId` y los `ruts[]`.
2. Cargar prerrequisitos del cliente: `requisitosCliente = loadClientePrerequisitos(clienteId)`.
3. (Opcional) Cargar prerrequisitos globales y mezclarlos según la política: `requisitos = merge(cliente, global)`.
4. Normalizar todos los requisitos: `requiredSet = new Set(requisitos.map(r => normalizeTipo(r.nombre || r.tipo_documento)))`.
5. Para cada `rut`:
   a. Obtener documentos vigentes del rut: `docs = loadDocumentosByRut(rut)`.
   b. Para cada documento en `docs`, calcular `tipo_normalizado = normalizeTipo(doc.tipo_documento || doc.tipo || doc.nombre)`.
   c. Evaluar vigencia: `vencido = checkVencimiento(doc, prerrequisitoMatched)`.
   d. Construir `personSet` = set de `tipo_normalizado` para documentos válidos (no vencidos).
   e. `faltantes = Array.from(requiredSet).filter(r => !personSet.has(r))`.
   f. `matchesAll = faltantes.length === 0`.
   g. Incluir resumen de documentos (id, tipo_original, tipo_normalizado, fecha_vencimiento, vencido).
6. Devolver array con { rut, matchesAll, faltantes, documentos }.

---

## Consideraciones de rendimiento y escalabilidad
- Soportar batches grandes (ej. hasta 200-500 ruts por petición) y paginar si es necesario.
- Indexar la tabla de documentos por `rut`, `tipo_documento` y `fecha_vencimiento`.
- Si el matching se utiliza mucho, considerar materializar/normalizar un resumen por persona (tabla `person_document_summary`) y actualizarla en triggers o jobs asíncronos.

---

## Tests recomendados
- Unit tests para `normalizeKey` y `normalizeTipo` con ejemplos reales (acentos, puntuación, mayúsculas, alias como "EPP", "E.P.P.").
- Unit test para la función que decide vigencia (fecha_vencimiento vs dias_duracion).
- Integration test para POST /prerequisitos/clientes/:clienteId/match con mocks de documentos y prerrequisitos.

---

## Ejemplo de implementación rápida (Node + Express, pseudo)
```ts
// handlers/prerequisitos.ts
import express from 'express';
import { normalizeTipo, loadClientePrerequisitos, loadDocumentosByRut } from './services';
const router = express.Router();

router.post('/clientes/:clienteId/match', async (req, res) => {
  const clienteId = Number(req.params.clienteId);
  const { ruts = [], requireAll = true, includeGlobal = true } = req.body;
  const requisitosCliente = await loadClientePrerequisitos(clienteId, includeGlobal);
  const requiredSet = new Set(requisitosCliente.map(r => normalizeTipo(r.nombre || r.tipo_documento)));

  const results = [];
  for (const rut of ruts) {
    const docs = await loadDocumentosByRut(rut);
    const personDocs = docs.map(d => ({ ...d, tipo_normalizado: normalizeTipo(d.tipo_documento || d.tipo || d.nombre) }));
    const personSet = new Set(personDocs.filter(d => !isVencido(d, requisitosCliente)).map(d => d.tipo_normalizado));
    const faltantes = Array.from(requiredSet).filter(r => !personSet.has(r));
    results.push({ rut, matchesAll: faltantes.length === 0, faltantes, documentos: personDocs });
  }

  res.json({ success: true, data: results });
});

export default router;
```

> Nota: `isVencido` debe implementarse con la lógica de `fecha_vencimiento` y/o `dias_duracion`.

---

## Prompt listo para usar (para un desarrollador o LLM)

A continuación tienes un prompt que puedes pegar en una issue, en un chat con un LLM o compartir con un desarrollador backend. Indica claramente que es una recomendación y que debe adaptarse a la estructura del proyecto.

"""
Contexto:
Tenemos un frontend (React/TypeScript) que necesita filtrar personas por prerrequisitos de un cliente. Actualmente el frontend consulta todos los documentos por persona y hace el matching en el navegador, lo que provoca muchas llamadas HTTP y resultados inconsistentes cuando hay diferencias de acentos o nombres. Queremos mover la lógica de matching al backend para centralizarla y optimizarla.

Tarea (recomendación):
Implementa un endpoint backend `POST /api/prerequisitos/clientes/:clienteId/match` que acepte un array de RUTs y devuelva para cada RUT si cumple los prerrequisitos del cliente (incluyendo globales), qué prerrequisitos faltan y un resumen de documentos válidos. Algunas reglas y expectativas:

- Normalización: aplica una función que convierta strings a minúsculas, quite diacríticos, reemplace caracteres no alfanuméricos por espacios y colapse espacios. Después aplica un mapa de alias (p. ej. 'epp' -> 'certificado_seguridad').
- Vigencias: si el documento tiene `fecha_vencimiento`, úsala; si no, y el prerrequisito tiene `dias_duracion`, calcula vigencia desde `created_at` o `fecha_subida`.
- Parámetros: soportar `requireAll` (boolean) para definir si se necesita cumplir todos los requisitos o no.
- Respuesta: por cada rut devolver: `rut`, `matchesAll`(bool), `faltantes`(array de tipos normalizados), `documentos`(resumen con `id`, `tipo_original`, `tipo_normalizado`, `fecha_vencimiento`, `vencido`).
- Performance: permitir batches (ej. 100-300 ruts por petición). Indexar por `rut` en la tabla de documentos. Considerar precomputar resumen por persona si la carga crece.

Entrega esperada:
- Código del endpoint adaptado al estilo del repo (controllers/services/routers).
- Tests unitarios para normalización y para la función `isVencido`.
- Un ejemplo de request/response en la documentación.

Por favor adapta los nombres de funciones y las rutas a la estructura y convenciones del proyecto. Esto es una recomendación; si en tu stack usas (p. ej.) NestJS, Django o Laravel, implementa la misma lógica siguiendo las guías del framework.
"""

---

## Siguientes pasos sugeridos
- Implementar el endpoint en backend y exponerlo al frontend.
- Cambiar `CalendarioPage` para llamar a este endpoint en vez de iterar `getDocumentosByPersona` por cada persona.
- Añadir tests de integración y un job que valide la coherencia de datos si se hace precomputación.

---

Archivo creado por: petición del equipo de frontend. Adaptar siempre a la estructura del backend.
