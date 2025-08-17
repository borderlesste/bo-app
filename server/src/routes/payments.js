const express = require('express');
const { body } = require('express-validator');
const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  createStripePayment,
  confirmStripePayment,
  createPayPalOrder,
  capturePayPalPayment,
  getPaymentInfo,
  createRefund
} = require('../controllers/paymentsController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// --- Rutas para todos los usuarios autenticados ---
router.get('/', isAuthenticated, getPayments);
router.get('/:id', isAuthenticated, getPaymentById);

// --- Rutas solo para administradores ---
router.post('/', [
    isAuthenticated,
    isAdmin,
    body('usuario_id', 'El ID del cliente es obligatorio').isInt(),
    body('pedido_id', 'El ID del pedido es obligatorio').isInt(),
    body('monto', 'El monto debe ser un número').isFloat({ gt: 0 }),
    body('metodo_pago', 'El método de pago es obligatorio').not().isEmpty(),
    body('referencia_transferencia').optional().isString()
], createPayment);
router.put('/:id', [
    isAuthenticated,
    isAdmin,
    body('usuario_id', 'El ID del cliente es obligatorio').isInt(),
    body('pedido_id', 'El ID del pedido es obligatorio').isInt(),
    body('monto', 'El monto debe ser un número').isFloat({ gt: 0 }),
    body('metodo_pago', 'El método de pago es obligatorio').not().isEmpty(),
    body('estado', 'El estado es obligatorio').not().isEmpty(),
    body('referencia_transferencia').optional().isString()
], updatePayment);
router.delete('/:id', isAuthenticated, isAdmin, deletePayment);

// ============ RUTAS PARA PASARELAS DE PAGO ============

// Stripe Routes
router.post('/stripe/create-payment-intent', [
    body('amount', 'El monto es obligatorio y debe ser mayor a 0').isFloat({ gt: 0 }),
    body('currency', 'La moneda debe ser válida').optional().isAlpha(),
    body('client_email', 'El email del cliente es obligatorio').isEmail()
], createStripePayment);

router.post('/stripe/confirm-payment', [
    body('payment_intent_id', 'El ID del Payment Intent es obligatorio').not().isEmpty(),
    body('client_email', 'El email del cliente es obligatorio').isEmail()
], confirmStripePayment);

// PayPal Routes  
router.post('/paypal/create-order', [
    body('amount', 'El monto es obligatorio y debe ser mayor a 0').isFloat({ gt: 0 }),
    body('currency', 'La moneda debe ser válida').optional().isAlpha(),
    body('service', 'El servicio es obligatorio').not().isEmpty()
], createPayPalOrder);

router.post('/paypal/capture-order', [
    body('order_id', 'El ID de la orden es obligatorio').not().isEmpty(),
    body('client_email', 'El email del cliente es obligatorio').isEmail()
], capturePayPalPayment);

// Rutas comunes
router.get('/info/:payment_id', getPaymentInfo);
router.post('/refund', [
    isAuthenticated,
    isAdmin,
    body('payment_id', 'El ID del pago es obligatorio').not().isEmpty(),
    body('method', 'El método de pago es obligatorio').isIn(['stripe', 'paypal'])
], createRefund);

module.exports = router;
