const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  getGeneralConfig,
  updateGeneralConfig,
  getThemeConfig,
  updateThemeConfig,
  getSecurityConfig,
  updateSecurityConfig,
  getPaymentConfig,
  updatePaymentConfig,
  getNotificationConfig,
  updateNotificationConfig,
  getCompleteConfig
} = require('../controllers/configurationUnified.js');

const { isAuthenticated, requireRole } = require('../middleware/authMiddleware.js');
const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array()
    });
  }
  next();
};

// ALL ROUTES REQUIRE AUTHENTICATION
router.use(isAuthenticated);
router.use(requireRole('admin'));

// GENERAL CONFIGURATION
router.get('/general', getGeneralConfig);
router.put('/general', [
  body('company_name').optional().trim(),
  body('company_description').optional().trim(),
  body('company_slogan').optional().trim(),
  body('company_email').optional().isEmail(),
  body('company_phone').optional().trim(),
  body('company_whatsapp').optional().trim(),
  body('company_address').optional().trim(),
  body('company_website').optional().isURL(),
  body('company_timezone').optional().trim(),
  body('company_language').optional().isIn(['es', 'en']),
  body('company_currency').optional().isIn(['USD', 'EUR', 'MXN']),
  body('company_rfc').optional().trim(),
  body('company_regimen_fiscal').optional().trim()
], handleValidationErrors, updateGeneralConfig);

// THEME CONFIGURATION
router.get('/theme', getThemeConfig);
router.put('/theme', [
  body('theme_mode').optional().isIn(['light', 'dark', 'auto']),
  body('theme_primary_color').optional().isHexColor(),
  body('theme_secondary_color').optional().isHexColor(),
  body('theme_compact_mode').optional().isBoolean(),
  body('theme_animations').optional().isBoolean()
], handleValidationErrors, updateThemeConfig);

// SECURITY CONFIGURATION
router.get('/security', getSecurityConfig);
router.put('/security', [
  body('password_min_length').optional().isInt({ min: 6, max: 128 }),
  body('password_require_uppercase').optional().isBoolean(),
  body('password_require_lowercase').optional().isBoolean(),
  body('password_require_numbers').optional().isBoolean(),
  body('password_require_symbols').optional().isBoolean(),
  body('password_expiration_days').optional().isInt({ min: 0 }),
  body('password_history_count').optional().isInt({ min: 0 }),
  body('login_max_attempts').optional().isInt({ min: 1 }),
  body('login_lockout_minutes').optional().isInt({ min: 1 }),
  body('session_timeout_minutes').optional().isInt({ min: 5 }),
  body('session_max_concurrent').optional().isInt({ min: 1 }),
  body('two_factor_enabled').optional().isBoolean(),
  body('ip_whitelist').optional().trim(),
  body('ip_blacklist').optional().trim()
], handleValidationErrors, updateSecurityConfig);

// PAYMENT CONFIGURATION
router.get('/payments', getPaymentConfig);
router.put('/payments', [
  body('payment_methods').isArray(),
  body('payment_methods.*.id').optional().isInt(),
  body('payment_methods.*.metodo').optional().trim(),
  body('payment_methods.*.nombre').optional().notEmpty(),
  body('payment_methods.*.descripcion').optional().trim(),
  body('payment_methods.*.enabled').optional().isBoolean(),
  body('payment_methods.*.es_online').optional().isBoolean(),
  body('payment_methods.*.configuracion').optional().isObject(),
  body('payment_methods.*.instrucciones').optional().trim(),
  body('payment_methods.*.comision_porcentaje').optional().isFloat({ min: 0 }),
  body('payment_methods.*.comision_fija').optional().isFloat({ min: 0 }),
  body('payment_methods.*.orden').optional().isInt({ min: 0 })
], handleValidationErrors, updatePaymentConfig);

// NOTIFICATION CONFIGURATION
router.get('/notifications', getNotificationConfig);
router.put('/notifications', [
  body('notifications').isArray(),
  body('notifications.*.id').optional().isInt(),
  body('notifications.*.tipo_evento').optional().trim(),
  body('notifications.*.nombre').optional().notEmpty(),
  body('notifications.*.descripcion').optional().trim(),
  body('notifications.*.email_enabled').optional().isBoolean(),
  body('notifications.*.sms_enabled').optional().isBoolean(),
  body('notifications.*.push_enabled').optional().isBoolean(),
  body('notifications.*.webhook_enabled').optional().isBoolean(),
  body('notifications.*.roles_notificar').optional().trim(),
  body('notifications.*.plantilla_email').optional().trim(),
  body('notifications.*.plantilla_sms').optional().trim()
], handleValidationErrors, updateNotificationConfig);

// COMPLETE CONFIGURATION (all sections at once)
router.get('/complete', getCompleteConfig);

// ROOT ENDPOINT - returns general config for backward compatibility
router.get('/', getGeneralConfig);

// LEGACY COMPATIBILITY ROUTES
router.all('/legacy-*', (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Esta ruta ha sido deprecada. Use /api/configuration-unified en su lugar.',
    redirect_to: '/api/configuration-unified',
    deprecated_since: '2024-01-01'
  });
});

module.exports = router;