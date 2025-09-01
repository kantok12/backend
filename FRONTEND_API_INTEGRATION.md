# 🔗 API ENDPOINTS PARA INTEGRACIÓN FRONTEND

## 🚀 **Configuración Base**

```javascript
// Configuración base para el frontend
const API_BASE_URL = 'http://localhost:3000/api';

// Headers por defecto
const defaultHeaders = {
  'Content-Type': 'application/json',
  // No se requiere Authorization en modo desarrollo
};
```

---

## 👥 **PERSONAL DISPONIBLE - ENDPOINTS COMPLETOS**

### **📋 1. Obtener Todo el Personal Disponible**

```javascript
// GET /api/personal-disponible
const getAllPersonal = async (params = {}) => {
  const queryParams = new URLSearchParams({
    limit: params.limit || 50,
    offset: params.offset || 0,
    ...(params.search && { search: params.search }),
    ...(params.estado_id && { estado_id: params.estado_id }),
    ...(params.cargo && { cargo: params.cargo })
  });

  const response = await fetch(`${API_BASE_URL}/personal-disponible?${queryParams}`, {
    method: 'GET',
    headers: defaultHeaders
  });

  return await response.json();
};

// Ejemplo de uso:
// getAllPersonal({ limit: 100 }) // Todos los registros
// getAllPersonal({ cargo: 'Lubricador' }) // Solo lubricadores
// getAllPersonal({ search: '19838046' }) // Buscar por RUT
```

### **👤 2. Obtener Personal por RUT**

```javascript
// GET /api/personal-disponible/:rut
const getPersonalByRut = async (rut) => {
  const response = await fetch(`${API_BASE_URL}/personal-disponible/${rut}`, {
    method: 'GET',
    headers: defaultHeaders
  });

  return await response.json();
};

// Ejemplo de uso:
// getPersonalByRut('19838046-6')
```

### **✅ 3. Verificar Importación (Dashboard)**

```javascript
// GET /api/personal-disponible/verify-import
const getImportVerification = async () => {
  const response = await fetch(`${API_BASE_URL}/personal-disponible/verify-import`, {
    method: 'GET',
    headers: defaultHeaders
  });

  return await response.json();
};

// Retorna:
// {
//   estadisticas_generales: { total_registros, registros_activos, etc. },
//   distribucion_por_cargo: [...],
//   distribucion_por_zona: [...],
//   estados_disponibles: [...]
// }
```

### **➕ 4. Crear Nuevo Personal**

```javascript
// POST /api/personal-disponible
const createPersonal = async (personalData) => {
  const response = await fetch(`${API_BASE_URL}/personal-disponible`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(personalData)
  });

  return await response.json();
};

// Ejemplo de uso:
// createPersonal({
//   rut: '12345678-9',
//   sexo: 'M',
//   fecha_nacimiento: '1990-01-01',
//   licencia_conducir: 'B',
//   talla_zapatos: '42',
//   talla_pantalones: 'L',
//   talla_poleras: 'L',
//   cargo: 'Lubricador',
//   estado_id: 1,
//   zona_geografica: 'Metropolitana de Santiago'
// })
```

### **✏️ 5. Actualizar Personal**

```javascript
// PUT /api/personal-disponible/:rut
const updatePersonal = async (rut, personalData) => {
  const response = await fetch(`${API_BASE_URL}/personal-disponible/${rut}`, {
    method: 'PUT',
    headers: defaultHeaders,
    body: JSON.stringify(personalData)
  });

  return await response.json();
};

// Ejemplo de uso:
// updatePersonal('19838046-6', { cargo: 'Supervisor', estado_id: 2 })
```

### **🗑️ 6. Eliminar Personal**

```javascript
// DELETE /api/personal-disponible/:rut
const deletePersonal = async (rut) => {
  const response = await fetch(`${API_BASE_URL}/personal-disponible/${rut}`, {
    method: 'DELETE',
    headers: defaultHeaders
  });

  return await response.json();
};

// Ejemplo de uso:
// deletePersonal('19838046-6')
```

---

## 📊 **ESTADOS - ENDPOINTS**

### **📋 1. Obtener Todos los Estados**

```javascript
// GET /api/estados
const getAllEstados = async () => {
  const response = await fetch(`${API_BASE_URL}/estados`, {
    method: 'GET',
    headers: defaultHeaders
  });

  return await response.json();
};

// Retorna:
// {
//   success: true,
//   data: [
//     { id: 1, nombre: 'Activo', descripcion: 'Personal activo y disponible' },
//     { id: 2, nombre: 'Inactivo', descripcion: 'Personal temporalmente inactivo' },
//     // ...
//   ]
// }
```

### **👤 2. Obtener Estado por ID**

```javascript
// GET /api/estados/:id
const getEstadoById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/estados/${id}`, {
    method: 'GET',
    headers: defaultHeaders
  });

  return await response.json();
};
```

---

## 🏥 **UTILIDADES - ENDPOINTS**

### **🔍 Health Check**

```javascript
// GET /api/health
const checkServerHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: defaultHeaders
  });

  return await response.json();
};
```

---

## 🔧 **HOOKS REACT PERSONALIZADOS**

### **Hook para Personal Disponible**

```javascript
// hooks/usePersonalDisponible.js
import { useState, useEffect } from 'react';

export const usePersonalDisponible = (params = {}) => {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchPersonal = async () => {
    try {
      setLoading(true);
      const data = await getAllPersonal(params);
      
      if (data.success) {
        setPersonal(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonal();
  }, [JSON.stringify(params)]);

  return {
    personal,
    loading,
    error,
    pagination,
    refetch: fetchPersonal
  };
};

// Uso en componente:
// const { personal, loading, error } = usePersonalDisponible({ limit: 50 });
```

### **Hook para Estados**

```javascript
// hooks/useEstados.js
import { useState, useEffect } from 'react';

export const useEstados = () => {
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const data = await getAllEstados();
        if (data.success) {
          setEstados(data.data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEstados();
  }, []);

  return { estados, loading, error };
};
```

---

## 📱 **EJEMPLOS DE COMPONENTES REACT**

### **Listado de Personal**

```jsx
// components/PersonalList.jsx
import React from 'react';
import { usePersonalDisponible } from '../hooks/usePersonalDisponible';

const PersonalList = () => {
  const { personal, loading, error, pagination } = usePersonalDisponible({
    limit: 20
  });

  if (loading) return <div>Cargando personal...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Personal Disponible ({pagination?.total} registros)</h2>
      <div className="grid">
        {personal.map((persona) => (
          <div key={persona.rut} className="card">
            <h3>{persona.comentario_estado?.replace('Importado: ', '')}</h3>
            <p><strong>RUT:</strong> {persona.rut}</p>
            <p><strong>Cargo:</strong> {persona.cargo}</p>
            <p><strong>Zona:</strong> {persona.zona_geografica}</p>
            <p><strong>Estado:</strong> {persona.estado_nombre}</p>
            <p><strong>Licencia:</strong> {persona.licencia_conducir}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### **Dashboard de Estadísticas**

```jsx
// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getImportVerification();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Cargando estadísticas...</div>;

  return (
    <div>
      <h1>Dashboard Personal Disponible</h1>
      
      {/* Estadísticas Generales */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Personal</h3>
          <p>{stats.estadisticas_generales.total_registros}</p>
        </div>
        <div className="stat-card">
          <h3>Personal Activo</h3>
          <p>{stats.estadisticas_generales.registros_activos}</p>
        </div>
        <div className="stat-card">
          <h3>Cargos Diferentes</h3>
          <p>{stats.estadisticas_generales.cargos_diferentes}</p>
        </div>
      </div>

      {/* Distribución por Cargo */}
      <div className="charts-section">
        <h2>Distribución por Cargo</h2>
        {stats.distribucion_por_cargo.map((cargo) => (
          <div key={cargo.cargo} className="cargo-bar">
            <span>{cargo.cargo}: {cargo.cantidad}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🎯 **FUNCIONES ÚTILES PARA EL FRONTEND**

### **Filtros y Búsqueda**

```javascript
// utils/personalFilters.js

export const filterPersonalByRole = (cargo) => {
  return getAllPersonal({ cargo });
};

export const searchPersonalByRut = (searchTerm) => {
  return getAllPersonal({ search: searchTerm });
};

export const getActivePersonal = () => {
  return getAllPersonal({ estado_id: 1 });
};

export const getPersonalByZone = (zona) => {
  return getAllPersonal({ zona_geografica: zona });
};
```

### **Validaciones**

```javascript
// utils/validations.js

export const validateRut = (rut) => {
  const rutPattern = /^\d{7,8}-[0-9Kk]$/;
  return rutPattern.test(rut);
};

export const validatePersonalData = (data) => {
  const errors = {};

  if (!data.rut || !validateRut(data.rut)) {
    errors.rut = 'RUT inválido';
  }

  if (!data.sexo || !['M', 'F'].includes(data.sexo)) {
    errors.sexo = 'Sexo debe ser M o F';
  }

  if (!data.fecha_nacimiento) {
    errors.fecha_nacimiento = 'Fecha de nacimiento requerida';
  }

  if (!data.cargo || data.cargo.trim().length === 0) {
    errors.cargo = 'Cargo requerido';
  }

  if (!data.estado_id || isNaN(data.estado_id)) {
    errors.estado_id = 'Estado ID requerido';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

---

## 🔧 **CONFIGURACIÓN AXIOS (Alternativa)**

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors para manejo de errores
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export default api;

// Servicios usando Axios
export const personalService = {
  getAll: (params) => api.get('/personal-disponible', { params }),
  getByRut: (rut) => api.get(`/personal-disponible/${rut}`),
  create: (data) => api.post('/personal-disponible', data),
  update: (rut, data) => api.put(`/personal-disponible/${rut}`, data),
  delete: (rut) => api.delete(`/personal-disponible/${rut}`),
  getStats: () => api.get('/personal-disponible/verify-import'),
};
```

---

## 🎨 **ESTILOS CSS SUGERIDOS**

```css
/* styles/personalComponents.css */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.stat-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  color: #495057;
}

.stat-card p {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin: 0;
}

.cargo-bar {
  background: #e9ecef;
  padding: 0.5rem 1rem;
  margin: 0.25rem 0;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.personal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.personal-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #dee2e6;
}

.personal-card h3 {
  margin: 0 0 1rem 0;
  color: #212529;
}

.personal-card p {
  margin: 0.25rem 0;
  color: #6c757d;
}
```

Esta documentación te da **todo lo necesario** para integrar el backend con cualquier frontend (React, Vue, Angular, etc.). ¿Necesitas alguna implementación específica o tienes dudas sobre algún endpoint?



