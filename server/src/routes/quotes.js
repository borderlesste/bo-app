const express = require('express');
const { body } = require('express-validator');
const {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  convertQuoteToOrder
} = require('../controllers/quotesController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public route for creating quotes from contact form
router.post('/', [
  body('nombre', 'El nombre es obligatorio').not().isEmpty(),
  body('email', 'Por favor, incluye un email válido').isEmail(),
  body('telefono').optional(),
  body('empresa').optional(),
  body('tipo_servicio', 'El tipo de servicio es obligatorio').not().isEmpty(),
  body('descripcion', 'La descripción es obligatoria').not().isEmpty()
], createQuote);

// Protected routes
router.get('/', isAuthenticated, isAdmin, getQuotes);
router.get('/:id', isAuthenticated, isAdmin, getQuoteById);
router.put('/:id', [
  isAuthenticated,
  isAdmin,
  body('estado', 'El estado es obligatorio').not().isEmpty()
], updateQuote);
router.delete('/:id', isAuthenticated, isAdmin, deleteQuote);
router.post('/:id/convert', isAuthenticated, isAdmin, convertQuoteToOrder);

module.exports = router;