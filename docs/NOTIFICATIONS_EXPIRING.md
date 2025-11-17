# Notificaciones por documentos por vencer

Endpoint para escanear documentos con fecha de vencimiento próxima y crear notificaciones automáticas en el sistema de auditoría.

**Ruta**: `POST /api/auditoria/notificaciones/expiring`

**Descripción**: Busca en `mantenimiento.documentos` los registros con `activo = true` y `fecha_vencimiento` dentro del rango solicitado. Por cada documento detectado crea una notificación en `sistema.notificaciones` usando un `tipo` permitido por la restricción de la tabla y guardando `notification_type: 'documento_por_vencer'` dentro del campo `metadata`.

**Parámetros (body JSON)**
- `days` (opcional, número): número de días hacia el futuro para considerar como "por vencer". Default: `30`.

**Comportamiento**
- Evita duplicar notificaciones: antes de crear verifica si ya existe una notificación con `metadata->>'documento_id' = <id>`.
- Inserta la notificación con `tipo = 'warning'` (valor permitido por el CHECK de la tabla). La clasificación específica `documento_por_vencer` queda en `metadata.notification_type`.
- En `metadata` se almacena al menos: `documento_id`, `rut_persona`, `nombre_archivo`, `notification_type`.
- `expira_en` se establece con la `fecha_vencimiento` del documento.

**Respuesta (ejemplo)**

```json
{
  "success": true,
  "message": "Proceso completado",
  "data": {
    "scanned": 12,
    "created": 3,
    "items": [ /* notificaciones creadas */ ]
  }
}
```

**Ejemplo PowerShell**

```powershell
# Escanear documentos que vencen dentro de 30 días
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auditoria/notificaciones/expiring' -Body (@{ days=30 } | ConvertTo-Json) -ContentType 'application/json' | ConvertTo-Json -Depth 6

# Listar notificaciones (para verificar las creadas)
Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/api/auditoria/notificaciones' | ConvertTo-Json -Depth 6
```

**Ejemplo curl**

```bash
curl -X POST "http://localhost:3000/api/auditoria/notificaciones/expiring" \
  -H "Content-Type: application/json" \
  -d '{"days":30}'
```

**Notas operativas**
- Si tu esquema de base de datos tiene una restricción CHECK sobre `tipo` (p. ej. sólo permite `info|warning|error|success|critical`), la lógica usa `tipo='warning'` para las notificaciones generadas y deja la clasificación detallada en `metadata.notification_type`.
- Se recomienda ejecutar este endpoint desde una tarea programada (cron, Windows Task Scheduler) diariamente para generar alertas tempranas.
- Para cancelar notificaciones repetidas o re-procesos, el endpoint evita duplicados verificando `metadata->>'documento_id'`.

**Siguientes mejoras posibles**
- Añadir opción `force=true` para recrear notificaciones existentes.
- Crear un endpoint GET que devuelva sólo las notificaciones de tipo `documento_por_vencer` filtrando por `metadata->>'notification_type'`.
- Añadir envío de alertas por correo/Slack cuando se creen notificaciones críticas.

---
Archivo generado automáticamente por asistente: `docs/NOTIFICATIONS_EXPIRING.md`.
