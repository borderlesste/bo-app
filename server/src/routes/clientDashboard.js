const express = require('express');
const router = express.Router();
const { getClientStats, getClientProjects, getClientPayments, getClientActivity, getClientQuotes, updateClientQuoteStatus, getClientProfile, updateClientProfile, changeClientPassword, getClientOrders, updateClientOrderStatus } = require('../controllers/clientDashboardController.js');
const { isAuthenticated } = require('../middleware/authMiddleware.js');

// Middleware para verificar que el usuario sea cliente
const clientOnly = (req, res, next) => {
  console.log('Verificando rol de cliente. req.user:', req.user);
  console.log('Rol en sesión:', req.session?.userRole);
  
  if (!req.user || (req.user.rol !== 'client' && req.user.rol !== 'cliente')) {
    return res.status(403).json({ message: 'Acceso denegado. Solo para clientes.' });
  }
  next();
};

// Todas las rutas requieren autenticación y rol de cliente
router.use(isAuthenticated);
router.use(clientOnly);

// GET /client/stats - Obtener estadísticas del cliente
router.get('/stats', getClientStats);

// GET /client/projects - Obtener proyectos del cliente
router.get('/projects', getClientProjects);

// GET /client/payments - Obtener pagos del cliente
router.get('/payments', getClientPayments);

// GET /client/activity - Obtener actividad reciente del cliente
router.get('/activity', getClientActivity);

// GET /client/quotes - Obtener cotizaciones del cliente
router.get('/quotes', getClientQuotes);

// PUT /client/quotes/:id/status - Actualizar estado de cotización (aceptar/rechazar)
router.put('/quotes/:id/status', updateClientQuoteStatus);

// GET /client/profile - Obtener perfil del cliente
router.get('/profile', getClientProfile);

// PUT /client/profile - Actualizar perfil del cliente
router.put('/profile', updateClientProfile);

// PUT /client/change-password - Cambiar contraseña del cliente
router.put('/change-password', changeClientPassword);

// GET /client/orders - Obtener pedidos del cliente
router.get('/orders', getClientOrders);

// PUT /client/orders/:id/status - Actualizar estado de pedido (cancelar/pausar/reactivar)
router.put('/orders/:id/status', updateClientOrderStatus);

module.exports = router;