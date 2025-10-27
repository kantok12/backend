# 🔄 Endpoint de Compatibilidad - Sistema de Programación

## 📋 Resumen

Este endpoint mantiene la **compatibilidad total** con el frontend actual mientras usa internamente el nuevo sistema optimizado. El frontend puede seguir usando días booleanos sin cambios.

---

## 🎯 **Solución al Problema**

### **Problema Original:**
```javascript
// Frontend enviaba esto:
{
  rut: "20.320.662-3",
  lunes: false,  // ← Problema: no se sincronizaba
  martes: false,
  // ...
  domingo: true
}
```

### **Solución con Compatibilidad:**
```javascript
// Frontend sigue enviando lo mismo:
{
  rut: "20.320.662-3",
  lunes: true,   // ← Ahora funciona correctamente
  martes: true,
  // ...
  domingo: false
}
```

---

## 🔧 **Endpoints de Compatibilidad**

### **1. GET** `/api/programacion-compatibilidad`
**Obtener programación en formato antiguo (días booleanos)**

#### Parámetros:
- `cartera_id` (requerido): ID de la cartera
- `semana` (requerido): Fecha de inicio de semana (YYYY-MM-DD)

#### Ejemplo:
```http
GET /api/programacion-compatibilidad?cartera_id=6&semana=2025-01-27
```

#### Respuesta:
```json
{
  "success": true,
  "data": {
    "cartera": {
      "id": 6,
      "nombre": "BAKERY - CARNES"
    },
    "semana": {
      "inicio": "2025-01-27",
      "fin": "2025-02-02"
    },
    "programacion": [
      {
        "id": 40,
        "rut": "20320662-3",
        "nombre_persona": "data ss",
        "cargo": "Tecnico Lubricador",
        "cartera_id": "6",
        "nombre_cartera": "BAKERY - CARNES",
        "semana_inicio": "2025-01-28T03:00:00.000Z",
        "semana_fin": "2025-02-03T03:00:00.000Z",
        "domingo": false,
        "lunes": true,      // ← Días booleanos como espera el frontend
        "martes": true,
        "miercoles": false,
        "jueves": false,
        "viernes": false,
        "sabado": false,
        "horas_estimadas": 10,
        "observaciones": "Asignación reactivada",
        "estado": "activo",
        "created_at": "2025-10-27T15:08:25.175Z",
        "updated_at": "2025-10-27T18:35:14.935Z"
      }
    ]
  }
}
```

---

### **2. POST** `/api/programacion-compatibilidad`
**Crear programación en formato antiguo (días booleanos)**

#### Body de la petición:
```json
{
  "rut": "20320662-3",
  "cartera_id": 6,
  "cliente_id": 28,
  "nodo_id": 1,
  "semana_inicio": "2025-01-27",
  "lunes": true,
  "martes": true,
  "miercoles": false,
  "jueves": false,
  "viernes": false,
  "sabado": false,
  "domingo": false,
  "horas_estimadas": 8,
  "observaciones": "Prueba compatibilidad",
  "estado": "activo"
}
```

#### Parámetros:
- `rut` (requerido): RUT del trabajador
- `cartera_id` (requerido): ID de la cartera
- `semana_inicio` (requerido): Fecha de inicio de semana (YYYY-MM-DD)
- `lunes`, `martes`, `miercoles`, `jueves`, `viernes`, `sabado`, `domingo` (opcional): Días booleanos
- `cliente_id`, `nodo_id` (opcional): IDs de cliente y nodo
- `horas_estimadas` (opcional): Horas estimadas (default: 8)
- `observaciones` (opcional): Observaciones adicionales
- `estado` (opcional): Estado de la asignación (default: "activo")

#### Respuesta:
```json
{
  "success": true,
  "data": {
    "asignaciones": [
      {
        "id": 48,
        "fecha": "2025-01-28",
        "dia": "lunes",
        "action": "created"
      },
      {
        "id": 48,
        "fecha": "2025-01-29",
        "dia": "martes",
        "action": "updated"
      }
    ],
    "message": "Programación procesada: 2 días asignados"
  }
}
```

---

## 🔄 **Conversión Automática**

### **Frontend → Backend (POST):**
```javascript
// Frontend envía:
{
  rut: "20320662-3",
  lunes: true,
  martes: true,
  miercoles: false,
  // ...
}

// Backend convierte automáticamente a:
[
  {
    rut: "20320662-3",
    fecha_trabajo: "2025-01-28",  // Lunes
    dia_semana: "lunes"
  },
  {
    rut: "20320662-3", 
    fecha_trabajo: "2025-01-29",  // Martes
    dia_semana: "martes"
  }
]
```

### **Backend → Frontend (GET):**
```javascript
// Backend tiene:
[
  { fecha_trabajo: "2025-01-28", dia_semana: "lunes" },
  { fecha_trabajo: "2025-01-29", dia_semana: "martes" }
]

// Frontend recibe:
{
  lunes: true,
  martes: true,
  miercoles: false,
  // ...
}
```

---

## 🚀 **Implementación en el Frontend**

### **Cambios Mínimos Requeridos:**

#### **1. Actualizar URL del endpoint:**
```typescript
// Antes:
const response = await fetch('/api/programacion?cartera_id=6&semana=2025-01-27');

// Después:
const response = await fetch('/api/programacion-compatibilidad?cartera_id=6&semana=2025-01-27');
```

#### **2. El resto del código NO cambia:**
```typescript
// Este código sigue funcionando igual:
const handleAsignarDia = (dia: string, rut: string) => {
  const diaKey = dia.toLowerCase() as keyof typeof programacion;
  setProgramacion(prev => ({
    ...prev,
    [diaKey]: !prev[diaKey]
  }));
};

// Y este también:
const estaAsignado = programacion.lunes || programacion.martes || /* ... */;
```

---

## ✅ **Ventajas de la Compatibilidad**

### **Para el Frontend:**
- ✅ **Cero cambios** - El código actual sigue funcionando
- ✅ **Migración gradual** - Puedes migrar cuando quieras
- ✅ **Sin bugs** - No hay riesgo de romper funcionalidad existente
- ✅ **Transparencia total** - El frontend no sabe que hay un sistema nuevo

### **Para el Backend:**
- ✅ **Sistema unificado** - Internamente usa el sistema optimizado
- ✅ **Mejor rendimiento** - Aprovecha todas las mejoras del nuevo sistema
- ✅ **Escalabilidad** - Base sólida para futuras mejoras
- ✅ **Mantenibilidad** - Un solo sistema que mantener

---

## 🎯 **Casos de Uso**

### **1. Frontend Actual (Sin Cambios):**
```typescript
// CalendarioPage.tsx - NO necesita cambios
const { data: programacion } = useQuery({
  queryKey: ['programacion', carteraId, semana],
  queryFn: () => apiService.getProgramacion({
    cartera_id: carteraId,
    semana: semana
  })
});

// Solo cambiar la URL:
const response = await fetch('/api/programacion-compatibilidad?cartera_id=6&semana=2025-01-27');
```

### **2. Botones de Días (Sin Cambios):**
```typescript
// BotonDia.tsx - NO necesita cambios
<button 
  className={`btn-dia ${programacion.lunes ? 'asignado' : 'disponible'}`}
  onClick={() => handleToggleDia('lunes', rut)}
>
  L
</button>
```

### **3. Validaciones (Sin Cambios):**
```typescript
// Validaciones - NO necesitan cambios
const estaAsignado = programacion.lunes || programacion.martes || 
                    programacion.miercoles || programacion.jueves || 
                    programacion.viernes || programacion.sabado || 
                    programacion.domingo;
```

---

## 🔧 **Configuración Rápida**

### **Paso 1: Cambiar URLs en el frontend**
```typescript
// En tu servicio API:
const API_BASE = '/api/programacion-compatibilidad';

// En lugar de:
// const API_BASE = '/api/programacion';
```

### **Paso 2: Probar funcionalidad**
- ✅ Crear asignaciones
- ✅ Ver asignaciones existentes
- ✅ Actualizar asignaciones
- ✅ Eliminar asignaciones

### **Paso 3: Verificar sincronización**
- ✅ Los datos se guardan correctamente
- ✅ Los datos se muestran correctamente
- ✅ No hay problemas de caché

---

## 🎉 **Resultado Final**

Con esta implementación:

1. **✅ El problema está resuelto** - `lunes: true` se mantiene después de recargar
2. **✅ Cero cambios en el frontend** - El código actual sigue funcionando
3. **✅ Sistema optimizado** - Internamente usa el mejor sistema
4. **✅ Migración gradual** - Puedes migrar cuando quieras
5. **✅ Sin riesgos** - No hay posibilidad de romper funcionalidad

**¡El frontend puede seguir usando días booleanos mientras el backend usa el sistema optimizado!**
