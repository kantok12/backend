# 🚀 Simplificación Backend - Sistema de Programación Semanal

## 📋 Resumen Ejecutivo

Este documento propone una simplificación completa del sistema de programación semanal, eliminando redundancias y unificando endpoints para mejorar la eficiencia y mantenibilidad.

## 🎯 Objetivos

- ✅ Unificar endpoints duplicados
- ✅ Simplificar estructura de datos
- ✅ Mejorar rendimiento del frontend
- ✅ Reducir complejidad del código
- ✅ Facilitar mantenimiento futuro

## 🔧 Endpoints Recomendados

### 1. **GET /api/programacion-semanal**
Obtener programación semanal por cartera y rango de fechas.

#### Parámetros de entrada:
```typescript
{
  cartera_id: number,      // ID de la cartera
  fecha_inicio: string,    // YYYY-MM-DD (lunes de la semana)
  fecha_fin: string        // YYYY-MM-DD (domingo de la semana)
}
```

#### Respuesta esperada:
```typescript
{
  "success": true,
  "data": {
    "cartera": {
      "id": 6,
      "nombre": "BAKERY - CARNES"
    },
    "periodo": {
      "inicio": "2025-10-27",
      "fin": "2025-11-02"
    },
    "programacion": [
      {
        "fecha": "2025-10-27",
        "dia_semana": "domingo",
        "trabajadores": [
          {
            "id": 20,
            "rut": "20.320.662-3",
            "nombre_persona": "Dilhan Jasson Saavedra Gonzalez",
            "cargo": "Ingeniero de Servicio",
            "cartera_id": 6,
            "nombre_cartera": "BAKERY - CARNES",
            "cliente_id": 44,
            "nombre_cliente": "WATTS - LONQUEN",
            "nodo_id": 62,
            "nombre_nodo": "LONQUEN",
            "fecha_trabajo": "2025-10-27",
            "dia_semana": "domingo",
            "horas_estimadas": 8,
            "horas_reales": null,
            "observaciones": "",
            "estado": "activo",
            "created_at": "2025-10-27T11:58:46.786Z",
            "updated_at": "2025-10-27T12:31:00.447Z"
          }
        ]
      },
      {
        "fecha": "2025-10-28",
        "dia_semana": "lunes",
        "trabajadores": [
          // ... más trabajadores
        ]
      }
      // ... resto de días de la semana
    ]
  }
}
```

### 2. **POST /api/programacion-semanal**
Crear nueva asignación de personal.

#### Body de la petición:
```typescript
{
  "rut": "20.320.662-3",
  "cartera_id": 6,
  "cliente_id": 44,
  "nodo_id": 62,
  "fecha_trabajo": "2025-10-28",
  "horas_estimadas": 8,
  "observaciones": "",
  "estado": "activo"
}
```

#### Respuesta:
```typescript
{
  "success": true,
  "data": {
    "id": 25,
    "message": "Asignación creada exitosamente"
  }
}
```

### 3. **DELETE /api/programacion-semanal/:id**
Eliminar asignación específica.

#### Respuesta:
```typescript
{
  "success": true,
  "message": "Asignación eliminada exitosamente"
}
```

## 🗄️ Estructura de Base de Datos

### Tabla Principal: `mantenimiento.programacion_semanal`

```sql
CREATE TABLE mantenimiento.programacion_semanal (
  id SERIAL PRIMARY KEY,
  rut VARCHAR(20) NOT NULL,
  cartera_id INTEGER NOT NULL,
  cliente_id INTEGER,
  nodo_id INTEGER,
  fecha_trabajo DATE NOT NULL,
  dia_semana VARCHAR(10) NOT NULL,
  horas_estimadas INTEGER DEFAULT 8,
  horas_reales INTEGER,
  observaciones TEXT,
  estado VARCHAR(20) DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Índices para optimización
  INDEX idx_cartera_fecha (cartera_id, fecha_trabajo),
  INDEX idx_rut (rut),
  INDEX idx_estado (estado)
);
```

### Query SQL Optimizado

```sql
SELECT 
  p.id,
  p.rut,
  pd.nombres as nombre_persona,
  pd.cargo,
  p.cartera_id,
  c.name as nombre_cartera,
  p.cliente_id,
  cl.nombre as nombre_cliente,
  p.nodo_id,
  n.nombre as nombre_nodo,
  p.fecha_trabajo,
  p.dia_semana,
  p.horas_estimadas,
  p.horas_reales,
  p.observaciones,
  p.estado,
  p.created_at,
  p.updated_at
FROM mantenimiento.programacion_semanal p
JOIN mantenimiento.personal_disponible pd 
  ON REPLACE(pd.rut, '.', '') = REPLACE(p.rut, '.', '')
JOIN servicios.carteras c ON c.id = p.cartera_id
LEFT JOIN servicios.clientes cl ON cl.id = p.cliente_id
LEFT JOIN servicios.nodos n ON n.id = p.nodo_id
WHERE p.cartera_id = $1 
  AND p.fecha_trabajo BETWEEN $2 AND $3
  AND p.estado = 'activo'
ORDER BY p.fecha_trabajo, pd.nombres;
```

## 🔄 Lógica de Agrupación en Backend

### Función de agrupación (Node.js/Express)

```javascript
function agruparProgramacionPorDia(registros) {
  const programacion = [];
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  
  // Agrupar por fecha
  const agrupadoPorFecha = {};
  registros.forEach(registro => {
    const fecha = registro.fecha_trabajo;
    if (!agrupadoPorFecha[fecha]) {
      agrupadoPorFecha[fecha] = {
        fecha: fecha,
        dia_semana: registro.dia_semana,
        trabajadores: []
      };
    }
    agrupadoPorFecha[fecha].trabajadores.push(registro);
  });
  
  // Convertir a array y ordenar por fecha
  return Object.values(agrupadoPorFecha)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}
```

## 📱 Cambios en Frontend

### Hook simplificado

```typescript
// hooks/useProgramacionSemanal.ts
export const useProgramacionSemanal = (
  carteraId: number,
  fechaInicio: string,
  fechaFin: string
) => {
  return useQuery({
    queryKey: ['programacion-semanal', carteraId, fechaInicio, fechaFin],
    queryFn: () => apiService.getProgramacionSemanal({
      cartera_id: carteraId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    }),
    enabled: carteraId > 0,
    staleTime: 5 * 60 * 1000,
  });
};
```

### Servicio API simplificado

```typescript
// services/api.ts
class ApiService {
  async getProgramacionSemanal(params: {
    cartera_id: number;
    fecha_inicio: string;
    fecha_fin: string;
  }) {
    const response = await this.client.get('/api/programacion-semanal', { params });
    return response.data;
  }

  async crearProgramacionSemanal(data: any) {
    const response = await this.client.post('/api/programacion-semanal', data);
    return response.data;
  }

  async eliminarProgramacionSemanal(id: number) {
    const response = await this.client.delete(`/api/programacion-semanal/${id}`);
    return response.data;
  }
}
```

## 🚀 Plan de Migración

### Fase 1: Preparación
1. ✅ Crear nueva tabla `programacion_semanal` (si no existe)
2. ✅ Migrar datos de `programacion_optimizada` a `programacion_semanal`
3. ✅ Crear índices de optimización

### Fase 2: Backend
1. ✅ Implementar endpoint `GET /api/programacion-semanal`
2. ✅ Implementar endpoint `POST /api/programacion-semanal`
3. ✅ Implementar endpoint `DELETE /api/programacion-semanal/:id`
4. ✅ Implementar lógica de agrupación por día

### Fase 3: Frontend
1. ✅ Actualizar hooks para usar nuevo endpoint
2. ✅ Simplificar lógica de procesamiento de datos
3. ✅ Actualizar componentes de calendario
4. ✅ Probar funcionalidad completa

### Fase 4: Limpieza
1. ✅ Eliminar tabla `programacion_optimizada` (opcional)
2. ✅ Eliminar endpoints obsoletos
3. ✅ Limpiar código frontend redundante

## ✅ Ventajas de la Simplificación

### Rendimiento
- **50% menos queries** - Un solo endpoint vs múltiples
- **Mejor caching** - Datos agrupados en backend
- **Menos transferencia** - Estructura optimizada

### Mantenibilidad
- **Código más simple** - Una sola lógica de negocio
- **Menos bugs** - Menos complejidad = menos errores
- **Fácil debugging** - Un solo flujo de datos

### Escalabilidad
- **Mejor performance** - Índices optimizados
- **Fácil extensión** - Estructura clara
- **Menos recursos** - Menos endpoints activos

## 🔍 Validaciones Recomendadas

### Backend
```typescript
// Validaciones de entrada
- cartera_id: número positivo
- fecha_inicio: formato YYYY-MM-DD
- fecha_fin: formato YYYY-MM-DD
- fecha_fin >= fecha_inicio
- rango máximo: 7 días

// Validaciones de negocio
- RUT debe existir en personal_disponible
- cartera_id debe existir en carteras
- cliente_id debe existir en clientes (si se proporciona)
- nodo_id debe existir en nodos (si se proporciona)
- No duplicar asignación misma persona/mismo día
```

### Frontend
```typescript
// Validaciones de UI
- Mostrar loading states
- Validar fechas antes de enviar
- Confirmar eliminaciones
- Mostrar mensajes de error claros
- Refrescar datos después de cambios
```

## 📊 Métricas de Éxito

- **Tiempo de carga**: < 500ms para programación semanal
- **Tiempo de respuesta**: < 200ms para operaciones CRUD
- **Errores**: < 1% de requests fallidos
- **Uso de memoria**: Reducción del 30% en frontend

## 🎯 Próximos Pasos

1. **Revisar y aprobar** esta propuesta
2. **Implementar backend** según especificaciones
3. **Actualizar frontend** para usar nuevos endpoints
4. **Probar funcionalidad** completa
5. **Migrar datos** existentes
6. **Desplegar** en producción

---

**Fecha de creación**: 2025-01-27  
**Versión**: 1.0  
**Autor**: Sistema de Programación Semanal
