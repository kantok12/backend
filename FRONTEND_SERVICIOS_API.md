# 🏢 API del Esquema Servicios - Documentación para Frontend

## 📋 Información General

**Base URL:** `http://192.168.10.194:3000/api/servicios`

**Estructura Jerárquica:** `Cartera → Cliente → Nodo`

---

## 🎯 Endpoints Disponibles

### 📊 **Carteras**

#### `GET /api/servicios/carteras`
Listar todas las carteras con paginación y búsqueda.

**Parámetros de Query:**
- `limit` (opcional): Número de registros por página (default: 20)
- `offset` (opcional): Número de registros a saltar (default: 0)
- `search` (opcional): Búsqueda por nombre de cartera

**Respuesta:**
```json
{
  "success": true,
  "message": "Carteras obtenidas exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "SNACK",
      "fecha_creacion": "2024-01-15T10:30:00Z",
      "total_clientes": 16,
      "total_nodos": 14
    }
  ],
  "pagination": {
    "total": 6,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

#### `GET /api/servicios/carteras/:id`
Obtener una cartera específica con sus clientes.

**Respuesta:**
```json
{
  "success": true,
  "message": "Cartera obtenida exitosamente",
  "data": {
    "id": 1,
    "nombre": "SNACK",
    "fecha_creacion": "2024-01-15T10:30:00Z",
    "total_clientes": 16,
    "total_nodos": 14,
    "clientes": [
      {
        "id": 1,
        "nombre": "ACONCAGUA FOODS - BUIN",
        "created_at": "2024-01-15T10:30:00Z",
        "region_id": null,
        "total_nodos": 1
      }
    ]
  }
}
```

#### `POST /api/servicios/carteras`
Crear una nueva cartera.

**Body:**
```json
{
  "name": "NUEVA CARTEA"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cartera creada exitosamente",
  "data": {
    "id": 7,
    "name": "NUEVA CARTEA",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 👥 **Clientes**

#### `GET /api/servicios/clientes`
Listar todos los clientes con filtros.

**Parámetros de Query:**
- `limit` (opcional): Número de registros por página (default: 20)
- `offset` (opcional): Número de registros a saltar (default: 0)
- `search` (opcional): Búsqueda por nombre de cliente
- `cartera_id` (opcional): Filtrar por ID de cartera

**Respuesta:**
```json
{
  "success": true,
  "message": "Clientes obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "ACONCAGUA FOODS - BUIN",
      "cartera_id": 1,
      "created_at": "2024-01-15T10:30:00Z",
      "region_id": null,
      "cartera_nombre": "SNACK",
      "total_nodos": 1
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### `GET /api/servicios/clientes/:id`
Obtener un cliente específico con sus nodos.

**Respuesta:**
```json
{
  "success": true,
  "message": "Cliente obtenido exitosamente",
  "data": {
    "id": 1,
    "nombre": "ACONCAGUA FOODS - BUIN",
    "cartera_id": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "region_id": null,
    "cartera_nombre": "SNACK",
    "total_nodos": 1,
    "nodos": [
      {
        "id": 1,
        "nombre": "ACONCAGUA FOODS - BUIN",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### `POST /api/servicios/clientes`
Crear un nuevo cliente.

**Body:**
```json
{
  "nombre": "NUEVO CLIENTE",
  "cartera_id": 1,
  "region_id": 1
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cliente creado exitosamente",
  "data": {
    "id": 46,
    "nombre": "NUEVO CLIENTE",
    "cartera_id": 1,
    "region_id": 1,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 🏢 **Nodos**

#### `GET /api/servicios/nodos`
Listar todos los nodos con filtros.

**Parámetros de Query:**
- `limit` (opcional): Número de registros por página (default: 20)
- `offset` (opcional): Número de registros a saltar (default: 0)
- `search` (opcional): Búsqueda por nombre de nodo
- `cliente_id` (opcional): Filtrar por ID de cliente
- `cartera_id` (opcional): Filtrar por ID de cartera

**Respuesta:**
```json
{
  "success": true,
  "message": "Nodos obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "ACONCAGUA FOODS - BUIN",
      "cliente_id": 1,
      "created_at": "2024-01-15T10:30:00Z",
      "cliente_nombre": "ACONCAGUA FOODS - BUIN",
      "cartera_id": 1,
      "cartera_nombre": "SNACK"
    }
  ],
  "pagination": {
    "total": 62,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### `GET /api/servicios/nodos/:id`
Obtener un nodo específico.

**Respuesta:**
```json
{
  "success": true,
  "message": "Nodo obtenido exitosamente",
  "data": {
    "id": 1,
    "nombre": "ACONCAGUA FOODS - BUIN",
    "cliente_id": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "cliente_nombre": "ACONCAGUA FOODS - BUIN",
    "cartera_id": 1,
    "cartera_nombre": "SNACK"
  }
}
```

#### `POST /api/servicios/nodos`
Crear un nuevo nodo.

**Body:**
```json
{
  "nombre": "NUEVO NODO",
  "cliente_id": 1
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Nodo creado exitosamente",
  "data": {
    "id": 63,
    "nombre": "NUEVO NODO",
    "cliente_id": 1,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 🏗️ **Estructura Completa**

#### `GET /api/servicios/estructura`
Obtener la estructura jerárquica completa (Cartera → Cliente → Nodo).

**Parámetros de Query:**
- `cartera_id` (opcional): Filtrar por ID de cartera
- `cliente_id` (opcional): Filtrar por ID de cliente

**Respuesta:**
```json
{
  "success": true,
  "message": "Estructura obtenida exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "SNACK",
      "created_at": "2024-01-15T10:30:00Z",
      "clientes": [
        {
          "id": 1,
          "nombre": "ACONCAGUA FOODS - BUIN",
          "created_at": "2024-01-15T10:30:00Z",
          "region_id": null,
          "nodos": [
            {
              "id": 1,
              "nombre": "ACONCAGUA FOODS - BUIN",
              "created_at": "2024-01-15T10:30:00Z"
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 📊 **Estadísticas**

#### `GET /api/servicios/estadisticas`
Obtener estadísticas generales del sistema.

**Respuesta:**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "totales": {
      "carteras": 6,
      "clientes": 45,
      "nodos": 62
    },
    "por_cartera": [
      {
        "id": 1,
        "cartera_nombre": "SNACK",
        "total_clientes": 1,
        "total_nodos": 1
      },
      {
        "id": 2,
        "cartera_nombre": "CAROZZI",
        "total_clientes": 6,
        "total_nodos": 20
      }
    ]
  }
}
```

---

## 🔧 Implementación en React/TypeScript

### Configuración de API

```typescript
// config/api.ts
const BASE_URL = 'http://192.168.10.194:3000/api/servicios';

export const serviciosAPI = {
  // Carteras
  getCarteras: (params?: { limit?: number; offset?: number; search?: string }) =>
    axios.get(`${BASE_URL}/carteras`, { params }),
  
  getCartera: (id: number) =>
    axios.get(`${BASE_URL}/carteras/${id}`),
  
  createCartera: (data: { name: string }) =>
    axios.post(`${BASE_URL}/carteras`, data),

  // Clientes
  getClientes: (params?: { limit?: number; offset?: number; search?: string; cartera_id?: number }) =>
    axios.get(`${BASE_URL}/clientes`, { params }),
  
  getCliente: (id: number) =>
    axios.get(`${BASE_URL}/clientes/${id}`),
  
  createCliente: (data: { nombre: string; cartera_id: number; region_id?: number }) =>
    axios.post(`${BASE_URL}/clientes`, data),

  // Nodos
  getNodos: (params?: { limit?: number; offset?: number; search?: string; cliente_id?: number; cartera_id?: number }) =>
    axios.get(`${BASE_URL}/nodos`, { params }),
  
  getNodo: (id: number) =>
    axios.get(`${BASE_URL}/nodos/${id}`),
  
  createNodo: (data: { nombre: string; cliente_id: number }) =>
    axios.post(`${BASE_URL}/nodos`, data),

  // Estructura y Estadísticas
  getEstructura: (params?: { cartera_id?: number; cliente_id?: number }) =>
    axios.get(`${BASE_URL}/estructura`, { params }),
  
  getEstadisticas: () =>
    axios.get(`${BASE_URL}/estadisticas`)
};
```

### Hooks Personalizados

```typescript
// hooks/useServicios.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviciosAPI } from '../config/api';

export const useCarteras = (params?: any) => {
  return useQuery({
    queryKey: ['carteras', params],
    queryFn: () => serviciosAPI.getCarteras(params),
    select: (data) => data.data
  });
};

export const useClientes = (params?: any) => {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => serviciosAPI.getClientes(params),
    select: (data) => data.data
  });
};

export const useNodos = (params?: any) => {
  return useQuery({
    queryKey: ['nodos', params],
    queryFn: () => serviciosAPI.getNodos(params),
    select: (data) => data.data
  });
};

export const useEstructura = (params?: any) => {
  return useQuery({
    queryKey: ['estructura', params],
    queryFn: () => serviciosAPI.getEstructura(params),
    select: (data) => data.data
  });
};

export const useEstadisticas = () => {
  return useQuery({
    queryKey: ['estadisticas'],
    queryFn: () => serviciosAPI.getEstadisticas(),
    select: (data) => data.data
  });
};
```

### Componente de Ejemplo

```typescript
// components/ServiciosDashboard.tsx
import React from 'react';
import { useCarteras, useEstructura, useEstadisticas } from '../hooks/useServicios';

const ServiciosDashboard: React.FC = () => {
  const { data: carteras, isLoading: carterasLoading } = useCarteras();
  const { data: estructura, isLoading: estructuraLoading } = useEstructura();
  const { data: estadisticas, isLoading: estadisticasLoading } = useEstadisticas();

  if (carterasLoading || estructuraLoading || estadisticasLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h1>Dashboard de Servicios</h1>
      
      {/* Estadísticas */}
      <div className="stats">
        <h2>Estadísticas Generales</h2>
        <p>Carteras: {estadisticas?.totales.carteras}</p>
        <p>Clientes: {estadisticas?.totales.clientes}</p>
        <p>Nodos: {estadisticas?.totales.nodos}</p>
      </div>

      {/* Estructura Jerárquica */}
      <div className="estructura">
        <h2>Estructura Jerárquica</h2>
        {estructura?.map((cartera) => (
          <div key={cartera.id} className="cartera">
            <h3>{cartera.nombre}</h3>
            {cartera.clientes.map((cliente) => (
              <div key={cliente.id} className="cliente">
                <h4>{cliente.nombre}</h4>
                {cliente.nodos.map((nodo) => (
                  <div key={nodo.id} className="nodo">
                    <p>{nodo.nombre}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiciosDashboard;
```

---

## ⚠️ Notas Importantes

1. **Autenticación:** Actualmente no se requiere autenticación, pero se puede implementar en el futuro.

2. **Validaciones:** Todos los endpoints incluyen validaciones de datos de entrada.

3. **Paginación:** Los endpoints de listado incluyen paginación para manejar grandes volúmenes de datos.

4. **Búsqueda:** Se puede buscar por nombre en todos los endpoints de listado.

5. **Relaciones:** Los endpoints respetan las relaciones jerárquicas: Cartera → Cliente → Nodo.

6. **CORS:** Configurado para permitir acceso desde el frontend en `http://192.168.10.194:3001`.

---

## 🚀 Próximos Pasos

1. Implementar endpoints de actualización (PUT) y eliminación (DELETE)
2. Agregar autenticación y autorización
3. Implementar filtros avanzados
4. Agregar validaciones de negocio específicas
5. Implementar logging y monitoreo
