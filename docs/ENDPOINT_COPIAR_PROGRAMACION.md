# Endpoint: Copiar Programación Semanal

## 📋 Descripción

Este endpoint permite copiar toda la programación de una semana específica a la siguiente semana automáticamente. Es útil cuando la programación se repite semanalmente y se quiere evitar cargar manualmente cada asignación.

## 🔗 Endpoint

```
POST /api/programacion-semanal/copiar-semana
```

## 📥 Request

### Headers
```
Content-Type: application/json
```

### Body Parameters

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `fecha_inicio` | string | Sí | Fecha de cualquier día de la semana origen (formato: YYYY-MM-DD). El endpoint calculará automáticamente el lunes y domingo de esa semana. |
| `cartera_id` | integer | Sí | ID de la cartera cuya programación se desea copiar |

### Ejemplo de Request

```json
{
  "fecha_inicio": "2025-11-03",
  "cartera_id": 1
}
```

## 📤 Response

### Respuesta Exitosa (201 Created)

```json
{
  "success": true,
  "message": "Programación copiada exitosamente: 25 asignaciones creadas",
  "data": {
    "semana_origen": {
      "inicio": "2025-11-03",
      "fin": "2025-11-09"
    },
    "semana_destino": {
      "inicio": "2025-11-10",
      "fin": "2025-11-16"
    },
    "asignaciones_copiadas": 25,
    "errores": 0,
    "nuevas_asignaciones": [
      {
        "id": 123,
        "rut": "12.345.678-9",
        "fecha_trabajo": "2025-11-10"
      },
      {
        "id": 124,
        "rut": "98.765.432-1",
        "fecha_trabajo": "2025-11-10"
      }
      // ... más asignaciones
    ]
  }
}
```

### Respuestas de Error

#### 400 Bad Request - Parámetros faltantes o inválidos

```json
{
  "success": false,
  "message": "fecha_inicio es requerida"
}
```

```json
{
  "success": false,
  "message": "Formato de fecha inválido. Use YYYY-MM-DD"
}
```

#### 404 Not Found - No hay programación para copiar

```json
{
  "success": false,
  "message": "No se encontró programación para la semana especificada"
}
```

#### 409 Conflict - Ya existe programación en la semana destino

```json
{
  "success": false,
  "message": "Ya existe programación para la semana siguiente. Elimínela primero si desea reemplazarla."
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Error al copiar programación",
  "error": "Mensaje de error específico"
}
```

## 🔄 Lógica del Endpoint

### 1. Cálculo de Semanas

El endpoint automáticamente:
- Calcula el **lunes** y **domingo** de la semana que contiene `fecha_inicio`
- Calcula el **lunes** y **domingo** de la semana siguiente (+7 días)

Ejemplo:
- Si `fecha_inicio = "2025-11-05"` (miércoles)
- Semana origen: lunes 03/11 → domingo 09/11
- Semana destino: lunes 10/11 → domingo 16/11

### 2. Validaciones

Antes de copiar, verifica:
1. ✅ Formato de fecha válido
2. ✅ `cartera_id` proporcionado
3. ✅ Existe programación en la semana origen
4. ✅ NO existe programación en la semana destino (evita duplicados)

### 3. Proceso de Copia

Para cada asignación de la semana origen:
1. Toma todos los campos: `rut`, `cartera_id`, `cliente_id`, `nodo_id`, `horas_estimadas`, `observaciones`, etc.
2. Calcula la nueva `fecha_trabajo` sumando 7 días
3. Mantiene el mismo `dia_semana` (ej: si era "lunes", sigue siendo "lunes")
4. Inserta la nueva asignación con estado `'activo'`
5. Asigna las nuevas fechas `semana_inicio` y `semana_fin`

### 4. Manejo de Errores

Si alguna asignación individual falla:
- Se registra el error pero continúa con las demás
- El contador de `errores` se incrementa
- El proceso NO se revierte completamente (inserciones exitosas permanecen)

## 💻 Ejemplo de Uso desde Frontend

### JavaScript/TypeScript

```typescript
async function copiarProgramacionSemanal(fechaInicio: string, carteraId: number) {
  try {
    const response = await axios.post('/api/programacion-semanal/copiar-semana', {
      fecha_inicio: fechaInicio,
      cartera_id: carteraId
    });

    if (response.data.success) {
      console.log(`✅ ${response.data.message}`);
      console.log(`Copiadas: ${response.data.data.asignaciones_copiadas} asignaciones`);
      return response.data.data;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.error('⚠️ Ya existe programación en la semana siguiente');
    } else if (error.response?.status === 404) {
      console.error('⚠️ No hay programación para copiar');
    } else {
      console.error('❌ Error al copiar:', error.message);
    }
    throw error;
  }
}

// Uso
copiarProgramacionSemanal('2025-11-03', 1);
```

### React Component

```tsx
const CopiarProgramacionButton = ({ fechaInicio, carteraId }) => {
  const [loading, setLoading] = useState(false);
  
  const handleCopiar = async () => {
    setLoading(true);
    try {
      const resultado = await axios.post('/api/programacion-semanal/copiar-semana', {
        fecha_inicio: fechaInicio,
        cartera_id: carteraId
      });
      
      alert(`✅ ${resultado.data.message}`);
      // Recargar la programación o actualizar el estado
      
    } catch (error) {
      if (error.response?.status === 409) {
        alert('Ya existe programación para la semana siguiente');
      } else {
        alert('Error al copiar la programación');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCopiar} disabled={loading}>
      {loading ? 'Copiando...' : 'Repetir Programación'}
    </button>
  );
};
```

## 🧪 Pruebas

### Usando el script de test

```powershell
cd "c:\Users\BR CO-WORK 1\Documents\GitHub\backend"
node test-copiar-programacion.js
```

Ajusta los valores en `testConfig` dentro del script:
- `fecha_inicio`: Una fecha de una semana con programación existente
- `cartera_id`: ID de cartera válido

### Usando curl

```bash
curl -X POST http://localhost:3000/api/programacion-semanal/copiar-semana \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_inicio": "2025-11-03",
    "cartera_id": 1
  }'
```

### Usando Postman

1. Método: `POST`
2. URL: `http://localhost:3000/api/programacion-semanal/copiar-semana`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "fecha_inicio": "2025-11-03",
  "cartera_id": 1
}
```

## 📊 Casos de Uso

### Caso 1: Programación Regular Semanal

Una empresa tiene la misma programación cada semana:
- Lunes a Viernes: 10 trabajadores en Sitio A
- Sábado: 5 trabajadores en Sitio B

En lugar de cargar manualmente cada semana:
1. Se programa la primera semana
2. Se usa este endpoint para copiar a las siguientes semanas
3. Se ajustan solo los cambios excepcionales

### Caso 2: Planificación Anticipada

Al final de cada mes:
1. Se copia la última semana del mes a las 4 semanas del siguiente mes
2. Se revisan y ajustan las asignaciones según necesidad
3. Se ahorra tiempo en entrada de datos

### Caso 3: Recuperación de Programación

Si se borra accidentalmente una semana:
1. Se copia desde la semana anterior
2. Se ajustan las fechas manualmente si es necesario

## ⚠️ Consideraciones Importantes

### 1. Conflictos
- El endpoint **NO permite sobrescribir** programación existente
- Si la semana destino ya tiene asignaciones, retorna error 409
- Solución: Eliminar la programación existente primero si se quiere reemplazar

### 2. Validaciones de Relaciones
- Solo copia asignaciones con estado `'activo'`
- No valida si los `cliente_id` o `nodo_id` siguen siendo válidos en la nueva semana
- Asume que las relaciones FK siguen existiendo

### 3. Performance
- Para programaciones muy grandes (>1000 asignaciones), puede tomar tiempo
- Se recomienda mostrar un indicador de carga en el frontend
- Las inserciones son secuenciales (no en batch) para mejor logging

### 4. Auditoría
- Cada nueva asignación se registra con `created_at = NOW()`
- El campo `created_by` se establece en `'sistema'` (ajustable según autenticación)

## 🔍 Debugging

### Ver logs del servidor
Los logs incluyen información detallada:
```
📅 Copiando programación de semana 2025-11-03 a 2025-11-10 para cartera 1
📋 Se encontraron 25 asignaciones para copiar
✅ Copiado: 12.345.678-9 - 2025-11-03 → 2025-11-10
✅ Copiado: 98.765.432-1 - 2025-11-03 → 2025-11-10
...
📊 Resultado: 25 copiados, 0 errores
```

### Consultar programación copiada
Después de copiar, verificar con:
```
GET /api/programacion-semanal?cartera_id=1&fecha_inicio=2025-11-10&fecha_fin=2025-11-16
```

### Tabla de la base de datos
```sql
SELECT * 
FROM mantenimiento.programacion_semanal 
WHERE semana_inicio = '2025-11-10' 
  AND cartera_id = 1
ORDER BY fecha_trabajo, rut;
```

## 🚀 Mejoras Futuras (Opcionales)

- [ ] Permitir copiar a múltiples semanas de una vez
- [ ] Opción para sobrescribir programación existente
- [ ] Copiar entre carteras diferentes
- [ ] Vista previa antes de confirmar la copia
- [ ] Opción para ajustar horas_estimadas en bloque
- [ ] Inserción en batch para mejor performance

---

**Endpoint creado**: Noviembre 5, 2025  
**Archivo**: `routes/programacion-semanal.js`  
**Test**: `test-copiar-programacion.js`
