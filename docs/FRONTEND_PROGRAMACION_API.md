# 📅 API de Programación Semanal - Documentación Frontend

## 🎯 Descripción General

El sistema de programación semanal permite planificar y gestionar la asignación de trabajadores a carteras, clientes y nodos por semana. Los trabajadores aparecen organizados según su cartera asignada.

## 🔗 Base URL
```
http://192.168.10.194:3000/api/programacion
```

## 📋 Endpoints Disponibles

### 1. **GET /api/programacion** - Obtener programación por cartera y semana

Obtiene la programación de trabajadores para una cartera específica en una semana determinada.

**Query Parameters:**
- `cartera_id` (requerido): ID de la cartera
- `semana` (opcional): Fecha del lunes de la semana (YYYY-MM-DD)
- `fecha` (opcional): Cualquier fecha de la semana (se calcula automáticamente el lunes)

**Ejemplo de Request:**
```javascript
// Obtener programación de cartera 1 para la semana actual
GET /api/programacion?cartera_id=1

// Obtener programación de cartera 1 para semana específica
GET /api/programacion?cartera_id=1&semana=2024-01-15

// Obtener programación usando cualquier fecha de la semana
GET /api/programacion?cartera_id=1&fecha=2024-01-17
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "cartera": {
      "id": 1,
      "nombre": "SNACK"
    },
    "semana": {
      "inicio": "2024-01-15",
      "fin": "2024-01-21"
    },
    "programacion": [
      {
        "id": 1,
        "rut": "12345678-9",
        "nombre_persona": "Juan Pérez",
        "cargo": "Ingeniero de Servicios",
        "cartera_id": 1,
        "nombre_cartera": "SNACK",
        "cliente_id": 5,
        "nombre_cliente": "CAROZZI - PLANTA NOS",
        "nodo_id": 12,
        "nombre_nodo": "CEREALES",
        "semana_inicio": "2024-01-15",
        "semana_fin": "2024-01-21",
        "lunes": true,
        "martes": true,
        "miercoles": false,
        "jueves": true,
        "viernes": true,
        "sabado": false,
        "domingo": false,
        "horas_estimadas": 8,
        "observaciones": "Trabajo en planta",
        "estado": "programado",
        "created_at": "2024-01-10T10:30:00.000Z",
        "updated_at": "2024-01-10T10:30:00.000Z"
      }
    ]
  }
}
```

### 2. **GET /api/programacion/persona/:rut** - Obtener programación de una persona

Obtiene el historial de programación de un trabajador específico.

**Path Parameters:**
- `rut`: RUT del trabajador

**Query Parameters:**
- `semanas` (opcional): Número de semanas a mostrar (default: 4)

**Ejemplo de Request:**
```javascript
// Obtener últimas 4 semanas de programación
GET /api/programacion/persona/12345678-9

// Obtener últimas 8 semanas
GET /api/programacion/persona/12345678-9?semanas=8
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "persona": {
      "rut": "12345678-9",
      "nombre": "Juan Pérez",
      "cargo": "Ingeniero de Servicios"
    },
    "programacion": [
      {
        "id": 1,
        "rut": "12345678-9",
        "nombre_persona": "Juan Pérez",
        "cargo": "Ingeniero de Servicios",
        "cartera_id": 1,
        "nombre_cartera": "SNACK",
        "cliente_id": 5,
        "nombre_cliente": "CAROZZI - PLANTA NOS",
        "nodo_id": 12,
        "nombre_nodo": "CEREALES",
        "semana_inicio": "2024-01-15",
        "semana_fin": "2024-01-21",
        "lunes": true,
        "martes": true,
        "miercoles": false,
        "jueves": true,
        "viernes": true,
        "sabado": false,
        "domingo": false,
        "horas_estimadas": 8,
        "observaciones": "Trabajo en planta",
        "estado": "programado",
        "created_at": "2024-01-10T10:30:00.000Z",
        "updated_at": "2024-01-10T10:30:00.000Z"
      }
    ]
  }
}
```

### 3. **POST /api/programacion** - Crear programación

Crea una nueva programación para un trabajador en una cartera específica.

**Body (JSON):**
```json
{
  "rut": "12345678-9",
  "cartera_id": 1,
  "cliente_id": 5,
  "nodo_id": 12,
  "semana_inicio": "2024-01-15",
  "lunes": true,
  "martes": true,
  "miercoles": false,
  "jueves": true,
  "viernes": true,
  "sabado": false,
  "domingo": false,
  "horas_estimadas": 8,
  "observaciones": "Trabajo en planta",
  "estado": "programado"
}
```

**Campos Requeridos:**
- `rut`: RUT del trabajador
- `cartera_id`: ID de la cartera
- `semana_inicio`: Fecha del lunes de la semana (YYYY-MM-DD)

**Campos Opcionales:**
- `cliente_id`: ID del cliente
- `nodo_id`: ID del nodo
- `lunes` a `domingo`: Boolean para cada día (default: false)
- `horas_estimadas`: Número de horas estimadas (default: 8)
- `observaciones`: Texto libre
- `estado`: Estado de la programación (default: "programado")

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Programación creada exitosamente",
  "data": {
    "id": 1,
    "rut": "12345678-9",
    "cartera_id": 1,
    "cliente_id": 5,
    "nodo_id": 12,
    "semana_inicio": "2024-01-15",
    "semana_fin": "2024-01-21",
    "lunes": true,
    "martes": true,
    "miercoles": false,
    "jueves": true,
    "viernes": true,
    "sabado": false,
    "domingo": false,
    "horas_estimadas": 8,
    "observaciones": "Trabajo en planta",
    "estado": "programado",
    "created_at": "2024-01-10T10:30:00.000Z",
    "updated_at": "2024-01-10T10:30:00.000Z",
    "created_by": "sistema"
  }
}
```

**Error de Conflicto (409):**
```json
{
  "success": false,
  "message": "Ya existe programación para esta persona en esta cartera y semana"
}
```

### 4. **PUT /api/programacion/:id** - Actualizar programación

Actualiza una programación existente.

**Path Parameters:**
- `id`: ID de la programación

**Body (JSON):** Todos los campos son opcionales
```json
{
  "cliente_id": 6,
  "nodo_id": 15,
  "lunes": false,
  "martes": true,
  "miercoles": true,
  "jueves": true,
  "viernes": true,
  "sabado": false,
  "domingo": false,
  "horas_estimadas": 10,
  "observaciones": "Cambio de cliente",
  "estado": "confirmado"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Programación actualizada exitosamente",
  "data": {
    "id": 1,
    "rut": "12345678-9",
    "cartera_id": 1,
    "cliente_id": 6,
    "nodo_id": 15,
    "semana_inicio": "2024-01-15",
    "semana_fin": "2024-01-21",
    "lunes": false,
    "martes": true,
    "miercoles": true,
    "jueves": true,
    "viernes": true,
    "sabado": false,
    "domingo": false,
    "horas_estimadas": 10,
    "observaciones": "Cambio de cliente",
    "estado": "confirmado",
    "created_at": "2024-01-10T10:30:00.000Z",
    "updated_at": "2024-01-10T14:45:00.000Z",
    "created_by": "sistema"
  }
}
```

### 5. **DELETE /api/programacion/:id** - Eliminar programación

Elimina una programación existente.

**Path Parameters:**
- `id`: ID de la programación

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Programación eliminada exitosamente"
}
```

### 6. **GET /api/programacion/semana/:fecha** - Obtener programación de toda la semana

Obtiene la programación de todas las carteras para una semana específica.

**Path Parameters:**
- `fecha`: Cualquier fecha de la semana (YYYY-MM-DD)

**Ejemplo de Request:**
```javascript
GET /api/programacion/semana/2024-01-17
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "semana": {
      "inicio": "2024-01-15",
      "fin": "2024-01-21"
    },
    "programacion": [
      {
        "cartera": {
          "id": 1,
          "nombre": "SNACK"
        },
        "trabajadores": [
          {
            "id": 1,
            "rut": "12345678-9",
            "nombre_persona": "Juan Pérez",
            "cargo": "Ingeniero de Servicios",
            "cartera_id": 1,
            "nombre_cartera": "SNACK",
            "cliente_id": 5,
            "nombre_cliente": "CAROZZI - PLANTA NOS",
            "nodo_id": 12,
            "nombre_nodo": "CEREALES",
            "semana_inicio": "2024-01-15",
            "semana_fin": "2024-01-21",
            "lunes": true,
            "martes": true,
            "miercoles": false,
            "jueves": true,
            "viernes": true,
            "sabado": false,
            "domingo": false,
            "horas_estimadas": 8,
            "observaciones": "Trabajo en planta",
            "estado": "programado",
            "created_at": "2024-01-10T10:30:00.000Z",
            "updated_at": "2024-01-10T10:30:00.000Z"
          }
        ]
      }
    ]
  }
}
```

## 🔧 Implementación en React/TypeScript

### Interfaces TypeScript

```typescript
interface ProgramacionSemanal {
  id: number;
  rut: string;
  nombre_persona: string;
  cargo: string;
  cartera_id: number;
  nombre_cartera: string;
  cliente_id?: number;
  nombre_cliente?: string;
  nodo_id?: number;
  nombre_nodo?: string;
  semana_inicio: string;
  semana_fin: string;
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  sabado: boolean;
  domingo: boolean;
  horas_estimadas: number;
  observaciones?: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

interface ProgramacionRequest {
  rut: string;
  cartera_id: number;
  cliente_id?: number;
  nodo_id?: number;
  semana_inicio: string;
  lunes?: boolean;
  martes?: boolean;
  miercoles?: boolean;
  jueves?: boolean;
  viernes?: boolean;
  sabado?: boolean;
  domingo?: boolean;
  horas_estimadas?: number;
  observaciones?: string;
  estado?: string;
}

interface ProgramacionResponse {
  success: boolean;
  data: {
    cartera: {
      id: number;
      nombre: string;
    };
    semana: {
      inicio: string;
      fin: string;
    };
    programacion: ProgramacionSemanal[];
  };
}
```

### Servicio API

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://192.168.10.194:3000/api';

class ProgramacionService {
  // Obtener programación por cartera y semana
  async getProgramacionPorCartera(carteraId: number, semana?: string, fecha?: string): Promise<ProgramacionResponse> {
    const params = new URLSearchParams({ cartera_id: carteraId.toString() });
    if (semana) params.append('semana', semana);
    if (fecha) params.append('fecha', fecha);
    
    const response = await axios.get(`${API_BASE_URL}/programacion?${params}`);
    return response.data;
  }

  // Obtener programación de una persona
  async getProgramacionPersona(rut: string, semanas: number = 4): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/programacion/persona/${rut}?semanas=${semanas}`);
    return response.data;
  }

  // Crear programación
  async crearProgramacion(programacion: ProgramacionRequest): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/programacion`, programacion);
    return response.data;
  }

  // Actualizar programación
  async actualizarProgramacion(id: number, updates: Partial<ProgramacionRequest>): Promise<any> {
    const response = await axios.put(`${API_BASE_URL}/programacion/${id}`, updates);
    return response.data;
  }

  // Eliminar programación
  async eliminarProgramacion(id: number): Promise<any> {
    const response = await axios.delete(`${API_BASE_URL}/programacion/${id}`);
    return response.data;
  }

  // Obtener programación de toda la semana
  async getProgramacionSemana(fecha: string): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/programacion/semana/${fecha}`);
    return response.data;
  }
}

export const programacionService = new ProgramacionService();
```

### Hook Personalizado

```typescript
import { useState, useEffect } from 'react';
import { programacionService } from '../services/programacionService';

export const useProgramacion = (carteraId?: number, semana?: string) => {
  const [programacion, setProgramacion] = useState<ProgramacionSemanal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarProgramacion = async () => {
    if (!carteraId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await programacionService.getProgramacionPorCartera(carteraId, semana);
      setProgramacion(response.data.programacion);
    } catch (err) {
      setError('Error al cargar programación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const crearProgramacion = async (nuevaProgramacion: ProgramacionRequest) => {
    try {
      const response = await programacionService.crearProgramacion(nuevaProgramacion);
      await cargarProgramacion(); // Recargar datos
      return response;
    } catch (err) {
      setError('Error al crear programación');
      throw err;
    }
  };

  const actualizarProgramacion = async (id: number, updates: Partial<ProgramacionRequest>) => {
    try {
      const response = await programacionService.actualizarProgramacion(id, updates);
      await cargarProgramacion(); // Recargar datos
      return response;
    } catch (err) {
      setError('Error al actualizar programación');
      throw err;
    }
  };

  const eliminarProgramacion = async (id: number) => {
    try {
      await programacionService.eliminarProgramacion(id);
      await cargarProgramacion(); // Recargar datos
    } catch (err) {
      setError('Error al eliminar programación');
      throw err;
    }
  };

  useEffect(() => {
    cargarProgramacion();
  }, [carteraId, semana]);

  return {
    programacion,
    loading,
    error,
    cargarProgramacion,
    crearProgramacion,
    actualizarProgramacion,
    eliminarProgramacion
  };
};
```

### Componente de Ejemplo

```typescript
import React, { useState } from 'react';
import { useProgramacion } from '../hooks/useProgramacion';

interface ProgramacionSemanalProps {
  carteraId: number;
  semana: string;
}

export const ProgramacionSemanal: React.FC<ProgramacionSemanalProps> = ({ carteraId, semana }) => {
  const { programacion, loading, error, crearProgramacion, actualizarProgramacion } = useProgramacion(carteraId, semana);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleCrearProgramacion = async (datos: any) => {
    try {
      await crearProgramacion({
        ...datos,
        cartera_id: carteraId,
        semana_inicio: semana
      });
      setMostrarFormulario(false);
    } catch (err) {
      console.error('Error al crear programación:', err);
    }
  };

  const handleActualizarDias = async (id: number, dia: string, valor: boolean) => {
    try {
      await actualizarProgramacion(id, { [dia]: valor });
    } catch (err) {
      console.error('Error al actualizar días:', err);
    }
  };

  if (loading) return <div>Cargando programación...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="programacion-semanal">
      <h2>Programación Semanal - Cartera {carteraId}</h2>
      
      <button onClick={() => setMostrarFormulario(true)}>
        Agregar Trabajador
      </button>

      <div className="programacion-lista">
        {programacion.map((item) => (
          <div key={item.id} className="programacion-item">
            <h3>{item.nombre_persona}</h3>
            <p>Cargo: {item.cargo}</p>
            {item.nombre_cliente && <p>Cliente: {item.nombre_cliente}</p>}
            {item.nombre_nodo && <p>Nodo: {item.nombre_nodo}</p>}
            
            <div className="dias-semana">
              {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                <label key={dia}>
                  <input
                    type="checkbox"
                    checked={item[dia as keyof ProgramacionSemanal] as boolean}
                    onChange={(e) => handleActualizarDias(item.id, dia, e.target.checked)}
                  />
                  {dia.charAt(0).toUpperCase() + dia.slice(1)}
                </label>
              ))}
            </div>
            
            <p>Horas estimadas: {item.horas_estimadas}</p>
            {item.observaciones && <p>Observaciones: {item.observaciones}</p>}
            <p>Estado: {item.estado}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 📊 Estados de Programación

- `programado`: Programación inicial creada
- `confirmado`: Programación confirmada por el trabajador
- `en_progreso`: Trabajo en curso
- `completado`: Trabajo completado
- `cancelado`: Programación cancelada

## ⚠️ Consideraciones Importantes

1. **Unicidad**: No se puede crear programación duplicada para la misma persona, cartera y semana
2. **Validación**: El sistema valida que la persona, cartera, cliente y nodo existan
3. **Historial**: Todas las operaciones se registran en el historial para auditoría
4. **Fechas**: Las fechas de semana se calculan automáticamente basándose en el lunes
5. **Asignaciones**: Los trabajadores deben estar asignados a las carteras antes de ser programados

## 🔄 Flujo de Trabajo Recomendado

1. **Asignar trabajadores a carteras** usando `/api/asignaciones`
2. **Crear programación semanal** usando `/api/programacion`
3. **Actualizar días de trabajo** según necesidades
4. **Confirmar programación** cambiando estado a "confirmado"
5. **Seguir progreso** actualizando estado según avance

## 📱 Ejemplo de Uso Completo

```typescript
// 1. Obtener programación de cartera SNACK para esta semana
const programacion = await programacionService.getProgramacionPorCartera(1);

// 2. Crear nueva programación
const nuevaProgramacion = await programacionService.crearProgramacion({
  rut: "12345678-9",
  cartera_id: 1,
  cliente_id: 5,
  nodo_id: 12,
  semana_inicio: "2024-01-15",
  lunes: true,
  martes: true,
  miercoles: false,
  jueves: true,
  viernes: true,
  horas_estimadas: 8,
  observaciones: "Trabajo en planta"
});

// 3. Actualizar días de trabajo
await programacionService.actualizarProgramacion(1, {
  miercoles: true,
  horas_estimadas: 10,
  estado: "confirmado"
});

// 4. Obtener vista completa de la semana
const semanaCompleta = await programacionService.getProgramacionSemana("2024-01-17");
```
