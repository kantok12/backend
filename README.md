# 🏭 Sistema de Gestión de Personal y Mantenimiento Industrial

Backend Node.js + Express + PostgreSQL. Este README ofrece un panorama consolidado del proyecto: estructura, estado actual, endpoints importantes, scripts y buenas prácticas.

Fecha: 2025-11-28

## Índice
- **Resumen rápido**
- **Estructura del repositorio**
- **Endpoints principales**
- **Scripts y utilidades**
- **Estado actual**
- **Cómo ejecutar (local, Windows)**
- **Checklist antes de producción**

---

## Resumen rápido
- Propósito: Gestión de personal, estados, asignaciones y documentación relacionada.
- Stack: Node.js, Express, PostgreSQL.
- Punto central DB: `config/database.js` exporta la función `query` usada por rutas y scripts.

---

## Estructura del repositorio (relevante)

- `server.js` — punto de entrada; carga `config.env`, middlewares y monta rutas.
- `config/`
  - `database.js` — conexión y wrapper `query`.
- `routes/` — endpoints Express principales; algunos ficheros importantes:
  - `estructura.js`, `programacion.js`, `estados.js`, `personal-estados.js`, `personal-disponible.js`, `personal-cargos-estados.js`, `estado-unificado.js`, `minimo-personal.js`, `asignaciones.js`, `migration.js`, `belray.js`, `auditoria.js`
- `scripts/` — utilidades y procesos batch:
  - `import_personal_from_claudio.js` — import masivo desde `exports/`.
  - `update-estados-safe.js` — script seguro para actualizar estados (`runEstadosUpdateSafe`).
  - `buscar-persona-documentos.js` — inspección local de archivos en unidad de red (G:).
  - varios scripts de verificación y utilidades.
- `exports/` — datos exportados y backups (ej.: `listado_claudio_full_rows_db_ready.json`).
- `docs/` — documentación y diagramas para frontend y operaciones (`FRONTEND_MACH_ENDPOINT.md`, `FRONTEND_ASIGNACIONES.md`, `FRONTEND_BELRAY_API.md`, `FRONTEND_AUDITORIA_API.md`, diagramas de BD, etc.).

---

## Endpoints principales (resumen)

> Para parámetros y cuerpos exactos, revisar cada archivo en `routes/`.

- Health:
  - `GET /api/health`

- Prerrequisitos (MACH):
  - `GET  /api/prerrequisitos/clientes/:clienteId/mach`
  - `POST /api/prerrequisitos/clientes/:clienteId/mach`
  - Docs: `docs/FRONTEND_MACH_ENDPOINT.md`

- Asignaciones:
  - `POST /api/asignaciones` (valida MACH antes de crear)
  - Rutas CRUD y consultas en `routes/asignaciones.js`

- Personal / Estados:
  - `GET/POST /api/personal-disponible`
  - `/api/personal-estados`
  - `/api/personal-cargos-estados`
  - `/api/estados`
  - `/api/estado-unificado`

- Mínimos / Cálculos:
  - `/api/minimo-personal` (usa la función DB `servicios.calcular_minimo_real`)

- Belray (Gestión de empresas y documentos):
  - Base: `/api/belray`
  - Documentos: `GET /api/belray/:id/documentos`, `POST /api/belray/:id/documentos/subir`, `GET /api/belray/:id/documentos/descargar/:archivo`, `DELETE /api/belray/:id/documentos/:archivo`, `POST /api/belray/:id/documentos/crear-carpeta`, `POST /api/belray/documentos/crear-carpetas-todas`
  - Docs: `docs/FRONTEND_BELRAY_API.md`

- Auditoría (Triggers, notificaciones, dashboard):
  - Base: `/api/auditoria`
  - `GET /api/auditoria/dashboard`, `GET/POST /api/auditoria/notificaciones`, `PUT /api/auditoria/notificaciones/:id/marcar-leida`, `GET /api/auditoria/historial/:tabla/:id`, `GET /api/auditoria/estadisticas`, `POST /api/auditoria/limpiar-logs`
  - Docs: `docs/FRONTEND_AUDITORIA_API.md`

---

## Scripts y utilidades importantes

- `node scripts/import_personal_from_claudio.js` — importa/normaliza datos desde `exports/`.
- `node scripts/update-estados-safe.js` — actualización controlada de estados (ejecutar en staging primero).
- `node scripts/buscar-persona-documentos.js` — busca documentos localmente en `G:/Unidades compartidas/...` (ejecútalo sólo si tienes acceso a la unidad).
- Migraciones: `routes/migration.js` contiene rutas para tareas de migración, pero están protegidas/deshabilitadas por seguridad en despliegues.

---

## Estado actual (resumen)

- Rutas y APIs principales implementadas y montadas en `server.js`.
- Nuevas APIs: `Belray` y `Auditoría` disponibles y documentadas en `docs/`.
- Scripts destructivos/migraciones están deliberadamente deshabilitados o protegidos para despliegues en Cloud Run.
- Exports JSON actualizados y versionados en `exports/` (ej.: `listado_claudio_full_rows_db_ready.json`).
- Dependencia crítica: `config/database.js` -> `query`. Antes de ejecutar imports o updates validar `config.env` y conexión DB.

---

## Cómo ejecutar (Windows / local)

1. Instalar dependencias:
   ```powershell
   npm install
   ```
2. Configurar `config.env` con credenciales DB y variables necesarias.
3. Arrancar servidor en desarrollo:
   ```powershell
   npm run dev
   # o
   node server.js
   ```
4. Scripts útiles:
   - Importar datos: `node scripts/import_personal_from_claudio.js`
   - Actualizar estados (seguro): `node scripts/update-estados-safe.js`
   - Buscar documentos localmente (requiere G:): `node scripts/buscar-persona-documentos.js`

---

## Checklist rápido antes de cambios en producción

- [ ] Hacer backup de `exports/` y dump de la base de datos.
- [ ] Validar `config.env` y credenciales en staging.
- [ ] Ejecutar scripts de migración en staging antes de producción.
- [ ] Confirmar que `routes/migration.js` está deshabilitado o protegido.
- [ ] Revisar logs y auditoría tras cualquier operación masiva.

---

## Documentación y diagramas


---

## Diagrama ER — extracción desde la base de datos

Se generó automáticamente un diagrama ER y un extracto del esquema real a partir de la base de datos actual. Archivos generados:

- `docs/ER_FROM_DB.md` — diagrama en formato Mermaid (bloque `mermaid`) con tablas, PK y relaciones detectadas.
- `docs/SCHEMA_EXTRACT.txt` — resumen tipo SQL con columnas, defaults y FKs detectadas.
- `scripts/generate_schema_and_mermaid.js` — script Node que extrae el esquema desde `information_schema` y regenera los archivos anteriores.

Comandos útiles (PowerShell):

Regenerar el diagrama y el extracto desde la BD:
```powershell
node .\scripts\generate_schema_and_mermaid.js
```

Generar una imagen SVG desde el bloque Mermaid (requiere `npx`):
```powershell
# extraer el bloque mermaid a .mmd si es necesario o usar un archivo .mmd ya existente
npx @mermaid-js/mermaid-cli -i .\docs\ER_FROM_DB.mmd -o .\docs\ER_FROM_DB.svg
```

Ver el diagrama interactivo (local): crear un HTML simple que incluya el bloque `mermaid` o abrir `docs/ER_FROM_DB.md` en un editor que soporte Mermaid preview.

Notas:
- El script utiliza la configuración de conexión en `config/env` (mira `config/database.js`). Asegúrate de que `config.env` tiene las credenciales correctas antes de regenerar.
- Si prefieres documentación HTML navegable (tablas, relaciones y búsqueda), puedo generar una salida completa con herramientas como SchemaSpy (requiere Java + driver JDBC) y dejar la carpeta lista en `docs/`.

---

## Contacto / Soporte

- Health: `GET /api/health`

© Sistema de Gestión de Personal y Mantenimiento Industrial
