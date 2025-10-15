# 🏭 Sistema de Gestión de Personal y Mantenimiento Industrial

Backend Node.js + Express + PostgreSQL. Este README consolidado documenta únicamente las NUEVAS APIs añadidas recientemente.

## 🎯 Información

- **Base URL**: `http://localhost:3000`
- **Red Local**: `http://192.168.10.198:3000`

---

## 🆕 Nuevas APIs

### 1) Belray (Gestión de Empresas y Documentación de Empresa)

- Base: `/api/belray`
- Funcionalidades:
  - CRUD de empresas Belray
  - Búsqueda y paginación
  - Documentación de empresa en disco: `G:\Unidades compartidas\Unidad de Apoyo\Belray\Documentacion_Empresa\Belray_{ID}`
  - Endpoints de documentos por empresa:
    - `GET /:id/documentos`
    - `POST /:id/documentos/subir` (multipart)
    - `GET /:id/documentos/descargar/:archivo`
    - `DELETE /:id/documentos/:archivo`
    - `POST /:id/documentos/crear-carpeta`
    - `POST /documentos/crear-carpetas-todas`

Documentación detallada: `FRONTEND_BELRAY_API.md`

Ejemplo creación empresa:
```bash
curl -X POST http://localhost:3000/api/belray \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Empresa X",
    "descripcion": "Descripción",
    "giro": "Servicios",
    "numero_telefono": "+56 2 2345 6789",
    "direccion": "Dirección 123"
  }'
```

### 2) Auditoría Híbrida (Triggers + Notificaciones + Dashboard)

- Base: `/api/auditoria`
- Componentes:
  - Auditoría automática (triggers) para tablas críticas:
    - `mantenimiento`: `personal_disponible`, `documentos`, `programacion_semanal`, `belray`
    - `servicios`: `carteras`, `clientes`, `nodos`
  - Notificaciones manuales
  - Dashboard y estadísticas

Endpoints principales:
- `GET /dashboard` — Actividad en tiempo real (filtros: `tabla`, `operacion`, `usuario`, `es_critico`, `desde`, `hasta`, `limit`, `offset`)
- `GET /notificaciones` — Listar notificaciones (filtros: `tipo`, `leida`, `usuario_destino`, `limit`, `offset`)
- `POST /notificaciones` — Crear notificación
- `PUT /notificaciones/:id/marcar-leida` — Marcar como leída
- `GET /historial/:tabla/:id` — Historial por registro
- `GET /estadisticas` — KPIs (periodo en días)
- `POST /limpiar-logs` — Limpieza de logs antiguos

Documentación detallada: `FRONTEND_AUDITORIA_API.md`

Ejemplo crear notificación:
```bash
curl -X POST http://localhost:3000/api/auditoria/notificaciones \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "warning",
    "titulo": "Operación crítica",
    "mensaje": "Se detectó un evento",
    "usuario_destino": "admin",
    "es_critico": true
  }'
```

---

## 🧩 Extras relevantes

- Diagramas de base de datos: `docs/DIAGRAMA_ESQUEMAS_BASE_DATOS.md`, `docs/DIAGRAMA_GRAFICO_ESQUEMAS.md`
- Resto de documentación histórica se mantiene en `docs/`.

---

## 📞 Soporte

- Health: `GET /api/health`
- Base URL red local: `http://192.168.10.198:3000`

---

© Sistema de Gestión de Personal y Mantenimiento Industrial