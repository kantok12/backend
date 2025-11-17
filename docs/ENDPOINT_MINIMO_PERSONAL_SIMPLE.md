# Endpoint: `GET /api/servicios/minimo-personal/simple`

**Descripción**
- Devuelve una lista simple con el nombre del cliente y el mínimo de personal calculado (minimo_real) por cliente.
- Está pensado para consumo por el frontend cuando sólo se requiere mostrar "Nombre de cliente + Mínimo".
- El valor `minimo_real` es calculado por la función de base de datos `servicios.calcular_minimo_real(mp.id)`.

**Ruta completa (ejemplo)**
- `${API_CONFIG.BASE_URL}/servicios/minimo-personal/simple`
- Por defecto, si en el frontend `API_CONFIG.BASE_URL` es `process.env.REACT_APP_API_URL || 'http://localhost:3000/api'`, la URL final será:
  - `http://localhost:3000/api/servicios/minimo-personal/simple`

**Método**
- `GET`

**Parámetros**
- Ninguno en el cuerpo. No necesita `query` ni `body`.

**Autenticación**
- El endpoint actual no requiere body ni parámetros; si su entorno requiere autorización global, aplica la misma lógica que el resto de endpoints del backend (token en header `Authorization`).

**Ejemplo de uso (fetch)**
```javascript
// Usando API_CONFIG.BASE_URL desde el frontend
const url = `${API_CONFIG.BASE_URL}/servicios/minimo-personal/simple`;
const res = await fetch(url);
const json = await res.json();
if (json.success) {
  const items = json.data; // array de { cliente_id, nombre_cliente, minimo_real }
}
```

**Ejemplo de uso (axios)**
```javascript
import axios from 'axios';

const url = `${API_CONFIG.BASE_URL}/servicios/minimo-personal/simple`;
const { data: json } = await axios.get(url);
if (json.success) {
  console.log(json.data);
}
```

**Ejemplo de respuesta (simplificada)**
```json
{
  "success": true,
  "message": "Mínimos simples por cliente obtenidos exitosamente",
  "count": 20,
  "data": [
    { "cliente_id": 39, "nombre_cliente": "ICB S.A.", "minimo_real": 3 },
    { "cliente_id": 40, "nombre_cliente": "PEPSICO", "minimo_real": 10 },
    { "cliente_id": 41, "nombre_cliente": "PROALSA", "minimo_real": 1 },
    { "cliente_id": 42, "nombre_cliente": "VITAL JUGOS - RENCA", "minimo_real": 5 }
  ]
}
```

**Notas y recomendaciones para el frontend**
- `cliente_id` y `minimo_real` vienen como números (ya convertidos en backend). Si tu código usa TypeScript, tipa `{ cliente_id: number; nombre_cliente: string; minimo_real: number }`.
- El endpoint devuelve una entrada por cliente (deduplicado). Si necesitas además `minimo_base` o información adicional, pide al backend que incluya esos campos.
- Si el frontend necesita filtrar por `cartera` o `nodo`, existe el endpoint completo `/api/servicios/minimo-personal` con filtros; usarlo en su lugar.
- Para evitar llamadas repetidas, cachear la respuesta o usar SWR/React Query según la arquitectura del frontend.

**Preguntas frecuentes**
- ¿Devuelve datos paginados? No — devuelve la lista deduplicada por cliente. Si necesitas paginación, usa los endpoints con paginación del servicio completo.
- ¿Incluye clientes inactivos? No — el endpoint filtra `mp.activo = true` (mínimos activos).

---
Archivo creado: `docs/ENDPOINT_MINIMO_PERSONAL_SIMPLE.md` (añade a la documentación del proyecto para uso del frontend).
