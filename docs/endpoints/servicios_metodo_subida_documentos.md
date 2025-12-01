# Método de Subida de Documentos - Clientes

## Descripción
Sistema flexible para configurar cómo y dónde cada cliente debe subir sus documentos de prerrequisitos. Cada cliente puede tener un método diferente con configuración específica almacenada en JSON.

## Columnas en `servicios.clientes`

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `metodo_subida_documentos` | VARCHAR(50) | `'portal_web'` | Método de subida: `portal_web`, `email`, `carpeta_compartida`, `plataforma_externa`, `presencial` |
| `config_subida_documentos` | JSONB | `{}` | Configuración específica del método en formato JSON |

## Métodos Disponibles

### 1. `portal_web`
Portal web interno del sistema (por defecto).

**Configuración ejemplo:**
```json
{
  "descripcion": "Portal web interno del sistema",
  "url": "/documentos/upload",
  "activo": true
}
```

### 2. `email`
Documentos enviados por correo electrónico.

**Configuración ejemplo:**
```json
{
  "descripcion": "Envío por correo electrónico",
  "email_destino": "documentos@cliente.com",
  "asunto_requerido": "Prerrequisitos - [NOMBRE_TRABAJADOR]",
  "contacto_responsable": "Juan Pérez",
  "telefono_contacto": "+56912345678",
  "instrucciones": "Enviar documentos en PDF adjuntos al email"
}
```

### 3. `carpeta_compartida`
Carpeta compartida en red o cloud (Google Drive, Dropbox, OneDrive).

**Configuración ejemplo:**
```json
{
  "descripcion": "Google Drive compartido",
  "tipo": "google_drive",
  "carpeta_url": "https://drive.google.com/drive/folders/1a2b3c4d5e",
  "estructura_carpetas": {
    "patron": "/[CLIENTE]/[AÑO]/[TRABAJADOR]",
    "ejemplo": "/CEMENTERAS/2025/JUAN_PEREZ"
  },
  "permisos": "editores",
  "contacto_responsable": "María González",
  "email_contacto": "maria.gonzalez@cliente.com"
}
```

**Alternativa con carpeta de red:**
```json
{
  "descripcion": "Carpeta compartida en red local",
  "tipo": "red_local",
  "ruta_unc": "\\\\servidor\\clientes\\CEMENTERAS\\Documentos",
  "permisos_requeridos": "lectura_escritura",
  "contacto_ti": "Soporte TI Cliente",
  "extension_vpn": "cliente-vpn.com"
}
```

### 4. `plataforma_externa`
Plataforma de terceros (Workday, SAP SuccessFactors, etc.).

**Configuración ejemplo:**
```json
{
  "descripcion": "Plataforma Workday del cliente",
  "plataforma": "workday",
  "url_portal": "https://workday.cliente.com",
  "api_endpoint": "https://api.workday.cliente.com/v1/documents",
  "requiere_autenticacion": true,
  "contacto_tecnico": "TI Cliente",
  "email_soporte": "soporte.workday@cliente.com",
  "documentacion_integracion": "https://docs.cliente.com/workday-integration"
}
```

### 5. `presencial`
Entrega física de documentos.

**Configuración ejemplo:**
```json
{
  "descripcion": "Entrega presencial en oficina del cliente",
  "direccion": "Av. Principal 1234, Santiago",
  "horario_atencion": "Lunes a Viernes 9:00-18:00",
  "contacto_recepcion": "Secretaría General",
  "telefono": "+56223456789",
  "instrucciones": "Presentarse con documentos originales y copia. Solicitar comprobante de entrega.",
  "requiere_cita": true,
  "email_citas": "citas@cliente.com"
}
```

---

## Endpoints API

### 1. Obtener cliente con método de subida
**GET** `/api/servicios/clientes/:id`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Cliente obtenido exitosamente",
  "data": {
    "id": 11,
    "nombre": "CEMENTERAS",
    "cartera_id": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "region_id": 13,
    "metodo_subida_documentos": "carpeta_compartida",
    "config_subida_documentos": {
      "descripcion": "Google Drive compartido",
      "tipo": "google_drive",
      "carpeta_url": "https://drive.google.com/drive/folders/1a2b3c4d5e",
      "estructura_carpetas": {
        "patron": "/[CLIENTE]/[AÑO]/[TRABAJADOR]",
        "ejemplo": "/CEMENTERAS/2025/JUAN_PEREZ"
      },
      "permisos": "editores",
      "contacto_responsable": "María González",
      "email_contacto": "maria.gonzalez@cliente.com"
    },
    "cartera_nombre": "Cartera Principal",
    "total_nodos": 5,
    "nodos": [...]
  }
}
```

---

### 2. Actualizar método de subida
**PUT** `/api/servicios/clientes/:id/metodo-subida`

**Body:**
```json
{
  "metodo_subida_documentos": "email",
  "config_subida_documentos": {
    "descripcion": "Envío por correo electrónico",
    "email_destino": "documentos@cliente.com",
    "asunto_requerido": "Prerrequisitos - [NOMBRE_TRABAJADOR]",
    "contacto_responsable": "Juan Pérez",
    "telefono_contacto": "+56912345678",
    "instrucciones": "Enviar documentos en PDF adjuntos al email"
  },
  "usuario_modificacion": "admin@sistema.com"
}
```

**Notas:**
- Puede actualizar solo `metodo_subida_documentos`, solo `config_subida_documentos`, o ambos
- `usuario_modificacion` es opcional (por defecto: 'sistema')
- Los cambios se registran automáticamente en el historial

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Método de subida actualizado exitosamente",
  "data": {
    "id": 11,
    "nombre": "CEMENTERAS",
    "cartera_id": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "region_id": 13,
    "metodo_subida_documentos": "email",
    "config_subida_documentos": {
      "descripcion": "Envío por correo electrónico",
      "email_destino": "documentos@cliente.com",
      "asunto_requerido": "Prerrequisitos - [NOMBRE_TRABAJADOR]",
      "contacto_responsable": "Juan Pérez",
      "telefono_contacto": "+56912345678",
      "instrucciones": "Enviar documentos en PDF adjuntos al email"
    }
  }
}
```

**Errores comunes:**

**400 - Método inválido:**
```json
{
  "success": false,
  "error": "Método de subida inválido",
  "message": "El método debe ser uno de: portal_web, email, carpeta_compartida, plataforma_externa, presencial"
}
```

**400 - Sin datos para actualizar:**
```json
{
  "success": false,
  "error": "Datos inválidos",
  "message": "Debe proporcionar metodo_subida_documentos o config_subida_documentos"
}
```

**404 - Cliente no encontrado:**
```json
{
  "success": false,
  "error": "Cliente no encontrado",
  "message": "No existe cliente con ID 999"
}
```

---

### 3. Obtener historial de cambios
**GET** `/api/servicios/clientes/:id/historial-metodo-subida`

**Query parameters:**
- `limit` (opcional, default: 50) - Número de registros por página
- `offset` (opcional, default: 0) - Desplazamiento para paginación

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Historial obtenido exitosamente",
  "data": [
    {
      "id": 15,
      "metodo_anterior": "portal_web",
      "metodo_nuevo": "email",
      "config_anterior": {
        "descripcion": "Portal web interno del sistema",
        "url": "/documentos/upload",
        "activo": true
      },
      "config_nueva": {
        "descripcion": "Envío por correo electrónico",
        "email_destino": "documentos@cliente.com",
        "asunto_requerido": "Prerrequisitos - [NOMBRE_TRABAJADOR]",
        "contacto_responsable": "Juan Pérez",
        "telefono_contacto": "+56912345678"
      },
      "usuario_modificacion": "admin@sistema.com",
      "fecha_modificacion": "2025-12-01T15:30:00.000Z"
    },
    {
      "id": 12,
      "metodo_anterior": "carpeta_compartida",
      "metodo_nuevo": "portal_web",
      "config_anterior": {...},
      "config_nueva": {...},
      "usuario_modificacion": "sistema",
      "fecha_modificacion": "2025-11-28T10:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### 4. Crear cliente con método personalizado
**POST** `/api/servicios/clientes`

**Body (con configuración personalizada):**
```json
{
  "nombre": "NUEVO CLIENTE",
  "cartera_id": 1,
  "region_id": 13,
  "metodo_subida_documentos": "plataforma_externa",
  "config_subida_documentos": {
    "descripcion": "Plataforma Workday del cliente",
    "plataforma": "workday",
    "url_portal": "https://workday.cliente.com",
    "requiere_autenticacion": true,
    "contacto_tecnico": "TI Cliente"
  }
}
```

**Body (valores por defecto):**
```json
{
  "nombre": "CLIENTE CON DEFAULTS",
  "cartera_id": 1,
  "region_id": 13
}
```
*Se aplicará automáticamente `metodo_subida_documentos: 'portal_web'` con config por defecto.*

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Cliente creado exitosamente",
  "data": {
    "id": 49,
    "nombre": "NUEVO CLIENTE",
    "cartera_id": 1,
    "region_id": 13,
    "metodo_subida_documentos": "plataforma_externa",
    "config_subida_documentos": {
      "descripcion": "Plataforma Workday del cliente",
      "plataforma": "workday",
      "url_portal": "https://workday.cliente.com",
      "requiere_autenticacion": true,
      "contacto_tecnico": "TI Cliente"
    },
    "created_at": "2025-12-01T16:00:00.000Z"
  }
}
```

---

## Base de Datos

### Tabla: `servicios.clientes`
```sql
ALTER TABLE servicios.clientes 
  ADD COLUMN metodo_subida_documentos VARCHAR(50) DEFAULT 'portal_web',
  ADD COLUMN config_subida_documentos JSONB DEFAULT '{}';

CREATE INDEX idx_clientes_metodo_subida 
  ON servicios.clientes(metodo_subida_documentos);
```

### Tabla de auditoría: `servicios.clientes_metodo_subida_historial`
```sql
CREATE TABLE servicios.clientes_metodo_subida_historial (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES servicios.clientes(id) ON DELETE CASCADE,
  metodo_anterior VARCHAR(50),
  metodo_nuevo VARCHAR(50),
  config_anterior JSONB,
  config_nueva JSONB,
  usuario_modificacion VARCHAR(255),
  fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_historial_cliente_metodo 
  ON servicios.clientes_metodo_subida_historial(cliente_id, fecha_modificacion DESC);
```

---

## Casos de Uso

### 1. Cliente con portal web (default)
```json
{
  "metodo_subida_documentos": "portal_web",
  "config_subida_documentos": {
    "descripcion": "Portal web interno",
    "url": "/documentos/upload",
    "activo": true
  }
}
```
→ Personal sube documentos directamente en el sistema.

### 2. Cliente con email
```json
{
  "metodo_subida_documentos": "email",
  "config_subida_documentos": {
    "email_destino": "documentos@cliente.com",
    "asunto_requerido": "Prerrequisitos - [NOMBRE]"
  }
}
```
→ Sistema envía email al cliente con documentos adjuntos.

### 3. Cliente con Google Drive
```json
{
  "metodo_subida_documentos": "carpeta_compartida",
  "config_subida_documentos": {
    "tipo": "google_drive",
    "carpeta_url": "https://drive.google.com/...",
    "estructura_carpetas": {
      "patron": "/[CLIENTE]/[TRABAJADOR]"
    }
  }
}
```
→ Sistema sube documentos a Google Drive del cliente.

### 4. Cliente con plataforma externa
```json
{
  "metodo_subida_documentos": "plataforma_externa",
  "config_subida_documentos": {
    "plataforma": "workday",
    "api_endpoint": "https://api.workday.cliente.com/...",
    "requiere_autenticacion": true
  }
}
```
→ Sistema integra con API de Workday para subir documentos.

### 5. Cliente presencial
```json
{
  "metodo_subida_documentos": "presencial",
  "config_subida_documentos": {
    "direccion": "Av. Principal 1234",
    "horario_atencion": "Lun-Vie 9-18",
    "requiere_cita": true
  }
}
```
→ Personal entrega documentos físicamente en oficina del cliente.

---

## Frontend - Ejemplo de uso

### Obtener configuración del cliente
```javascript
const response = await axios.get(`/api/servicios/clientes/${clienteId}`);
const { metodo_subida_documentos, config_subida_documentos } = response.data.data;

switch(metodo_subida_documentos) {
  case 'portal_web':
    // Mostrar formulario de upload
    break;
  case 'email':
    // Mostrar instrucciones de email con contacto
    break;
  case 'carpeta_compartida':
    // Mostrar link a carpeta compartida
    break;
  case 'plataforma_externa':
    // Redirigir a plataforma externa
    break;
  case 'presencial':
    // Mostrar dirección y horario
    break;
}
```

### Actualizar configuración
```javascript
const response = await axios.put(
  `/api/servicios/clientes/${clienteId}/metodo-subida`,
  {
    metodo_subida_documentos: 'email',
    config_subida_documentos: {
      email_destino: 'docs@cliente.com',
      asunto_requerido: 'Prerrequisitos',
      contacto_responsable: 'Juan Pérez'
    },
    usuario_modificacion: currentUser.email
  }
);
```

### Ver historial de cambios
```javascript
const response = await axios.get(
  `/api/servicios/clientes/${clienteId}/historial-metodo-subida?limit=20`
);

response.data.data.forEach(cambio => {
  console.log(`${cambio.fecha_modificacion}: ${cambio.metodo_anterior} → ${cambio.metodo_nuevo}`);
  console.log(`Por: ${cambio.usuario_modificacion}`);
});
```

---

## Migración

Ejecutar script de migración:
```bash
node scripts/migrations/run_004_add_metodo_subida_documentos.js
```

Resultado esperado:
- ✅ 2 columnas agregadas a `servicios.clientes`
- ✅ Tabla de historial creada
- ✅ Índice para búsquedas rápidas
- ✅ 48 clientes configurados con valores por defecto

---

## Notas importantes

1. **Flexibilidad JSON**: El campo `config_subida_documentos` es JSONB, por lo que puede contener cualquier estructura necesaria sin modificar el schema.

2. **Auditoría automática**: Todos los cambios se registran en `clientes_metodo_subida_historial` con fecha, usuario y valores anteriores/nuevos.

3. **Valores por defecto**: Clientes existentes se configuran automáticamente con `portal_web`.

4. **Validación**: El endpoint valida que el método sea uno de los 5 permitidos.

5. **Extensibilidad**: Para agregar nuevos métodos, solo se necesita:
   - Agregar el método a la validación en el endpoint
   - Documentar la estructura de config_subida_documentos esperada
   - Implementar la lógica de integración en el frontend/backend

6. **Integraciones futuras**: La estructura soporta agregar credenciales de API, tokens, webhooks, etc. en el JSON de configuración.
