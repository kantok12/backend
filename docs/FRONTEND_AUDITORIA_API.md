# 📊 Sistema de Auditoría Híbrido - API Frontend

## 🎯 **Descripción General**

El **Sistema de Auditoría Híbrido** proporciona un monitoreo completo de todas las operaciones críticas en la base de datos, combinando:

- ✅ **Auditoría automática** mediante triggers en tablas críticas
- ✅ **Notificaciones manuales** para eventos específicos
- ✅ **Dashboard en tiempo real** de actividad del sistema
- ✅ **Historial completo** de cambios por registro

---

## 🏗️ **Arquitectura del Sistema**

### **Esquemas de Base de Datos:**

#### **1. Esquema `sistema`** (Nuevo)
- **`auditoria_log`**: Registro de todas las operaciones CRUD
- **`notificaciones`**: Sistema de notificaciones para el frontend
- **`configuracion_auditoria`**: Configuración por tabla

#### **2. Tablas Monitoreadas Automáticamente:**
- `mantenimiento.personal_disponible` 🔴 **CRÍTICO**
- `mantenimiento.documentos` 🔴 **CRÍTICO**
- `mantenimiento.programacion_semanal` 🔴 **CRÍTICO**
- `mantenimiento.belray` 🟡 **NORMAL**
- `servicios.carteras` 🔴 **CRÍTICO**
- `servicios.clientes` 🔴 **CRÍTICO**
- `servicios.nodos` 🔴 **CRÍTICO**

---

## 🔗 **Endpoints Disponibles**

### **📊 Dashboard de Actividad**

#### **GET /api/auditoria/dashboard**
**Descripción**: Dashboard principal con actividad en tiempo real.

**Parámetros de Query:**
- `limit` (opcional): Número de registros (default: 50)
- `offset` (opcional): Desplazamiento (default: 0)
- `tabla` (opcional): Filtrar por tabla específica
- `operacion` (opcional): Filtrar por operación (INSERT, UPDATE, DELETE)
- `usuario` (opcional): Filtrar por usuario
- `es_critico` (opcional): Filtrar por criticidad (true/false)
- `desde` (opcional): Fecha desde (YYYY-MM-DD)
- `hasta` (opcional): Fecha hasta (YYYY-MM-DD)

**Ejemplo de Request:**
```bash
GET /api/auditoria/dashboard?limit=20&es_critico=true&tabla=personal_disponible
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Dashboard de actividad obtenido exitosamente",
  "data": {
    "actividades": [
      {
        "id": "1",
        "tabla_afectada": "belray",
        "operacion": "INSERT",
        "registro_id": "4",
        "usuario": "sistema",
        "timestamp": "2025-10-15T13:46:07.447Z",
        "es_critico": false,
        "contexto": "Registro creado",
        "endpoint": "/api/belray",
        "color_operacion": "success",
        "icono": "✅"
      }
    ],
    "estadisticas": {
      "total_actividades": "1",
      "actividades_criticas": "0",
      "inserciones": "1",
      "actualizaciones": "0",
      "eliminaciones": "0",
      "usuarios_activos": "1",
      "tablas_afectadas": "1"
    },
    "actividad_por_tabla": [
      {
        "tabla_afectada": "belray",
        "total_operaciones": "1",
        "inserciones": "1",
        "actualizaciones": "0",
        "eliminaciones": "0",
        "criticas": "0"
      }
    ],
    "actividad_por_usuario": [
      {
        "usuario": "sistema",
        "total_operaciones": "1",
        "criticas": "0",
        "ultima_actividad": "2025-10-15T13:46:07.447Z"
      }
    ]
  }
}
```

---

### **🔔 Sistema de Notificaciones**

#### **GET /api/auditoria/notificaciones**
**Descripción**: Obtener notificaciones del sistema.

**Parámetros de Query:**
- `limit` (opcional): Número de notificaciones (default: 20)
- `offset` (opcional): Desplazamiento (default: 0)
- `tipo` (opcional): Filtrar por tipo (info, warning, error, success, critical)
- `leida` (opcional): Filtrar por estado (true/false)
- `usuario_destino` (opcional): Filtrar por usuario destino

**Ejemplo de Request:**
```bash
GET /api/auditoria/notificaciones?tipo=critical&leida=false
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Notificaciones obtenidas exitosamente",
  "data": {
    "notificaciones": [
      {
        "id": "1",
        "tipo": "info",
        "titulo": "Sistema de Auditoría Iniciado",
        "mensaje": "El sistema híbrido de auditoría ha sido implementado exitosamente",
        "usuario_destino": null,
        "leida": false,
        "timestamp": "2025-10-15T13:45:54.621Z",
        "es_critico": false,
        "tabla_afectada": null,
        "operacion": null,
        "registro_id": null
      }
    ],
    "total_no_leidas": "1"
  }
}
```

---

#### **POST /api/auditoria/notificaciones**
**Descripción**: Crear notificación manual.

**Body (JSON):**
```json
{
  "tipo": "warning",
  "titulo": "Operación Crítica Detectada",
  "mensaje": "Se ha detectado una operación que requiere atención",
  "usuario_destino": "admin",
  "es_critico": true,
  "metadata": {
    "tabla": "personal_disponible",
    "operacion": "DELETE",
    "registro_id": "12345678-9"
  },
  "expira_en": "2025-10-20T00:00:00Z"
}
```

**Campos Requeridos:**
- `tipo`: Tipo de notificación (info, warning, error, success, critical)
- `titulo`: Título de la notificación
- `mensaje`: Mensaje descriptivo

**Campos Opcionales:**
- `usuario_destino`: Usuario específico (null = todos)
- `es_critico`: Si es crítica (default: false)
- `metadata`: Datos adicionales en JSON
- `expira_en`: Fecha de expiración

---

#### **PUT /api/auditoria/notificaciones/:id/marcar-leida**
**Descripción**: Marcar notificación como leída.

**Ejemplo de Request:**
```bash
PUT /api/auditoria/notificaciones/1/marcar-leida
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Notificación marcada como leída",
  "data": {
    "id": "1",
    "leida": true,
    "timestamp": "2025-10-15T13:45:54.621Z"
  }
}
```

---

### **📋 Historial de Cambios**

#### **GET /api/auditoria/historial/:tabla/:id**
**Descripción**: Obtener historial completo de cambios de un registro específico.

**Parámetros:**
- `tabla` (requerido): Nombre de la tabla
- `id` (requerido): ID del registro

**Parámetros de Query:**
- `limit` (opcional): Número de registros (default: 20)
- `offset` (opcional): Desplazamiento (default: 0)

**Ejemplo de Request:**
```bash
GET /api/auditoria/historial/belray/4?limit=10
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Historial obtenido exitosamente",
  "data": {
    "tabla": "belray",
    "registro_id": "4",
    "historial": [
      {
        "id": "1",
        "operacion": "INSERT",
        "datos_anteriores": null,
        "datos_nuevos": {
          "id": 4,
          "nombre": "Empresa de Prueba Auditoría",
          "descripcion": "Empresa creada para probar el sistema de auditoría"
        },
        "usuario": "sistema",
        "timestamp": "2025-10-15T13:46:07.447Z",
        "es_critico": false,
        "contexto": "Registro creado"
      }
    ],
    "total_cambios": 1
  }
}
```

---

### **📊 Estadísticas del Sistema**

#### **GET /api/auditoria/estadisticas**
**Descripción**: Estadísticas generales del sistema de auditoría.

**Parámetros de Query:**
- `periodo` (opcional): Días a analizar (default: 7)

**Ejemplo de Request:**
```bash
GET /api/auditoria/estadisticas?periodo=30
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "periodo_dias": 30,
    "estadisticas_generales": {
      "total_operaciones": "150",
      "operaciones_criticas": "25",
      "inserciones": "60",
      "actualizaciones": "70",
      "eliminaciones": "20",
      "usuarios_activos": "8",
      "tablas_afectadas": "7"
    },
    "actividad_diaria": [
      {
        "fecha": "2025-10-15",
        "total_operaciones": "15",
        "criticas": "3"
      }
    ],
    "top_usuarios": [
      {
        "usuario": "admin",
        "total_operaciones": "45",
        "criticas": "8"
      }
    ],
    "top_tablas": [
      {
        "tabla_afectada": "personal_disponible",
        "total_operaciones": "50",
        "criticas": "10"
      }
    ]
  }
}
```

---

### **🧹 Mantenimiento del Sistema**

#### **POST /api/auditoria/limpiar-logs**
**Descripción**: Limpiar logs antiguos del sistema.

**Body (JSON):**
```json
{
  "dias_antiguedad": 90
}
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Limpieza de logs completada",
  "data": {
    "dias_antiguedad": 90,
    "registros_eliminados": 1250
  }
}
```

---

## 🔧 **Implementación Frontend**

### **TypeScript Interfaces**

```typescript
// interfaces/auditoria.ts
export interface ActividadAuditoria {
  id: string;
  tabla_afectada: string;
  operacion: 'INSERT' | 'UPDATE' | 'DELETE';
  registro_id: string;
  usuario: string;
  timestamp: string;
  es_critico: boolean;
  contexto: string;
  endpoint: string;
  color_operacion: 'success' | 'info' | 'warning';
  icono: string;
}

export interface Notificacion {
  id: string;
  tipo: 'info' | 'warning' | 'error' | 'success' | 'critical';
  titulo: string;
  mensaje: string;
  usuario_destino?: string;
  leida: boolean;
  timestamp: string;
  es_critico: boolean;
  metadata?: any;
}

export interface EstadisticasAuditoria {
  total_operaciones: number;
  operaciones_criticas: number;
  inserciones: number;
  actualizaciones: number;
  eliminaciones: number;
  usuarios_activos: number;
  tablas_afectadas: number;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    actividades: ActividadAuditoria[];
    estadisticas: EstadisticasAuditoria;
    actividad_por_tabla: any[];
    actividad_por_usuario: any[];
  };
}
```

### **Service de Auditoría**

```typescript
// services/auditoriaService.ts
import { ActividadAuditoria, Notificacion, DashboardResponse } from '../interfaces/auditoria';

class AuditoriaService {
  private baseUrl = 'http://localhost:3000/api/auditoria';

  async getDashboard(filtros: any = {}): Promise<DashboardResponse> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/dashboard?${params}`);
    return response.json();
  }

  async getNotificaciones(filtros: any = {}): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/notificaciones?${params}`);
    return response.json();
  }

  async createNotification(notificacion: Partial<Notificacion>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/notificaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificacion),
    });
    return response.json();
  }

  async marcarNotificacionLeida(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/notificaciones/${id}/marcar-leida`, {
      method: 'PUT',
    });
    return response.json();
  }

  async getHistorial(tabla: string, id: string, limit = 20): Promise<any> {
    const response = await fetch(`${this.baseUrl}/historial/${tabla}/${id}?limit=${limit}`);
    return response.json();
  }

  async getEstadisticas(periodo = 7): Promise<any> {
    const response = await fetch(`${this.baseUrl}/estadisticas?periodo=${periodo}`);
    return response.json();
  }

  async limpiarLogs(diasAntiguedad = 90): Promise<any> {
    const response = await fetch(`${this.baseUrl}/limpiar-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dias_antiguedad: diasAntiguedad }),
    });
    return response.json();
  }
}

export const auditoriaService = new AuditoriaService();
```

### **React Hook para Dashboard**

```typescript
// hooks/useAuditoriaDashboard.ts
import { useState, useEffect } from 'react';
import { auditoriaService } from '../services/auditoriaService';

export const useAuditoriaDashboard = (filtros = {}) => {
  const [actividades, setActividades] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await auditoriaService.getDashboard(filtros);
      if (response.success) {
        setActividades(response.data.actividades);
        setEstadisticas(response.data.estadisticas);
      } else {
        setError('Error al cargar dashboard');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [JSON.stringify(filtros)]);

  return {
    actividades,
    estadisticas,
    loading,
    error,
    refetch: fetchDashboard
  };
};
```

### **React Hook para Notificaciones**

```typescript
// hooks/useNotificaciones.ts
import { useState, useEffect } from 'react';
import { auditoriaService } from '../services/auditoriaService';

export const useNotificaciones = (filtros = {}) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [totalNoLeidas, setTotalNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotificaciones = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await auditoriaService.getNotificaciones(filtros);
      if (response.success) {
        setNotificaciones(response.data.notificaciones);
        setTotalNoLeidas(response.data.total_no_leidas);
      } else {
        setError('Error al cargar notificaciones');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (id: string) => {
    try {
      await auditoriaService.marcarNotificacionLeida(id);
      await fetchNotificaciones(); // Recargar
    } catch (err) {
      setError('Error marcando notificación como leída');
    }
  };

  const crearNotificacion = async (notificacion: any) => {
    try {
      const response = await auditoriaService.createNotification(notificacion);
      if (response.success) {
        await fetchNotificaciones(); // Recargar
        return response.data;
      }
      throw new Error('Error creando notificación');
    } catch (err) {
      setError('Error creando notificación');
      throw err;
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, [JSON.stringify(filtros)]);

  return {
    notificaciones,
    totalNoLeidas,
    loading,
    error,
    marcarComoLeida,
    crearNotificacion,
    refetch: fetchNotificaciones
  };
};
```

### **Componente de Dashboard**

```typescript
// components/AuditoriaDashboard.tsx
import React, { useState } from 'react';
import { useAuditoriaDashboard } from '../hooks/useAuditoriaDashboard';

export const AuditoriaDashboard: React.FC = () => {
  const [filtros, setFiltros] = useState({
    limit: 50,
    es_critico: null,
    tabla: null,
    operacion: null
  });

  const { actividades, estadisticas, loading, error, refetch } = useAuditoriaDashboard(filtros);

  if (loading) return <div>Cargando dashboard...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="auditoria-dashboard">
      <h2>📊 Dashboard de Auditoría</h2>
      
      {/* Filtros */}
      <div className="filtros">
        <select 
          value={filtros.tabla || ''} 
          onChange={(e) => setFiltros({...filtros, tabla: e.target.value || null})}
        >
          <option value="">Todas las tablas</option>
          <option value="personal_disponible">Personal</option>
          <option value="documentos">Documentos</option>
          <option value="belray">Belray</option>
        </select>
        
        <select 
          value={filtros.operacion || ''} 
          onChange={(e) => setFiltros({...filtros, operacion: e.target.value || null})}
        >
          <option value="">Todas las operaciones</option>
          <option value="INSERT">Creaciones</option>
          <option value="UPDATE">Actualizaciones</option>
          <option value="DELETE">Eliminaciones</option>
        </select>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="estadisticas">
          <div className="stat-card">
            <h3>Total Actividades</h3>
            <span className="stat-number">{estadisticas.total_actividades}</span>
          </div>
          <div className="stat-card critical">
            <h3>Críticas</h3>
            <span className="stat-number">{estadisticas.actividades_criticas}</span>
          </div>
          <div className="stat-card">
            <h3>Usuarios Activos</h3>
            <span className="stat-number">{estadisticas.usuarios_activos}</span>
          </div>
        </div>
      )}

      {/* Lista de Actividades */}
      <div className="actividades">
        <h3>Actividad Reciente</h3>
        {actividades.map((actividad) => (
          <div key={actividad.id} className={`actividad ${actividad.color_operacion}`}>
            <span className="icono">{actividad.icono}</span>
            <div className="contenido">
              <div className="operacion">
                {actividad.operacion} en {actividad.tabla_afectada}
              </div>
              <div className="detalles">
                ID: {actividad.registro_id} | {actividad.contexto}
              </div>
              <div className="timestamp">
                {new Date(actividad.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### **Componente de Notificaciones**

```typescript
// components/NotificacionesPanel.tsx
import React from 'react';
import { useNotificaciones } from '../hooks/useNotificaciones';

export const NotificacionesPanel: React.FC = () => {
  const { 
    notificaciones, 
    totalNoLeidas, 
    loading, 
    error, 
    marcarComoLeida 
  } = useNotificaciones({ leida: false });

  if (loading) return <div>Cargando notificaciones...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="notificaciones-panel">
      <h3>🔔 Notificaciones ({totalNoLeidas})</h3>
      
      {notificaciones.map((notif) => (
        <div 
          key={notif.id} 
          className={`notificacion ${notif.tipo} ${notif.leida ? 'leida' : 'no-leida'}`}
          onClick={() => marcarComoLeida(notif.id)}
        >
          <div className="notificacion-header">
            <span className="tipo">{notif.tipo}</span>
            <span className="timestamp">
              {new Date(notif.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="titulo">{notif.titulo}</div>
          <div className="mensaje">{notif.mensaje}</div>
          {notif.es_critico && <span className="critica">🔴 CRÍTICA</span>}
        </div>
      ))}
    </div>
  );
};
```

---

## 🚀 **Características del Sistema**

### **✅ Auditoría Automática:**
- **Triggers automáticos** en 7 tablas críticas
- **Registro completo** de INSERT, UPDATE, DELETE
- **Datos antes/después** en formato JSON
- **Contexto de usuario** y endpoint

### **✅ Notificaciones Inteligentes:**
- **Notificaciones automáticas** para operaciones críticas
- **Notificaciones manuales** para eventos específicos
- **Sistema de tipos** (info, warning, error, success, critical)
- **Expiración automática** de notificaciones

### **✅ Dashboard en Tiempo Real:**
- **Actividad reciente** con filtros avanzados
- **Estadísticas detalladas** por tabla y usuario
- **Indicadores visuales** de criticidad
- **Historial completo** por registro

### **✅ Mantenimiento Automático:**
- **Limpieza automática** de logs antiguos
- **Configuración flexible** por tabla
- **Optimización de rendimiento** con índices

---

## 📋 **Tipos de Notificaciones**

| Tipo | Icono | Uso | Ejemplo |
|------|-------|-----|---------|
| `info` | ℹ️ | Información general | "Nuevo usuario registrado" |
| `success` | ✅ | Operaciones exitosas | "Registro creado exitosamente" |
| `warning` | ⚠️ | Advertencias | "Documento próximo a vencer" |
| `error` | ❌ | Errores del sistema | "Error al procesar archivo" |
| `critical` | 🔴 | Operaciones críticas | "Personal eliminado del sistema" |

---

## 🔧 **Configuración Avanzada**

### **Configurar Auditoría por Tabla:**
```sql
-- Activar/desactivar auditoría para una tabla
UPDATE sistema.configuracion_auditoria 
SET auditar_delete = false 
WHERE tabla = 'belray';

-- Marcar tabla como crítica
UPDATE sistema.configuracion_auditoria 
SET es_critico = true 
WHERE tabla = 'personal_disponible';
```

### **Limpieza Programada:**
```sql
-- Limpiar logs más antiguos que 30 días
SELECT sistema.limpiar_logs_antiguos(30);
```

---

*Documentación generada el 15 de octubre de 2025*
