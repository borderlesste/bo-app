const express = require('express');
const { body } = require('express-validator');
const { isAuthenticated } = require('../middleware/authMiddleware.js');
const paymentGatewayService = require('../services/paymentGatewayService.js');
const { pool } = require('../config/db.js');

const router = express.Router();

// PayPal Routes
router.post('/paypal/create-order', 
  [
    isAuthenticated,
    body('amount', 'El monto es obligatorio').isFloat({ gt: 0 }),
    body('currency', 'La moneda es obligatoria').isIn(['USD', 'MXN', 'EUR']),
    body('pedidoData').optional().isObject()
  ],
  async (req, res) => {
    try {
      const { amount, currency, pedidoData } = req.body;

      // Create only the remote PayPal order (no DB pedido) using SDK helper
      const result = await paymentGatewayService.createPayPalOrderRemote(
        amount, 
        currency, 
        {
          ...pedidoData,
          user_id: req.user.id
        }
      );

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Orden de PayPal creada exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al crear orden de PayPal'
        });
      }
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Nuevo endpoint: crear pedido en BD + orden PayPal
router.post('/paypal/create-order-with-pedido',
  [
    isAuthenticated,
    body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un item'),
    body('items.*.descripcion').notEmpty().withMessage('Descripción del item es obligatoria'),
    body('items.*.precio_unitario').isFloat({ gt: 0 }).withMessage('Precio unitario debe ser mayor a 0'),
    body('items.*.cantidad').optional().isInt({ min: 1 }).withMessage('Cantidad debe ser un entero positivo'),
    body('currency').optional().isIn(['USD', 'MXN', 'EUR']).withMessage('Moneda no válida'),
    body('descripcion').optional().isString().withMessage('Descripción debe ser texto')
  ],
  async (req, res) => {
    try {
      const { items, currency = 'USD', descripcion } = req.body;
      const userId = req.user.id;

      // Calls the high-level service that creates DB pedido + PayPal order
      const result = await paymentGatewayService.createOrderAndPayPalOrder(userId, items, {
        currency,
        descripcion
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Pedido y orden PayPal creados exitosamente',
          data: result.data
        });
      } else {
        res.status(400).json({ success: false, message: result.message || 'Error al crear pedido' });
      }
    } catch (error) {
      console.error('Error creating order with pedido:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

router.post('/paypal/capture-order',
  [
    isAuthenticated,
    body('pedidoID', 'ID de pedido es obligatorio').notEmpty(),
    body('paymentID').optional().notEmpty()
  ],
  async (req, res) => {
    try {
      const { pedidoID, paymentID } = req.body;

      const result = await paymentGatewayService.capturePayPalorder(pedidoID);

      if (result.success) {
        // Update payment status in database
        if (paymentID) {
          await pool.execute(
            'UPDATE pagos SET estado = ?, referencia = ?, fecha_aplicacion = NOW() WHERE id = ?',
            ['aplicado', pedidoID, paymentID]
          );
        }

        res.json({
          success: true,
          data: result.data,
          message: 'Pago de PayPal capturado exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al capturar pago de PayPal'
        });
      }
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Stripe Routes
router.post('/stripe/create-intent',
  [
    isAuthenticated,
    body('amount', 'El monto es obligatorio').isFloat({ gt: 0 }),
    body('currency', 'La moneda es obligatoria').isIn(['usd', 'mxn', 'eur']),
    body('metadata').optional().isObject()
  ],
  async (req, res) => {
    try {
      const { amount, currency, metadata } = req.body;
      
      const result = await paymentGatewayService.createStripePayment(
        amount,
        currency,
        {
          ...metadata,
          user_id: req.user.id
        }
      );

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Payment Intent creado exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al crear Payment Intent'
        });
      }
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

router.post('/stripe/confirm-payment',
  [
    isAuthenticated,
    body('paymentIntentId', 'Payment Intent ID es obligatorio').notEmpty(),
    body('paymentID').optional().notEmpty()
  ],
  async (req, res) => {
    try {
      const { paymentIntentId, paymentID } = req.body;
      
      const result = await paymentGatewayService.confirmStripePayment(paymentIntentId);

      if (result.success) {
        // Update payment status in database
        if (paymentID) {
          await pool.execute(
            'UPDATE pagos SET estado = ?, referencia = ?, fecha_aplicacion = NOW() WHERE id = ?',
            ['aplicado', paymentIntentId, paymentID]
          );
        }

        res.json({
          success: true,
          data: result.data,
          message: 'Pago de Stripe confirmado exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al confirmar pago de Stripe'
        });
      }
    } catch (error) {
      console.error('Error confirming Stripe payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Get payment status
router.get('/:paymentId/status',
  [isAuthenticated],
  async (req, res) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      const [payments] = await pool.execute(
        'SELECT * FROM pagos WHERE id = ? AND usuario_id = ?',
        [paymentId, userId]
      );

      if (payments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pago no encontrado'
        });
      }

      res.json({
        success: true,
        data: payments[0]
      });
    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Bank transfer verification (admin only)
router.post('/bank-transfer/verify/:paymentId',
  [
    isAuthenticated,
    body('verified', 'Estado de verificación es obligatorio').isBoolean(),
    body('notes').optional().isString()
  ],
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden verificar transferencias.'
        });
      }

      const { paymentId } = req.params;
      const { verified, notes } = req.body;

      const newStatus = verified ? 'aplicado' : 'rechazado';
      
      await pool.execute(
        'UPDATE pagos SET estado = ?, notas = ?, verified_by = ?, fecha_aplicacion = ? WHERE id = ?',
        [newStatus, notes, req.user.id, verified ? new Date() : null, paymentId]
      );

      // Get updated payment info
      const [payments] = await pool.execute(
        'SELECT p.*, u.nombre as cliente_nombre FROM pagos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?',
        [paymentId]
      );

      if (payments.length > 0) {
        const payment = payments[0];
        
        // Send notification to client
        const emailService = require('../services/emailService.js');
        const notificationMessage = verified 
          ? `Su transferencia bancaria ha sido verificada y aplicada exitosamente. Monto: $${payment.monto}`
          : `Su transferencia bancaria ha sido rechazada. ${notes ? 'Motivo: ' + notes : ''}`;

        try {
          await emailService.sendEmail(
            payment.usuario_id,
            verified ? 'Pago Verificado' : 'Pago Rechazado',
            notificationMessage
          );
        } catch (emailError) {
          console.error('Error sending notification email:', emailError);
        }
      }

      res.json({
        success: true,
        message: `Transferencia ${verified ? 'verificada' : 'rechazada'} exitosamente`
      });
    } catch (error) {
      console.error('Error verifying bank transfer:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Get pending bank transfers (admin only)
router.get('/bank-transfers/pending',
  [isAuthenticated],
  async (req, res) => {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }

      const [transfers] = await pool.execute(`
        SELECT 
          p.*,
          u.nombre as cliente_nombre,
          u.email as cliente_email,
          ped.numero_order,
          ped.descripcion as proyecto_descripcion
        FROM pagos p
        JOIN usuarios u ON p.usuario_id = u.id
        LEFT JOIN pedidos ped ON p.pedido_id = ped.id
        WHERE p.metodo_pago = 'Transferencia Bancaria' 
        AND p.estado = 'pendiente'
        order BY p.created_at DESC
      `);

      res.json({
        success: true,
        data: transfers
      });
    } catch (error) {
      console.error('Error getting pending transfers:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

module.exports = router;