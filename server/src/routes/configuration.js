const express = require('express');
const { 
  getSecurityConfiguration,
  updateSecurityConfiguration,
  getGeneralConfiguration,
  updateGeneralConfiguration
} = require('../controllers/configurationController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Todas las rutas requieren autenticación de admin
router.use(isAuthenticated);
router.use(isAdmin);

// Configuración de Seguridad
// GET /api/configuration/security - Obtener configuración de seguridad
router.get('/security', getSecurityConfiguration);

// PUT /api/configuration/security - Actualizar configuración de seguridad
router.put('/security', updateSecurityConfiguration);

// Configuración General
// GET /api/configuration/general - Obtener configuración general
router.get('/general', getGeneralConfiguration);

// PUT /api/configuration/general - Actualizar configuración general
router.put('/general', updateGeneralConfiguration);

module.exports = router;