# 🚀 Guía para Probar Endpoints con Frontend

## 📋 **URL Base de la API**
```
https://backend-gestion-personal-694385816892.us-central1.run.app
```

## 🔧 **Configuración Inicial del Frontend**

### **1. Configurar CORS (Importante)**
Primero, configura CORS para tu dominio:

```bash
gcloud run services update backend-gestion-personal \
  --region us-central1 \
  --set-env-vars CORS_ORIGIN=https://tu-dominio-frontend.com,http://localhost:3000,http://localhost:3001
```

### **2. Headers Recomendados**
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

---

## 🎯 **Endpoints Principales para Probar**

### **1. Health Check**
```javascript
// GET - Verificar estado del servidor
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/health')
  .then(response => response.json())
  .then(data => console.log('Servidor:', data));
```

### **2. Información de la API**
```javascript
// GET - Obtener documentación de endpoints
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/')
  .then(response => response.json())
  .then(data => console.log('API Info:', data));
```

---

## 👥 **Gestión de Personal**

### **3. Obtener Personal Disponible**
```javascript
// GET - Listar todo el personal
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/personal-disponible')
  .then(response => response.json())
  .then(data => console.log('Personal:', data));

// GET - Con filtros
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/personal-disponible?cargo=Operador&zona_geografica=Santiago&limit=10')
  .then(response => response.json())
  .then(data => console.log('Personal Filtrado:', data));
```

### **4. Obtener Nombres del Personal**
```javascript
// GET - Listar nombres
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/nombres')
  .then(response => response.json())
  .then(data => console.log('Nombres:', data));
```

### **5. Obtener Estados del Personal**
```javascript
// GET - Listar estados
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/estados')
  .then(response => response.json())
  .then(data => console.log('Estados:', data));
```

---

## 📄 **Gestión de Documentos**

### **6. Obtener Documentos**
```javascript
// GET - Listar documentos
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/documentos')
  .then(response => response.json())
  .then(data => console.log('Documentos:', data));

// GET - Documentos por persona
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/documentos?rut=12345678-9')
  .then(response => response.json())
  .then(data => console.log('Documentos por RUT:', data));

// GET - Documentos por tipo
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/documentos?tipo_documento=Certificado')
  .then(response => response.json())
  .then(data => console.log('Certificados:', data));
```

### **7. Subir Documento**
```javascript
// POST - Subir documento
const formData = new FormData();
formData.append('archivo', fileInput.files[0]);
formData.append('rut_persona', '12345678-9');
formData.append('tipo_documento', 'Certificado');
formData.append('descripcion', 'Certificado de seguridad');

fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/documentos', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log('Documento subido:', data));
```

---

## 🎓 **Gestión de Cursos**

### **8. Obtener Cursos**
```javascript
// GET - Listar cursos
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/cursos')
  .then(response => response.json())
  .then(data => console.log('Cursos:', data));

// GET - Cursos por persona
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/cursos/persona/12345678-9')
  .then(response => response.json())
  .then(data => console.log('Cursos por persona:', data));

// GET - Estadísticas de cursos
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/cursos/stats')
  .then(response => response.json())
  .then(data => console.log('Stats cursos:', data));
```

### **9. Crear Curso**
```javascript
// POST - Crear nuevo curso
const nuevoCurso = {
  rut_persona: '12345678-9',
  nombre_curso: 'Seguridad Industrial',
  institucion: 'Instituto de Seguridad',
  fecha_obtencion: '2024-01-15',
  fecha_vencimiento: '2025-01-15',
  estado: 'vigente'
};

fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/cursos', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(nuevoCurso)
})
.then(response => response.json())
.then(data => console.log('Curso creado:', data));
```

---

## 🏢 **Gestión de Servicios**

### **10. Obtener Carteras**
```javascript
// GET - Listar carteras
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/carteras')
  .then(response => response.json())
  .then(data => console.log('Carteras:', data));
```

### **11. Obtener Clientes**
```javascript
// GET - Listar clientes
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/clientes')
  .then(response => response.json())
  .then(data => console.log('Clientes:', data));

// GET - Clientes con filtros
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/clientes?cartera_id=1&activo=true')
  .then(response => response.json())
  .then(data => console.log('Clientes filtrados:', data));
```

### **12. Obtener Nodos**
```javascript
// GET - Listar nodos
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/nodos')
  .then(response => response.json())
  .then(data => console.log('Nodos:', data));
```

---

## 🔧 **Área de Servicio**

### **13. Personal del Área de Servicio**
```javascript
// GET - Personal del área de servicio
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/area-servicio')
  .then(response => response.json())
  .then(data => console.log('Área de servicio:', data));

// GET - Estadísticas del área
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/area-servicio/stats')
  .then(response => response.json())
  .then(data => console.log('Stats área:', data));

// GET - Personal por cargo
fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/area-servicio/cargo/Operador')
  .then(response => response.json())
  .then(data => console.log('Operadores:', data));
```

---

## 🔐 **Autenticación (Opcional)**

### **14. Registro Simple**
```javascript
// POST - Registrar usuario
const usuario = {
  username: 'test@ejemplo.com',
  password: 'password123'
};

fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/auth/register-simple', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(usuario)
})
.then(response => response.json())
.then(data => console.log('Usuario registrado:', data));
```

### **15. Login**
```javascript
// POST - Iniciar sesión
const credenciales = {
  username: 'test@ejemplo.com',
  password: 'password123'
};

fetch('https://backend-gestion-personal-694385816892.us-central1.run.app/api/auth/login', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(credenciales)
})
.then(response => response.json())
.then(data => {
  console.log('Login:', data);
  // Guardar token si es exitoso
  if (data.success && data.token) {
    localStorage.setItem('token', data.token);
  }
});
```

---

## 🛠️ **Ejemplo Completo con React**

```jsx
import React, { useState, useEffect } from 'react';

const API_BASE = 'https://backend-gestion-personal-694385816892.us-central1.run.app';

function App() {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar personal al iniciar
    fetchPersonal();
  }, []);

  const fetchPersonal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/personal-disponible?limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setPersonal(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentos = async (rut) => {
    try {
      const response = await fetch(`${API_BASE}/api/documentos?rut=${rut}`);
      const data = await response.json();
      console.log('Documentos:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Personal Disponible</h1>
      {personal.map(persona => (
        <div key={persona.rut} style={{border: '1px solid #ccc', margin: '10px', padding: '10px'}}>
          <h3>{persona.nombre}</h3>
          <p>RUT: {persona.rut}</p>
          <p>Cargo: {persona.cargo}</p>
          <p>Zona: {persona.zona_geografica}</p>
          <button onClick={() => fetchDocumentos(persona.rut)}>
            Ver Documentos
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;
```

---

## 🧪 **Herramientas de Prueba**

### **1. Postman Collection**
```json
{
  "info": {
    "name": "Backend Gestión Personal",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://backend-gestion-personal-694385816892.us-central1.run.app"
    }
  ]
}
```

### **2. cURL Examples**
```bash
# Health check
curl https://backend-gestion-personal-694385816892.us-central1.run.app/api/health

# Obtener personal
curl https://backend-gestion-personal-694385816892.us-central1.run.app/api/personal-disponible

# Obtener documentos
curl https://backend-gestion-personal-694385816892.us-central1.run.app/api/documentos
```

---

## ⚠️ **Notas Importantes**

1. **CORS**: Configura los orígenes permitidos en Cloud Run
2. **Rate Limiting**: La API no tiene rate limiting implementado
3. **Autenticación**: Actualmente deshabilitada para desarrollo
4. **Uploads**: Los archivos se suben a `/uploads/` en el servidor
5. **Paginación**: Usa `limit` y `offset` para paginar resultados

---

## 🚀 **Próximos Pasos**

1. **Configurar CORS** para tu dominio
2. **Implementar autenticación** si es necesario
3. **Agregar manejo de errores** en el frontend
4. **Implementar paginación** para listas grandes
5. **Agregar validación** de formularios

¡Tu API está lista para usar! 🎉
