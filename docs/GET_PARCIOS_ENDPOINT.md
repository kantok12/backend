# Endpoint: Obtener Personas con Prerrequisitos Parciales

Este documento explica cómo funciona el endpoint `GET /api/prerrequisitos/clientes/:clienteId/parciales` y proporciona un ejemplo de uso para obtener el nombre de una persona a partir de su RUT.

## Descripción del Endpoint

El endpoint permite obtener una lista de personas que cumplen **algunos** pero no todos los prerrequisitos definidos para un cliente específico. Esto es útil para identificar qué documentos faltan para completar los requisitos.

### URL
```
GET /api/prerrequisitos/clientes/:clienteId/parciales
```

### Parámetros
- `clienteId` (requerido): ID del cliente para el cual se desean verificar los prerrequisitos.

### Respuesta
La respuesta es un objeto JSON con el siguiente formato:

```json
{
  "message": "OK",
  "data": [
    {
      "rut": "12345678-9",
      "nombres": "Juan Pérez",
      "cargo": "Analista",
      "documentos": [
        {
          "tipo": "Certificado de Antecedentes",
          "fecha_vencimiento": "2025-12-31",
          "fecha_subida": "2025-01-01",
          "vencido": false
        }
      ],
      "faltantes": [
        "Certificado de Salud"
      ]
    }
  ]
}
```

### Campos de la Respuesta
- `rut`: RUT de la persona.
- `nombres`: Nombre completo de la persona.
- `cargo`: Cargo de la persona.
- `documentos`: Lista de documentos asociados a la persona.
  - `tipo`: Tipo de documento.
  - `fecha_vencimiento`: Fecha de vencimiento del documento (si aplica).
  - `fecha_subida`: Fecha en que se subió el documento.
  - `vencido`: Indica si el documento está vencido (`true` o `false`).
- `faltantes`: Lista de tipos de documentos que faltan para cumplir con los prerrequisitos.

## Ejemplo de Uso

### Obtener Personas con Prerrequisitos Parciales

Realiza una solicitud al endpoint utilizando `Invoke-RestMethod` en PowerShell:

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/prerrequisitos/clientes/28/parciales" | ConvertTo-Json -Depth 10
$response.data
```

### Extraer el Nombre de una Persona por su RUT

Si deseas obtener el nombre de una persona específica a partir de su RUT, puedes filtrar los resultados de la siguiente manera:

```powershell
# Filtrar por RUT
$rut = "12345678-9"
$persona = $response.data | Where-Object { $_.rut -eq $rut }

# Mostrar el nombre
$persona.nombres
```

### Resultado Esperado
Si el RUT existe en los datos devueltos, obtendrás el nombre de la persona:

```
Juan Pérez
```

Si el RUT no existe, el resultado será `null` o vacío.