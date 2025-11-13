# Instructivo para probar endpoints de documentos y cursos (Frontend)

Este instructivo explica cómo probar desde el frontend (o con fetch/curl) los endpoints principales del backend para subir documentos y cursos, y cómo interpretar la respuesta (el backend devuelve el nombre final del archivo).

> Resumen rápido

- POST `/api/documentos` (multipart/form-data): subir archivos; acepta `nombre_archivo_destino` opcional. El backend sanitiza el nombre, resuelve colisiones y devuelve el nombre final en `data.documentos[].nombre_archivo`.
- POST `/api/documentos/registrar-existente` (JSON): registrar un archivo que ya existe en una ruta accesible por el servidor (p. ej. Google Drive mapeado en G:). Acepta `nombre_archivo_destino` opcional.
- POST `/api/cursos` (multipart/form-data): subir curso con archivo; el backend genera el nombre final y lo devuelve en `data.documento.nombre_archivo`. Actualmente `nombre_archivo_destino` no está soportado para cursos.
- GET `/api/documentos/persona/:rut`: listar documentos y documentos locales (divididos por carpeta).

---

## Requisitos previos

1. El servidor backend debe estar corriendo (ej. `http://localhost:3000`).
2. Desde el frontend dispones de un `File` (por ejemplo desde `<input type="file">`).
3. Para registrar archivos existentes, la ruta `ruta_local` debe ser accesible por el servidor (p. ej. unidad G: mapeada).

---

## A — Subir documento (POST /api/documentos)

Campos principales (multipart/form-data):

- `rut_persona` (string) — ej. `20.011.078-1` o `20011078-1`.
- `nombre_documento` (string) — título del documento.
- `tipo_documento` (string) — p. ej. `certificado_curso`, `diploma`, `otro`, etc.
- `nombre_archivo_destino` (opcional): nombre deseado para el archivo en el servidor.
- `archivo` — el archivo (campo file). Si deseas múltiples archivos, repite el campo.

### Ejemplo (fetch)

```javascript
async function uploadDocumento(file, { rut_persona, nombre_documento, tipo_documento, nombre_archivo_destino }) {
  const form = new FormData();
  form.append('rut_persona', rut_persona);
  form.append('nombre_documento', nombre_documento);
  form.append('tipo_documento', tipo_documento);
  if (nombre_archivo_destino) form.append('nombre_archivo_destino', nombre_archivo_destino);
  form.append('archivo', file, file.name);

  const res = await fetch('http://localhost:3000/api/documentos', {
    method: 'POST',
    body: form
  });
  return res.json();
}
```

### Ejemplo (curl en PowerShell)

```powershell
curl -X POST 'http://localhost:3000/api/documentos' \
  -H @{'Content-Type'='multipart/form-data'} \
  -F "rut_persona=20.011.078-1" \
  -F "nombre_documento=Prueba desde frontend" \
  -F "tipo_documento=certificado_curso" \
  -F "nombre_archivo_destino=mi_nombre_deseado.pdf" \
  -F "archivo=@C:\ruta\a\archivo.pdf"
```

### Respuesta esperada (extracto)

```json
{
  "success": true,
  "data": {
    "persona": { "rut": "20.011.078-1", "nombre": "..." },
    "documentos": [
      {
        "id": 111,
        "nombre_archivo": "mi_nombre_deseado_1762868806530.pdf",
        "nombre_original": "mi_nombre_deseado_1762868806530.pdf",
        "tipo_mime": "application/pdf",
        "tamaño_bytes": 12345,
        "fecha_subida": "2025-11-11T13:46:46.559Z"
      }
    ]
  }
}
```

> Nota: muestra y guarda el valor `data.documentos[0].nombre_archivo` como el nombre definitivo.

---

## B — Registrar archivo existente (POST /api/documentos/registrar-existente)

Este endpoint se usa cuando el archivo ya existe en una ruta accesible por el servidor (p. ej. en Google Drive mapeado). El servidor copiará el archivo a `uploads` y registrará la entrada en la BD.

Payload JSON:

- `rut_persona` (string)
- `nombre_documento` (string)
- `nombre_archivo` (string) — nombre en la ruta origen
- `ruta_local` (string) — ruta completa en servidor/Drive donde está el archivo
- `tipo_documento` (string)
- `nombre_archivo_destino` (opcional)

### Ejemplo (fetch)

```javascript
const payload = {
  rut_persona: '20.011.078-1',
  nombre_documento: 'Prueba registro existente',
  nombre_archivo: 'archivo_en_drive.pdf',
  ruta_local: 'G:\\Unidades compartidas\\Unidad de Apoyo\\Personal\\...\\archivo_en_drive.pdf',
  tipo_documento: 'certificado_curso',
  nombre_archivo_destino: 'mi_nombre_destino.pdf'
};

const res = await fetch('http://localhost:3000/api/documentos/registrar-existente', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
const json = await res.json();
console.log(json);
```

### Respuesta esperada
- Status 201 con `data.documento.nombre_archivo` indicando el nombre final guardado.

---

## C — Subir curso con archivo (POST /api/cursos)

Campos (multipart/form-data): `rut_persona`, `nombre_curso`, `fecha_inicio`, `fecha_fin`, `fecha_vencimiento`, `estado`, `institucion`, `descripcion`, `dias_validez`, y `archivo` (campo file).

```javascript
const form = new FormData();
form.append('rut_persona', '20.320.662-3');
form.append('nombre_curso', 'Primeros Auxilios Básicos ' + Date.now());
form.append('fecha_inicio', '2025-11-01');
form.append('fecha_fin', '2025-11-03');
form.append('fecha_vencimiento', '2026-11-03');
form.append('estado', 'completado');
form.append('archivo', file, file.name);

const res = await fetch('http://localhost:3000/api/cursos', {
  method: 'POST',
  body: form
});
const json = await res.json();
console.log(json);
```

> Nota: actualmente no hay `nombre_archivo_destino` para `/api/cursos`. El backend generará y devolverá `data.documento.nombre_archivo`. `nombre_original` está alineado con ese nombre final.

---

## D — Listar documentos por persona

- GET `/api/documentos/persona/:rut`
- Devuelve `documentos` (BD) y `documentos_locales_split` (archivos en Drive, separados por carpeta `documentos` y `cursos_certificaciones`).

Útil para refrescar la vista después de una subida o registro.

---

## Recomendaciones para el frontend (UX)

1. Siempre confiar en el nombre devuelto por el backend (`data.documentos[n].nombre_archivo` o `data.documento.nombre_archivo`).
2. Mostrar una notificación si el backend ajustó el nombre (sufijo por colisión, sanitización).
3. Manejar correctamente errores 400/404/500 y mostrar mensajes legibles.
4. Usar progreso de subida (Axios o XHR) para archivos grandes.

---

## Casos borde a probar

- Subida de múltiples archivos simultáneos.
- `nombre_archivo_destino` con caracteres inválidos (backend los sanitiza).
- RUT con/ sin puntos (backend normaliza ambos).
- Registrar existente con `ruta_local` en G: (asegúrate que el servidor tenga acceso).
- Intento de crear curso duplicado (el backend puede devolver un mensaje de negocio).

---

## Checklist rápido para QA

- [ ] Backend corriendo en `http://localhost:3000`.
- [ ] Subir archivo con `POST /api/documentos` y confirmar `data.documentos[0].nombre_archivo`.
- [ ] Registrar archivo existente y confirmar `data.documento.nombre_archivo`.
- [ ] Subir curso con `POST /api/cursos` y confirmar `data.documento.nombre_archivo === data.documento.nombre_original`.
- [ ] Hacer `GET /api/documentos/persona/:rut` y verificar lista.

---

## Opciones adicionales

Puedo:

- Crear un pequeño componente React de ejemplo para integrar en tu frontend. (dímelo y lo creo)
- Habilitar `nombre_archivo_destino` para `/api/cursos` si quieres que el frontend pueda fijar el nombre en ese endpoint.

---

**Archivo generado:** `docs/INSTRUCTIVO_PRUEBAS_FRONTEND.md`

Si quieres que lo coloque en otra ruta o cambie el estilo/ejemplos, dime y lo actualizo.
