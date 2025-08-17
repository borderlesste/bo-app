const express = require('express');
const { 
  getIntegrations, 
  getIntegration, 
  updateIntegration, 
  testIntegration,
  createIntegration,
  deleteIntegration,
  syncIntegrations,
  // Webhook functions
  getWebhooks,
  createWebhook,
  deleteWebhook
} = require('../controllers/integrationsController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Todas las rutas requieren autenticación de admin
router.use(isAuthenticated);
router.use(isAdmin);

// GET /api/integrations - Obtener todas las integraciones
router.get('/', getIntegrations);

// Webhook routes (MUST come before /:id routes to avoid conflicts)
// GET /api/integrations/webhooks - Obtener todos los webhooks
router.get('/webhooks', getWebhooks);

// POST /api/integrations/webhooks - Crear nuevo webhook
router.post('/webhooks', createWebhook);

// DELETE /api/integrations/webhooks/:id - Eliminar webhook
router.delete('/webhooks/:id', deleteWebhook);

// POST /api/integrations/sync - Sincronizar/detectar integraciones automáticamente
router.post('/sync', syncIntegrations);

// Dynamic routes (MUST come after specific routes)
// GET /api/integrations/:id - Obtener una integración específica
router.get('/:id', getIntegration);

// POST /api/integrations - Crear nueva integración manual
router.post('/', createIntegration);

// PUT /api/integrations/:id - Actualizar integración
router.put('/:id', updateIntegration);

// DELETE /api/integrations/:id - Eliminar integración
router.delete('/:id', deleteIntegration);

// POST /api/integrations/:id/test - Probar conexión de integración
router.post('/:id/test', testIntegration);

module.exports = router;