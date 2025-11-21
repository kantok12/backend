# Frontend — Requisitos para Prerrequisitos

Este documento describe todo lo que el frontend necesita saber e implementar para la funcionalidad de "prerrequisitos" (solo prerrequisitos). Incluye rutas API, formatos de petición/respuesta, comportamiento de UI, estados, validaciones y recomendaciones de UX.

**Contexto**
- Backend: Node/Express con endpoints relacionados a prerrequisitos.
- Autenticación: la mayoría de endpoints requieren token Bearer en `Authorization: Bearer <token>`.

---

## Endpoints principales (contracto)
- Obtener prerrequisitos de un cliente
  - Método: `GET`
  - URL: `/api/prerrequisitos/cliente/:clienteId`
  - Autorización: sí (Bearer)
  - Parámetros:
    - `:clienteId` (path) — id numérico del cliente
  - Respuesta esperada (200): JSON con lista de prerrequisitos. Ejemplo:
    {
      "cliente_id": 1,
      "prerrequisitos": [
        { "id": 10, "nombre": "Carnet de Identidad", "tipo_normalizado": "carnet_identidad", "dias_duracion": 365, "requerido": true },
        { "id": 11, "nombre": "Contrato de trabajo", "tipo_normalizado": "contrato_trabajo", "requerido": true }
      ]
    }

- Calcular/matchear prerrequisitos para un cliente (batch)
  - Método: `POST`
  - URL: `/api/prerrequisitos/clientes/:clienteId/match`
  - Autorización: sí (Bearer)
  - Body: JSON
    - `ruts`: array de RUTs (strings) a evaluar. Ejemplo: `{ "ruts": ["12.345.678-9", "16924504-5"] }`
    - Opciones (opcional): `{ "includeGlobal": true }` — si se usan prerrequisitos globales además de los del cliente
  - Respuesta esperada (200): lista de resultados por RUT. Forma (ejemplo):
    {
      "cliente_id": 1,
      "results": [
        {
          "rut": "16924504-5",
          "required_count": 2,
          "provided_count": 1,
          "estado_acreditacion": "parcial", // o "completo", "pendiente"
          "faltantes": ["carnet_identidad"],
          "documentos": [
            {
              "id": 141,
              "tipo_original": "Carnet de identidad (foto)",
              "tipo_normalizado": "carnet_identidad",
              "fecha_subida": "2025-10-01T12:00:00Z",
              "fecha_vencimiento": "2026-10-01",
              "vencido": false
            }
          ]
        }
      ]
    }
  - Notas importantes sobre campos:
    - `required_count`: número de tipos de prerequisito requeridos para el cliente (ej., carnet + contrato => 2).
    - `provided_count`: número de tipos requeridos que el usuario ya cumplió (se cuenta por tipo normalizado, no por cantidad de archivos).
    - `estado_acreditacion`: resumen de estado: `completo` (provided_count == required_count), `parcial` (0 < provided_count < required_count), `pendiente` (provided_count == 0).
    - `faltantes`: array de `tipo_normalizado` que faltan.
    - `documentos`: array de documentos asociados a ese rut (puede ser vacío). Ver formato arriba.

- Consultar personas que cumplen (opcional para UI de filtro)
  - Método: `GET`
  - URL: `/api/prerrequisitos/clientes/:clienteId/cumplen`
  - Retorna lista de personas que actualmente cumplen todos los prerrequisitos del cliente.

---

## Reglas de autorización y errores
- Todos los endpoints requieren `Authorization: Bearer <token>` salvo que el backend documente lo contrario.
- Errores comunes:
  - `401 Unauthorized` — token faltante o invalidado.
  - `403 Forbidden` — token válido pero usuario no tiene permiso para ver datos del cliente.
  - `400 Bad Request` — body mal formado (por ejemplo `ruts` no es array).
  - `500 Internal Server Error` — mostrar mensaje genérico y ofrecer reintento.

Frontend: mostrar mensajes claros según códigos (toast / banner). Para 401 redirigir a login; para 403 mostrar mensaje de permiso insuficiente.

---

## Forma de consumir y consideraciones UI
1. Pantalla principal "Prerrequisitos por cliente"
   - Selección de cliente (dropdown o búsqueda).
   - Al seleccionar cliente, llamar a `GET /api/prerrequisitos/cliente/:id` y renderizar la lista de prerequisitos:
     - Nombre, tipo_normalizado, dias_duracion (si aplica), nota si es obligatorio.
   - Mostrar botón "Evaluar RUT(s)" que abre formulario para ingresar uno o varios RUTs.

2. Evaluación individual o batch
   - Form: input (un RUT) + opción para bulk (textarea o CSV upload) con validación básica de RUT.
   - Al enviar: llamar `POST /api/prerrequisitos/clientes/:id/match` con `ruts`.
   - Mostrar resultados por RUT en tarjetas o tabla con columnas:
     - RUT, Estado (completo/parcial/pendiente), required_count, provided_count, Ver documentos (dropdown), Acciones (solicitar documento, marcar como recibido).
   - Ofrecer filtro: mostrar solo los que faltan (`provided_count < required_count`), solo completos, ordenar por `faltantes.length`.

3. Detalle RUT / Documentos
   - Al expandir/ver documentos, mostrar los objetos `documentos` retornados por la API:
     - Mostrar `tipo_original` y `tipo_normalizado`, `fecha_subida`, `fecha_vencimiento`, y un badge si `vencido === true`.
     - Si existe `ruta_archivo` o `download_url` (no provisto por match), opcionalmente llamar `GET /api/documentos/persona/:rut` para obtener archivos con `ruta_archivo` y enlaces de descarga.
   - Botones: "Ver archivo" (descarga), "Marcar como enviado" (si existe endpoint que permita asociar), "Solicitar actualización" (si integra notificaciones).

4. UX y estados visuales
   - Loading skeletons al llamar endpoints.
   - Estados vacíos: mensaje claro "No se encontraron prerrequisitos" o "No hay documentos para este RUT".
   - Indicadores de prioridad: usar colores para `vencido` (rojo), `por vencer` (naranja, p. ej. si vence en <30 días), `válido` (verde).
   - Accesibilidad: etiquetas ARIA en filas y botones, leyendas para badges.

---

## Validaciones y normalizaciones en frontend
- RUT: validar formato mínimo (número + guion + dígito verificador). Normalizar puntos y guion al enviar.
- No suponer que `documentos` contenga `download_url`; si falta, llamar al endpoint de documentos para el rut.
- Manejar zonas horarias para `fecha_vencimiento` y `fecha_subida` (mostrar en local del usuario).

---

## Caching y rendimiento
- Cachear la respuesta de `GET /api/prerrequisitos/cliente/:id` mientras el cliente no cambie (p. ej. 5–10 minutos) para evitar recargas frecuentes.
- Para `POST /match` (batch), evitar reenvíos simultáneos. Mostrar barra de progreso si se envía gran cantidad de RUTs.
- Paginación / límites: si el backend limita tamaño de `ruts`, detectar 413/400 y auto-split en batches.

---

## Manejo de errores y reintentos
- Reintentos automáticos: reintentar 1 vez en fallo de red; para 500 no reintentar automáticamente sin intervención.
- Mostrar errores por RUT si la respuesta los incluye (por ejemplo, si un RUT no existe en la base).

---

## Formato esperado de datos — resumen (ejemplo claro)
- Request (match):
  ```json
  { "ruts": ["16924504-5", "12.345.678-9"], "includeGlobal": true }
  ```
- Response (match):
  ```json
  {
    "cliente_id": 1,
    "results": [
      {
        "rut": "16924504-5",
        "required_count": 2,
        "provided_count": 1,
        "estado_acreditacion": "parcial",
        "faltantes": ["carnet_identidad"],
        "documentos": [
          {
            "id": 141,
            "tipo_original": "Carnet de identidad (foto)",
            "tipo_normalizado": "carnet_identidad",
            "fecha_subida": "2025-10-01T12:00:00Z",
            "fecha_vencimiento": "2026-10-01",
            "vencido": false
          }
        ]
      }
    ]
  }
  ```

---

## Recomendaciones de implementación (componentes)
- `PrereqClientPage` — pagina principal: carga prerrequisitos del cliente y muestra botones de evaluación.
- `PrereqForm` — formulario para ingreso de RUTs (single / bulk).
- `PrereqResultsTable` — tabla/ tarjetas con resultados por RUT, filtros y acciones.
- `DocumentList` — componente reutilizable para listar `documentos` y enlaces.
- `PrerreqFilters` — filtros para mostrar solo faltantes/completos.

---

## Integración con otras funcionalidades (breve)
- Si necesita archivos, integrar con `GET /api/documentos/persona/:rut`.
- Para notificaciones (solicitar que el trabajador suba docs), coordinar con el equipo backend si usar `POST /api/auditoria/notificaciones` o un servicio centralizado (ver doc de auditoría).

---

## Checklist para QA (verificación antes de pasar a producción)
- [ ] `GET /api/prerrequisitos/cliente/:id` retorna lista correcta.
- [ ] `POST /api/prerrequisitos/clientes/:id/match` acepta array de RUTs y responde por cada RUT.
- [ ] Estados UI: completo/parcial/pendiente renderizados correctamente.
- [ ] Documentos muestran fecha y flag `vencido` correctamente.
- [ ] Manejo de errores: 401 redirige, 403 muestra mensaje, 400 muestra validación.
- [ ] Caching y batching implementados para grandes listas.

---

## Preguntas pendientes para backend (si aplica)
- ¿El campo `documentos[*].download_url` estará disponible en `match` o debo llamar `GET /api/documentos/persona/:rut`?
- ¿El `required_count` incluye prerrequisitos globales cuando `includeGlobal` está activo?
- ¿Cuál es el tamaño máximo de `ruts` para `POST /match`? ¿hay paginación recomendada?

---

## Historias de usuario (ejemplos rápidos)
- Como operador, quiero ingresar varios RUTs y ver al instante quién cumple los prerrequisitos para enviar al cliente.
- Como asistente, quiero filtrar solo los trabajadores que faltan documentos, para solicitarles actualizaciones.

---

Archivo creado: `docs/FRONTEND_PREREQUISITOS.md`

Si quieres, puedo ahora:
- implementar mock components React con ejemplos usando estos contratos,
- o crear ejemplos de requests curl / Postman colección.
