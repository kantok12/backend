const fs = require('fs');

// Leer el archivo actual
let content = fs.readFileSync('routes/documentos.js', 'utf8');

// Reemplazar la configuración de multer para aceptar el campo 'archivo'
const oldConfig = `const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB por archivo (para PDFs grandes)
    files: 5 // Máximo 5 archivos por request
  },`;

const newConfig = `const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB por archivo (para PDFs grandes)
    files: 5 // Máximo 5 archivos por request
  },`;

// Buscar y reemplazar la configuración
if (content.includes(oldConfig)) {
  content = content.replace(oldConfig, newConfig);
  
  // También necesitamos cambiar el uso de uploadMultiple para especificar el campo
  const oldUsage = `router.post('/', uploadMultiple, handleUploadError, async (req, res) => {`;
  const newUsage = `router.post('/', uploadMultiple.array('archivo', 5), handleUploadError, async (req, res) => {`;
  
  if (content.includes(oldUsage)) {
    content = content.replace(oldUsage, newUsage);
    console.log('✅ Configuración de multer corregida');
  } else {
    console.log('⚠️ No se encontró el uso de uploadMultiple para corregir');
  }
  
  // Escribir el archivo corregido
  fs.writeFileSync('routes/documentos.js', content);
  console.log('✅ Archivo routes/documentos.js actualizado');
} else {
  console.log('❌ No se encontró la configuración de multer para corregir');
}

