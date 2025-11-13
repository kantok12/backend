## Cambio: división de archivos locales por carpeta y contrato de subida para frontend

Este documento explica dos cambios importantes para la integración frontend:

- La respuesta de `GET /api/documentos/persona/:rut` ahora incluye, además del array legacy `documentos_locales`, una estructura `documentos_locales_split` que separa archivos por subcarpeta (`documentos` y `cursos_certificaciones`).
- El backend acepta un nombre objetivo proporcionado por el frontend cuando se sube o se registra un documento: `nombre_archivo_destino`. El servidor aplica sanitización y resolución de colisiones antes de guardar.

---

## Endpoints afectados (resumen)

- GET /api/documentos/persona/:rut
  - Respuesta: incluye `documentos_locales` (compatibilidad) y `documentos_locales_split` (preferido).

- POST /api/documentos  (upload multipart/form-data)
  - Acepta archivo(s) y opcionalmente `nombre_archivo_destino` por archivo.
  - El backend devuelve el nombre final guardado en el registro DB.

- POST /api/documentos/registrar-existente
  - Acepta referencia a archivo en Drive/servidor y opcional `nombre_archivo_destino` para renombrar en el proceso de registro.

---

## GET /api/documentos/persona/:rut — respuesta (esquema relevante)

200 OK

```
{
  "success": true,
  "data": {
    "persona": { "rut": "string", "nombre": "string", "cargo": "string" },
    "documentos": [ /* documentos registrados en BD */ ],
    "documentos_locales": [ /* legacy: array plano */ ],
    "documentos_locales_split": {
      "documentos": [
        { "nombre_archivo": "string", "ruta_local": "string", "carpeta": "documentos" }
      ],
      "cursos_certificaciones": [
        { "nombre_archivo": "string", "ruta_local": "string", "carpeta": "cursos_certificaciones" }
      ]
    }
  }
}
```

Notas importantes:
- `documentos_locales_split` es preferido por el frontend para renderizar dos secciones distintas.
- `ruta_local` contiene la ruta absoluta en la unidad en servidor (ej. `G:\\...`). No intentes descargar directamente con esa ruta desde el navegador. En su lugar, usa un endpoint de descarga seguro en backend.

---

## Contrato de subida: `POST /api/documentos` (multipart/form-data)

Objetivo: permitir que el frontend proponga el nombre del archivo que desea ver finalmente almacenado.

Requisitos y comportamiento del backend:
- Campo opcional: `nombre_archivo_destino` — puede enviarse una vez por cada archivo subido. Si hay múltiples archivos, enviar múltiples campos con el mismo nombre (o un array según el cliente HTTP) asociando el orden/nombre al archivo correspondiente.
- Si `nombre_archivo_destino` no se envía, el servidor usará el nombre original del archivo subido.
- El servidor:
  - Conserva la extensión original del archivo (por ejemplo, `.pdf`, `.jpg`).
  - Sanitiza el nombre recibido (quita caracteres inseguros, normaliza acentos, reemplaza espacios por guiones bajos, limita longitud).
  - Resuelve colisiones: si el nombre final ya existe en el destino, el servidor añade un sufijo incremental `-1`, `-2`, etc. (ej. `mi_doc.pdf`, `mi_doc-1.pdf`).
  - Inserta el registro en BD con `nombre_archivo` y `ruta_archivo` actualizados y responde con el nombre final.

Ejemplo con FormData (frontend)

```javascript
const form = new FormData();
// file1 -> queremos que se guarde como 'certificado_seguridad.pdf'
form.append('files', file1, file1.name);
form.append('nombre_archivo_destino', 'certificado_seguridad.pdf');

// file2 -> dejamos que el servidor elija nombre (sin campo correspondiente)
form.append('files', file2, file2.name);

fetch('/api/documentos', { method: 'POST', body: form })
  .then(r => r.json())
  .then(console.log);
```

Respuesta esperada (parcial)

```
{
  "success": true,
  "data": [
    { "originalName": "upload.pdf", "finalName": "certificado_seguridad.pdf", "dbId": 123 },
    { "originalName": "photo.jpg", "finalName": "photo.jpg", "dbId": 124 }
  ]
}
```

Errores comunes
- 400 Bad Request: archivo faltante o tipo inválido.
- 422 Unprocessable Entity: `nombre_archivo_destino` contiene solo extensión o es inválido después de sanitización.
- 500 Internal Server Error: problema en servidor (subida/IO/DB).

---

## Registrar existente: `POST /api/documentos/registrar-existente`

Uso: cuando ya existe un archivo (ej. en Drive) y deseas crear un registro en la BD copiando/registrando con un nombre deseado.

Payload (JSON) ejemplo

```
{
  "ruta_drive": "drive/folder/archivo123.pdf",
  "rut": "12.345.678-9",
  "nombre_archivo_destino": "mi_certificado_seguridad.pdf" // opcional
}
```

Comportamiento: si `nombre_archivo_destino` se entrega, el servidor aplicará las mismas reglas de sanitización y colisión descritas para el upload.

---

## Reglas de sanitización y colisiones (detalles para frontend)

- El servidor preserva la extensión del archivo. Si frontend envía `certificado` sin extensión, el servidor añadirá la extensión del archivo original.
- Sanitización básica aplicada por backend:
  - Eliminar caracteres no imprimibles y peligrosos (\\/, ?, %, #, :, <, >, |, etc.).
  - Reemplazar espacios por guiones bajos `_` (implementación actual).
  - Normalizar acentos y diacríticos (ej. `á` -> `a`).
  - Limitar nombre base a X caracteres (ej. 100) y mantener la extensión completa.
- Colisiones: si `nombre_archivo_destino` ya existe en la carpeta destino, backend renombra agregando sufijo `-1`, `-2`, ... hasta encontrar nombre libre.

Recomendación frontend: mostrar al usuario el `finalName` devuelto por el backend como confirmación; no confiar en que `nombre_archivo_destino` será 1:1 el guardado final.

---

## Manejo en la UI (sugerencias)

1) Antes de subir: permitir al usuario especificar el nombre que desea para el archivo.
2) Mostrar una vista previa del nombre propuesto (no definitivo): "Nombre solicitado: X".
3) Después del upload (respuesta del servidor): mostrar el `finalName` devuelto por el backend y ofrecer opción para renombrar de nuevo (si procede) o confirmar.
4) Para archivos locales (de `documentos_locales_split`): mostrar botón "Solicitar registro" que abra un modal para completar metadatos y, opcionalmente, `nombre_archivo_destino`.

---

## Seguridad y privacidad

- No uses `ruta_local` para construir enlaces de descarga desde el cliente. Pide al backend un endpoint seguro que valide permisos y entregue el archivo con `res.download()`.
- Si necesitas, podemos cambiar `ruta_local` por un `downloadToken` o por `path_relative` para no exponer rutas absolutas.

---

## Errores y códigos de respuesta (resumen)

- 200 OK — operación correcta, ver campo `data`.
- 400 Bad Request — parámetros inválidos.
- 401/403 — autenticación/permiso requerido.
- 422 — datos semánticamente inválidos (por ejemplo `nombre_archivo_destino` inválido después de sanitización).
- 500 — error del servidor.

---

## Posibles mejoras (implementables a pedido)

- Endpoints dedicados para cada carpeta:
  - `GET /api/documentos/persona/:rut/cursos` — solo `cursos_certificaciones`.
  - `GET /api/documentos/persona/:rut/documentos` — solo `documentos`.
- Añadir metadatos locales: `size` (bytes), `mtime` (fecha de modificación) en la respuesta.
- Endpoint seguro de descarga para entradas locales no registradas en BD.

Si quieres, implemento cualquiera de estas mejoras y adapto ejemplos de frontend.
## Cambio: división de archivos locales por carpeta para el endpoint `GET /api/documentos/persona/:rut`

Resumen
- Se añadió una nueva propiedad en la respuesta de `GET /api/documentos/persona/:rut` llamada `documentos_locales_split` que separa los archivos encontrados en la unidad compartida G: en dos listas distintas:
  - `documentos` — archivos ubicados en la subcarpeta `documentos`.
  - `cursos_certificaciones` — archivos ubicados en la subcarpeta `cursos_certificaciones`.

Motivación
- El frontend necesita renderizar de forma separada los documentos generales y los certificados/cursos. Antes la API devolvía un único array `documentos_locales` (plano). Para evitar trabajo adicional de filtrado y reducir la probabilidad de errores en cliente, la API ahora devuelve además `documentos_locales_split` con la estructura explícita.

Compatibilidad
- Se mantiene `documentos_locales` (array plano) por compatibilidad hacia atrás.
- `documentos_locales_split` es adición no disruptiva; los clientes nuevos/actualizados deben preferir `documentos_locales_split`.

Ruta afectada
- GET /api/documentos/persona/:rut

Dónde se encuentra
- Código: `routes/documentos.js`

Estructura de la respuesta (esquema relevante)

200 OK

{
  "success": true,
  "data": {
    "persona": {
      "rut": "string",
      "nombre": "string",
      "cargo": "string",
      "zona_geografica": "string"
    },
    "documentos": [ /* documentos registrados en BD (array de objetos) */ ],
    "documentos_locales": [ /* legacy: array plano con archivos locales */ ],
    "documentos_locales_split": {
      "documentos": [
        {
          "nombre_archivo": "string",
          "ruta_local": "string", // ruta absoluta en G:\... (ver nota de privacidad)
          "carpeta": "documentos"
        }
      ],
      "cursos_certificaciones": [
        {
          "nombre_archivo": "string",
          "ruta_local": "string",
          "carpeta": "cursos_certificaciones"
        }
      ]
    },
    "pagination": { /* metadatos para la parte 'documentos' que viene de BD */ }
  }
}

Ejemplo real simplificado

{
  "success": true,
  "data": {
    "persona": { "rut": "12.345.678-9", "nombre": "Juan Pérez", "cargo": "Técnico", "zona_geografica": "Santiago" },
    "documentos": [ /* ... */ ],
    "documentos_locales": [
      { "nombre_archivo": "cv.pdf", "ruta_local": "G:\\Unidades compartidas\\Unidad de Apoyo\\Personal\\Juan Perez - 12.345.678-9\\documentos\\cv.pdf", "carpeta": "documentos" },
      { "nombre_archivo": "curso_x.pdf", "ruta_local": "G:\\...\\cursos_certificaciones\\curso_x.pdf", "carpeta": "cursos_certificaciones" }
    ],
    "documentos_locales_split": {
      "documentos": [ { "nombre_archivo": "cv.pdf", "ruta_local": "G:\\...\\documentos\\cv.pdf", "carpeta": "documentos" } ],
      "cursos_certificaciones": [ { "nombre_archivo": "curso_x.pdf", "ruta_local": "G:\\...\\cursos_certificaciones\\curso_x.pdf", "carpeta": "cursos_certificaciones" } ]
    }
  }
}

Cómo debe procesarlo el frontend (guía)

1) Preferir `documentos_locales_split` si existe
- Accede a `response.data.documentos_locales_split.documentos` y `response.data.documentos_locales_split.cursos_certificaciones`.
- Ejemplo (JavaScript/React):

```javascript
// fetchData es la respuesta JSON obtenida de la API
const split = fetchData.data.documentos_locales_split;
const documentos = (split && split.documentos) || [];
const cursos = (split && split.cursos_certificaciones) || [];

// Render: sección Documentos
// map(documentos, d => <DocumentRow key={d.nombre_archivo} file={d} />)

// Render: sección Cursos/Certificaciones
// map(cursos, c => <CourseRow key={c.nombre_archivo} file={c} />)
```

2) Fallback a `documentos_locales` (compatibilidad)
- Si `documentos_locales_split` no está presente (clientes antiguos), el frontend puede recrear la separación localmente:

```javascript
const legacy = fetchData.data.documentos_locales || [];
const documentos = legacy.filter(x => x.carpeta === 'documentos');
const cursos = legacy.filter(x => x.carpeta === 'cursos_certificaciones');
```

3) No confiar en `ruta_local` para permitir descargas directas sin validación
- Actualmente `ruta_local` contiene la ruta absoluta del archivo en la unidad G:. Por motivos de seguridad y control de acceso, NO se recomienda que el frontend intente hacer una descarga directa usando esa ruta (no funcionará desde un navegador). Las opciones seguras son:
  - Registrar el archivo en la BD y usar el endpoint existente `/api/documentos/:id/descargar` (recomendado), o
  - Implementar un endpoint de descarga en el backend que reciba el path relativo o nombre y sirva el archivo aplicando validaciones/permiso, por ejemplo:
    - `GET /api/documentos/persona/:rut/cursos/download?file=curso_x.pdf` => backend valida que el archivo pertenece al rut y lo envía con `res.download()`.

4) UI/UX sugerida
- Mostrar dos secciones claramente diferenciadas: "Documentos" y "Cursos / Certificaciones".
- Mostrar nombre del archivo, fecha (si puedes obtenerla), tamaño (podemos añadirlo al endpoint si lo necesitas) y botón de "Descargar".
- Para archivos no registrados en BD, mostrar un mensaje aclarando que la descarga requiere registro o permiso (si no implementamos descarga directa todavía).

Notas de seguridad y privacidad
- Evitar exponer rutas absolutas innecesarias a usuarios finales si tu organización lo requiere. Podemos reemplazar `ruta_local` por `path_relative` o por un `download_token` si lo prefieres.
- Asegurar que cualquier endpoint de descarga valide que el usuario tiene permiso para acceder al archivo.

Pruebas rápidas (dev)
- Desde el backend local: `node .\scripts\test-prerrequisitos-cumplen.js` para probar coincidencias.
- Probar la nueva salida del endpoint persona:
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/documentos/persona/12.345.678-9' -Method Get
```

Posibles mejoras (puedo implementar)
- Crear endpoints dedicados:
  - `GET /api/documentos/persona/:rut/cursos` — devuelve únicamente `cursos_certificaciones` (y metadatos opcionales como tamaño/fecha)
  - `GET /api/documentos/persona/:rut/documentos` — devuelve únicamente `documentos`
- Añadir `size` y `mtime` (fecha modificación) para cada archivo local en la respuesta.
- Añadir endpoint seguro de descarga para archivos locales no registrados en BD.

Si quieres que genere el endpoint específico `GET /api/documentos/persona/:rut/cursos` y el endpoint de descarga segura para `cursos_certificaciones`, dime y lo implemento next.
