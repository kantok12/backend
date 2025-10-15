# 📋 API de Cursos - Guía para Frontend

## 🎯 Endpoint Principal
```
POST http://192.168.10.194:3000/api/cursos
```

## 📝 Estructura de Datos Requerida

```typescript
interface CursoData {
  rut_persona: string;           // REQUERIDO - RUT de la persona
  nombre_curso: string;          // REQUERIDO - Nombre del curso
  fecha_inicio?: string;         // OPCIONAL - Fecha de inicio (YYYY-MM-DD)
  fecha_fin?: string;            // OPCIONAL - Fecha de fin (YYYY-MM-DD)
  fecha_vencimiento?: string;    // OPCIONAL - Fecha de vencimiento (YYYY-MM-DD)
  estado?: string;               // OPCIONAL - Estado del curso (default: 'completado')
  institucion?: string;          // OPCIONAL - Institución que otorga el curso
  descripcion?: string;          // OPCIONAL - Descripción del curso
}
```

## 🔧 Implementación en React/TypeScript

### API Service
```typescript
const createCurso = async (cursoData: CursoData) => {
  try {
    const response = await fetch('http://192.168.10.194:3000/api/cursos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cursoData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Error al crear curso');
    }
    
    return result;
  } catch (error) {
    console.error('Error creando curso:', error);
    throw error;
  }
};
```

### Hook Personalizado
```typescript
const useCreateCurso = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCurso = async (data: CursoData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createCurso(data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createCurso, loading, error };
};
```

## 📋 Formulario de Ejemplo

```tsx
const CursoForm = () => {
  const { createCurso, loading, error } = useCreateCurso();
  const [formData, setFormData] = useState<CursoData>({
    rut_persona: '',
    nombre_curso: '',
    fecha_inicio: '',
    fecha_fin: '',
    fecha_vencimiento: '',
    estado: 'completado',
    institucion: '',
    descripcion: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await createCurso(formData);
      console.log('Curso creado:', result);
      // Manejar éxito (mostrar mensaje, limpiar formulario, etc.)
    } catch (error) {
      console.error('Error:', error);
      // Manejar error (mostrar mensaje de error)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>RUT de la Persona *</label>
        <input
          type="text"
          value={formData.rut_persona}
          onChange={(e) => setFormData({...formData, rut_persona: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>Nombre del Curso *</label>
        <input
          type="text"
          value={formData.nombre_curso}
          onChange={(e) => setFormData({...formData, nombre_curso: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>Fecha de Inicio</label>
        <input
          type="date"
          value={formData.fecha_inicio}
          onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
        />
      </div>
      
      <div>
        <label>Fecha de Fin</label>
        <input
          type="date"
          value={formData.fecha_fin}
          onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
        />
      </div>
      
      <div>
        <label>Fecha de Vencimiento</label>
        <input
          type="date"
          value={formData.fecha_vencimiento}
          onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
        />
      </div>
      
      <div>
        <label>Estado</label>
        <select
          value={formData.estado}
          onChange={(e) => setFormData({...formData, estado: e.target.value})}
        >
          <option value="completado">Completado</option>
          <option value="en_progreso">En Progreso</option>
          <option value="pendiente">Pendiente</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
      
      <div>
        <label>Institución</label>
        <input
          type="text"
          value={formData.institucion}
          onChange={(e) => setFormData({...formData, institucion: e.target.value})}
        />
      </div>
      
      <div>
        <label>Descripción</label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Curso'}
      </button>
      
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

## 📊 Respuestas del Servidor

### ✅ Éxito (201 Created)
```json
{
  "success": true,
  "message": "Curso creado exitosamente",
  "data": {
    "id": 123,
    "rut_persona": "12345678-9",
    "nombre_curso": "Seguridad Industrial",
    "fecha_inicio": "2025-01-15",
    "fecha_fin": "2025-01-20",
    "fecha_vencimiento": "2026-01-20",
    "estado": "completado",
    "institucion": "Instituto de Seguridad",
    "descripcion": "Curso básico de seguridad industrial",
    "fecha_creacion": "2025-10-01T17:30:00.000Z",
    "activo": true
  }
}
```

### ❌ Error de Validación (400 Bad Request)
```json
{
  "success": false,
  "message": "RUT y nombre del curso son requeridos"
}
```

### ❌ Persona No Encontrada (404 Not Found)
```json
{
  "success": false,
  "message": "No se encontró personal con RUT: 12345678-9"
}
```

### ❌ Curso Duplicado (409 Conflict)
```json
{
  "success": false,
  "message": "La persona ya tiene un curso registrado: Seguridad Industrial"
}
```

### ❌ Error del Servidor (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "Detalles del error"
}
```

## 🔍 Validaciones del Backend

1. **Campos Requeridos:** `rut_persona` y `nombre_curso`
2. **Persona Existe:** Verifica que el RUT exista en `personal_disponible`
3. **No Duplicados:** Verifica que no exista el mismo curso para la misma persona
4. **Formato de Fechas:** Acepta formato ISO (YYYY-MM-DD)

## 💡 Consejos para el Frontend

1. **Validación Local:** Validar RUT y nombre del curso antes de enviar
2. **Manejo de Errores:** Mostrar mensajes específicos según el código de error
3. **Loading States:** Mostrar indicador de carga durante la creación
4. **Formato de Fechas:** Usar input type="date" para las fechas
5. **Limpieza de Datos:** Trim automático en el nombre del curso

## 🗂️ Estructura de la Tabla `mantenimiento.cursos`

| Columna | Tipo | Descripción | Restricciones |
|---------|------|-------------|---------------|
| `id` | SERIAL | ID único del curso | PRIMARY KEY, AUTO_INCREMENT |
| `rut_persona` | VARCHAR | RUT de la persona | NOT NULL, FK a personal_disponible |
| `nombre_curso` | VARCHAR | Nombre del curso | NOT NULL |
| `fecha_inicio` | DATE | Fecha de inicio del curso | NULLABLE |
| `fecha_fin` | DATE | Fecha de finalización del curso | NULLABLE |
| `fecha_vencimiento` | DATE | Fecha de vencimiento del certificado | NULLABLE |
| `estado` | VARCHAR | Estado del curso | DEFAULT 'completado' |
| `institucion` | VARCHAR | Institución que otorga el curso | NULLABLE |
| `descripcion` | TEXT | Descripción del curso | NULLABLE |
| `fecha_creacion` | TIMESTAMP | Fecha de creación del registro | DEFAULT CURRENT_TIMESTAMP |
| `fecha_actualizacion` | TIMESTAMP | Fecha de última actualización | DEFAULT CURRENT_TIMESTAMP |
| `activo` | BOOLEAN | Indica si el registro está activo | DEFAULT true |

## 🔗 Otros Endpoints Relacionados

### Obtener Cursos de una Persona
```
GET http://192.168.10.194:3000/api/cursos/persona/{rut}
```

### Obtener Todos los Cursos
```
GET http://192.168.10.194:3000/api/cursos
```

### Actualizar Curso
```
PUT http://192.168.10.194:3000/api/cursos/{id}
```

### Eliminar Curso (Soft Delete)
```
DELETE http://192.168.10.194:3000/api/cursos/{id}
```

