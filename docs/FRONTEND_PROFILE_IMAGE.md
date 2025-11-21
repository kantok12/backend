# Integración Frontend: Subir y mostrar foto de perfil

Este documento describe cómo implementar en el frontend la funcionalidad de subir y mostrar la foto de perfil del usuario que está autenticado en la empresa.

## Cambios realizados (resumen)

- Aclarado que las "fotos de perfil" pertenecen a los usuarios de la aplicación (tabla `sistema.usuarios`) y NO al personal (`mantenimiento.personal_disponible`).
- El flujo por defecto del frontend debe usar el endpoint autenticado `GET /api/users/me/photo` para obtener la URL de la foto del usuario logueado.
- Mantuvimos los endpoints `profile-photos` y `personal` para compatibilidad y para casos administrativos (subir por RUT o usar Drive compartido), pero recomendamos proteger la subida en producción.
- Actualizados ejemplos JS/CLI para preferir la ruta autenticada y simplificar la integración.

> Motivo: en esta app se distinguen dos conceptos —usuarios de la aplicación (cuentas que inician sesión) y "personal" que es una entidad de RRHH. Las fotos de perfil públicas deben asociarse a la cuenta (`sistema.usuarios`), no a variables internas del personal.

## Endpoints relevantes
- Subida (grabar en uploads): `POST /api/profile-photos/{rut}/upload` (multipart/form-data, campo `file`)
- Alternativa de subida (ruta personal): `POST /api/personal/{rut}/upload` (usa Drive share)
- Obtener metadata / URL pública: `GET /api/profile-photos/{rut}/image` -> devuelve `{ profile_image_url }`
- Descargar la imagen: `GET /api/profile-photos/{rut}/image/download` (devuelve el stream de la imagen)
- Endpoint conveniencia para usuario autenticado: `GET /api/users/me/photo` (requiere Bearer token) — devuelve `photo_url` y `company`

> Nota: Los endpoints `profile-photos` no requieren autenticación por diseño en el backend actual; `GET /api/users/me/photo` sí requiere token. Recomendación: proteger las rutas de subida para evitar uploads no autorizados.

---

## Flujo en el Frontend (resumen)
1. El usuario inicia sesión y obtienes el token JWT.
2. Para subir su foto, la app debe enviar un `multipart/form-data` con el archivo al endpoint `POST /api/profile-photos/{rut}/upload` (la app puede obtener el `rut` del usuario autenticado llamando `/api/users/me`).
3. Después de una subida exitosa, el backend devuelve `profile_image_url` (o puedes obtenerlo desde `GET /api/profile-photos/{rut}/image`).
4. Para mostrar la foto en la UI, usa la `photo_url` devuelta por `GET /api/users/me/photo` o el endpoint de descarga en un `<img src="...">`.

Nota importante (recomendación de integración):

- Para mostrar la foto del usuario actualmente autenticado, en lugar de pedir el RUT en la UI, usa `GET /api/users/me/photo` con el token Bearer. Este endpoint devuelve `photo_url` listo para usar y evita exponer el RUT en formularios.
- El flujo con RUT se mantiene para casos administrativos (p. ej. admin sube o consulta la foto de cualquier usuario) o para integraciones con el repositorio de personal.

---

## Ejemplo de frontend (HTML + JavaScript básico)

Reemplazo del ejemplo: fragmento pensado para una SPA o página protegida por autenticación. Este ejemplo prioriza el uso del endpoint autenticado `GET /api/users/me/photo`.

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Subir Foto de Perfil</title>
</head>
<body>
  <h3>Subir y mostrar foto de perfil</h3>
  <div>
    <input type="file" id="fileInput" accept="image/*" />
    <button id="uploadBtn">Subir mi foto</button>
  </div>
  <div>
    <button id="refreshBtn">Refrescar mi foto</button>
  </div>
  <div>
    <img id="profileImg" src="" alt="Foto de perfil" style="max-width:200px; max-height:200px; display:block;"/>
  </div>

  <script>
    const uploadBtn = document.getElementById('uploadBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const fileInput = document.getElementById('fileInput');
    const profileImg = document.getElementById('profileImg');

    // TOKEN: guardar al iniciar sesión, p.ej. localStorage.setItem('token', '<TOKEN>')
    const AUTH_TOKEN = window.localStorage.getItem('token') || null;

    // Subir la foto del usuario autenticado
    uploadBtn.addEventListener('click', async () => {
      if (!AUTH_TOKEN) return alert('Debe autenticarse para subir su foto');
      if (!fileInput.files || fileInput.files.length === 0) return alert('Selecciona una imagen');

      const file = fileInput.files[0];
      const form = new FormData();
      form.append('file', file);

      try {
        // La app obtiene el RUT del usuario autenticado para usar el endpoint de subida
        const me = await fetch('/api/users/me', { headers: { 'Authorization': 'Bearer ' + AUTH_TOKEN } });
        if (!me.ok) throw new Error('No se pudo obtener información del usuario');
        const meJson = await me.json();
        const rut = meJson.user.rut;

        const res = await fetch(`/api/profile-photos/${encodeURIComponent(rut)}/upload`, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + AUTH_TOKEN },
          body: form
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error subiendo imagen');

        alert('Subida exitosa');
        const url = data.data.profile_image_url;
        if (url) profileImg.src = url + '?_=' + Date.now(); // cache-bust
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });

    // Refrescar la foto del usuario autenticado usando el endpoint conveniencia
    refreshBtn.addEventListener('click', async () => {
      if (!AUTH_TOKEN) return alert('Debe autenticarse para ver su foto');
      try {
        const res = await fetch('/api/users/me/photo', { headers: { 'Authorization': 'Bearer ' + AUTH_TOKEN } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'No se encontró imagen');
        profileImg.src = data.data.photo_url + '?_=' + Date.now();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  </script>
</body>
</html>
```

---

## Pruebas automatizadas (CLI)
A continuación se muestran comandos de PowerShell y curl que puedes ejecutar para validar la integración.

### 1) Crear una imagen de prueba y subirla (PowerShell)
```powershell
# Desde la carpeta del repo
New-Item -ItemType Directory -Force -Path tmp
$base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
[IO.File]::WriteAllBytes('tmp\sample.png',[Convert]::FromBase64String($base64))
# Subir con curl (Windows incluye curl en versiones recientes)
curl -v -F "file=@tmp/sample.png" "http://localhost:3000/api/profile-photos/12.345.678-9/upload"
```

### 2) Obtener URL pública (PowerShell)
```powershell
Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/api/profile-photos/12.345.678-9/image' | ConvertTo-Json -Depth 6
```

### 3) Descargar la imagen subida (PowerShell)
```powershell
curl "http://localhost:3000/api/profile-photos/12.345.678-9/image/download" -o tmp\downloaded.png
```

### 4) Usar `GET /api/users/me/photo` (requiere token)
```powershell
# Asumiendo que tienes el token en $env:MY_TOKEN
Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/api/users/me/photo' -Headers @{ Authorization = "Bearer $env:MY_TOKEN" } | ConvertTo-Json -Depth 6
```

---

## Consideraciones de seguridad y UX
- Validar tamaño y tipo de imagen en frontend y backend (backend ya valida tipos y tamaño).
- Proteger endpoints de subida si no deseas que cualquier persona suba imágenes (usar `authenticateToken`). Recomendado: permitir subir solo para el usuario autenticado o roles administrativos.
- Si deseas usar Drive compartido (`G:/...`), usa el endpoint `POST /api/personal/{rut}/upload` que copia a la ruta corporativa (esto es distinto de las fotos de usuario).
- Agregar thumbnails y optimización de imágenes en el servidor para mejorar rendimiento.

---

## Siguientes pasos y recomendaciones de implementación
- Cambiar el endpoint de subida para aceptar una llamada autenticada al recurso "mi foto" (p. ej. `POST /api/users/me/photo`) y así evitar que el frontend tenga que construir URLs con RUT.
- Implementar un redirect 302 en `GET /api/users/me/photo` si deseas usar la URL directamente desde una etiqueta `<img>` sin parsear JSON.
- Programar limpieza de imágenes antiguas y validación periódica de archivos.

---

Si quieres, puedo:
- Ejecutar ahora las pruebas de subida y descarga desde el entorno (crear imagen de prueba, subirla y descargarla) y pegar la salida aquí.
- Modificar el backend para añadir `POST /api/users/me/photo` y/o devolver redirect 302 en `/api/users/me/photo`.

