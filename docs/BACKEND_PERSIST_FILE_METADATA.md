# Solicitud: Persistir y devolver metadatos de archivos en `documentos`

## Resumen

El frontend necesita que el backend persista y devuelva información de ubicación de los archivos subidos (ej. Google Drive) para poder mostrar y descargar correctamente los documentos desde la UI.

Problema actual: las respuestas de `GET /documentos` y `GET /documentos/persona/:rut` no incluyen campos como `drive_file_id`, `url`, `ruta_archivo` ni `ruta_local`. Por ejemplo, la respuesta para `16924504-5` contiene varios documentos pero ninguno con identificadores o rutas de almacenamiento.

## Campos requeridos (DB + API)

Agregar los siguientes campos en la tabla `documentos` y asegurarse de que la API los devuelva en los endpoints:

- `drive_file_id` (VARCHAR / TEXT): id del archivo en Google Drive u otro proveedor.
- `url` (TEXT): enlace público o `webViewLink` para ver/descargar el archivo si está disponible.
- `ruta_archivo` (TEXT): ruta en el servidor o ubicación relativa en el almacenamiento.
- `nombre_archivo_guardado` (TEXT): nombre del fichero como fue guardado en el storage (opcional, útil para reconstruir rutas).

Campos ya presentes que conviene conservar/asegurar:
- `nombre_archivo` / `nombre_original`
- `tipo_mime`
- `tamaño_bytes`
- `fecha_subida`

## Cambios en la API

- `POST /api/documentos` (upload): después de subir el archivo al storage (Drive, S3, filesystem), el backend debe:
  - persistir `drive_file_id`, `url` y `ruta_archivo` junto con el resto de metadatos.
  - devolver en la respuesta JSON los campos añadidos.

- `GET /api/documentos` y `GET /api/documentos/persona/:rut`: incluir siempre los nuevos campos (`drive_file_id`, `url`, `ruta_archivo`, `nombre_archivo_guardado`) en cada documento.

- (Opcional) `PATCH /api/documentos/:id` o `PUT /api/documentos/:id`: permitir actualizar los campos de ubicación (útil para migraciones o re-procesos manuales).

## SQL - Migración sugerida

Ejemplo para PostgreSQL / MySQL (ajustar tipos según DB):

```sql
ALTER TABLE documentos
  ADD COLUMN drive_file_id VARCHAR(255),
  ADD COLUMN url TEXT,
  ADD COLUMN ruta_archivo TEXT,
  ADD COLUMN nombre_archivo_guardado TEXT;
```

Para añadir índices de búsqueda (opcional):

```sql
CREATE INDEX idx_documentos_drive_file_id ON documentos(drive_file_id);
```

## Script de actualización (ejemplo) para documentos existentes

Si ya existen archivos en su storage y solo falta persistir los IDs/rutas, usar un script que recorra los registros y actualice la tabla. Ejemplo SQL directo (ejemplo genérico):

```sql
UPDATE documentos
SET drive_file_id = 'ID_DE_DRIVE',
    url = 'https://drive.google.com/file/d/ID_DE_DRIVE/view',
    ruta_archivo = '/storage/documents/16924504-5/archivo.pdf',
    nombre_archivo_guardado = 'archivo-guardado.pdf'
WHERE id = 123;
```

## Ejemplo Node.js (Google Drive) - guardar metadata después de subir

Este snippet muestra el flujo: subir a Drive → obtener `id` y `webViewLink` → guardar en DB vía función `saveDocumentMetadata` (ajustar según stack).

```js
const { google } = require('googleapis');
const drive = google.drive({ version: 'v3', auth });

async function uploadToDrive(fileStream, fileName, mimeType) {
  const res = await drive.files.create({
    requestBody: { name: fileName, mimeType },
    media: { body: fileStream }
  });
  const fileId = res.data.id;

  // Obtener enlaces de vista/descarga (puede requerir permisos o publish)
  const meta = await drive.files.get({ fileId, fields: 'id, name, webViewLink, webContentLink' });

  return {
    drive_file_id: meta.data.id,
    url: meta.data.webViewLink || meta.data.webContentLink || null,
    nombre_archivo_guardado: meta.data.name
  };
}

async function handleUpload(req, res) {
  // lógica para recibir archivo y obtener stream
  const { fileStream, originalName, mimeType } = req; // ejemplar

  const driveMeta = await uploadToDrive(fileStream, originalName, mimeType);

  // guardar en la tabla documentos
  await saveDocumentMetadata({
    nombre_original: originalName,
    nombre_archivo: originalName,
    tipo_mime: mimeType,
    tamaño_bytes: /* size */ 0,
    drive_file_id: driveMeta.drive_file_id,
    url: driveMeta.url,
    ruta_archivo: `/drive/${driveMeta.drive_file_id}`,
    nombre_archivo_guardado: driveMeta.nombre_archivo_guardado
  });

  res.json({ success: true, data: { /* doc object including drive fields */ } });
}
```

## Ejemplo de endpoint para actualizar solo metadata (PATCH)

- Endpoint sugerido: `PATCH /api/documentos/:id` (body: `{ drive_file_id, url, ruta_archivo }`)

Ejemplo `curl`:

```bash
curl -X PATCH "http://localhost:3000/api/documentos/123" \
  -H "Content-Type: application/json" \
  -d '{ "drive_file_id": "ID123", "url": "https://...", "ruta_archivo": "/drive/ID123" }'
```

Ejemplo PowerShell:

```powershell
Invoke-RestMethod -Method Patch -Uri 'http://localhost:3000/api/documentos/123' -Body (@{ drive_file_id='ID123'; url='https://...' ; ruta_archivo='/drive/ID123' } | ConvertTo-Json) -ContentType 'application/json'
```

## Checklist para implementación (para el equipo backend)

- [ ] Añadir columnas en la DB y ejecutar migración.
- [ ] Modificar `POST /api/documentos` para persistir metadata tras subir al storage.
- [ ] Asegurar que `GET /api/documentos` y `GET /api/documentos/persona/:rut` devuelvan los nuevos campos.
- [ ] Implementar `PATCH /api/documentos/:id` para actualizaciones manuales/migraciones.
- [ ] Proveer pruebas e2e o scripts de migración para documentos ya existentes.

## Notas adicionales

- Si se usa Google Drive y los archivos no son públicos, devolver `webViewLink` puede requerir ajustar permisos o usar un endpoint backend que sirva el archivo por streaming.
- Si se usa almacenamiento local o S3, adaptar `ruta_archivo` y `url` a la convención del provider (S3 pre-signed URL, ruta absoluta en server, etc.).

---

Archivo generado por el equipo frontend para facilitar la integración con el backend.
