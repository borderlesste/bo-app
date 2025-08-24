const express = require('express');
const router = express.Router();
const EmailController = require('../controllers/emailController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ================ RUTAS ADMIN ================

// Enviar recordatorio de factura específica
router.post('/invoice-reminder/:invoice_id', 
  authenticateToken, 
  requireAdmin, 
  EmailController.sendInvoiceReminder
);

// Enviar recordatorios masivos de facturas vencidas
router.post('/bulk-invoice-reminders', 
  authenticateToken, 
  requireAdmin, 
  EmailController.sendOverdueInvoiceReminders
);

// Test de templates de email
router.post('/test-template', 
  authenticateToken, 
  requireAdmin, 
  EmailController.testEmailTemplate
);

// Obtener configuración de email
router.get('/config', 
  authenticateToken, 
  requireAdmin, 
  EmailController.getEmailConfig
);

module.exports = router;