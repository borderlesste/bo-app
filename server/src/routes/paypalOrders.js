const express = require('express');
const { body, param } = require('express-validator');
const { isAuthenticated } = require('../middleware/authMiddleware.js');
const { validationResult } = require('express-validator');
const paymentGatewayService = require('../services/paymentGatewayService.js');
const { pool } = require('../config/db.js');

const router = express.Router();

// Middleware para validar errores
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

// 🔄 PASO 1 y 2: Crear order en MySQL y orden en PayPal
router.post('/create-orders', 
  [
    isAuthenticated,
    body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un item'),
    body('items.*.descripcion').notEmpty().withMessage('Descripción del item es obligatoria'),
    body('items.*.precio_unitario').isFloat({ gt: 0 }).withMessage('Precio unitario debe ser mayor a 0'),
    body('items.*.cantidad').optional().isInt({ min: 1 }).withMessage('Cantidad debe ser un entero positivo'),
    body('currency').optional().isIn(['USD', 'MXN', 'EUR']).withMessage('Moneda no válida'),
    body('descripcion').optional().isString().withMessage('Descripción debe ser texto')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { items, currency = 'USD', descripcion } = req.body;
      const userId = req.user.id;
      
      console.log('🔄 Creating PayPal order for user:', userId);
      console.log('📦 Items:', items);
      
      const result = await paymentGatewayService.createPayPalorder(
        userId,
        items,
        {
          currency,
          descripcion
        }
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'order y orden PayPal creados exitosamente',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al crear el order'
        });
      }
    } catch (error) {
      console.error('❌ Error in create-orders:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// 🔄 PASO 4: Capturar pago de PayPal y actualizar order
router.post('/capture-orders',
  [
    isAuthenticated,
    body('paypal_order_id').notEmpty().withMessage('PayPal order ID es obligatorio'),
    body('order_id').optional().isInt().withMessage('ID de order debe ser un entero')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { paypal_order_id, order_id } = req.body;
      const userId = req.user.id;
      
      console.log('🔄 Capturing PayPal payment:', paypal_order_id);
      
      // Verificar que el order pertenece al usuario (seguridad)
      if (order_id) {
        const [orders] = await pool.execute(
          'SELECT * FROM orders WHERE id = ? AND usuario_id = ?',
          [order_id, userId]
        );
        
        if (orders.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'order no encontrado o no autorizado'
          });
        }
      }
      
      const result = await paymentGatewayService.capturePayPalorder(paypal_order_id);

      if (result.success) {
        res.json({
          success: true,
          message: 'Pago capturado y order actualizado exitosamente',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al capturar el pago'
        });
      }
    } catch (error) {
      console.error('❌ Error in capture-orders:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// 📋 Obtener estado del order
router.get('/orders/:orderId/status',
  [
    isAuthenticated,
    param('orderId').isInt().withMessage('ID de order debe ser un entero')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const [orders] = await pool.execute(
        `SELECT p.*, 
                COUNT(pi.id) as total_items,
                SUM(CASE WHEN pi.estado = 'completado' THEN 1 ELSE 0 END) as items_completados
         FROM orders p 
         LEFT JOIN order_items pi ON p.id = pi.order_id
         WHERE p.id = ? AND p.usuario_id = ?
         GROUP BY p.id`,
        [orderId, userId]
      );

      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'order no encontrado'
        });
      }

      const order = orders[0];
      
      // Obtener items del order
      const [items] = await pool.execute(
        'SELECT * FROM order_items WHERE order_id = ? order BY orden',
        [orderId]
      );
      
      // Obtener pagos relacionados
      const [pagos] = await pool.execute(
        `SELECT * FROM pagos 
         WHERE paypal_order_id = ? OR referencia LIKE ?
         order BY created_at DESC`,
        [order.paypal_order_id, `%${order.numero_order}%`]
      );

      res.json({
        success: true,
        data: {
          ...order,
          items,
          pagos,
          progress: {
            total_items: parseInt(order.total_items) || 0,
            items_completados: parseInt(order.items_completados) || 0,
            porcentaje: order.total_items > 0 
              ? Math.round((order.items_completados / order.total_items) * 100) 
              : 0
          }
        }
      });
    } catch (error) {
      console.error('❌ Error getting order status:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// 📋 Listar orders del usuario
router.get('/orders',
  [isAuthenticated],
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { estado, limit = 10, offset = 0 } = req.query;
      
      let whereClause = 'WHERE p.usuario_id = ?';
      let params = [userId];
      
      if (estado && ['nuevo', 'confirmado', 'en_proceso', 'completado', 'cancelado'].includes(estado)) {
        whereClause += ' AND p.estado = ?';
        params.push(estado);
      }
      
      const [orders] = await pool.execute(
        `SELECT p.*, 
                COUNT(pi.id) as total_items,
                SUM(CASE WHEN pi.estado = 'completado' THEN 1 ELSE 0 END) as items_completados
         FROM orders p 
         LEFT JOIN order_items pi ON p.id = pi.order_id
         ${whereClause}
         GROUP BY p.id
         order BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );

      // Contar total de orders
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM orders p ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            total: countResult[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            has_more: countResult[0].total > (parseInt(offset) + parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('❌ Error listing orders:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// 🔄 PASO 5: Webhook de PayPal (sin autenticación)
router.post('/webhook/paypal', 
  async (req, res) => {
    try {
      console.log('📨 PayPal webhook received:', req.body);
      console.log('📨 Headers:', req.headers);
      
      const result = await paymentGatewayService.processPayPalWebhook(req.body, req.headers);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Webhook procesado exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al procesar webhook'
        });
      }
    } catch (error) {
      console.error('❌ Error processing PayPal webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// 📊 Obtener resumen de pagos (admin only)
router.get('/admin/payment-summary',
  [isAuthenticated],
  async (req, res) => {
    try {
      if (req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }
      
      const [summary] = await pool.execute(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN estado = 'confirmado' THEN 1 ELSE 0 END) as orders_confirmados,
          SUM(CASE WHEN estado = 'nuevo' THEN 1 ELSE 0 END) as orders_pendientes,
          SUM(CASE WHEN payment_method = 'paypal' THEN total ELSE 0 END) as ingresos_paypal,
          SUM(total) as ingresos_totales,
          COUNT(DISTINCT usuario_id) as clientes_unicos
        FROM orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);
      
      const [recentWebhooks] = await pool.execute(`
        SELECT event_type, status, COUNT(*) as count
        FROM webhooks_paypal 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY event_type, status
        order BY count DESC
      `);

      res.json({
        success: true,
        data: {
          summary: summary[0],
          recent_webhooks: recentWebhooks
        }
      });
    } catch (error) {
      console.error('❌ Error getting payment summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

module.exports = router;