const express = require('express');
const { query, getClient } = require('../config/database');

const router = express.Router();

// GET /api/estructura - Obtener estructura jerárquica completa
router.get('/', async (req, res) => {
  try {
    console.log('🏗️ Obteniendo estructura jerárquica completa...');
    
    const result = await query(`
      SELECT 
        c.id as cartera_id,
        c.name as cartera_nombre,
        c.created_at as cartera_created_at,
        cl.id as cliente_id,
        cl.nombre as cliente_nombre,
        cl.created_at as cliente_created_at,
        ug.id as region_id,
        ug.nombre as region_nombre,
        n.id as nodo_id,
        n.nombre as nodo_nombre,
        n.created_at as nodo_created_at
      FROM carteras c
      LEFT JOIN clientes cl ON c.id = cl.cartera_id
      LEFT JOIN ubicacion_geografica ug ON cl.region_id = ug.id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      ORDER BY c.name, cl.nombre, n.nombre
    `);
    
    // Procesar los datos para crear estructura jerárquica
    const estructura = {};
    
    result.rows.forEach(row => {
      const carteraId = row.cartera_id;
      const clienteId = row.cliente_id;
      const nodoId = row.nodo_id;
      
      // Inicializar cartera si no existe
      if (!estructura[carteraId]) {
        estructura[carteraId] = {
          id: carteraId,
          nombre: row.cartera_nombre,
          created_at: row.cartera_created_at,
          clientes: {}
        };
      }
      
      // Inicializar cliente si no existe
      if (clienteId && !estructura[carteraId].clientes[clienteId]) {
        estructura[carteraId].clientes[clienteId] = {
          id: clienteId,
          nombre: row.cliente_nombre,
          created_at: row.cliente_created_at,
          region: {
            id: row.region_id,
            nombre: row.region_nombre
          },
          nodos: []
        };
      }
      
      // Agregar nodo si existe
      if (nodoId && estructura[carteraId].clientes[clienteId]) {
        estructura[carteraId].clientes[clienteId].nodos.push({
          id: nodoId,
          nombre: row.nodo_nombre,
          created_at: row.nodo_created_at
        });
      }
    });
    
    // Convertir a array y agregar estadísticas
    const estructuraArray = Object.values(estructura).map(cartera => {
      const clientesArray = Object.values(cartera.clientes);
      const totalClientes = clientesArray.length;
      const totalNodos = clientesArray.reduce((sum, cliente) => sum + cliente.nodos.length, 0);
      
      return {
        ...cartera,
        clientes: clientesArray,
        estadisticas: {
          total_clientes: totalClientes,
          total_nodos: totalNodos
        }
      };
    });
    
    res.json({
      success: true,
      message: 'Estructura jerárquica obtenida exitosamente',
      data: estructuraArray,
      estadisticas_generales: {
        total_carteras: estructuraArray.length,
        total_clientes: estructuraArray.reduce((sum, c) => sum + c.estadisticas.total_clientes, 0),
        total_nodos: estructuraArray.reduce((sum, c) => sum + c.estadisticas.total_nodos, 0)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estructura:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/estructura/cartera/:id - Obtener estructura de una cartera específica
router.get('/cartera/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🏗️ Obteniendo estructura de cartera ID: ${id}`);
    
    const result = await query(`
      SELECT 
        c.id as cartera_id,
        c.name as cartera_nombre,
        c.created_at as cartera_created_at,
        cl.id as cliente_id,
        cl.nombre as cliente_nombre,
        cl.created_at as cliente_created_at,
        ug.id as region_id,
        ug.nombre as region_nombre,
        n.id as nodo_id,
        n.nombre as nodo_nombre,
        n.created_at as nodo_created_at
      FROM carteras c
      LEFT JOIN clientes cl ON c.id = cl.cartera_id
      LEFT JOIN ubicacion_geografica ug ON cl.region_id = ug.id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      WHERE c.id = $1
      ORDER BY cl.nombre, n.nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cartera no encontrada'
      });
    }
    
    // Procesar los datos para crear estructura jerárquica
    const cartera = {
      id: result.rows[0].cartera_id,
      nombre: result.rows[0].cartera_nombre,
      created_at: result.rows[0].cartera_created_at,
      clientes: {}
    };
    
    result.rows.forEach(row => {
      const clienteId = row.cliente_id;
      const nodoId = row.nodo_id;
      
      // Inicializar cliente si no existe
      if (clienteId && !cartera.clientes[clienteId]) {
        cartera.clientes[clienteId] = {
          id: clienteId,
          nombre: row.cliente_nombre,
          created_at: row.cliente_created_at,
          region: {
            id: row.region_id,
            nombre: row.region_nombre
          },
          nodos: []
        };
      }
      
      // Agregar nodo si existe
      if (nodoId && cartera.clientes[clienteId]) {
        cartera.clientes[clienteId].nodos.push({
          id: nodoId,
          nombre: row.nodo_nombre,
          created_at: row.nodo_created_at
        });
      }
    });
    
    // Convertir clientes a array y agregar estadísticas
    const clientesArray = Object.values(cartera.clientes);
    const totalClientes = clientesArray.length;
    const totalNodos = clientesArray.reduce((sum, cliente) => sum + cliente.nodos.length, 0);
    
    cartera.clientes = clientesArray;
    cartera.estadisticas = {
      total_clientes: totalClientes,
      total_nodos: totalNodos
    };
    
    res.json({
      success: true,
      message: 'Estructura de cartera obtenida exitosamente',
      data: cartera,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estructura de cartera:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/estructura/cliente/:id - Obtener estructura de un cliente específico
router.get('/cliente/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🏗️ Obteniendo estructura de cliente ID: ${id}`);
    
    const result = await query(`
      SELECT 
        c.id as cartera_id,
        c.name as cartera_nombre,
        cl.id as cliente_id,
        cl.nombre as cliente_nombre,
        cl.created_at as cliente_created_at,
        ug.id as region_id,
        ug.nombre as region_nombre,
        n.id as nodo_id,
        n.nombre as nodo_nombre,
        n.created_at as nodo_created_at
      FROM clientes cl
      LEFT JOIN carteras c ON cl.cartera_id = c.id
      LEFT JOIN ubicacion_geografica ug ON cl.region_id = ug.id
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      WHERE cl.id = $1
      ORDER BY n.nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    const row = result.rows[0];
    const cliente = {
      id: row.cliente_id,
      nombre: row.cliente_nombre,
      created_at: row.cliente_created_at,
      cartera: {
        id: row.cartera_id,
        nombre: row.cartera_nombre
      },
      region: {
        id: row.region_id,
        nombre: row.region_nombre
      },
      nodos: result.rows
        .filter(r => r.nodo_id)
        .map(r => ({
          id: r.nodo_id,
          nombre: r.nodo_nombre,
          created_at: r.nodo_created_at
        }))
    };
    
    cliente.estadisticas = {
      total_nodos: cliente.nodos.length
    };
    
    res.json({
      success: true,
      message: 'Estructura de cliente obtenida exitosamente',
      data: cliente,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estructura de cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/estructura/estadisticas - Obtener estadísticas de la estructura
router.get('/estadisticas', async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de la estructura...');
    
    const result = await query(`
      SELECT 
        'carteras' as tabla,
        COUNT(*) as total
      FROM carteras
      UNION ALL
      SELECT 
        'clientes' as tabla,
        COUNT(*) as total
      FROM clientes
      UNION ALL
      SELECT 
        'ubicaciones' as tabla,
        COUNT(*) as total
      FROM ubicacion_geografica
      UNION ALL
      SELECT 
        'nodos' as tabla,
        COUNT(*) as total
      FROM nodos
    `);
    
    const estadisticas = {};
    result.rows.forEach(row => {
      estadisticas[row.tabla] = parseInt(row.total);
    });
    
    // Estadísticas adicionales
    const adicionalesResult = await query(`
      SELECT 
        COUNT(DISTINCT cl.cartera_id) as carteras_con_clientes,
        COUNT(DISTINCT cl.region_id) as regiones_con_clientes,
        COUNT(DISTINCT n.cliente_id) as clientes_con_nodos,
        AVG(nodos_por_cliente.nodo_count) as promedio_nodos_por_cliente
      FROM clientes cl
      LEFT JOIN nodos n ON cl.id = n.cliente_id
      LEFT JOIN (
        SELECT cliente_id, COUNT(*) as nodo_count
        FROM nodos
        GROUP BY cliente_id
      ) nodos_por_cliente ON cl.id = nodos_por_cliente.cliente_id
    `);
    
    const adicionales = adicionalesResult.rows[0];
    
    res.json({
      success: true,
      message: 'Estadísticas de estructura obtenidas exitosamente',
      data: {
        ...estadisticas,
        carteras_con_clientes: parseInt(adicionales.carteras_con_clientes),
        regiones_con_clientes: parseInt(adicionales.regiones_con_clientes),
        clientes_con_nodos: parseInt(adicionales.clientes_con_nodos),
        promedio_nodos_por_cliente: parseFloat(adicionales.promedio_nodos_por_cliente || 0).toFixed(2)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
