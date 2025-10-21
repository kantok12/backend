# 📊 Tablas de Programación Semanal - Verificación Frontend

## 🎯 **Objetivo**
Este documento contiene la información completa de las tablas utilizadas para la programación semanal, para verificar que el frontend esté mostrando correctamente todos los datos disponibles.

## 📋 **Tablas Principales**

### 1. **Tabla Principal: `mantenimiento.programacion_semanal`**

#### **Estructura Completa:**
```sql
CREATE TABLE mantenimiento.programacion_semanal (
  id SERIAL PRIMARY KEY,
  rut VARCHAR(20) NOT NULL,
  cartera_id BIGINT NOT NULL,
  cliente_id BIGINT,
  nodo_id BIGINT,
  semana_inicio DATE NOT NULL,
  semana_fin DATE NOT NULL,
  lunes BOOLEAN DEFAULT false,
  martes BOOLEAN DEFAULT false,
  miercoles BOOLEAN DEFAULT false,
  jueves BOOLEAN DEFAULT false,
  viernes BOOLEAN DEFAULT false,
  sabado BOOLEAN DEFAULT false,
  domingo BOOLEAN DEFAULT false,
  horas_estimadas INTEGER DEFAULT 8,
  observaciones TEXT,
  estado VARCHAR(20) DEFAULT 'programado',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'sistema',
  UNIQUE (rut, cartera_id, semana_inicio)
);
```

#### **Campos Disponibles para el Frontend:**
- ✅ `id` - ID único de la programación
- ✅ `rut` - RUT del trabajador
- ✅ `cartera_id` - ID de la cartera
- ✅ `cliente_id` - ID del cliente (puede ser NULL)
- ✅ `nodo_id` - ID del nodo (puede ser NULL)
- ✅ `semana_inicio` - Fecha de inicio de la semana
- ✅ `semana_fin` - Fecha de fin de la semana
- ✅ `lunes` - Trabaja el lunes (boolean)
- ✅ `martes` - Trabaja el martes (boolean)
- ✅ `miercoles` - Trabaja el miércoles (boolean)
- ✅ `jueves` - Trabaja el jueves (boolean)
- ✅ `viernes` - Trabaja el viernes (boolean)
- ✅ `sabado` - Trabaja el sábado (boolean)
- ✅ `domingo` - Trabaja el domingo (boolean)
- ✅ `horas_estimadas` - Horas estimadas de trabajo
- ✅ `observaciones` - Observaciones adicionales
- ✅ `estado` - Estado de la programación
- ✅ `created_at` - Fecha de creación
- ✅ `updated_at` - Fecha de última actualización
- ✅ `created_by` - Usuario que creó el registro

### 2. **Tabla de Historial: `mantenimiento.programacion_historial`**

#### **Estructura Completa:**
```sql
CREATE TABLE mantenimiento.programacion_historial (
  id SERIAL PRIMARY KEY,
  programacion_id INTEGER NOT NULL,
  rut VARCHAR(20) NOT NULL,
  cartera_id BIGINT NOT NULL,
  accion VARCHAR(20) NOT NULL, -- 'creado', 'actualizado', 'eliminado'
  cambios JSONB,
  fecha_accion TIMESTAMP DEFAULT NOW(),
  usuario VARCHAR(50) DEFAULT 'sistema'
);
```

#### **Campos Disponibles para Auditoría:**
- ✅ `id` - ID único del historial
- ✅ `programacion_id` - ID de la programación relacionada
- ✅ `rut` - RUT del trabajador
- ✅ `cartera_id` - ID de la cartera
- ✅ `accion` - Tipo de acción realizada
- ✅ `cambios` - JSON con los cambios realizados
- ✅ `fecha_accion` - Fecha de la acción
- ✅ `usuario` - Usuario que realizó la acción

## 🔗 **Tablas Relacionadas (JOIN)**

### 3. **Personal Disponible: `mantenimiento.personal_disponible`**

#### **Campos Importantes:**
- ✅ `rut` - RUT del trabajador (clave de relación)
- ✅ `nombres` - Nombre completo del trabajador
- ✅ `cargo` - Cargo del trabajador
- ✅ `activo` - Si el trabajador está activo
- ✅ `disponible` - Si está disponible para trabajo

### 4. **Carteras: `servicios.carteras`**

#### **Campos Importantes:**
- ✅ `id` - ID de la cartera (clave de relación)
- ✅ `name` - Nombre de la cartera
- ✅ `descripcion` - Descripción de la cartera
- ✅ `activa` - Si la cartera está activa

### 5. **Clientes: `servicios.clientes`**

#### **Campos Importantes:**
- ✅ `id` - ID del cliente (clave de relación)
- ✅ `nombre` - Nombre del cliente
- ✅ `rut_cliente` - RUT del cliente
- ✅ `direccion` - Dirección del cliente
- ✅ `activo` - Si el cliente está activo

### 6. **Nodos: `servicios.nodos`**

#### **Campos Importantes:**
- ✅ `id` - ID del nodo (clave de relación)
- ✅ `nombre` - Nombre del nodo
- ✅ `direccion` - Dirección del nodo
- ✅ `activo` - Si el nodo está activo

## 📊 **Consulta Completa del Backend**

### **Query Principal (GET /api/programacion):**
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
  p.semana_inicio,
  p.semana_fin,
  p.lunes,
  p.martes,
  p.miercoles,
  p.jueves,
  p.viernes,
  p.sabado,
  p.domingo,
  p.horas_estimadas,
  p.observaciones,
  p.estado,
  p.created_at,
  p.updated_at
FROM mantenimiento.programacion_semanal p
JOIN mantenimiento.personal_disponible pd ON pd.rut = p.rut
JOIN servicios.carteras c ON c.id = p.cartera_id
LEFT JOIN servicios.clientes cl ON cl.id = p.cliente_id
LEFT JOIN servicios.nodos n ON n.id = p.nodo_id
WHERE p.cartera_id = $1 
  AND p.semana_inicio = $2
  AND p.semana_fin = $3
ORDER BY pd.nombres, p.created_at
```

## 🎯 **Datos que Debe Mostrar el Frontend**

### **Información del Trabajador:**
- ✅ **RUT:** `p.rut`
- ✅ **Nombre:** `pd.nombres` (alias: `nombre_persona`)
- ✅ **Cargo:** `pd.cargo`

### **Información de la Cartera:**
- ✅ **ID Cartera:** `p.cartera_id`
- ✅ **Nombre Cartera:** `c.name` (alias: `nombre_cartera`)

### **Información del Cliente (Opcional):**
- ✅ **ID Cliente:** `p.cliente_id` (puede ser NULL)
- ✅ **Nombre Cliente:** `cl.nombre` (alias: `nombre_cliente`)

### **Información del Nodo (Opcional):**
- ✅ **ID Nodo:** `p.nodo_id` (puede ser NULL)
- ✅ **Nombre Nodo:** `n.nombre` (alias: `nombre_nodo`)

### **Información de la Semana:**
- ✅ **Fecha Inicio:** `p.semana_inicio`
- ✅ **Fecha Fin:** `p.semana_fin`

### **Días de Trabajo:**
- ✅ **Lunes:** `p.lunes` (boolean)
- ✅ **Martes:** `p.martes` (boolean)
- ✅ **Miércoles:** `p.miercoles` (boolean)
- ✅ **Jueves:** `p.jueves` (boolean)
- ✅ **Viernes:** `p.viernes` (boolean)
- ✅ **Sábado:** `p.sabado` (boolean)
- ✅ **Domingo:** `p.domingo` (boolean)

### **Información Adicional:**
- ✅ **Horas Estimadas:** `p.horas_estimadas`
- ✅ **Observaciones:** `p.observaciones`
- ✅ **Estado:** `p.estado`
- ✅ **Fecha Creación:** `p.created_at`
- ✅ **Fecha Actualización:** `p.updated_at`

## 🔍 **Verificaciones para el Frontend**

### **1. Verificar que se muestren todos los campos:**
```javascript
// Ejemplo de verificación en el frontend
const programacion = response.data.programacion;

programacion.forEach(item => {
  console.log('ID:', item.id);
  console.log('RUT:', item.rut);
  console.log('Nombre:', item.nombre_persona);
  console.log('Cargo:', item.cargo);
  console.log('Cartera:', item.nombre_cartera);
  console.log('Cliente:', item.nombre_cliente || 'Sin cliente');
  console.log('Nodo:', item.nombre_nodo || 'Sin nodo');
  console.log('Semana:', item.semana_inicio, 'a', item.semana_fin);
  console.log('Días:', {
    lunes: item.lunes,
    martes: item.martes,
    miercoles: item.miercoles,
    jueves: item.jueves,
    viernes: item.viernes,
    sabado: item.sabado,
    domingo: item.domingo
  });
  console.log('Horas:', item.horas_estimadas);
  console.log('Observaciones:', item.observaciones);
  console.log('Estado:', item.estado);
});
```

### **2. Verificar estructura de respuesta del API:**
```javascript
// Estructura esperada de la respuesta
{
  "success": true,
  "data": {
    "cartera": {
      "id": 1,
      "nombre": "Nombre de la Cartera"
    },
    "semana": {
      "inicio": "2024-12-16",
      "fin": "2024-12-22"
    },
    "programacion": [
      {
        "id": 1,
        "rut": "12345678-9",
        "nombre_persona": "Juan Pérez",
        "cargo": "Técnico",
        "cartera_id": 1,
        "nombre_cartera": "Cartera A",
        "cliente_id": 1,
        "nombre_cliente": "Cliente A",
        "nodo_id": 1,
        "nombre_nodo": "Nodo A",
        "semana_inicio": "2024-12-16",
        "semana_fin": "2024-12-22",
        "lunes": true,
        "martes": true,
        "miercoles": false,
        "jueves": true,
        "viernes": true,
        "sabado": false,
        "domingo": false,
        "horas_estimadas": 8,
        "observaciones": "Observaciones del trabajo",
        "estado": "programado",
        "created_at": "2024-12-16T10:00:00Z",
        "updated_at": "2024-12-16T10:00:00Z"
      }
    ]
  }
}
```

## 🚨 **Problemas Comunes a Verificar**

### **1. Campos NULL no manejados:**
- ✅ `cliente_id` puede ser NULL
- ✅ `nombre_cliente` puede ser NULL
- ✅ `nodo_id` puede ser NULL
- ✅ `nombre_nodo` puede ser NULL
- ✅ `observaciones` puede ser NULL

### **2. Tipos de datos:**
- ✅ Los días de la semana son booleanos (true/false)
- ✅ Las fechas están en formato ISO (YYYY-MM-DD)
- ✅ Los IDs son números enteros
- ✅ Las horas estimadas son números enteros

### **3. Validaciones:**
- ✅ Verificar que se muestren todos los días de la semana
- ✅ Verificar que se muestren las horas estimadas
- ✅ Verificar que se muestren las observaciones
- ✅ Verificar que se muestren los timestamps

## 📱 **Ejemplo de Componente React**

```jsx
const ProgramacionSemanal = ({ programacion }) => {
  return (
    <div className="programacion-container">
      {programacion.map(item => (
        <div key={item.id} className="programacion-item">
          <h3>{item.nombre_persona}</h3>
          <p><strong>RUT:</strong> {item.rut}</p>
          <p><strong>Cargo:</strong> {item.cargo}</p>
          <p><strong>Cartera:</strong> {item.nombre_cartera}</p>
          {item.nombre_cliente && (
            <p><strong>Cliente:</strong> {item.nombre_cliente}</p>
          )}
          {item.nombre_nodo && (
            <p><strong>Nodo:</strong> {item.nombre_nodo}</p>
          )}
          <p><strong>Semana:</strong> {item.semana_inicio} a {item.semana_fin}</p>
          
          <div className="dias-trabajo">
            <h4>Días de Trabajo:</h4>
            <div className="dias-grid">
              <span className={item.lunes ? 'activo' : 'inactivo'}>Lunes</span>
              <span className={item.martes ? 'activo' : 'inactivo'}>Martes</span>
              <span className={item.miercoles ? 'activo' : 'inactivo'}>Miércoles</span>
              <span className={item.jueves ? 'activo' : 'inactivo'}>Jueves</span>
              <span className={item.viernes ? 'activo' : 'inactivo'}>Viernes</span>
              <span className={item.sabado ? 'activo' : 'inactivo'}>Sábado</span>
              <span className={item.domingo ? 'activo' : 'inactivo'}>Domingo</span>
            </div>
          </div>
          
          <p><strong>Horas Estimadas:</strong> {item.horas_estimadas}</p>
          {item.observaciones && (
            <p><strong>Observaciones:</strong> {item.observaciones}</p>
          )}
          <p><strong>Estado:</strong> {item.estado}</p>
          <p><strong>Creado:</strong> {new Date(item.created_at).toLocaleString()}</p>
          <p><strong>Actualizado:</strong> {new Date(item.updated_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};
```

## ✅ **Checklist de Verificación**

- [ ] Se muestran todos los campos de la programación
- [ ] Se manejan correctamente los campos NULL
- [ ] Los tipos de datos son correctos
- [ ] Se muestran los días de la semana como booleanos
- [ ] Se muestran las fechas en formato correcto
- [ ] Se muestran las horas estimadas
- [ ] Se muestran las observaciones (si existen)
- [ ] Se muestran los timestamps
- [ ] Se muestran los datos relacionados (cartera, cliente, nodo)
- [ ] La estructura de respuesta es correcta

## 🎯 **Conclusión**

El backend proporciona toda la información necesaria para mostrar la programación semanal completa. Si algún campo no se muestra en el frontend, verificar:

1. **Que se esté accediendo correctamente a los datos de la respuesta**
2. **Que se estén manejando los campos NULL**
3. **Que se estén usando los alias correctos de los campos**
4. **Que se esté renderizando toda la información disponible**

---

**Documento generado para verificación del frontend**  
**Fecha:** Diciembre 2024  
**Versión:** 1.0.0
