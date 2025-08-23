const express = require('express');
const { body } = require('express-validator');
const { createClientPayment, updateClientPayment } = require('../controllers/paymentsController.js');
const { isAuthenticated } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Ruta para que un cliente cree un pago para sí mismo
router.post('/',
  [
    isAuthenticated,
    body('pedido_id', 'El ID del pedido es obligatorio').isInt(),
    body('monto', 'El monto debe ser un número').isFloat({ gt: 0 }),
    body('concepto', 'El concepto es obligatorio').not().isEmpty(),
    body('metodo_pago', 'El método de pago es obligatorio').isIn(['PayPal', 'Transferencia Bancaria', 'Tarjeta de Crédito']),
    body('referencia_transferencia').optional().isString(),
  ],
  createClientPayment
);

// Ruta para que un cliente actualice/procese un pago existente (ej. de Pendiente a Pagado)
router.put('/:id',
  [
    isAuthenticated,
    body('metodo_pago', 'El método de pago es obligatorio').isIn(['PayPal', 'Transferencia Bancaria', 'Tarjeta de Crédito']),
    body('referencia_transferencia').optional().isString(),
  ],
  updateClientPayment
);


module.exports = router;
