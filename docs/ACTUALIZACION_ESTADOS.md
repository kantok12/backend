# 🔄 Actualización de Estados del Sistema

## 📋 Resumen

Se ha actualizado la tabla de estados para incluir 4 estados específicos, donde el estado "activo" se ha dividido en 2 versiones según los requerimientos del sistema.

## 🎯 Estados Configurados

### 1. **Proceso de Activo**
- **ID**: 1
- **Descripción**: Personal en proceso de activación
- **Uso**: Personal que está siendo activado en el sistema

### 2. **De Acreditación**
- **ID**: 2
- **Descripción**: Personal en proceso de acreditación
- **Uso**: Personal que está en proceso de acreditación

### 3. **Inactivo**
- **ID**: 3
- **Descripción**: Personal temporalmente inactivo
- **Uso**: Personal que no está disponible temporalmente

### 4. **Vacaciones**
- **ID**: 4
- **Descripción**: Personal en período de vacaciones
- **Uso**: Personal que está en vacaciones

## 🔧 Cambios Realizados

### Antes de la Actualización
- Estados genéricos o no definidos
- Posible estado "activo" único

### Después de la Actualización
- **4 estados específicos** y bien definidos
- **Estado "activo" dividido** en 2 versiones:
  - "Proceso de Activo"
  - "De Acreditación"
- **Estados adicionales** para mejor gestión

## 🚀 Métodos de Ejecución

### Opción 1: Endpoints de API (Recomendado)
```bash
# Verificar estado actual
GET /api/migration/estados-status

# Ejecutar actualización
POST /api/migration/update-estados
```

### Opción 2: Script JavaScript
```bash
# Verificar estado actual
node scripts/execute-estados-update.js check

# Ejecutar actualización
node scripts/execute-estados-update.js
```

### Opción 3: Script Directo
```bash
# Ejecutar actualización directa
node scripts/update-estados.js
```

## 📊 Proceso de Actualización

### 1. Verificación Previa
- Revisar estados existentes
- Identificar personal afectado
- Verificar integridad de datos

### 2. Limpieza de Estados
- Eliminar estados existentes
- Mantener integridad referencial

### 3. Inserción de Nuevos Estados
```sql
INSERT INTO mantenimiento.estados (nombre, descripcion, activo)
VALUES 
  ('Proceso de Activo', 'Personal en proceso de activación', true),
  ('De Acreditación', 'Personal en proceso de acreditación', true),
  ('Inactivo', 'Personal temporalmente inactivo', true),
  ('Vacaciones', 'Personal en período de vacaciones', true);
```

### 4. Verificación Post-Actualización
- Confirmar que se crearon 4 estados
- Verificar que los nombres son correctos
- Validar impacto en personal existente

## 🔍 Verificación de Resultados

### Estados Creados
```sql
SELECT id, nombre, descripcion, activo
FROM mantenimiento.estados
ORDER BY id;
```

**Resultado esperado:**
```
ID | Nombre              | Descripción                           | Activo
1  | Proceso de Activo   | Personal en proceso de activación     | true
2  | De Acreditación     | Personal en proceso de acreditación   | true
3  | Inactivo            | Personal temporalmente inactivo        | true
4  | Vacaciones          | Personal en período de vacaciones     | true
```

### Impacto en Personal
```sql
SELECT 
  e.nombre as estado_nombre,
  COUNT(p.rut) as cantidad_personal
FROM mantenimiento.estados e
LEFT JOIN mantenimiento.personal_disponible p ON e.id = p.estado_id
GROUP BY e.id, e.nombre
ORDER BY e.id;
```

## ⚠️ Consideraciones Importantes

### Personal con Estados Obsoletos
- Si hay personal con estados que ya no existen, aparecerá como "orphan"
- Se recomienda actualizar estos registros manualmente
- Los endpoints de personal seguirán funcionando

### Integridad Referencial
- La actualización mantiene la integridad de la base de datos
- No se elimina personal, solo se actualizan los estados
- Las relaciones FK se mantienen intactas

### Rollback
- Si necesitas revertir los cambios, puedes restaurar desde backup
- O ejecutar un script de rollback personalizado

## 📋 Endpoints Afectados

### Estados (`/api/estados`)
- `GET /` - Listar estados (mostrará los 4 nuevos estados)
- `POST /` - Crear estado (funcionalidad normal)
- `GET /:id` - Obtener estado por ID
- `PUT /:id` - Actualizar estado
- `DELETE /:id` - Eliminar estado

### Personal (`/api/personal-disponible`)
- `GET /` - Listar personal (mostrará nuevos estados)
- `POST /` - Crear personal (usar nuevos IDs de estado)
- `PUT /:rut` - Actualizar personal (usar nuevos IDs de estado)

## 🎯 Casos de Uso

### 1. Personal Nuevo
```json
{
  "rut": "12345678-9",
  "nombre": "Juan Pérez",
  "estado_id": 1,  // Proceso de Activo
  "cargo": "Operador"
}
```

### 2. Personal en Acreditación
```json
{
  "rut": "87654321-0",
  "nombre": "María González",
  "estado_id": 2,  // De Acreditación
  "cargo": "Supervisor"
}
```

### 3. Personal en Vacaciones
```json
{
  "rut": "11223344-5",
  "nombre": "Carlos López",
  "estado_id": 4,  // Vacaciones
  "cargo": "Técnico"
}
```

## 🔧 Configuración Avanzada

### Agregar Nuevos Estados
```sql
INSERT INTO mantenimiento.estados (nombre, descripcion, activo)
VALUES ('Nuevo Estado', 'Descripción del nuevo estado', true);
```

### Modificar Estados Existentes
```sql
UPDATE mantenimiento.estados 
SET descripcion = 'Nueva descripción'
WHERE nombre = 'Proceso de Activo';
```

### Desactivar Estados
```sql
UPDATE mantenimiento.estados 
SET activo = false
WHERE nombre = 'Estado a desactivar';
```

## 📈 Beneficios de la Actualización

### Para el Sistema
- **Estados más específicos**: Mejor categorización del personal
- **Flexibilidad**: Fácil agregar nuevos estados
- **Claridad**: Nombres descriptivos y claros

### Para los Usuarios
- **Mejor organización**: Personal categorizado correctamente
- **Filtros más precisos**: Búsquedas más específicas
- **Reportes más claros**: Estadísticas más detalladas

### Para el Desarrollo
- **Código más limpio**: Estados bien definidos
- **Mantenimiento más fácil**: Estructura clara
- **Escalabilidad**: Fácil agregar nuevos estados

## 🚀 Próximos Pasos

1. **Ejecutar actualización**: `POST /api/migration/update-estados`
2. **Verificar resultados**: `GET /api/migration/estados-status`
3. **Probar endpoints**: `GET /api/estados`
4. **Actualizar personal**: Revisar personal con estados obsoletos
5. **Documentar cambios**: Informar a usuarios sobre nuevos estados

## 📊 Estadísticas Post-Actualización

- **Total de estados**: 4
- **Estados activos**: 4
- **Estados específicos**: 2 (Proceso de Activo, De Acreditación)
- **Estados generales**: 2 (Inactivo, Vacaciones)
- **Personal afectado**: Variable (depende de datos existentes)

---

**Fecha de actualización**: 10 de enero de 2025  
**Versión**: 1.1.0  
**Estado**: ✅ Listo para ejecutar



