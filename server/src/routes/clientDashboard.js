const express = require('express');
const router = express.Router();
const { getClientStats, getClientProjects, getClientPayments, getClientActivity, getClientQuotes, updateClientQuoteStatus, getClientProfile, updateClientProfile, changeClientPassword, getClientpedidos, updateClientpedidostatus, getClientInvoices } = require('../controllers/clientDashboardController.js');
const { isAuthenticated } = require('../middleware/authMiddleware.js');

// Middleware para verificar que el usuario sea cliente
const clientOnly = (req, res, next) => {
  console.log('=== EJECUTANDO MIDDLEWARE clientOnly ===');
  console.log('req.user:', req.user);
  console.log('req.user.rol:', req.user?.rol);
  console.log('req.session?.userRole:', req.session?.userRole);
  
  if (!req.user) {
    console.log('❌ ACCESO DENEGADO: No hay usuario autenticado');
    return res.status(403).json({ message: 'Acceso denegado. Usuario no autenticado.' });
  }
  
  if (req.user.rol !== 'client' && req.user.rol !== 'cliente') {
    console.log('❌ ACCESO DENEGADO: Rol incorrecto:', req.user.rol);
    return res.status(403).json({ message: 'Acceso denegado. Solo para clientes.' });
  }
  
  console.log('✅ ACCESO PERMITIDO: Usuario', req.user.rol);
  next();
};

// Todas las rutas requieren autenticación y rol de cliente
router.use(isAuthenticated);
router.use(clientOnly);

// GET /client/stats - Obtener estadísticas del cliente
router.get('/stats', (req, res, next) => {
  console.log('🔍 RUTA /client/dashboard/stats - Usuario:', req.user?.id, 'Rol:', req.user?.rol);
  next();
}, getClientStats);

// GET /client/projects - Obtener proyectos del cliente
router.get('/projects', (req, res, next) => {
  console.log('🔍 RUTA /client/dashboard/projects - Usuario:', req.user?.id, 'Rol:', req.user?.rol);
  next();
}, getClientProjects);

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

// GET /client/orders - Obtener pedidos del usuario
router.get('/orders', getClientpedidos);

// PUT /client/orders/:id/status - Actualizar estado de pedido
router.put('/orders/:id/status', updateClientpedidostatus);

// GET /client/invoices - Obtener facturas del cliente
router.get('/invoices', getClientInvoices);

module.exports = router;