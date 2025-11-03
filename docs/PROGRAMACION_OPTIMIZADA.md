# Documentación Programación Optimizada

Esta documentación describe los endpoints disponibles para manejar la programación optimizada de personal, incluyendo ejemplos de requests y responses.

## Endpoints Disponibles

### 1. Obtener Programación
```http
GET /api/programacion-optimizada
```

#### Parámetros Query
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| cartera_id | number | ID de la cartera (requerido) |
| fecha | string | Fecha específica (YYYY-MM-DD). Obtiene toda la semana |
| fecha_inicio | string | Inicio del rango (YYYY-MM-DD) |
| fecha_fin | string | Fin del rango (YYYY-MM-DD) |
| semana | string | Fecha de inicio de semana (YYYY-MM-DD) |

#### Ejemplo de Response
```json
{
    "success": true,
    "data": {
        "cartera": {
            "id": 6,
            "nombre": "Nombre Cartera"
        },
        "periodo": {
            "inicio": "2025-11-03",
            "fin": "2025-11-09"
        },
        "programacion": [
            {
                "fecha": "2025-11-03",
                "dia_semana": "lunes",
                "trabajadores": [
                    {
                        "id": 27,
                        "rut": "12345678-9",
                        "nombre_persona": "Nombre Trabajador",
                        "cargo": "Cargo",
                        "cartera_id": "6",
                        "nombre_cartera": "Nombre Cartera",
                        "cliente_id": "100",
                        "nombre_cliente": "Cliente",
                        "nodo_id": "200",
                        "nombre_nodo": "Nodo",
                        "fecha_trabajo": "2025-11-03",
                        "dia_semana": "lunes",
                        "horas_estimadas": 8,
                        "horas_reales": null,
                        "observaciones": "Observación",
                        "estado": "programado"
                    }
                ]
            }
        ]
    }
}
```

### 2. Crear/Actualizar Programación
```http
POST /api/programacion-optimizada
```

#### Request Body
```json
{
    "rut": "12345678-9",
    "cartera_id": 6,
    "cliente_id": 100,
    "nodo_id": 200,
    "fechas_trabajo": ["2025-11-03", "2025-11-04", "2025-11-05"],
    "horas_estimadas": 8,
    "observaciones": "Turno diurno",
    "estado": "programado"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| rut | string | Sí | RUT del trabajador |
| cartera_id | number | Sí | ID de la cartera |
| cliente_id | number | No | ID del cliente |
| nodo_id | number | No | ID del nodo |
| fechas_trabajo | array[string] | Sí | Array de fechas en formato YYYY-MM-DD |
| horas_estimadas | number | No | Horas estimadas (default: 8) |
| observaciones | string | No | Observaciones adicionales |
| estado | string | No | Estado (default: "programado") |

#### Response (201 Created)
```json
{
    "success": true,
    "message": "Programación procesada: 2 fechas creadas, 1 fechas actualizadas",
    "data": {
        "programacion": [
            {
                "id": 28,
                "rut": "12345678-9",
                "cartera_id": 6,
                "cliente_id": 100,
                "nodo_id": 200,
                "fecha_trabajo": "2025-11-03",
                "dia_semana": "lunes",
                "horas_estimadas": 8,
                "observaciones": "Turno diurno",
                "estado": "programado",
                "created_by": "sistema",
                "created_at": "2025-11-03T12:00:00.000Z"
            }
            // ... más registros
        ],
        "resumen": {
            "total": 3,
            "creadas": 2,
            "actualizadas": 1,
            "fechas_creadas": ["2025-11-03","2025-11-04"],
            "fechas_actualizadas": ["2025-11-05"]
        }
    }
}
```

## Ejemplos de Uso (Frontend)

### Obtener Programación
```javascript
// Función para obtener programación
async function obtenerProgramacion(carteraId, fecha) {
    try {
        const response = await fetch(
            `/api/programacion-optimizada?cartera_id=${carteraId}&fecha=${fecha}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': 'Bearer ' + token  // Si se requiere autenticación
                }
            }
        );

        if (!response.ok) {
            throw new Error('Error al obtener programación');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Ejemplo de uso
obtenerProgramacion(6, '2025-11-03')
    .then(data => {
        console.log('Programación:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
```

### Crear/Actualizar Programación
```javascript
// Función para crear/actualizar programación
async function crearProgramacion(datos) {
    try {
        const response = await fetch('/api/programacion-optimizada', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer ' + token  // Si se requiere autenticación
            },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear programación');
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Ejemplo de uso
const nuevaProgramacion = {
    rut: '12345678-9',
    cartera_id: 6,
    cliente_id: 100,
    nodo_id: 200,
    fechas_trabajo: ['2025-11-03', '2025-11-04', '2025-11-05'],
    horas_estimadas: 8,
    observaciones: 'Turno diurno',
    estado: 'programado'
};

crearProgramacion(nuevaProgramacion)
    .then(resultado => {
        console.log('Programación creada:', resultado);
        console.log('Resumen:', resultado.data.resumen);
    })
    .catch(error => {
        console.error('Error:', error);
    });
```

## Manejo de Errores

### Códigos de Error
- 400: Datos inválidos o faltantes
- 404: Recurso no encontrado
- 409: Conflicto (registro duplicado)
- 500: Error interno del servidor

### Ejemplos de Errores
```json
// 400 Bad Request
{
    "success": false,
    "message": "rut, cartera_id y fechas_trabajo (array) son requeridos"
}

// 404 Not Found
{
    "success": false,
    "message": "Persona no encontrada"
}

// 409 Conflict
{
    "success": false,
    "message": "Ya existe programación para esta persona en esta cartera y fecha"
}
```

## Recomendaciones Frontend
1. Validar datos antes de enviar:
   - RUT válido
   - Fechas en formato YYYY-MM-DD
   - Array de fechas no vacío
   - IDs numéricos válidos

2. Manejar estados de carga:
   ```javascript
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);

   // En la función de fetch
   setLoading(true);
   try {
       // ... fetch
   } catch (err) {
       setError(err.message);
   } finally {
       setLoading(false);
   }
   ```

3. Implementar reintentos para errores de red:
   ```javascript
   async function fetchConReintento(url, opciones, intentos = 3) {
       for (let i = 0; i < intentos; i++) {
           try {
               const response = await fetch(url, opciones);
               if (response.ok) return await response.json();
           } catch (err) {
               if (i === intentos - 1) throw err;
               await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
           }
       }
   }
   ```

4. Mantener estado local actualizado:
   ```javascript
   const [programacion, setProgramacion] = useState([]);
   
   // Después de crear/actualizar
   const actualizarProgramacion = async () => {
       const nuevaData = await obtenerProgramacion(carteraId, fecha);
       setProgramacion(nuevaData.programacion);
   };
   ```

## Notas Adicionales
- La programación optimizada permite mayor granularidad (por día) que el sistema anterior
- Mantiene historial de cambios automáticamente
- Soporta horas reales además de estimadas
- Incluye información de cliente y nodo
- Permite actualizaciones parciales de registros existentes