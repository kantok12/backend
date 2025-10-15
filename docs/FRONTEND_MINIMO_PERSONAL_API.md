# 👥 API de Mínimo de Personal y Acuerdos - Documentación para Frontend

## 📋 Información General

**Base URL:** `http://192.168.10.194:3000/api/servicios`

**Funcionalidad:** Sistema para gestionar el mínimo de personal requerido para el funcionamiento de servicios, con capacidad de crear acuerdos que modifiquen temporalmente estos mínimos.

---

## 🎯 Endpoints Disponibles

### 📊 **Mínimo de Personal**

#### `GET /api/servicios/minimo-personal`
Listar todos los mínimos de personal con filtros y paginación.

**Parámetros de Query:**
- `cartera_id` (opcional): Filtrar por ID de cartera
- `cliente_id` (opcional): Filtrar por ID de cliente
- `nodo_id` (opcional): Filtrar por ID de nodo
- `activo` (opcional): Filtrar por estado activo (default: true)
- `limit` (opcional): Número de registros por página (default: 50)
- `offset` (opcional): Número de registros a saltar (default: 0)

**Respuesta:**
```json
{
  "success": true,
  "message": "Mínimos de personal obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "cartera_id": 1,
      "nombre_cartera": "SNACK",
      "cliente_id": 5,
      "nombre_cliente": "CAROZZI - PLANTA NOS",
      "nodo_id": 12,
      "nombre_nodo": "CEREALES",
      "minimo_base": 2,
      "descripcion": "Mínimo base para cartera SNACK",
      "activo": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "created_by": "sistema",
      "minimo_real": 4,
      "total_acuerdos": 2,
      "acuerdos_activos": 1
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### `GET /api/servicios/minimo-personal/:id`
Obtener un mínimo de personal específico con sus acuerdos.

**Respuesta:**
```json
{
  "success": true,
  "message": "Mínimo de personal obtenido exitosamente",
  "data": {
    "id": 1,
    "cartera_id": 1,
    "nombre_cartera": "SNACK",
    "cliente_id": 5,
    "nombre_cliente": "CAROZZI - PLANTA NOS",
    "nodo_id": 12,
    "nombre_nodo": "CEREALES",
    "minimo_base": 2,
    "descripcion": "Mínimo base para cartera SNACK",
    "activo": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "created_by": "sistema",
    "minimo_real": 4,
    "acuerdos": [
      {
        "id": 1,
        "tipo_acuerdo": "incremento",
        "valor_modificacion": 2,
        "fecha_inicio": "2024-01-15",
        "fecha_fin": "2024-02-15",
        "motivo": "Incremento por alta demanda",
        "aprobado_por": "Gerente de Operaciones",
        "estado": "activo",
        "created_at": "2024-01-15T10:30:00Z",
        "created_by": "sistema"
      }
    ]
  }
}
```

#### `POST /api/servicios/minimo-personal`
Crear un nuevo mínimo de personal.

**Body:**
```json
{
  "cartera_id": 1,
  "cliente_id": 5,
  "nodo_id": 12,
  "minimo_base": 2,
  "descripcion": "Mínimo de personal para nodo específico"
}
```

**Campos Requeridos:**
- `cartera_id`: ID de la cartera
- `minimo_base`: Número mínimo de personal (debe ser > 0)

**Campos Opcionales:**
- `cliente_id`: ID del cliente
- `nodo_id`: ID del nodo
- `descripcion`: Descripción del mínimo

**Respuesta:**
```json
{
  "success": true,
  "message": "Mínimo de personal creado exitosamente",
  "data": {
    "id": 1,
    "cartera_id": 1,
    "cliente_id": 5,
    "nodo_id": 12,
    "minimo_base": 2,
    "descripcion": "Mínimo de personal para nodo específico",
    "activo": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "created_by": "sistema"
  }
}
```

#### `PUT /api/servicios/minimo-personal/:id`
Actualizar un mínimo de personal existente.

**Body (todos los campos son opcionales):**
```json
{
  "minimo_base": 3,
  "descripcion": "Mínimo actualizado",
  "activo": true
}
```

#### `DELETE /api/servicios/minimo-personal/:id`
Eliminar un mínimo de personal (eliminará también todos los acuerdos relacionados).

#### `GET /api/servicios/minimo-personal/:id/calcular`
Calcular el mínimo real considerando todos los acuerdos activos.

**Parámetros de Query:**
- `fecha` (opcional): Fecha para el cálculo (default: fecha actual)

**Respuesta:**
```json
{
  "success": true,
  "message": "Mínimo real calculado exitosamente",
  "data": {
    "minimo_personal_id": 1,
    "fecha_calculo": "2024-01-20",
    "minimo_real": 4,
    "acuerdos_aplicados": [
      {
        "id": 1,
        "tipo_acuerdo": "incremento",
        "valor_modificacion": 2,
        "fecha_inicio": "2024-01-15",
        "fecha_fin": "2024-02-15",
        "motivo": "Incremento por alta demanda",
        "estado": "activo"
      }
    ]
  }
}
```

---

### 📝 **Acuerdos**

#### `GET /api/servicios/acuerdos`
Listar todos los acuerdos con filtros.

**Parámetros de Query:**
- `minimo_personal_id` (opcional): Filtrar por ID de mínimo personal
- `tipo_acuerdo` (opcional): Filtrar por tipo ('incremento', 'reduccion', 'temporal')
- `estado` (opcional): Filtrar por estado ('activo', 'inactivo', 'vencido')
- `fecha_desde` (opcional): Filtrar desde fecha
- `fecha_hasta` (opcional): Filtrar hasta fecha
- `limit` (opcional): Número de registros por página (default: 50)
- `offset` (opcional): Número de registros a saltar (default: 0)

**Respuesta:**
```json
{
  "success": true,
  "message": "Acuerdos obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "minimo_personal_id": 1,
      "tipo_acuerdo": "incremento",
      "valor_modificacion": 2,
      "fecha_inicio": "2024-01-15",
      "fecha_fin": "2024-02-15",
      "motivo": "Incremento por alta demanda",
      "aprobado_por": "Gerente de Operaciones",
      "estado": "activo",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "created_by": "sistema",
      "cartera_id": 1,
      "nombre_cartera": "SNACK",
      "cliente_id": 5,
      "nombre_cliente": "CAROZZI - PLANTA NOS",
      "nodo_id": 12,
      "nombre_nodo": "CEREALES",
      "minimo_base": 2,
      "minimo_real_actual": 4
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### `GET /api/servicios/acuerdos/:id`
Obtener un acuerdo específico.

#### `POST /api/servicios/acuerdos`
Crear un nuevo acuerdo.

**Body:**
```json
{
  "minimo_personal_id": 1,
  "tipo_acuerdo": "incremento",
  "valor_modificacion": 2,
  "fecha_inicio": "2024-01-15",
  "fecha_fin": "2024-02-15",
  "motivo": "Incremento por alta demanda estacional",
  "aprobado_por": "Gerente de Operaciones"
}
```

**Campos Requeridos:**
- `minimo_personal_id`: ID del mínimo de personal
- `tipo_acuerdo`: Tipo de acuerdo ('incremento', 'reduccion', 'temporal')
- `valor_modificacion`: Valor de modificación (positivo para incremento, negativo para reducción)
- `fecha_inicio`: Fecha de inicio del acuerdo

**Campos Opcionales:**
- `fecha_fin`: Fecha de fin del acuerdo (si no se especifica, es indefinido)
- `motivo`: Motivo del acuerdo
- `aprobado_por`: Persona que aprobó el acuerdo

**Tipos de Acuerdo:**
- `incremento`: Aumenta el mínimo de personal
- `reduccion`: Reduce el mínimo de personal
- `temporal`: Modificación temporal con fecha específica

#### `PUT /api/servicios/acuerdos/:id`
Actualizar un acuerdo existente.

**Body (todos los campos son opcionales):**
```json
{
  "tipo_acuerdo": "reduccion",
  "valor_modificacion": -1,
  "fecha_inicio": "2024-01-20",
  "fecha_fin": "2024-02-20",
  "motivo": "Reducción por mantenimiento programado",
  "aprobado_por": "Supervisor de Mantenimiento",
  "estado": "activo"
}
```

#### `DELETE /api/servicios/acuerdos/:id`
Eliminar un acuerdo.

#### `GET /api/servicios/acuerdos/vencer`
Obtener acuerdos próximos a vencer.

**Parámetros de Query:**
- `dias` (opcional): Días hacia adelante para buscar (default: 30)
- `limit` (opcional): Número de registros por página (default: 50)
- `offset` (opcional): Número de registros a saltar (default: 0)

**Respuesta:**
```json
{
  "success": true,
  "message": "Acuerdos próximos a vencer en 30 días obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "minimo_personal_id": 1,
      "tipo_acuerdo": "incremento",
      "valor_modificacion": 2,
      "fecha_inicio": "2024-01-15",
      "fecha_fin": "2024-02-15",
      "motivo": "Incremento por alta demanda",
      "estado": "activo",
      "cartera_id": 1,
      "nombre_cartera": "SNACK",
      "cliente_id": 5,
      "nombre_cliente": "CAROZZI - PLANTA NOS",
      "nodo_id": 12,
      "nombre_nodo": "CEREALES",
      "dias_restantes": 15
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### `POST /api/servicios/acuerdos/:id/activar`
Activar un acuerdo.

#### `POST /api/servicios/acuerdos/:id/desactivar`
Desactivar un acuerdo.

---

## 🔧 **Lógica de Cálculo**

### **Cálculo del Mínimo Real:**
```
Mínimo Real = Mínimo Base + Suma de Modificaciones Activas
```

**Donde:**
- **Mínimo Base**: Valor establecido en la tabla `minimo_personal`
- **Modificaciones Activas**: Suma de `valor_modificacion` de todos los acuerdos que cumplan:
  - `estado = 'activo'`
  - `fecha_inicio <= fecha_calculo`
  - `fecha_fin IS NULL OR fecha_fin >= fecha_calculo`

**Restricción:** El mínimo real nunca puede ser menor a 0.

### **Ejemplo de Cálculo:**
```
Mínimo Base: 2
Acuerdo 1 (incremento): +2 (activo del 15/01 al 15/02)
Acuerdo 2 (reducción): -1 (activo del 20/01 al 20/02)

Para fecha 25/01/2024:
Mínimo Real = 2 + 2 + (-1) = 3
```

---

## 🚨 **Códigos de Error**

### **400 Bad Request:**
- Campos requeridos faltantes
- Validación de datos fallida
- Fechas inválidas
- Conflictos de fechas en acuerdos

### **404 Not Found:**
- Mínimo de personal no encontrado
- Acuerdo no encontrado

### **409 Conflict:**
- Ya existe un mínimo para la combinación cartera/cliente/nodo
- Ya existe un acuerdo activo del mismo tipo en el rango de fechas

### **500 Internal Server Error:**
- Error interno del servidor
- Error de base de datos

---

## 📱 **Ejemplos de Uso en Frontend**

### **Crear Mínimo de Personal:**
```javascript
const crearMinimo = async (datos) => {
  try {
    const response = await axios.post('/api/servicios/minimo-personal', {
      cartera_id: datos.carteraId,
      cliente_id: datos.clienteId,
      nodo_id: datos.nodoId,
      minimo_base: datos.minimoBase,
      descripcion: datos.descripcion
    });
    return response.data;
  } catch (error) {
    console.error('Error creando mínimo:', error.response.data);
    throw error;
  }
};
```

### **Crear Acuerdo de Incremento:**
```javascript
const crearAcuerdoIncremento = async (minimoId, datos) => {
  try {
    const response = await axios.post('/api/servicios/acuerdos', {
      minimo_personal_id: minimoId,
      tipo_acuerdo: 'incremento',
      valor_modificacion: datos.incremento,
      fecha_inicio: datos.fechaInicio,
      fecha_fin: datos.fechaFin,
      motivo: datos.motivo,
      aprobado_por: datos.aprobadoPor
    });
    return response.data;
  } catch (error) {
    console.error('Error creando acuerdo:', error.response.data);
    throw error;
  }
};
```

### **Calcular Mínimo Real:**
```javascript
const calcularMinimoReal = async (minimoId, fecha = null) => {
  try {
    const url = `/api/servicios/minimo-personal/${minimoId}/calcular`;
    const params = fecha ? { fecha } : {};
    const response = await axios.get(url, { params });
    return response.data.data.minimo_real;
  } catch (error) {
    console.error('Error calculando mínimo real:', error.response.data);
    throw error;
  }
};
```

### **Obtener Acuerdos Próximos a Vencer:**
```javascript
const obtenerAcuerdosPorVencer = async (dias = 30) => {
  try {
    const response = await axios.get('/api/servicios/acuerdos/vencer', {
      params: { dias }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo acuerdos por vencer:', error.response.data);
    throw error;
  }
};
```

---

## 🎯 **Casos de Uso Comunes**

1. **Configurar Mínimo Base**: Establecer el mínimo de personal requerido para una cartera/cliente/nodo
2. **Incremento Temporal**: Aumentar temporalmente el mínimo por alta demanda
3. **Reducción por Mantenimiento**: Reducir el mínimo durante mantenimientos programados
4. **Monitoreo de Vencimientos**: Identificar acuerdos que están por vencer
5. **Cálculo en Tiempo Real**: Obtener el mínimo real considerando todos los acuerdos activos
6. **Historial de Modificaciones**: Rastrear todos los cambios realizados a los mínimos

---

## 📊 **Estados de Acuerdos**

- **`activo`**: El acuerdo está en vigor y afecta el cálculo del mínimo real
- **`inactivo`**: El acuerdo está desactivado y no afecta el cálculo
- **`vencido`**: El acuerdo ha expirado (fecha_fin < fecha actual)

---

## 🔄 **Flujo de Trabajo Recomendado**

1. **Configuración Inicial**: Crear mínimos base para cada cartera/cliente/nodo
2. **Gestión de Acuerdos**: Crear acuerdos para modificaciones temporales
3. **Monitoreo**: Revisar regularmente acuerdos próximos a vencer
4. **Cálculo**: Usar el endpoint de cálculo para obtener mínimos reales
5. **Mantenimiento**: Actualizar o eliminar acuerdos según sea necesario

