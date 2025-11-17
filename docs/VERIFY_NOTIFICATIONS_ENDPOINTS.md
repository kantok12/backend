# Verificación de Endpoints de Notificaciones (Auditoría)

Objetivo

- Proveer un checklist y comandos reutilizables para verificar que los endpoints de notificaciones (`/api/auditoria/notificaciones`) funcionan correctamente y que los registros se persisten en el backend.

Endpoints clave

- GET /api/auditoria/notificaciones
  - Parámetros opcionales: `leida=true|false`, `limit`, `offset`, `tipo`, `usuario_destino` (según implementación del backend).
  - Uso desde frontend: `useAuditoriaNotificaciones(leida?)` → `apiService.getAuditoriaNotificaciones(params)`.

- PUT /api/auditoria/notificaciones/:id/marcar-leida
  - Marca una notificación como leída.
  - Uso desde frontend: mutación definida en `useNotificaciones.ts`.

- GET /api/auditoria/dashboard
  - Endpoint auxiliar para el dashboard de auditoría (no es el listado de notifs pero útil para estadísticas).

Cómo probar (PowerShell)

1) Listar notificaciones no leídas

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/auditoria/notificaciones?leida=false' -Method Get | ConvertTo-Json -Depth 6
```

2) Listar todas las notificaciones

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/auditoria/notificaciones' -Method Get | ConvertTo-Json -Depth 6
```

3) Marcar una notificación como leída (ejemplo id=123)

```powershell
Invoke-RestMethod -Method Put -Uri 'http://localhost:3000/api/auditoria/notificaciones/123/marcar-leida'
```

Equivalente `curl`:

```bash
curl -X PUT "http://localhost:3000/api/auditoria/notificaciones/123/marcar-leida"
```

Comprobaciones esperadas

- GET sin filtros o con `leida=false` debe devolver JSON con `success: true` y `data.notificaciones` (array). Ejemplo:

```json
{
  "success": true,
  "data": {
    "notificaciones": [
      {
        "id": "1",
        "tipo": "info",
        "titulo": "Sistema de Auditoría Iniciado",
        "mensaje": "El sistema híbrido de auditoría ha sido implementado exitosamente",
        "usuario_destino": null,
        "leida": true,
        "timestamp": "2025-10-15T13:45:54.621Z"
      }
    ],
    "total_no_leidas": "0"
  }
}
```

- Después de ejecutar el `PUT .../marcar-leida`, una nueva consulta con `leida=false` debe no incluir la notificación marcada (si la API actualiza el campo `leida`).

Verificar persistencia (si no ves notificaciones)

- Si `GET` devuelve vacío y sospechas creación, confirmá que el backend realmente creó registros:
  - Ejecuta `GET /api/auditoria/notificaciones` (sin filtro) y revisa `data.notificaciones`.
  - Si la respuesta está vacía pero esperabas datos, revisa los logs del backend o la base de datos.

Crear notificación de prueba

- Opción A: Si el backend tiene endpoint de creación (admin), use ese endpoint (consultar equipo backend). Si existe, te doy el payload.

- Opción B (inserción directa SQL) — ejemplo para PostgreSQL (ajustar columnas según esquema):

```sql
INSERT INTO auditoria_notificaciones (tipo, titulo, mensaje, usuario_destino, leida, timestamp)
VALUES ('info', 'Notificación de prueba', 'Esta es una notificación de prueba para verificar UI', NULL, false, now());
```

Nota: la tabla y columnas pueden llamarse diferente (`auditoria`, `notificaciones`, etc.). Reemplaza con el nombre real de la tabla.

Chequeo rápido en la DB (Postgres)

```sql
SELECT id, tipo, titulo, leida, timestamp FROM auditoria_notificaciones ORDER BY timestamp DESC LIMIT 20;
```

Buenas prácticas / notas

- La UI acepta varias formas en la respuesta: `data.notificaciones`, `data.data`, o `data` (el hook `useNotificaciones` normaliza flexiblemente). Preferible que backend devuelva en `data.notificaciones` por consistencia.
- Para entornos con autenticación, asegurarse de agregar headers de autorización en las pruebas: `-H "Authorization: Bearer <token>"`.
- Si los links devueltos por notificaciones apuntan a recursos privados, asegurar que el backend sólo entregue enlaces expiring o que la descarga pase por el backend (streaming) para controlar acceso.

Checklist de verificación

- [ ] GET `/api/auditoria/notificaciones` devuelve registros existentes.
- [ ] GET `?leida=false` lista solo no leídas.
- [ ] PUT `/api/auditoria/notificaciones/:id/marcar-leida` cambia `leida` a true y GET con `leida=false` ya no incluye la notificación.
- [ ] Si es necesario, crear una notificación de prueba (SQL o endpoint) y verificar que aparece en GET.
- [ ] Revisar logs del backend si no aparecen registros (posible problema de creación o permisos).

Contacto / Siguientes pasos

- Si querés, puedo generar un script PowerShell que:
  1) Cree X notificaciones de prueba (si existe endpoint POST) o te entregue SQL listo para ejecutar.
  2) Liste las no leídas y marque la primera como leída para validar el flujo.

---

Archivo creado por el equipo frontend para facilitar pruebas de integración con backend.
