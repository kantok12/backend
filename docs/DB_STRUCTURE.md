# Estructura de la base de datos (Resumen)

Este documento describe las tablas y relaciones principales usadas por el backend. Es un resumen orientado a desarrollo y mantenimiento; para detalles completos revisar los scripts de migración y el SQL del proyecto.

## Esquema `mantenimiento`

- `personal_disponible`
  - Campos clave: `rut` (PK), `nombres`, `apellido`, `cargo`, `zona_geografica`, `email`, `telefono`, `fecha_ingreso`, `activo`
  - Índices: `rut` (único), índices por `zona_geografica`, `cargo`

- `documentos`
  - Campos: `id` (PK, serial), `rut_persona`, `nombre_documento`, `tipo_documento`, `nombre_archivo`, `ruta_archivo`, `fecha_subida`, `subido_por`
  - Relaciones: `rut_persona` -> `personal_disponible.rut`

- `programacion_semanal`
  - Campos: `id`, `rut_persona`, `semana_inicio`, `semana_fin`, `servicio_id`, `rol`, `horas`, `creado_en`

- `belray` (si existe tabla para empresas Belray)
  - Campos: `id`, `nombre`, `descripcion`, `giro`, `direccion`, `telefono`, `created_at`

## Esquema `servicios`

- `carteras`
  - Campos: `id`, `nombre`, `descripcion`, `servicio_padre`

- `clientes`
  - Campos: `id`, `cartera_id`, `nombre`, `codigo_cliente`, `domicilio`, `contacto`
  - Relaciones: `cartera_id` -> `carteras.id`

- `nodos`
  - Campos: `id`, `cliente_id`, `nombre`, `tipo`, `direccion`
  - Relaciones: `cliente_id` -> `clientes.id`

## Auditoría y notificaciones

- `auditoria.logs` (o tabla `auditoria`)
  - Campos: `id`, `tabla`, `registro_id`, `operacion`, `usuario`, `detalle`, `es_critico`, `created_at`

- `auditoria.notificaciones`
  - Campos: `id`, `tipo`, `titulo`, `mensaje`, `usuario_origen`, `usuario_destino`, `leida`, `es_critico`, `created_at`

## Funciones y procedimientos importantes

- `servicios.calcular_minimo_real(...)`  — función que calcula mínimos requeridos (utilizada por `routes/minimo-personal.js`).

## Relaciones y notas

- Muchas tablas usan `rut_persona` o `rut` como ligadura entre datos personales y documentos/planificaciones.
- Las operaciones críticas y los cambios masivos quedan registrados en `auditoria` (si está activado) y se usan para dashboards y notificaciones.

> Nota: este documento es un resumen generado a partir del código y la estructura del proyecto. Si necesitas un dump SQL o migraciones actuales, puedo generar un script para extraer el esquema completo.
