# API Belray - Documentación Frontend

## 📋 Descripción General

La API Belray proporciona endpoints para gestionar registros en la tabla `mantenimiento.belray`. Esta tabla permite almacenar información sobre sistemas, procesos o entidades relacionadas con Belray.

## 🏗️ Estructura de la Tabla

### **Tabla: `mantenimiento.belray`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Identificador único |
| `nombre` | VARCHAR(255) NOT NULL | Nombre del registro |
| `descripcion` | TEXT | Descripción detallada |
| `observaciones` | TEXT | Observaciones adicionales |
| `giro` | VARCHAR(255) | Giro comercial de la empresa |
| `numero_telefono` | VARCHAR(20) | Número de teléfono de contacto |
| `direccion` | TEXT | Dirección física de la empresa |
| `razon_social` | VARCHAR(255) | Razón social de la empresa |
| `rut_empresa` | VARCHAR(20) | RUT de la empresa |
| `comuna` | VARCHAR(100) | Comuna donde se ubica |
| `correo_electronico` | VARCHAR(255) | Correo electrónico de contacto |
| `representante_legal` | VARCHAR(255) | Nombre del representante legal |
| `gerente_general` | VARCHAR(255) | Nombre del gerente general |
| `numero_trabajadores_obra` | INTEGER | Número de trabajadores en obra/faena |
| `organismo_admin_ley_16744` | VARCHAR(255) | Organismo administrador Ley 16.744 |
| `numero_adherentes` | INTEGER | Número de adherentes |
| `tasa_siniestralidad_generica` | DECIMAL(5,2) | Tasa de siniestralidad genérica |
| `tasa_siniestralidad_adicional` | DECIMAL(5,2) | Tasa de siniestralidad adicional |
| `experto_prevencion_riesgos` | VARCHAR(255) | Nombre del experto en prevención de riesgos |
| `supervisor_coordinador_obra` | VARCHAR(255) | Nombre del supervisor o coordinador de obra |

## 🔗 Endpoints Disponibles

### **1. GET /api/belray**
**Descripción**: Listar todos los registros de Belray con paginación y filtros.

**Parámetros de Query:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Registros por página (default: 10)
- `activo` (opcional): Filtrar por estado activo (true/false)
- `search` (opcional): Búsqueda en nombre, descripción o código

**Ejemplo de Request:**
```bash
GET /api/belray?page=1&limit=5&activo=true&search=principal
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Lista de registros Belray obtenida exitosamente",
  "data": {
    "registros": [
      {
        "id": 1,
        "nombre": "Belray Principal",
        "descripcion": "Sistema principal de Belray",
        "observaciones": null,
        "giro": "Servicios de Mantenimiento Industrial",
        "numero_telefono": "+56 2 2345 6789",
        "direccion": "Av. Industrial 1234, Santiago, Región Metropolitana"
      }
    ],
    "paginacion": {
      "pagina_actual": 1,
      "total_paginas": 1,
      "total_registros": 3,
      "registros_por_pagina": 10
    }
  }
}
```

---

### **2. GET /api/belray/:id**
**Descripción**: Obtener un registro específico por ID.

**Parámetros:**
- `id` (requerido): ID del registro

**Ejemplo de Request:**
```bash
GET /api/belray/1
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Registro Belray obtenido exitosamente",
  "data": {
    "id": 1,
    "nombre": "Belray Principal",
    "descripcion": "Sistema principal de Belray",
    "codigo": "BELRAY-001",
    "activo": true,
    "fecha_creacion": "2025-10-15T12:49:38.954Z",
    "fecha_modificacion": "2025-10-15T12:49:38.954Z",
    "usuario_creacion": "sistema",
    "usuario_modificacion": null,
    "observaciones": null
  }
}
```

---

### **3. POST /api/belray**
**Descripción**: Crear un nuevo registro de Belray.

**Body (JSON):**
```json
{
  "nombre": "Empresa Industrial ABC Ltda.",
  "descripcion": "Empresa de servicios industriales especializada en mantenimiento",
  "observaciones": "Observaciones adicionales",
  "giro": "Servicios de Mantenimiento Industrial",
  "numero_telefono": "+56 2 2345 6789",
  "direccion": "Av. Industrial 1234, Santiago",
  "razon_social": "Empresa Industrial ABC Limitada",
  "rut_empresa": "76.123.456-7",
  "comuna": "Santiago",
  "correo_electronico": "contacto@empresaabc.cl",
  "representante_legal": "Juan Carlos Pérez González",
  "gerente_general": "María Elena Rodríguez Silva",
  "numero_trabajadores_obra": 150,
  "organismo_admin_ley_16744": "Mutual de Seguridad CChC",
  "numero_adherentes": 120,
  "tasa_siniestralidad_generica": 2.5,
  "tasa_siniestralidad_adicional": 1.8,
  "experto_prevencion_riesgos": "Carlos Alberto Torres",
  "supervisor_coordinador_obra": "Ana Patricia Morales"
}
```

**Campos Requeridos:**
- `nombre`: Nombre del registro

**Campos Opcionales:**
- `descripcion`: Descripción detallada
- `codigo`: Código único (debe ser único en la tabla)
- `activo`: Estado activo (default: true)
- `usuario_creacion`: Usuario que crea el registro
- `observaciones`: Observaciones adicionales
- `giro`: Giro comercial de la empresa
- `numero_telefono`: Número de teléfono de contacto
- `direccion`: Dirección física de la empresa

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Registro Belray creado exitosamente",
  "data": {
    "id": 4,
    "nombre": "Nuevo Sistema Belray",
    "descripcion": "Descripción del nuevo sistema",
    "codigo": "BELRAY-004",
    "activo": true,
    "fecha_creacion": "2025-10-15T12:55:00.000Z",
    "fecha_modificacion": "2025-10-15T12:55:00.000Z",
    "usuario_creacion": "usuario123",
    "usuario_modificacion": null,
    "observaciones": "Observaciones adicionales"
  }
}
```

---

### **4. PUT /api/belray/:id**
**Descripción**: Actualizar un registro existente.

**Parámetros:**
- `id` (requerido): ID del registro a actualizar

**Body (JSON):**
```json
{
  "nombre": "Sistema Belray Actualizado",
  "descripcion": "Nueva descripción",
  "codigo": "BELRAY-001-UPDATED",
  "activo": false,
  "usuario_modificacion": "usuario456",
  "observaciones": "Registro actualizado"
}
```

**Nota**: Todos los campos son opcionales. Solo se actualizarán los campos proporcionados.

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Registro Belray actualizado exitosamente",
  "data": {
    "id": 1,
    "nombre": "Sistema Belray Actualizado",
    "descripcion": "Nueva descripción",
    "codigo": "BELRAY-001-UPDATED",
    "activo": false,
    "fecha_creacion": "2025-10-15T12:49:38.954Z",
    "fecha_modificacion": "2025-10-15T12:55:30.000Z",
    "usuario_creacion": "sistema",
    "usuario_modificacion": "usuario456",
    "observaciones": "Registro actualizado"
  }
}
```

---

### **5. DELETE /api/belray/:id**
**Descripción**: Eliminar un registro.

**Parámetros:**
- `id` (requerido): ID del registro a eliminar

**Ejemplo de Request:**
```bash
DELETE /api/belray/4
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Registro Belray eliminado exitosamente",
  "data": {
    "id": 4,
    "nombre": "Nuevo Sistema Belray",
    "descripcion": "Descripción del nuevo sistema",
    "codigo": "BELRAY-004",
    "activo": true,
    "fecha_creacion": "2025-10-15T12:55:00.000Z",
    "fecha_modificacion": "2025-10-15T12:55:00.000Z",
    "usuario_creacion": "usuario123",
    "usuario_modificacion": null,
    "observaciones": "Observaciones adicionales"
  }
}
```

---

### **6. GET /api/belray/estadisticas/resumen**
**Descripción**: Obtener estadísticas generales de la tabla Belray.

**Ejemplo de Request:**
```bash
GET /api/belray/estadisticas/resumen
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Estadísticas de Belray obtenidas exitosamente",
  "data": {
    "total_registros": "3",
    "registros_activos": "3",
    "registros_inactivos": "0",
    "con_codigo": "3",
    "sin_codigo": "0",
    "primer_registro": "2025-10-15T12:49:38.954Z",
    "ultimo_registro": "2025-10-15T12:49:38.960Z"
  }
}
```

## 🔧 Implementación Frontend

### **TypeScript Service**

```typescript
// services/belrayService.ts
export interface BelrayRecord {
  id: number;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
  usuario_creacion?: string;
  usuario_modificacion?: string;
  observaciones?: string;
  giro?: string;
  numero_telefono?: string;
  direccion?: string;
}

export interface BelrayListResponse {
  success: boolean;
  message: string;
  data: {
    registros: BelrayRecord[];
    paginacion: {
      pagina_actual: number;
      total_paginas: number;
      total_registros: number;
      registros_por_pagina: number;
    };
  };
}

export interface BelrayStats {
  total_registros: string;
  registros_activos: string;
  registros_inactivos: string;
  con_codigo: string;
  sin_codigo: string;
  primer_registro: string;
  ultimo_registro: string;
}

class BelrayService {
  private baseUrl = 'http://localhost:3000/api/belray';

  async getRecords(params?: {
    page?: number;
    limit?: number;
    activo?: boolean;
    search?: string;
  }): Promise<BelrayListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.activo !== undefined) queryParams.append('activo', params.activo.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(`${this.baseUrl}?${queryParams}`);
    return response.json();
  }

  async getRecord(id: number): Promise<{ success: boolean; data: BelrayRecord }> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    return response.json();
  }

  async createRecord(data: Partial<BelrayRecord>): Promise<{ success: boolean; data: BelrayRecord }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateRecord(id: number, data: Partial<BelrayRecord>): Promise<{ success: boolean; data: BelrayRecord }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteRecord(id: number): Promise<{ success: boolean; data: BelrayRecord }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  async getStats(): Promise<{ success: boolean; data: BelrayStats }> {
    const response = await fetch(`${this.baseUrl}/estadisticas/resumen`);
    return response.json();
  }
}

export const belrayService = new BelrayService();
```

### **React Hook**

```typescript
// hooks/useBelray.ts
import { useState, useEffect } from 'react';
import { belrayService, BelrayRecord, BelrayListResponse } from '../services/belrayService';

export const useBelray = () => {
  const [records, setRecords] = useState<BelrayRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pagina_actual: 1,
    total_paginas: 1,
    total_registros: 0,
    registros_por_pagina: 10
  });

  const fetchRecords = async (params?: {
    page?: number;
    limit?: number;
    activo?: boolean;
    search?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await belrayService.getRecords(params);
      if (response.success) {
        setRecords(response.data.registros);
        setPagination(response.data.paginacion);
      } else {
        setError('Error al cargar registros');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (data: Partial<BelrayRecord>) => {
    try {
      const response = await belrayService.createRecord(data);
      if (response.success) {
        await fetchRecords(); // Recargar lista
        return response.data;
      }
      throw new Error('Error al crear registro');
    } catch (err) {
      setError('Error al crear registro');
      throw err;
    }
  };

  const updateRecord = async (id: number, data: Partial<BelrayRecord>) => {
    try {
      const response = await belrayService.updateRecord(id, data);
      if (response.success) {
        await fetchRecords(); // Recargar lista
        return response.data;
      }
      throw new Error('Error al actualizar registro');
    } catch (err) {
      setError('Error al actualizar registro');
      throw err;
    }
  };

  const deleteRecord = async (id: number) => {
    try {
      const response = await belrayService.deleteRecord(id);
      if (response.success) {
        await fetchRecords(); // Recargar lista
        return response.data;
      }
      throw new Error('Error al eliminar registro');
    } catch (err) {
      setError('Error al eliminar registro');
      throw err;
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return {
    records,
    loading,
    error,
    pagination,
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord
  };
};
```

### **Componente React**

```typescript
// components/BelrayList.tsx
import React, { useState } from 'react';
import { useBelray } from '../hooks/useBelray';

export const BelrayList: React.FC = () => {
  const { records, loading, error, pagination, fetchRecords, deleteRecord } = useBelray();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  const handleSearch = () => {
    fetchRecords({ search, activo: activeFilter });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        await deleteRecord(id);
      } catch (err) {
        console.error('Error al eliminar:', err);
      }
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Registros Belray</h2>
      
      {/* Filtros */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={activeFilter === undefined ? '' : activeFilter.toString()}
          onChange={(e) => setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <button onClick={handleSearch}>Buscar</button>
      </div>

      {/* Lista */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Código</th>
            <th>Estado</th>
            <th>Fecha Creación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.id}</td>
              <td>{record.nombre}</td>
              <td>{record.codigo || '-'}</td>
              <td>{record.activo ? 'Activo' : 'Inactivo'}</td>
              <td>{new Date(record.fecha_creacion).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleDelete(record.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      <div>
        <p>
          Página {pagination.pagina_actual} de {pagination.total_paginas} 
          ({pagination.total_registros} registros totales)
        </p>
      </div>
    </div>
  );
};
```

## 🚀 Características

- ✅ **CRUD completo** (Create, Read, Update, Delete)
- ✅ **Paginación** automática
- ✅ **Filtros** por estado y búsqueda
- ✅ **Validaciones** de datos
- ✅ **Códigos únicos** con verificación
- ✅ **Auditoría** (usuario creación/modificación)
- ✅ **Estadísticas** generales
- ✅ **Triggers automáticos** para fechas
- ✅ **Índices optimizados** para consultas

## 📝 Notas Importantes

1. **Códigos únicos**: El campo `codigo` debe ser único en toda la tabla
2. **Auditoría**: Los campos de usuario y fechas se manejan automáticamente
3. **Soft delete**: Considera usar el campo `activo` en lugar de eliminar físicamente
4. **Paginación**: Usa los parámetros `page` y `limit` para controlar la carga de datos
5. **Búsqueda**: La búsqueda funciona en nombre, descripción y código

---

## 📁 **Gestión de Documentos de Empresa**

### **Estructura de Almacenamiento**
```
G:\Unidades compartidas\Unidad de Apoyo\Belray\Documentacion_Empresa\
├── Belray_1\    # Documentos de empresa ID 1
│   ├── contrato_empresa.pdf
│   ├── certificados_iso.pdf
│   └── ...
├── Belray_2\    # Documentos de empresa ID 2
│   ├── documentacion_tecnica.pdf
│   └── ...
└── ...
```

### **Endpoints de Documentos**

#### **GET /api/belray/:id/documentos**
**Descripción**: Listar documentos de una empresa Belray específica.

**Parámetros:**
- `id` (requerido): ID de la empresa Belray

**Ejemplo de Request:**
```bash
GET /api/belray/1/documentos
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Documentos obtenidos exitosamente",
  "data": {
    "empresa": {
      "id": 1,
      "nombre": "Belray Principal"
    },
    "carpeta": "G:\\Unidades compartidas\\Unidad de Apoyo\\Belray\\Documentacion_Empresa\\Belray_1",
    "total_documentos": 2,
    "documentos": [
      {
        "nombre": "contrato_empresa_1697123456789.pdf",
        "ruta": "G:\\Unidades compartidas\\Unidad de Apoyo\\Belray\\Documentacion_Empresa\\Belray_1\\contrato_empresa_1697123456789.pdf",
        "tamaño": 1024000,
        "creado": "2025-10-15T13:00:00.000Z",
        "modificado": "2025-10-15T13:00:00.000Z",
        "es_directorio": false
      }
    ]
  }
}
```

---

#### **POST /api/belray/:id/documentos/subir**
**Descripción**: Subir un documento a la carpeta de una empresa Belray.

**Parámetros:**
- `id` (requerido): ID de la empresa Belray

**Body (FormData):**
- `archivo` (requerido): Archivo a subir

**Ejemplo de Request:**
```bash
POST /api/belray/1/documentos/subir
Content-Type: multipart/form-data

archivo: [archivo.pdf]
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Documento subido exitosamente",
  "data": {
    "archivo_original": "contrato_empresa.pdf",
    "archivo_guardado": "contrato_empresa_1697123456789.pdf",
    "ruta": "G:\\Unidades compartidas\\Unidad de Apoyo\\Belray\\Documentacion_Empresa\\Belray_1\\contrato_empresa_1697123456789.pdf",
    "tamaño": 1024000
  }
}
```

---

#### **GET /api/belray/:id/documentos/descargar/:archivo**
**Descripción**: Descargar un documento específico.

**Parámetros:**
- `id` (requerido): ID de la empresa Belray
- `archivo` (requerido): Nombre del archivo

**Ejemplo de Request:**
```bash
GET /api/belray/1/documentos/descargar/contrato_empresa_1697123456789.pdf
```

**Response**: Descarga directa del archivo

---

#### **DELETE /api/belray/:id/documentos/:archivo**
**Descripción**: Eliminar un documento específico.

**Parámetros:**
- `id` (requerido): ID de la empresa Belray
- `archivo` (requerido): Nombre del archivo

**Ejemplo de Request:**
```bash
DELETE /api/belray/1/documentos/contrato_empresa_1697123456789.pdf
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Documento eliminado exitosamente"
}
```

---

#### **POST /api/belray/:id/documentos/crear-carpeta**
**Descripción**: Crear la carpeta de documentos para una empresa Belray.

**Parámetros:**
- `id` (requerido): ID de la empresa Belray

**Ejemplo de Request:**
```bash
POST /api/belray/1/documentos/crear-carpeta
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Carpeta de documentos creada exitosamente",
  "data": {
    "empresa": {
      "id": 1,
      "nombre": "Belray Principal"
    },
    "carpeta": "G:\\Unidades compartidas\\Unidad de Apoyo\\Belray\\Documentacion_Empresa\\Belray_1"
  }
}
```

---

## 🔧 **Implementación Frontend para Documentos**

### **TypeScript Service para Documentos**

```typescript
// services/belrayDocumentosService.ts
export interface BelrayDocumento {
  nombre: string;
  ruta: string;
  tamaño: number;
  creado: string;
  modificado: string;
  es_directorio: boolean;
}

export interface BelrayDocumentosResponse {
  success: boolean;
  message: string;
  data: {
    empresa: {
      id: number;
      nombre: string;
    };
    carpeta: string;
    total_documentos: number;
    documentos: BelrayDocumento[];
  };
}

class BelrayDocumentosService {
  private baseUrl = 'http://localhost:3000/api/belray';

  async getDocumentos(empresaId: number): Promise<BelrayDocumentosResponse> {
    const response = await fetch(`${this.baseUrl}/${empresaId}/documentos`);
    return response.json();
  }

  async subirDocumento(empresaId: number, archivo: File): Promise<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await fetch(`${this.baseUrl}/${empresaId}/documentos/subir`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  async descargarDocumento(empresaId: number, nombreArchivo: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${empresaId}/documentos/descargar/${nombreArchivo}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }

  async eliminarDocumento(empresaId: number, nombreArchivo: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${empresaId}/documentos/${nombreArchivo}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  async crearCarpeta(empresaId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${empresaId}/documentos/crear-carpeta`, {
      method: 'POST',
    });
    return response.json();
  }
}

export const belrayDocumentosService = new BelrayDocumentosService();
```

### **React Hook para Documentos**

```typescript
// hooks/useBelrayDocumentos.ts
import { useState, useEffect } from 'react';
import { belrayDocumentosService, BelrayDocumento } from '../services/belrayDocumentosService';

export const useBelrayDocumentos = (empresaId: number) => {
  const [documentos, setDocumentos] = useState<BelrayDocumento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<any>(null);

  const fetchDocumentos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await belrayDocumentosService.getDocumentos(empresaId);
      if (response.success) {
        setDocumentos(response.data.documentos);
        setEmpresa(response.data.empresa);
      } else {
        setError('Error al cargar documentos');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const subirDocumento = async (archivo: File) => {
    try {
      const response = await belrayDocumentosService.subirDocumento(empresaId, archivo);
      if (response.success) {
        await fetchDocumentos(); // Recargar lista
        return response.data;
      }
      throw new Error('Error al subir documento');
    } catch (err) {
      setError('Error al subir documento');
      throw err;
    }
  };

  const eliminarDocumento = async (nombreArchivo: string) => {
    try {
      const response = await belrayDocumentosService.eliminarDocumento(empresaId, nombreArchivo);
      if (response.success) {
        await fetchDocumentos(); // Recargar lista
        return response.data;
      }
      throw new Error('Error al eliminar documento');
    } catch (err) {
      setError('Error al eliminar documento');
      throw err;
    }
  };

  const crearCarpeta = async () => {
    try {
      const response = await belrayDocumentosService.crearCarpeta(empresaId);
      if (response.success) {
        await fetchDocumentos(); // Recargar lista
        return response.data;
      }
      throw new Error('Error al crear carpeta');
    } catch (err) {
      setError('Error al crear carpeta');
      throw err;
    }
  };

  useEffect(() => {
    if (empresaId) {
      fetchDocumentos();
    }
  }, [empresaId]);

  return {
    documentos,
    empresa,
    loading,
    error,
    fetchDocumentos,
    subirDocumento,
    eliminarDocumento,
    crearCarpeta
  };
};
```

---

## 🚀 **Características del Sistema de Documentos**

- ✅ **Almacenamiento organizado** por empresa
- ✅ **Subida de archivos** con límite de 50MB
- ✅ **Descarga directa** de documentos
- ✅ **Eliminación segura** de archivos
- ✅ **Creación automática** de carpetas
- ✅ **Información detallada** de archivos
- ✅ **Integración completa** con API Belray

---

*Documentación generada el 15 de octubre de 2025*
