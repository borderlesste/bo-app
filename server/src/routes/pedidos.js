const express = require('express');
const { body } = require('express-validator');
const {
  getPedidos,
  getPedidoById,
  getPedidosSummaryForAdmin,
  createPedido,
  updatePedido,
  deletePedido,
  cancelPedidoClient,
  resumePedidoClient,
  getPedidoStatus
} = require('../controllers/pedidosController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// --- Rutas para todos los usuarios autenticados ---
router.get('/', isAuthenticated, getPedidos);
router.get('/:id', isAuthenticated, getPedidoById);
router.get('/:id/status', isAuthenticated, getPedidoStatus);

// --- Rutas para clientes ---
router.post('/', [
    isAuthenticated,
    body('servicio', 'El servicio es obligatorio').not().isEmpty(),
    body('descripcion', 'La descripción es obligatoria').not().isEmpty()
], createPedido);
router.put('/:id/cancel', isAuthenticated, cancelPedidoClient);
router.put('/:id/resume', isAuthenticated, resumePedidoClient);


// --- Rutas solo para administradores ---
router.get('/admin/summary', isAuthenticated, isAdmin, getPedidosSummaryForAdmin);

router.put('/:id/status', [
    isAuthenticated,
    isAdmin,
    body('estado', 'El estado es obligatorio').not().isEmpty()
], updatePedido);

router.put('/:id', [
    isAuthenticated,
    isAdmin,
    body('descripcion').optional().not().isEmpty().withMessage('La descripción no puede estar vacía'),
    body('estado').optional().isIn(['nuevo', 'confirmado', 'en_proceso', 'completado', 'cancelado', 'en_pausa']).withMessage('Estado inválido'),
    body('prioridad').optional().isIn(['baja', 'normal', 'alta', 'urgente']).withMessage('Prioridad inválida'),
    body('total').optional().isNumeric().withMessage('El total debe ser un número'),
    body('fecha_entrega_estimada').optional().isISO8601().toDate().withMessage('Fecha de entrega inválida')
], updatePedido);
router.delete('/:id', isAuthenticated, isAdmin, deletePedido);

module.exports = router;
