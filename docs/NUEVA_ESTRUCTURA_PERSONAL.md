# 🏗️ Nueva Estructura de Personal - Separación en 3 Tablas

## 🎯 Objetivo

Separar la tabla `personal_disponible` en 3 tablas especializadas:
1. **`personal`** - Datos principales del personal
2. **`documentos`** - Documentos y tallas del personal  
3. **`cursos`** - Cursos y certificaciones (ya existe)

---

## 📊 Estructura Actual vs Nueva

### 🔴 **ESTRUCTURA ACTUAL (1 tabla):**
```
personal_disponible
├── rut (PK)
├── nombre
├── sexo
├── fecha_nacimiento
├── cargo
├── estado_id (FK)
├── comentario_estado
├── zona_geografica
├── licencia_conducir
├── talla_zapatos
├── talla_pantalones
├── talla_poleras
└── documentacion_id
```

### 🟢 **NUEVA ESTRUCTURA (3 tablas):**

#### 1. **`personal`** (Datos principales)
```
personal
├── rut (PK)
├── nombre
├── sexo
├── fecha_nacimiento
├── cargo
├── estado_id (FK → estados.id)
├── comentario_estado
├── zona_geografica
├── fecha_creacion
├── fecha_actualizacion
└── activo
```

#### 2. **`documentos_personal`** (Documentos y tallas)
```
documentos_personal
├── id (PK)
├── rut_persona (FK → personal.rut)
├── tipo_documento
├── nombre_documento
├── valor_documento
├── fecha_emision
├── fecha_vencimiento
├── descripcion
├── fecha_creacion
├── fecha_actualizacion
└── activo
```

#### 3. **`cursos`** (Ya existe, se mantiene)
```
cursos
├── id (PK)
├── rut_persona (FK → personal.rut)
├── nombre_curso
├── fecha_inicio
├── fecha_fin
├── estado
├── institucion
├── descripcion
├── fecha_vencimiento
├── fecha_creacion
├── fecha_actualizacion
└── activo
```

---

## 🔄 Mapeo de Datos

### **PERSONAL_DISPONIBLE → PERSONAL:**
| Campo Original | Campo Nuevo | Notas |
|----------------|-------------|-------|
| `rut` | `rut` | Clave primaria |
| `nombre` | `nombre` | Directo |
| `sexo` | `sexo` | Directo |
| `fecha_nacimiento` | `fecha_nacimiento` | Directo |
| `cargo` | `cargo` | Directo |
| `estado_id` | `estado_id` | FK a estados |
| `comentario_estado` | `comentario_estado` | Directo |
| `zona_geografica` | `zona_geografica` | Directo |
| `created_at` | `fecha_creacion` | Directo |
| `updated_at` | `fecha_actualizacion` | Directo |

### **PERSONAL_DISPONIBLE → DOCUMENTOS_PERSONAL:**
| Campo Original | Tipo Documento | Valor Documento | Nombre Documento |
|----------------|----------------|-----------------|------------------|
| `licencia_conducir` | `licencia_conducir` | Valor del campo | `Licencia de Conducir` |
| `talla_zapatos` | `talla_zapatos` | Valor del campo | `Talla de Zapatos` |
| `talla_pantalones` | `talla_pantalones` | Valor del campo | `Talla de Pantalones` |
| `talla_poleras` | `talla_poleras` | Valor del campo | `Talla de Poleras` |

---

## 🔗 Relaciones

### **Diagrama de Relaciones:**
```
estados (id) ←──┐
    │            │
    └── personal (estado_id)
         │
         ├── rut ←── cursos (rut_persona)
         │
         └── rut ←── documentos_personal (rut_persona)
```

### **Relaciones Detalladas:**
1. **`personal.estado_id`** → **`estados.id`** (1:N)
2. **`personal.rut`** → **`cursos.rut_persona`** (1:N)
3. **`personal.rut`** → **`documentos_personal.rut_persona`** (1:N)

---

## 📋 Ventajas de la Nueva Estructura

### ✅ **Beneficios:**
1. **Normalización**: Elimina redundancia y mejora integridad
2. **Flexibilidad**: Permite múltiples documentos por persona
3. **Escalabilidad**: Fácil agregar nuevos tipos de documentos
4. **Mantenimiento**: Separación clara de responsabilidades
5. **Consultas**: Más eficientes y específicas
6. **Auditoría**: Mejor tracking de cambios por tabla

### 🎯 **Casos de Uso Mejorados:**
- **Consultar solo datos personales**: `SELECT * FROM personal`
- **Obtener documentos específicos**: `SELECT * FROM documentos_personal WHERE tipo_documento = 'licencia_conducir'`
- **Agregar nuevos documentos**: Sin modificar estructura de personal
- **Historial de documentos**: Múltiples versiones por tipo

---

## 🛠️ Scripts de Migración

### **Archivos Creados:**
1. **`scripts/migrate-personal-structure.sql`** - Script SQL completo
2. **`scripts/execute-migration.js`** - Ejecutor de migración con validaciones
3. **`scripts/redesign-personal-structure.js`** - Análisis y diseño

### **Proceso de Migración:**
1. ✅ Crear tabla `personal`
2. ✅ Crear tabla `documentos_personal`
3. ✅ Migrar datos de `personal_disponible` a `personal`
4. ✅ Migrar documentos a `documentos_personal`
5. ✅ Crear índices para performance
6. ✅ Crear vista de compatibilidad
7. ✅ Verificar integridad de datos

---

## 🌐 Impacto en Endpoints

### **Endpoints que Necesitan Actualización:**
1. **`/api/personal-disponible`** → **`/api/personal`**
2. **`/api/nombres`** → Usar tabla `personal`
3. **`/api/documentos`** → Separar en documentos de cursos y documentos de personal

### **Nuevos Endpoints Sugeridos:**
- **`/api/personal`** - CRUD de personal
- **`/api/personal/:rut/documentos`** - Documentos de una persona
- **`/api/personal/:rut/cursos`** - Cursos de una persona
- **`/api/documentos-personal`** - CRUD de documentos de personal

---

## ⚠️ Consideraciones Importantes

### **Riesgos:**
1. **Compatibilidad**: Endpoints existentes dejarán de funcionar
2. **Datos**: Posible pérdida si la migración falla
3. **Tiempo**: Migración requiere downtime

### **Mitigaciones:**
1. **Backup completo** antes de migrar
2. **Vista de compatibilidad** para transición gradual
3. **Pruebas exhaustivas** en desarrollo
4. **Rollback plan** en caso de problemas

---

## 📊 Estadísticas de Migración

### **Datos a Migrar:**
- **Personal**: 50 registros
- **Documentos**: ~200 registros (4 tipos × 50 personas)
- **Cursos**: 2 registros (ya existen)
- **Estados**: 4 registros (ya existen)

### **Tiempo Estimado:**
- **Migración**: 5-10 minutos
- **Actualización de endpoints**: 2-4 horas
- **Pruebas**: 1-2 horas
- **Total**: 3-6 horas

---

**Fecha de diseño**: 10 de septiembre de 2025  
**Versión**: 1.0.0  
**Estado**: Listo para implementación




