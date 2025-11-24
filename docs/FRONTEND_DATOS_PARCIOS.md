# Guía para Mostrar Datos del Endpoint `parciales`

Este documento explica cómo procesar y mostrar los datos devueltos por el endpoint `GET /api/prerrequisitos/clientes/:clienteId/parciales` en el frontend.

## Estructura de los Datos Devueltos

El endpoint devuelve un objeto JSON con la siguiente estructura:

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

### Campos Importantes
- **`rut`**: Identificador único de la persona.
- **`nombres`**: Nombre completo de la persona. Si está vacío, mostrar "Nombre no disponible".
- **`cargo`**: Cargo de la persona. Si está vacío, mostrar "Cargo no disponible".
- **`documentos`**: Lista de documentos asociados a la persona.
  - `tipo`: Tipo de documento.
  - `fecha_vencimiento`: Fecha de vencimiento del documento.
  - `vencido`: Indica si el documento está vencido (`true` o `false`).
- **`faltantes`**: Lista de documentos que faltan para cumplir con los prerrequisitos.

## Ejemplo de Código para el Frontend

### React Component

```jsx
import React from 'react';

const MostrarDatos = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No se encontraron datos.</p>;
  }

  return (
    <div>
      {data.map((persona, index) => (
        <div key={index} style={{ marginBottom: '20px' }}>
          <h3>{persona.nombres || 'Nombre no disponible'}</h3>
          <p><strong>RUT:</strong> {persona.rut}</p>
          <p><strong>Cargo:</strong> {persona.cargo || 'Cargo no disponible'}</p>
          <p><strong>Documentos Faltantes:</strong> {persona.faltantes.join(', ') || 'Ninguno'}</p>
          <h4>Documentos:</h4>
          <ul>
            {persona.documentos.map((doc, docIndex) => (
              <li key={docIndex}>
                {doc.tipo} - {doc.vencido ? 'Vencido' : 'Vigente'}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default MostrarDatos;
```

### Explicación del Código
1. **Validación de Datos**:
   - Si no hay datos (`data` está vacío o es `null`), se muestra un mensaje indicando que no se encontraron datos.
2. **Iteración sobre los Datos**:
   - Se recorre la lista de personas devuelta por el endpoint y se muestran sus nombres, RUT, cargo, documentos faltantes y detalles de los documentos.
3. **Manejo de Campos Vacíos**:
   - Si `nombres` o `cargo` están vacíos, se muestra un mensaje predeterminado como "Nombre no disponible" o "Cargo no disponible".

## Consideraciones

1. **Formato de Fechas**:
   - Si necesitas mostrar las fechas en un formato específico, utiliza una librería como `date-fns` o `moment.js` para formatearlas.

2. **Estilo**:
   - Usa estilos o componentes de tu framework de diseño (como Material-UI o TailwindCSS) para mejorar la presentación.

3. **Manejo de Errores**:
   - Asegúrate de manejar errores en la solicitud al backend y mostrar mensajes adecuados al usuario.

Con esta guía, el frontend podrá procesar y mostrar los datos del endpoint de manera efectiva.