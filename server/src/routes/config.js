// server/src/routes/config.js
const express = require('express');
const { getConfig, updateConfig, getPaymentConfig } = require('../controllers/configController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Ruta pública para obtener configuración de pagos (solo claves públicas)
router.get('/payments', getPaymentConfig);

// Proteger las demás rutas de configuración para que solo los admins puedan acceder
router.use(isAuthenticated, isAdmin);

// Obtener la configuración (solo claves seguras)
router.get('/', getConfig);

// Actualizar la configuración
router.put('/', updateConfig);

module.exports = router;
