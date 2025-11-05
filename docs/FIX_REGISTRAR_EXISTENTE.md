# Fix: Error 500 en POST /api/documentos/registrar-existente

## 🐛 Problema Identificado

El endpoint `POST /api/documentos/registrar-existente` estaba devolviendo **500 Internal Server Error** desde el frontend.

### Causa Raíz

El endpoint tiene un fallo lógico fundamental:

1. **Propósito**: Registrar documentos que **ya existen** en Google Drive
2. **Comportamiento anterior**: Intentaba **copiar** el archivo desde `ruta_local` a Google Drive
3. **Conflicto**: Si `ruta_local` apunta a un archivo que ya está en Google Drive, intentaba copiarlo a sí mismo
4. **Resultado**: Error de sistema de archivos (file conflict, permission denied, etc.)

### Ejemplo del Error

```javascript
// Usuario selecciona archivo existente en Google Drive
ruta_local = "G:/Unidades compartidas/Unidad de Apoyo/Personal/JUAN PEREZ - 12345678-9/cursos_certificaciones/certificado.pdf"

// Endpoint calculaba destino
googleDrivePath = "G:/Unidades compartidas/Unidad de Apoyo/Personal/JUAN PEREZ - 12345678-9/cursos_certificaciones/certificado.pdf"

// Intentaba copiar: source === destination ❌
fs.copyFileSync(ruta_local, googleDrivePath) // ERROR!
```

## ✅ Solución Implementada

### 1. Detección de Archivos ya en Google Drive

```javascript
// Detectar si el archivo ya está en Google Drive
const archivoYaEnGoogleDrive = ruta_local.toLowerCase().startsWith('g:') || 
                                ruta_local.toLowerCase().startsWith('g:/');
```

### 2. Lógica Condicional de Copiado

```javascript
if (googleDrivePath && !archivoYaEnGoogleDrive) {
  // Archivo viene de otra ubicación → copiarlo a Google Drive
  try {
    fs.copyFileSync(ruta_local, googleDrivePath);
    console.log(`📂 Archivo copiado a Google Drive: ${googleDrivePath}`);
  } catch (copyErr) {
    return res.status(500).json({
      success: false,
      message: 'Error al copiar archivo a Google Drive',
      error: copyErr.message
    });
  }
} else if (archivoYaEnGoogleDrive) {
  // Archivo ya está en Google Drive → solo registrarlo
  console.log(`📂 Archivo ya existe en Google Drive: ${ruta_local}`);
  googleDrivePath = ruta_local; // Usar la ruta existente
}
```

### 3. Mejora de Backup Local

```javascript
// Crear directorio si no existe
const uploadsDir = path.dirname(destinoLocal);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Copiar solo si son rutas diferentes
if (!destinoLocal.toLowerCase().includes(ruta_local.toLowerCase()) && 
    ruta_local !== destinoLocal) {
  try {
    fs.copyFileSync(ruta_local, destinoLocal);
    console.log(`📁 Archivo copiado a uploads local: ${destinoLocal}`);
  } catch (copyErr) {
    console.error('⚠️ Error copiando a uploads local:', copyErr.message);
    // Continuar aunque falle el backup local
  }
}
```

## 📋 Cambios Realizados

### Archivo: `routes/documentos.js`

**Líneas modificadas**: ~926-985

1. **Backup local mejorado**: Validación antes de copiar + try/catch
2. **Detección de Google Drive**: Verificar si `ruta_local` empieza con `G:/`
3. **Copiado condicional**: Solo copiar si el archivo NO está en Google Drive
4. **Manejo de errores**: Try/catch con mensajes específicos

## 🧪 Cómo Probar

### Usando el script de test

```powershell
node test-registrar-existente.js
```

**Configuración requerida** (en el script):
- `rut_persona`: RUT válido en la base de datos
- `ruta_local`: Ruta de un archivo existente en Google Drive

### Casos de prueba

#### Caso 1: Archivo ya en Google Drive (caso más común)
```json
{
  "rut_persona": "12345678-9",
  "ruta_local": "G:/Unidades compartidas/Unidad de Apoyo/Personal/JUAN PEREZ - 12345678-9/cursos_certificaciones/certificado.pdf",
  "nombre_archivo": "certificado.pdf",
  "nombre_documento": "Certificado Curso",
  "tipo_documento": "certificado_curso"
}
```

**Comportamiento**: No copia el archivo, solo lo registra en la BD.

#### Caso 2: Archivo en otra ubicación
```json
{
  "rut_persona": "12345678-9",
  "ruta_local": "C:/temp/certificado.pdf",
  "nombre_archivo": "certificado.pdf",
  "nombre_documento": "Certificado Curso",
  "tipo_documento": "certificado_curso"
}
```

**Comportamiento**: Copia el archivo a Google Drive y lo registra.

## 🎯 Resultados Esperados

### Antes del Fix
- ❌ Error 500 al intentar registrar archivos existentes
- ❌ Conflictos de archivo al copiar a sí mismo
- ❌ Frontend muestra "Internal Server Error"

### Después del Fix
- ✅ Registra archivos existentes sin errores
- ✅ Detecta automáticamente si el archivo está en Google Drive
- ✅ Solo copia cuando es necesario
- ✅ Mejor manejo de errores con mensajes específicos

## 📝 Notas Adicionales

### Campos Requeridos

```javascript
{
  rut_persona: String,      // Requerido
  nombre_archivo: String,   // Requerido
  ruta_local: String,       // Requerido - ruta completa del archivo
  nombre_documento: String, // Requerido
  tipo_documento: String    // Requerido - ver valores válidos abajo
}
```

### Valores Válidos de `tipo_documento`

Para que vaya a `cursos_certificaciones/`:
- `certificado_curso`
- `diploma`
- `curso`
- `certificacion`
- `certificación`

Para que vaya a `documentos/`:
- `certificado_laboral`
- `certificado_medico`
- `licencia_conducir`
- `certificado_seguridad`
- `certificado_vencimiento`
- `otro`

### Estructura de Respuesta Exitosa

```json
{
  "success": true,
  "message": "Documento registrado exitosamente",
  "data": {
    "id": 123,
    "persona": {
      "rut": "12345678-9",
      "nombre": "JUAN PEREZ",
      "cargo": "Operador"
    },
    "documento": {
      "nombre_documento": "Certificado Curso",
      "tipo_documento": "certificado_curso",
      "nombre_archivo": "certificado_1736937600000.pdf",
      "fecha_subida": "2025-01-15T10:00:00.000Z"
    }
  }
}
```

## 🔍 Debugging

Si el error persiste:

1. **Verificar Google Drive montado**:
   ```powershell
   Test-Path "G:/Unidades compartidas/Unidad de Apoyo/Personal"
   ```

2. **Verificar permisos de escritura**:
   ```powershell
   # Crear archivo de prueba
   "test" | Out-File "G:/Unidades compartidas/Unidad de Apoyo/Personal/test.txt"
   ```

3. **Revisar logs del servidor**:
   ```javascript
   console.log('📂 Archivo ya existe en Google Drive: ${ruta_local}');
   console.log('📂 Archivo copiado a Google Drive: ${googleDrivePath}');
   ```

4. **Validar payload desde frontend**:
   - Asegurar que `ruta_local` apunta a un archivo que existe
   - Verificar que `rut_persona` existe en la base de datos
   - Confirmar que `tipo_documento` es válido

## 🚀 Deployment

El fix está listo para producción. Solo requiere:

1. Reiniciar el servidor Node.js
2. Verificar que Google Drive esté montado en `G:/`
3. Probar con un caso real desde el frontend

---

**Fecha**: 2025-01-15  
**Autor**: GitHub Copilot  
**Archivos Modificados**: `routes/documentos.js`  
**Test**: `test-registrar-existente.js`
