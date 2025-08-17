// server/src/routes/stats.js
const express = require('express');
const router = express.Router();
const {
  getMonthlyStats,
  getGrowthStats,
  getYearlyStats,
  updateMonthlyStats,
  getComparison
} = require('../controllers/statsController.js');

// Rutas públicas (para gráficos del dashboard)
router.get('/monthly', getMonthlyStats);
router.get('/growth', getGrowthStats);
router.get('/yearly', getYearlyStats);
router.get('/comparison', getComparison);

// Rutas protegidas (requieren autenticación admin)
// TODO: Agregar middleware de autenticación para admin
router.post('/monthly', updateMonthlyStats);
router.put('/monthly', updateMonthlyStats);

module.exports = router;