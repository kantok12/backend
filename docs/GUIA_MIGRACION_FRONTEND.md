# 🚀 Guía de Migración Frontend - Sistema de Programación Optimizada

## 📋 Resumen

Esta guía te ayudará a migrar el frontend del sistema de programación semanal antiguo (días booleanos) al nuevo sistema optimizado (fechas específicas).

---

## 🔄 Cambios Principales

### **Antes (Sistema Antiguo):**
```javascript
// Estructura antigua
{
  rut: "20.320.662-3",
  lunes: false,
  martes: false,
  miercoles: false,
  jueves: false,
  viernes: false,
  sabado: false,
  domingo: true,
  isAsignado: false
}
```

### **Después (Sistema Nuevo):**
```javascript
// Estructura nueva
{
  rut: "20.320.662-3",
  fecha_trabajo: "2025-01-27",
  dia_semana: "domingo",
  horas_estimadas: 8,
  estado: "activo",
  cliente_id: 28,
  nodo_id: 1,
  observaciones: ""
}
```

---

## 🛠️ Cambios por Componente

### **1. CalendarioPage.tsx**

#### **Antes:**
```typescript
// Lógica antigua
const handleAsignarDia = (dia: string, rut: string) => {
  const diaKey = dia.toLowerCase() as keyof typeof programacion;
  setProgramacion(prev => ({
    ...prev,
    [diaKey]: !prev[diaKey]
  }));
};
```

#### **Después:**
```typescript
// Lógica nueva
const handleAsignarDia = async (fecha: string, rut: string) => {
  try {
    const response = await fetch('/api/programacion-semanal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rut,
        cartera_id: carteraId,
        fecha_trabajo: fecha,
        horas_estimadas: 8,
        estado: 'activo'
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // Refrescar datos
      await cargarProgramacion();
    }
  } catch (error) {
    console.error('Error asignando día:', error);
  }
};
```

### **2. Hook useProgramacionSemanal**

#### **Antes:**
```typescript
// Hook antiguo
export const useProgramacionSemanal = (carteraId: number, semana: string) => {
  return useQuery({
    queryKey: ['programacion-semanal', carteraId, semana],
    queryFn: () => apiService.getProgramacionSemanal({
      cartera_id: carteraId,
      semana: semana
    })
  });
};
```

#### **Después:**
```typescript
// Hook nuevo
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
    enabled: carteraId > 0 && fechaInicio && fechaFin
  });
};
```

### **3. Servicio API**

#### **Antes:**
```typescript
// Servicio antiguo
class ApiService {
  async getProgramacionSemanal(params: {
    cartera_id: number;
    semana: string;
  }) {
    const response = await this.client.get('/api/programacion', { params });
    return response.data;
  }
}
```

#### **Después:**
```typescript
// Servicio nuevo
class ApiService {
  async getProgramacionSemanal(params: {
    cartera_id: number;
    fecha_inicio: string;
    fecha_fin: string;
  }) {
    const response = await this.client.get('/api/programacion-semanal', { params });
    return response.data;
  }

  async crearProgramacionSemanal(data: {
    rut: string;
    cartera_id: number;
    fecha_trabajo: string;
    horas_estimadas?: number;
    cliente_id?: number;
    nodo_id?: number;
    observaciones?: string;
    estado?: string;
  }) {
    const response = await this.client.post('/api/programacion-semanal', data);
    return response.data;
  }

  async eliminarProgramacionSemanal(id: number) {
    const response = await this.client.delete(`/api/programacion-semanal/${id}`);
    return response.data;
  }
}
```

---

## 📅 Manejo de Fechas

### **Función para calcular fechas de la semana:**
```typescript
// utils/fechas.ts
export const calcularFechasSemana = (fechaInicio: string) => {
  const fecha = new Date(fechaInicio);
  const lunes = new Date(fecha);
  lunes.setDate(fecha.getDate() - fecha.getDay() + 1);
  
  const fechas = [];
  for (let i = 0; i < 7; i++) {
    const dia = new Date(lunes);
    dia.setDate(lunes.getDate() + i);
    fechas.push(dia.toISOString().split('T')[0]);
  }
  
  return fechas;
};

export const obtenerDiaSemana = (fecha: string) => {
  const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return dias[new Date(fecha).getDay()];
};
```

### **Función para verificar si una fecha está asignada:**
```typescript
// utils/programacion.ts
export const estaFechaAsignada = (programacion: any[], rut: string, fecha: string) => {
  return programacion.some(p => 
    p.fecha === fecha && 
    p.trabajadores.some((t: any) => t.rut === rut)
  );
};
```

---

## 🎨 Componente de Calendario Actualizado

### **Estructura de datos nueva:**
```typescript
interface ProgramacionNueva {
  cartera: {
    id: number;
    nombre: string;
  };
  periodo: {
    inicio: string;
    fin: string;
  };
  programacion: Array<{
    fecha: string;
    dia_semana: string;
    trabajadores: Array<{
      id: number;
      rut: string;
      nombre_persona: string;
      cargo: string;
      horas_estimadas: number;
      horas_reales?: number;
      estado: string;
      cliente_id?: number;
      nodo_id?: number;
      observaciones?: string;
    }>;
  }>;
}
```

### **Componente de botón actualizado:**
```typescript
// Componente BotonDia.tsx
interface BotonDiaProps {
  fecha: string;
  diaSemana: string;
  rut: string;
  nombrePersona: string;
  estaAsignado: boolean;
  onToggle: (fecha: string, rut: string) => void;
}

export const BotonDia: React.FC<BotonDiaProps> = ({
  fecha,
  diaSemana,
  rut,
  nombrePersona,
  estaAsignado,
  onToggle
}) => {
  return (
    <button
      className={`btn-dia ${estaAsignado ? 'asignado' : 'disponible'}`}
      onClick={() => onToggle(fecha, rut)}
      title={`${nombrePersona} - ${fecha} (${diaSemana})`}
    >
      <span className="dia">{diaSemana.charAt(0).toUpperCase()}</span>
      <span className="fecha">{fecha.split('-')[2]}</span>
    </button>
  );
};
```

---

## 🔄 Migración Paso a Paso

### **Paso 1: Actualizar tipos TypeScript**
```typescript
// types/programacion.ts
export interface ProgramacionSemanal {
  cartera: {
    id: number;
    nombre: string;
  };
  periodo: {
    inicio: string;
    fin: string;
  };
  programacion: Array<{
    fecha: string;
    dia_semana: string;
    trabajadores: Trabajador[];
  }>;
}

export interface Trabajador {
  id: number;
  rut: string;
  nombre_persona: string;
  cargo: string;
  horas_estimadas: number;
  horas_reales?: number;
  estado: string;
  cliente_id?: number;
  nodo_id?: number;
  observaciones?: string;
}
```

### **Paso 2: Actualizar hooks**
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
    enabled: carteraId > 0 && fechaInicio && fechaFin,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
```

### **Paso 3: Actualizar componentes**
```typescript
// components/CalendarioSemanal.tsx
export const CalendarioSemanal: React.FC<Props> = ({ carteraId, fechaInicio }) => {
  const fechaFin = calcularFechaFin(fechaInicio);
  const { data: programacion, isLoading, refetch } = useProgramacionSemanal(
    carteraId, 
    fechaInicio, 
    fechaFin
  );

  const handleAsignarDia = async (fecha: string, rut: string) => {
    try {
      await apiService.crearProgramacionSemanal({
        rut,
        cartera_id: carteraId,
        fecha_trabajo: fecha,
        horas_estimadas: 8,
        estado: 'activo'
      });
      
      await refetch(); // Refrescar datos
    } catch (error) {
      console.error('Error asignando día:', error);
    }
  };

  const estaFechaAsignada = (fecha: string, rut: string) => {
    return programacion?.programacion.some(p => 
      p.fecha === fecha && 
      p.trabajadores.some(t => t.rut === rut)
    ) || false;
  };

  // Renderizar calendario...
};
```

---

## ✅ Checklist de Migración

- [ ] **Actualizar tipos TypeScript**
- [ ] **Modificar hooks de datos**
- [ ] **Actualizar servicio API**
- [ ] **Cambiar lógica de componentes**
- [ ] **Actualizar manejo de fechas**
- [ ] **Modificar botones de asignación**
- [ ] **Actualizar validaciones**
- [ ] **Probar funcionalidad completa**

---

## 🎯 Beneficios de la Migración

### **Para el Frontend:**
- ✅ **Datos más precisos** - Fechas específicas en lugar de días booleanos
- ✅ **Mejor UX** - Información más detallada (horas, observaciones, etc.)
- ✅ **Menos bugs** - Sistema más robusto y confiable
- ✅ **Mejor rendimiento** - Menos queries y mejor caching

### **Para el Backend:**
- ✅ **Sistema unificado** - Un solo sistema de programación
- ✅ **Mejor mantenimiento** - Código más simple y claro
- ✅ **Escalabilidad** - Fácil agregar nuevas funcionalidades

---

## 🚀 Próximos Pasos

1. **Revisar esta guía** y identificar componentes a modificar
2. **Crear branch de migración** en el repositorio
3. **Implementar cambios paso a paso** siguiendo el checklist
4. **Probar funcionalidad** en cada paso
5. **Hacer merge** cuando todo esté funcionando

¿Te gustaría que profundice en algún aspecto específico de la migración?
