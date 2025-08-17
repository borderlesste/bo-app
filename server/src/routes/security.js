const express = require('express');
const { 
  getSecurityLogs, 
  getSecurityStats,
  unlockAccount,
  getSecuritySummary
} = require('../controllers/securityController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Todas las rutas requieren autenticación de admin
router.use(isAuthenticated);
router.use(isAdmin);

// GET /api/security/logs - Obtener logs de seguridad con filtros
router.get('/logs', getSecurityLogs);

// GET /api/security/stats - Obtener estadísticas de seguridad
router.get('/stats', getSecurityStats);

// GET /api/security/summary - Obtener resumen de seguridad
router.get('/summary', getSecuritySummary);

// POST /api/security/unlock/:email - Desbloquear cuenta por email
router.post('/unlock/:email', unlockAccount);

module.exports = router;