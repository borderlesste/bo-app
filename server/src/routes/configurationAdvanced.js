const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { isAuthenticated } = require('../middleware/authMiddleware');
const configurationAdvancedController = require('../controllers/configurationAdvancedController');

// Public routes (company info and theme settings)
router.get('/company', configurationAdvancedController.getCompanyInfo);
router.get('/theme', configurationAdvancedController.getThemeSettings);
router.get('/business', configurationAdvancedController.getBusinessSettings);

// Protected routes
router.use(isAuthenticated);

// Company info validation
const companyInfoValidation = [
  body('company_name').optional().notEmpty().withMessage('El nombre de la empresa no puede estar vacío'),
  body('company_email').optional().isEmail().withMessage('Email de empresa inválido'),
  body('company_phone').optional().isMobilePhone().withMessage('Teléfono inválido'),
  body('company_website').optional().isURL().withMessage('URL del sitio web inválida')
];

// Theme settings validation
const themeValidation = [
  body('theme_mode').optional().isIn(['light', 'dark', 'auto']).withMessage('Modo de tema inválido'),
  body('theme_primary_color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color primario inválido'),
  body('theme_secondary_color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color secundario inválido'),
  body('theme_compact_mode').optional().isBoolean().withMessage('Modo compacto debe ser booleano'),
  body('theme_animations').optional().isBoolean().withMessage('Animaciones debe ser booleano')
];

// Security settings validation
const securityValidation = [
  body('password_min_length').optional().isInt({ min: 6, max: 32 }).withMessage('Longitud mínima de contraseña debe estar entre 6 y 32'),
  body('login_max_attempts').optional().isInt({ min: 3, max: 10 }).withMessage('Intentos máximos debe estar entre 3 y 10'),
  body('login_lockout_minutes').optional().isInt({ min: 5, max: 1440 }).withMessage('Tiempo de bloqueo debe estar entre 5 y 1440 minutos'),
  body('session_timeout_minutes').optional().isInt({ min: 15, max: 480 }).withMessage('Timeout de sesión debe estar entre 15 y 480 minutos'),
  body('session_max_concurrent').optional().isInt({ min: 1, max: 10 }).withMessage('Sesiones concurrentes debe estar entre 1 y 10'),
  body('two_factor_enabled').optional().isBoolean().withMessage('2FA debe ser booleano')
];

// Routes
router.get('/', configurationAdvancedController.getConfiguration);
router.put('/', configurationAdvancedController.updateConfiguration);

// Company info routes
router.put('/company', companyInfoValidation, configurationAdvancedController.updateCompanyInfo);

// Theme settings routes
router.put('/theme', themeValidation, configurationAdvancedController.updateThemeSettings);

// Security settings routes
router.get('/security', configurationAdvancedController.getSecuritySettings);
router.put('/security', securityValidation, configurationAdvancedController.updateSecuritySettings);

module.exports = router;