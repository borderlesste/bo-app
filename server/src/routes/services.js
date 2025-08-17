const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { isAuthenticated } = require('../middleware/authMiddleware');
const servicesController = require('../controllers/servicesController');

// Public routes (no authentication required)
router.get('/active', servicesController.getActiveServices);
router.get('/categories', servicesController.getCategories);
router.get('/category/:categoria', servicesController.getServicesByCategory);
router.get('/most-used', servicesController.getMostUsedServices);

// Protected routes (authentication required)
router.use(isAuthenticated);

// Validation middleware
const createServiceValidation = [
  body('codigo').notEmpty().withMessage('El código es requerido'),
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('categoria').notEmpty().withMessage('La categoría es requerida'),
  body('precio_base').optional().isNumeric().withMessage('El precio base debe ser numérico'),
  body('unidad_medida').optional().isIn([
    'hora', 'proyecto', 'mes', 'año', 'unidad'
  ]).withMessage('Unidad de medida inválida')
];

const updateServiceValidation = [
  body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('categoria').optional().notEmpty().withMessage('La categoría no puede estar vacía'),
  body('precio_base').optional().isNumeric().withMessage('El precio base debe ser numérico'),
  body('unidad_medida').optional().isIn([
    'hora', 'proyecto', 'mes', 'año', 'unidad'
  ]).withMessage('Unidad de medida inválida')
];

const statusValidation = [
  body('estado').isIn(['activo', 'inactivo']).withMessage('Estado inválido')
];

// Routes
router.get('/', servicesController.getAllServices);
router.get('/:id', servicesController.getServiceById);
router.get('/:id/usage', servicesController.getServiceUsage);
router.post('/', createServiceValidation, servicesController.createService);
router.put('/:id', updateServiceValidation, servicesController.updateService);
router.patch('/:id/status', statusValidation, servicesController.updateServiceStatus);
router.delete('/:id', servicesController.deleteService);

module.exports = router;