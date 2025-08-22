const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { validateClientProfile, validatePasswordUpdate } = require('../middleware/validationMiddleware');
const {
  getClientStats,
  getClientProjects,
  getClientQuotations,
  updateQuotationStatus,
  getClientInvoices,
  getClientProfile,
  updateClientProfile,
  updateClientPassword
} = require('../controllers/clientController');
const { 
  getClientConversations, 
  getConversationMessages, 
  startClientConversation, 
  sendMessage 
} = require('../controllers/messagesController');

// Rate limiting for client routes
const clientRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Demasiadas solicitudes, intenta de nuevo más tarde'
  }
});

// Middleware to ensure user is a client
const requireClient = (req, res, next) => {
  if (req.user.rol !== 'usuarios') {
    return res.status(403).json({
      success: false,
      error: 'Acceso de usuarios requerido'
    });
  }
  next();
};

// Apply rate limiting and authentication to all client routes
router.use(clientRateLimit);
router.use(isAuthenticated);
router.use(requireClient);

// Dashboard routes
router.get('/stats', getClientStats);

// Projects routes
router.get('/projects', getClientProjects);

// Quotations routes
router.get('/quotations', getClientQuotations);
router.put('/quotations/:quotationId/:action', (req, res) => updateQuotationStatus(req, res));

// Invoices routes
router.get('/invoices', getClientInvoices);

// Profile routes
router.get('/profile', getClientProfile);
router.put('/profile', validateClientProfile, updateClientProfile);
router.put('/password', validatePasswordUpdate, updateClientPassword);

// Conversations routes (to be implemented)
router.get('/conversations', getClientConversations);
router.get('/messages', getClientConversations); // Alias para compatibilidad

router.post('/conversations', startClientConversation);
router.get('/conversations/:conversationId/messages', getConversationMessages);
router.post('/conversations/:conversationId/messages', sendMessage);

// Client management routes (for admin-like functionality in client area)
router.get('/users', (req, res) => {
  // Return client's own user data
  res.json({
    success: true,
    data: [req.user]
  });
});

router.get('/usuarios', (req, res) => {
  // Alias en español
  res.json({
    success: true,
    data: [req.user]
  });
});

router.get('/clients', (req, res) => {
  // Return client's own data
  res.json({
    success: true,
    data: [req.user]
  });
});

// Notification settings
router.get('/notification-settings', (req, res) => {
  res.json({
    success: true,
    data: {
      email_proyectos: true,
      email_facturas: true,
      email_cotizaciones: true,
      email_marketing: false
    }
  });
});

router.put('/notification-settings', (req, res) => {
  res.json({
    success: true,
    message: 'Configuración actualizada exitosamente'
  });
});

module.exports = router;