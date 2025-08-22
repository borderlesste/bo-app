const express = require('express');
const router = express.Router();
const { 
  getAdminStats, 
  getRecentActivity, 
  getTopClients, 
  getChartsData, 
  getFinancialSummary,
  getAdvancedMetrics,
  getTrends,
  getAlerts
} = require('../controllers/dashboardController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');

// Todas las rutas requieren autenticación y rol de admin
router.use(isAuthenticated);
router.use(isAdmin);

// GET /admin/stats - Obtener estadísticas del dashboard
router.get('/stats', getAdminStats);

// GET /admin/recent-activity - Obtener actividades recientes
router.get('/recent-activity', getRecentActivity);

// GET /admin/top-clients - Obtener mejores clientes
router.get('/top-clients', getTopClients);

// GET /admin/charts - Obtener datos para gráficos
router.get('/charts', getChartsData);

// GET /admin/financial-summary - Obtener resumen financiero detallado
router.get('/financial-summary', getFinancialSummary);

// GET /admin/advanced-metrics - Obtener métricas avanzadas del negocio
router.get('/advanced-metrics', getAdvancedMetrics);

// GET /admin/trends - Obtener tendencias y comparaciones
router.get('/trends', getTrends);

// GET /admin/alerts - Obtener alertas y notificaciones importantes
router.get('/alerts', getAlerts);

module.exports = router;