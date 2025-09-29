const fs = require('fs');

// Leer el archivo actual
const content = fs.readFileSync('routes/documentos.js', 'utf8');

// Encontrar las rutas específicas que deben ir antes de /:id
const specificRoutes = [
  "router.get('/tipos',",
  "router.get('/formatos',",
  "router.get('/persona/:rut',"
];

// Encontrar la posición de router.get('/:id',
const idRouteIndex = content.indexOf("router.get('/:id',");

if (idRouteIndex !== -1) {
  console.log('🔧 Reorganizando rutas de documentos...');
  
  // Extraer las rutas específicas
  let specificRoutesContent = '';
  let remainingContent = content;
  
  specificRoutes.forEach(route => {
    const startIndex = remainingContent.indexOf(route);
    if (startIndex !== -1) {
      // Encontrar el final de esta ruta (hasta el siguiente router.get o final del archivo)
      const nextRouterIndex = remainingContent.indexOf('\nrouter.get(', startIndex + route.length);
      const nextRouterIndex2 = remainingContent.indexOf('\nrouter.post(', startIndex + route.length);
      const nextRouterIndex3 = remainingContent.indexOf('\nrouter.put(', startIndex + route.length);
      const nextRouterIndex4 = remainingContent.indexOf('\nrouter.delete(', startIndex + route.length);
      
      let endIndex = remainingContent.length;
      if (nextRouterIndex !== -1) endIndex = Math.min(endIndex, nextRouterIndex);
      if (nextRouterIndex2 !== -1) endIndex = Math.min(endIndex, nextRouterIndex2);
      if (nextRouterIndex3 !== -1) endIndex = Math.min(endIndex, nextRouterIndex3);
      if (nextRouterIndex4 !== -1) endIndex = Math.min(endIndex, nextRouterIndex4);
      
      const routeContent = remainingContent.substring(startIndex, endIndex);
      specificRoutesContent += routeContent + '\n\n';
      
      // Remover esta ruta del contenido restante
      remainingContent = remainingContent.substring(0, startIndex) + remainingContent.substring(endIndex);
    }
  });
  
  // Insertar las rutas específicas antes de /:id
  const newContent = remainingContent.substring(0, idRouteIndex) + 
                    specificRoutesContent + 
                    remainingContent.substring(idRouteIndex);
  
  // Escribir el archivo corregido
  fs.writeFileSync('routes/documentos.js', newContent);
  
  console.log('✅ Rutas de documentos reorganizadas correctamente');
  console.log('📋 Rutas específicas movidas antes de /:id:');
  specificRoutes.forEach(route => {
    console.log(`   - ${route}`);
  });
} else {
  console.log('❌ No se encontró la ruta /:id para reorganizar');
}

