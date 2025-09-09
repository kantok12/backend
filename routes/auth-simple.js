const express = require('express');
const router = express.Router();

// Ruta de prueba simple
router.get('/simple-test', (req, res) => {
  res.json({
    message: 'Ruta simple funcionando',
    timestamp: new Date().toISOString()
  });
});

// Registro simple sin dependencias
router.post('/simple-register', (req, res) => {
  console.log('Body recibido:', req.body);
  
  res.json({
    message: 'Datos recibidos correctamente',
    receivedData: req.body,
    success: true
  });
});

module.exports = router;














