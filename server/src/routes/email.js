const express = require('express');
const router = express.Router();
const EmailController = require('../controllers/emailController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// ================ RUTAS ADMIN ================

// Enviar recordatorio de factura específica
router.post('/invoice-reminder/:invoice_id', 
  isAuthenticated, 
  isAdmin, 
  (req, res) => EmailController.sendInvoiceReminder(req, res)
);

// Enviar recordatorios masivos de facturas vencidas
router.post('/bulk-invoice-reminders', 
  isAuthenticated, 
  isAdmin, 
  (req, res) => EmailController.sendOverdueInvoiceReminders(req, res)
);

// Test de templates de email
router.post('/test-template', 
  isAuthenticated, 
  isAdmin, 
  (req, res) => EmailController.testEmailTemplate(req, res)
);

// Obtener configuración de email
router.get('/config', 
  isAuthenticated, 
  isAdmin, 
  (req, res) => EmailController.getEmailConfig(req, res)
);

module.exports = router;