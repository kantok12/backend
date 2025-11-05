# Resumen: Corrección del Error 500 en /api/documentos/registrar-existente

## ✅ Problema Solucionado

El endpoint `POST /api/documentos/registrar-existente` estaba fallando con **Error 500** cuando el frontend intentaba registrar documentos que ya existían en Google Drive.

## 🔧 Causa del Error

El endpoint intentaba **copiar archivos a sí mismos** cuando estos ya estaban en Google Drive:

```
Archivo origen:  G:/Unidades compartidas/.../certificado.pdf
Archivo destino: G:/Unidades compartidas/.../certificado.pdf
                 ↑ misma ubicación = ERROR
```

## 💡 Solución Implementada

Se modificó la lógica para:

1. **Detectar** si el archivo ya está en Google Drive (ruta empieza con `G:/`)
2. **No copiar** si ya está en la ubicación correcta
3. **Solo registrar** en la base de datos sin mover el archivo
4. **Copiar** solo cuando el archivo viene de otra ubicación

## 📦 Archivos Modificados

### 1. `routes/documentos.js` (líneas 926-985)
- ✅ Añadida detección de archivos en Google Drive
- ✅ Lógica condicional para copiar solo cuando es necesario
- ✅ Mejor manejo de errores con try/catch
- ✅ Creación automática de directorios si no existen

### 2. `test-registrar-existente.js` (nuevo)
- Script de prueba para validar el endpoint
- Incluye instrucciones de configuración
- Análisis de errores detallado

### 3. `docs/FIX_REGISTRAR_EXISTENTE.md` (nuevo)
- Documentación completa del fix
- Casos de prueba
- Guía de debugging

## 🚀 Próximos Pasos

### 1. Reiniciar el servidor
```powershell
# Detener el servidor actual (Ctrl+C)
# Iniciar nuevamente
npm start
# o
node server.js
# o
pm2 restart all
```

### 2. Probar desde el frontend
- Seleccionar un archivo existente en Google Drive
- Intentar registrarlo
- Debe funcionar sin error 500

### 3. Verificar logs del servidor
Deberías ver mensajes como:
```
📂 Archivo ya existe en Google Drive: G:/Unidades compartidas/.../certificado.pdf
✅ Documento registrado: Certificado Curso (ID: 123)
```

## 📋 Validaciones del Endpoint

### Campos Requeridos
```json
{
  "rut_persona": "12345678-9",
  "nombre_archivo": "certificado.pdf",
  "ruta_local": "G:/..../certificado.pdf",
  "nombre_documento": "Certificado",
  "tipo_documento": "certificado_curso"
}
```

### Respuesta Exitosa (201)
```json
{
  "success": true,
  "message": "Documento registrado exitosamente",
  "data": {
    "id": 123,
    "persona": {...},
    "documento": {...}
  }
}
```

## 🧪 Pruebas Opcionales

Si quieres probar manualmente:

```powershell
cd "c:\Users\BR CO-WORK 1\Documents\GitHub\backend"
node test-registrar-existente.js
```

**Nota**: Ajusta las rutas en el script antes de ejecutar.

## ❓ Si el Problema Persiste

1. Verificar que Google Drive esté montado en `G:/`
2. Revisar permisos de acceso a las carpetas
3. Verificar que el RUT existe en la base de datos
4. Comprobar que el archivo existe en `ruta_local`
5. Revisar logs del servidor para el mensaje de error específico

---

**Fecha**: Enero 15, 2025  
**Estado**: ✅ Listo para probar  
**Requiere**: Reiniciar servidor
