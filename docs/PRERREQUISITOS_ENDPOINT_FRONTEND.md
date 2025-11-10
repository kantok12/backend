## Endpoint: Obtener personas que cumplen TODOS los prerrequisitos de un cliente

Ruta
- GET /api/prerrequisitos/clientes/:clienteId/cumplen

Descripción corta
- Devuelve la lista de personas (personal disponible) que cumplen todos los prerrequisitos aplicables a un cliente específico. Se consideran prerrequisitos específicos del cliente y (por defecto) los prerrequisitos globales.

Parámetros
- Path
  - `clienteId` (integer) — ID del cliente cuyos prerrequisitos se evalúan.
- Query (opcionales)
  - `includeGlobal` (string) — por defecto se incluyen los prerrequisitos globales. Para excluirlos: `?includeGlobal=false`.
  - `limit` (integer) — número máximo de personas a devolver. Default: `1000`.
  - `offset` (integer) — desplazamiento para paginación. Default: `0`.

Autenticación
- El endpoint responde en la API pública del backend. Si tu entorno exige autenticación/headers, incluye el token o cookie según la política de tu app (ej. `Authorization: Bearer <token>`). El código del backend no fuerza un middleware de autenticación aquí, pero si tu servidor tiene global auth se aplicará.

Comportamiento y reglas importantes (backend)
- Prerrequisitos: se leen desde `mantenimiento.cliente_prerrequisitos`.
  - Si `includeGlobal` es true, se cargan también los prerrequisitos con `cliente_id IS NULL` (globales).
  - Cada prerrequisito tiene: `tipo_documento` (texto libre), `descripcion`, `dias_duracion` (opcional).
- Tipos normalizados: el backend normaliza valores libres (`tipo_documento` o `nombre_documento`) con `lib/tipoDocumento.js` para mapear a tipos canónicos (ej. `certificado_curso`, `licencia_conducir`, `certificado_seguridad`, `otro`, ...).
- Personal candidato: se obtienen registros de `mantenimiento.personal_disponible` filtrando por `estado_id = 1` (personal "activo") y aplicando `limit`/`offset`.
- Documentos: se cargan en batch desde `mantenimiento.documentos` por RUTs de los candidatos.
  - El servicio no asume una columna booleana `activo` en `documentos`. En su lugar aplica reglas de vigencia:
    - Si el documento tiene `fecha_vencimiento`, se considera vencido si `fecha_vencimiento < hoy`.
    - Si no tiene `fecha_vencimiento` pero el prerrequisito define `dias_duracion`, se calcula `fecha_subida + dias_duracion` y se compara con hoy.
    - Si no hay reglas de vigencia, el documento se considera vigente por defecto.

Qué devuelve (schema)
- 200 OK
  {
    "success": true,
    "message": "OK",
    "data": [
      {
        "persona": {
          "rut": "string",
          "nombres": "string",
          "cargo": "string",
          "zona_geografica": "string"
        },
        "documentos": [
          {
            "id": number,
            "tipo_original": "string",         // valor tal como está en la BD
            "tipo_normalizado": "string",      // resultado de normalizeTipo (ej. 'certificado_curso' o 'otro')
            "fecha_vencimiento": "ISO date or null",
            "fecha_subida": "ISO date or null",
            "vencido": boolean
          },
          ...
        ]
      },
      ...
    ]
  }

Notas sobre el contenido de `documentos`
- `tipo_original` viene de `documentos.tipo_documento` o `documentos.nombre_documento`.
- `tipo_normalizado` es el valor por el que se evalúa si el documento satisface un prerrequisito. Si aparece `"otro"` significa que el texto no coincidió con los mapeos conocidos. En ese caso el frontend debería mostrarlo como "tipo no reconocido" y/o ofrecer un paso manual para corregir/marcar.
- `vencido: true` indica que el documento, aun existiendo, no cuenta para satisfacer el prerrequisito por estar vencido.

Comportamiento relativo a los prerrequisitos globales
- Por defecto `includeGlobal=true` (o ausencia del parámetro) => globales incluidos.
- Para ignorar prerrequisitos globales: `?includeGlobal=false`.

Errores comunes
- 500 Internal Server Error: errores de DB o falta de columnas esperadas. Ejemplo histórico: "no existe la columna 'activo'" — el servicio fue actualizado para evitar ese filtro, pero si cambias el esquema del backend revisa las queries en `services/prerrequisitosService.js`.
- 400 Bad Request: no aplica para este GET (la ruta no valida body). Para el endpoint de match por RUTs (POST) sí se validan `ruts`.

Endpoints relacionados (útiles para el frontend)
- POST /api/prerrequisitos/clientes/:clienteId/match
  - Envío: { ruts: ["rut1","rut2"], requireAll: true|false, includeGlobal: true|false }
  - Responde con un objeto por RUT indicando `matchesAll` y `faltantes` (tipos que le faltan) — útil para validar listas cortas o cuando el frontend tiene RUTs seleccionados.
- GET /api/documentos/:id
  - Obtener metadatos de un documento específico.
- GET /api/documentos/:id/descargar  (o /api/documentos/download/:id)
  - Descargar el archivo físico asociado.

Qué debería mostrar el frontend (sugerencia UX)
- Página/Modal: "Personas que cumplen prerrequisitos del cliente X"
  - Filtros: incluir/excluir prerrequisitos globales; zona geográfica; cargo; paginación.
  - Tabla de resultados: columnas (RUT, Nombre, Cargo, Zona, # documentos válidos, acción "Ver documentos").
  - Al expandir/abrir una persona: lista de documentos con `tipo_normalizado`, `tipo_original`, `fecha_vencimiento`, y un badge rojo si `vencido`.
  - Botones: "Descargar" (llama a `/api/documentos/:id/descargar`), "Marcar / Actualizar documento" (navegar a formulario de subir/editar).
  - Si un prerrequisito exige un tipo nuevo, mostrar claramente "Falta: <tipo esperado>" y sugerir la acción: subir documento o indicar por qué está ausente.

Consejos para manejar "tipo_normalizado: 'otro'"
- Mostrar el `tipo_original` al usuario para ayudar a reconocerlo.
- Permitir al admin mapear ese `tipo_original` a un tipo canónico (actualizar `lib/tipoDocumento.js` y/o un registro en la UI que normalice los valores).

Rendimiento y escalado
- El servicio obtiene candidatos (limit/offset) y después carga todos sus documentos en una sola query con `WHERE rut_persona = ANY($1)`. Para limits grandes (miles) considera:
  - Reducir `limit` por página (ej. 200)
  - Añadir un índice en `mantenimiento.documentos(rut_persona, fecha_subida)` si no existe
  - Mover matching a SQL/PL si necesitas mayor velocidad (evitar transferencia grande de rows a Node)

Pruebas y verificación (rápido)
1. Ejecuta el script de prueba end-to-end (desde la raíz del repo):
```powershell
node .\scripts\test-prerrequisitos-cumplen.js
```
2. Para probar matching puntual con RUTs (útil en UI cuando el usuario selecciona RUTs):
```powershell
node .\scripts\test-prerrequisitos-match.js
# o enviar POST desde frontend a /api/prerrequisitos/clientes/:clienteId/match
```

Notas finales
- La lógica de vigencia y normalización está en el backend. El frontend debe interpretar `documentos[].vencido` como indicador definitivo de si ese documento cuenta o no.
- Si el equipo de producto quiere reglas más complejas (prerrequisitos con alternativas, prioridades, o reglas condicionales), lo ideal es modelarlas en `mantenimiento.cliente_prerrequisitos` y ampliar el servicio para soportar `OR` entre tipos o condiciones compuestas.

Si quieres, creo una versión resumida para incluir en el README del frontend (o reduzco a una tarjeta de Confluence). ¿Cuál prefieres?
