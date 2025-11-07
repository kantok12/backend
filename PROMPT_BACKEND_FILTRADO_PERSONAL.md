# Prompt para Backend: Filtrado de Personal por Prerrequisitos de Cliente

## Contexto del Problema

Actualmente el frontend está realizando el filtrado de personal según los prerrequisitos del cliente, lo que genera problemas de performance:

- **N+1 queries**: Por cada persona se hace una petición HTTP para obtener sus documentos
- **Lentitud**: Con 100+ personas, el filtrado toma varios segundos
- **Sobrecarga de red**: Se transfieren todos los documentos de todas las personas al frontend
- **Lógica duplicada**: Si otro sistema necesita este filtro, hay que reimplementarlo

## Solución Requerida

Crear un endpoint optimizado en el backend que retorne **únicamente el personal que cumple con todos los prerrequisitos** de un cliente específico.

---

## Especificaciones del Endpoint

### Ruta Propuesta
```
GET /api/personal-disponible/por-cliente/:cliente_id
```

O alternativamente:
```
GET /api/personal-disponible?cliente_id=:cliente_id&filtrar_por_prerrequisitos=true
```

### Parámetros
- `cliente_id` (number, required): ID del cliente para obtener sus prerrequisitos

### Respuesta Esperada
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "rut": "12345678-9",
      "nombre": "Juan Pérez",
      "cargo": "Operario",
      "estado_id": 1,
      // ... otros campos de personal
      "documentos_count": 5,  // Opcional: cantidad de documentos que tiene
      "cumple_requisitos": true  // Opcional: siempre true si está en el resultado
    }
  ],
  "message": "Personal filtrado exitosamente",
  "total": 15
}
```

---

## ⚠️ IMPORTANTE: Comparación por TIPO de Documento

**NO usar el campo `nombre` del documento para la comparación.**

La comparación debe hacerse entre:
- `prerrequisitos.tipo_documento` ← Campo del prerrequisito
- `documentos.tipo_documento` ← Campo del documento del personal

### ❌ Incorrecto:
```sql
-- NO hacer esto:
WHERE d.nombre = pr.tipo_documento
```

### ✅ Correcto:
```sql
-- Hacer esto:
WHERE LOWER(TRIM(d.tipo_documento)) = LOWER(TRIM(pr.tipo_documento))
```

---

## Lógica de Filtrado

### 1. Obtener Prerrequisitos del Cliente

El cliente tiene dos tipos de prerrequisitos:
- **Globales**: `prerrequisitos.es_global = true AND prerrequisitos.cliente_id IS NULL`
- **Específicos del cliente**: `prerrequisitos.cliente_id = :cliente_id`

```sql
SELECT tipo_documento 
FROM prerrequisitos 
WHERE (cliente_id = :cliente_id OR es_global = true)
```

Ejemplo para cliente ID 28 (ACONCAGUA FOODS - BUIN):
```
- Carnet de Identidad (global)
- prueba (global)
- CV (específico)
- EPP (específico)
- Exámenes Preocupaciones (específico)
```

### 2. Filtrar Personal

Retornar **solo el personal que tiene TODOS los prerrequisitos requeridos**.

**Persona CUMPLE** si:
```
Para cada prerrequisito requerido →
  Existe al menos un documento activo con ese tipo_documento
```

**Persona NO CUMPLE** si:
```
Falta aunque sea 1 prerrequisito
```

---

## Opciones de Implementación SQL

### Opción 1: NOT EXISTS (Recomendada para PostgreSQL)

```sql
SELECT DISTINCT p.* 
FROM personal p
WHERE p.estado_id = 1  -- Solo personal activo
AND NOT EXISTS (
    -- Buscar prerrequisitos que NO tiene esta persona
    SELECT 1 
    FROM prerrequisitos pr
    WHERE (pr.cliente_id = :cliente_id OR pr.es_global = true)
    AND NOT EXISTS (
        -- Verificar si tiene un documento de este tipo
        SELECT 1 
        FROM documentos d
        WHERE d.rut = p.rut 
        AND LOWER(TRIM(d.tipo_documento)) = LOWER(TRIM(pr.tipo_documento))
        AND d.estado = 'Activo'  -- Solo documentos activos
    )
)
ORDER BY p.nombre;
```

**Explicación**: "Dame el personal donde NO EXISTE ningún prerrequisito que NO tenga"
- Si la subquery interior retorna filas = hay prerrequisitos faltantes = excluir persona
- Si la subquery interior está vacía = tiene todos = incluir persona

### Opción 2: COUNT con HAVING (Alternativa)

```sql
WITH prerrequisitos_requeridos AS (
    SELECT tipo_documento
    FROM prerrequisitos
    WHERE (cliente_id = :cliente_id OR es_global = true)
),
personal_con_documentos AS (
    SELECT 
        p.*,
        COUNT(DISTINCT pr.tipo_documento) as prerrequisitos_cumplidos
    FROM personal p
    CROSS JOIN prerrequisitos_requeridos pr
    LEFT JOIN documentos d 
        ON d.rut = p.rut 
        AND LOWER(TRIM(d.tipo_documento)) = LOWER(TRIM(pr.tipo_documento))
        AND d.estado = 'Activo'
    WHERE p.estado_id = 1
    GROUP BY p.id
    HAVING COUNT(DISTINCT pr.tipo_documento) = (SELECT COUNT(*) FROM prerrequisitos_requeridos)
)
SELECT * FROM personal_con_documentos
ORDER BY nombre;
```

**Explicación**: "Cuenta cuántos prerrequisitos cumple cada persona, y retorna solo los que cumplen TODOS"

### Opción 3: Para MySQL (si usas MySQL en vez de PostgreSQL)

```sql
SELECT p.* 
FROM personal p
WHERE p.estado_id = 1
AND (
    SELECT COUNT(DISTINCT pr.tipo_documento)
    FROM prerrequisitos pr
    WHERE (pr.cliente_id = :cliente_id OR pr.es_global = 1)
) = (
    SELECT COUNT(DISTINCT pr2.tipo_documento)
    FROM prerrequisitos pr2
    INNER JOIN documentos d 
        ON LOWER(TRIM(d.tipo_documento)) = LOWER(TRIM(pr2.tipo_documento))
    WHERE d.rut = p.rut
    AND d.estado = 'Activo'
    AND (pr2.cliente_id = :cliente_id OR pr2.es_global = 1)
)
ORDER BY p.nombre;
```

---

## Consideraciones Adicionales

### 1. Normalización de Strings

Para evitar problemas con espacios, mayúsculas, o acentos:

```sql
-- Función helper recomendada (PostgreSQL)
CREATE OR REPLACE FUNCTION normalizar_tipo_documento(texto TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(TRIM(REGEXP_REPLACE(texto, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Uso en la query:
WHERE normalizar_tipo_documento(d.tipo_documento) = normalizar_tipo_documento(pr.tipo_documento)
```

### 2. Estado de Documentos

Solo considerar documentos activos:
```sql
AND d.estado = 'Activo'
```

O verificar que no estén vencidos:
```sql
AND (d.fecha_vencimiento IS NULL OR d.fecha_vencimiento >= CURRENT_DATE)
```

### 3. Performance

- Crear índices en:
  ```sql
  CREATE INDEX idx_documentos_rut_tipo ON documentos(rut, tipo_documento);
  CREATE INDEX idx_prerrequisitos_cliente ON prerrequisitos(cliente_id, tipo_documento);
  CREATE INDEX idx_prerrequisitos_global ON prerrequisitos(es_global, tipo_documento);
  ```

### 4. Cache (Opcional)

Si el resultado no cambia frecuentemente:
- Cachear la respuesta por 5-10 minutos
- Invalidar cache cuando se crea/actualiza/elimina un documento o prerrequisito

---

## Casos de Prueba

### Caso 1: Personal que cumple todos los requisitos
**Setup:**
- Cliente ID 28 requiere: ["CV", "EPP", "Carnet de Identidad"]
- Claudio (RUT: 12345678-9) tiene documentos con `tipo_documento`: ["CV", "EPP", "Carnet de Identidad", "Licencia"]

**Resultado esperado:** Claudio debe aparecer en el resultado ✅

### Caso 2: Personal que le falta un requisito
**Setup:**
- Cliente ID 28 requiere: ["CV", "EPP", "Carnet de Identidad"]
- María (RUT: 98765432-1) tiene documentos con `tipo_documento`: ["CV", "EPP"]

**Resultado esperado:** María NO debe aparecer en el resultado ❌ (le falta "Carnet de Identidad")

### Caso 3: Documentos inactivos no cuentan
**Setup:**
- Cliente ID 28 requiere: ["CV"]
- Pedro (RUT: 11111111-1) tiene documento "CV" pero con `estado = 'Inactivo'`

**Resultado esperado:** Pedro NO debe aparecer en el resultado ❌

### Caso 4: Case-insensitive
**Setup:**
- Cliente requiere: "Carnet de Identidad"
- Ana tiene documento: "CARNET DE IDENTIDAD"

**Resultado esperado:** Ana debe aparecer (comparación case-insensitive) ✅

---

## Endpoints Relacionados (Existentes)

Para referencia, estos endpoints ya existen:

1. **Obtener prerrequisitos de un cliente:**
   ```
   GET /api/prerrequisitos/cliente/:cliente_id
   ```

2. **Obtener documentos de una persona:**
   ```
   GET /api/documentos/persona/:rut
   ```

3. **Obtener todo el personal:**
   ```
   GET /api/personal-disponible?limit=1000&offset=0
   ```

---

## Ejemplo de Implementación en Node.js/Express

```javascript
router.get('/personal-disponible/por-cliente/:cliente_id', async (req, res) => {
  const { cliente_id } = req.params;
  
  try {
    const query = `
      SELECT DISTINCT p.* 
      FROM personal p
      WHERE p.estado_id = 1
      AND NOT EXISTS (
        SELECT 1 
        FROM prerrequisitos pr
        WHERE (pr.cliente_id = $1 OR pr.es_global = true)
        AND NOT EXISTS (
          SELECT 1 
          FROM documentos d
          WHERE d.rut = p.rut 
          AND LOWER(TRIM(d.tipo_documento)) = LOWER(TRIM(pr.tipo_documento))
          AND d.estado = 'Activo'
        )
      )
      ORDER BY p.nombre;
    `;
    
    const result = await pool.query(query, [cliente_id]);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      message: 'Personal filtrado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al filtrar personal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al filtrar personal por prerrequisitos',
      error: error.message
    });
  }
});
```

---

## Migración Frontend → Backend

Una vez implementado el endpoint:

**Frontend actual (lento):**
```typescript
// ❌ Hace N+1 queries
for (const persona of todasLasPersonas) {
  const docs = await getDocumentosByPersona(persona.rut);
  // ... verificar manualmente si cumple
}
```

**Frontend nuevo (rápido):**
```typescript
// ✅ Una sola query
const { data } = await apiService.getPersonalPorCliente(clienteId);
// data ya viene filtrado del backend
```

---

## Preguntas Frecuentes

**P: ¿Qué pasa si un cliente no tiene prerrequisitos específicos?**
R: Se deben considerar solo los prerrequisitos globales (`es_global = true`).

**P: ¿Qué pasa si un cliente no tiene prerrequisitos (ni globales ni específicos)?**
R: Retornar todo el personal activo (no hay restricciones).

**P: ¿Los documentos vencidos cuentan?**
R: Depende de la lógica de negocio. Recomiendo filtrar por `estado = 'Activo'` o verificar `fecha_vencimiento`.

**P: ¿Hay que normalizar espacios múltiples o caracteres especiales?**
R: Sí, usar `TRIM()` y considerar `REGEXP_REPLACE()` para normalizar espacios extras.

---

## Beneficios Esperados

✅ **Performance**: De ~5-10 segundos a <500ms
✅ **Escalabilidad**: Funciona igual con 10 o 10,000 personas
✅ **Mantenibilidad**: Lógica centralizada en el backend
✅ **Reutilización**: Otros sistemas pueden usar el mismo endpoint
✅ **Seguridad**: Menos datos sensibles transferidos al frontend

---

## Prioridad

🔴 **ALTA** - Esta optimización es crítica para la usabilidad del sistema de programación.
