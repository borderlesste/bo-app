const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  convertQuotationToorder,
  getQuotationStats
} = require('../controllers/quotationsUnified.js');

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

// PUBLIC ROUTES
router.post('/', [
  body('nombre', 'El nombre es obligatorio').notEmpty().trim(),
  body('email', 'Email válido es requerido').isEmail().normalizeEmail(),
  body('telefono').optional().trim(),
  body('empresa').optional().trim(),
  body('titulo').optional().trim(),
  body('descripcion', 'La descripción es obligatoria').notEmpty().trim(),
  body('tipo_servicio').optional().trim(),
  body('items').optional().isArray(),
  body('items.*.descripcion').optional().notEmpty(),
  body('items.*.cantidad').optional().isFloat({ min: 0 }),
  body('items.*.precio_unitario').optional().isFloat({ min: 0 }),
  body('items.*.descuento').optional().isFloat({ min: 0 })
], handleValidationErrors, createQuotation);

// PROTECTED ROUTES
router.use(isAuthenticated);
router.use(requireRole('admin'));

router.get('/stats', getQuotationStats);

router.get('/', [
  query('estado').optional().isIn(['Pendiente', 'Aprobada', 'Rechazada', 'Expirada']),
  query('usuario_id').optional().isInt(),
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort_by').optional().isIn(['created_at', 'updated_at', 'precio_estimado', 'estado']),
  query('sort_order').optional().isIn(['ASC', 'DESC'])
], handleValidationErrors, getAllQuotations);

router.get('/:id', [
  param('id').isInt({ min: 1 })
], handleValidationErrors, getQuotationById);

router.put('/:id', [
  param('id').isInt({ min: 1 }),
  body('titulo').optional().trim(),
  body('descripcion').optional().trim(),
  body('precio_estimado').optional().isFloat({ min: 0 }),
  body('estado').optional().isIn(['Pendiente', 'Aprobada', 'Rechazada', 'Expirada']),
  body('prioridad').optional().isIn(['baja', 'media', 'alta']),
  body('fecha_expiracion').optional().isISO8601(),
  body('notas_internas').optional().trim(),
  body('terminos_condiciones').optional().trim(),
  body('tiempo_entrega_dias').optional().isInt({ min: 1 }),
  body('items').optional().isArray(),
  body('items.*.servicio_id').optional().isInt(),
  body('items.*.descripcion').optional().notEmpty(),
  body('items.*.cantidad').optional().isFloat({ min: 0 }),
  body('items.*.precio_unitario').optional().isFloat({ min: 0 }),
  body('items.*.descuento').optional().isFloat({ min: 0 })
], handleValidationErrors, updateQuotation);

router.delete('/:id', [
  param('id').isInt({ min: 1 })
], handleValidationErrors, deleteQuotation);

router.post('/:id/convert', [
  param('id').isInt({ min: 1 }),
  body('convert_to').isIn(['order', 'project'])
], handleValidationErrors, convertQuotationToorder);

// DEPRECATION NOTICE for legacy routes
router.all('/legacy-*', (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Esta ruta ha sido deprecada. Use /api/quotations-unified en su lugar.',
    redirect_to: '/api/quotations-unified',
    deprecated_since: '2024-01-01'
  });
});

module.exports = router;