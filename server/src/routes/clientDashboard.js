const express = require('express');
const router = express.Router();
const { getClientStats, getClientProjects, getClientPayments, getClientActivity, getClientQuotes, updateClientQuoteStatus, getClientProfile, updateClientProfile, changeClientPassword, getClientorders, updateClientorderstatus } = require('../controllers/clientDashboardController.js');
const { isAuthenticated } = require('../middleware/authMiddleware.js');

// Middleware para verificar que el usuario sea usuarios
const clientOnly = (req, res, next) => {
  console.log('Verificando rol de usuarios. req.user:', req.user);
  console.log('Rol en sesión:', req.session?.userRole);
  
  if (!req.user || (req.user.rol !== 'client' && req.user.rol !== 'usuarios')) {
    return res.status(403).json({ message: 'Acceso denegado. Solo para usuarioss.' });
  }
  next();
};

// Todas las rutas requieren autenticación y rol de usuarios
router.use(isAuthenticated);
router.use(clientOnly);

// GET /client/stats - Obtener estadísticas del usuarios
router.get('/stats', getClientStats);

// GET /client/projects - Obtener proyectos del usuarios
router.get('/projects', getClientProjects);

// GET /client/payments - Obtener pagos del usuarios
router.get('/payments', getClientPayments);

// GET /client/activity - Obtener actividad reciente del usuarios
router.get('/activity', getClientActivity);

// GET /client/quotes - Obtener cotizaciones del usuarios
router.get('/quotes', getClientQuotes);

// PUT /client/quotes/:id/status - Actualizar estado de cotización (aceptar/rechazar)
router.put('/quotes/:id/status', updateClientQuoteStatus);

// GET /client/profile - Obtener perfil del usuarios
router.get('/profile', getClientProfile);

// PUT /client/profile - Actualizar perfil del usuarios
router.put('/profile', updateClientProfile);

// PUT /client/change-password - Cambiar contraseña del usuarios
router.put('/change-password', changeClientPassword);

// GET /client/orders - Obtener pedidos del usuario
router.get('/orders', getClientpedidos);

// PUT /client/orders/:id/status - Actualizar estado de pedido (cancelar/pausar/reactivar)
router.put('/orders/:id/status', updateClientpedidostatus);

module.exports = router;