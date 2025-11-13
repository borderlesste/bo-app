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
router.post('/create-pedidos', 
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
      console.error('❌ Error in create-pedidos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// 🔄 PASO 4: Capturar pago de PayPal y actualizar order
router.post('/capture-pedidos',
  [
    isAuthenticated,
    body('paypal_pedido_id').notEmpty().withMessage('PayPal order ID es obligatorio'),
    body('pedido_id').optional().isInt().withMessage('ID de order debe ser un entero')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { paypal_pedido_id, pedido_id } = req.body;
      const userId = req.user.id;
      
      console.log('🔄 Capturing PayPal payment:', paypal_pedido_id);
      
      // Verificar que el order pertenece al usuario (seguridad)
      if (pedido_id) {
        const [pedidos] = await pool.execute(
          'SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?',
          [pedido_id, userId]
        );
        
        if (pedidos.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'order no encontrado o no autorizado'
          });
        }
      }
      
      const result = await paymentGatewayService.capturePayPalorder(paypal_pedido_id);

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
      console.error('❌ Error in capture-pedidos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// 📋 Obtener estado del order
router.get('/pedidos/:orderId/status',
  [
    isAuthenticated,
    param('orderId').isInt().withMessage('ID de order debe ser un entero')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const [pedidos] = await pool.execute(
        `SELECT p.*, 
                COUNT(pi.id) as total_items,
                SUM(CASE WHEN pi.estado = 'completado' THEN 1 ELSE 0 END) as items_completados
         FROM pedidos p 
         LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
         WHERE p.id = ? AND p.usuario_id = ?
         GROUP BY p.id`,
        [orderId, userId]
      );

      if (pedidos.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'order no encontrado'
        });
      }

      const order = pedidos[0];
      
      // Obtener items del order
      const [items] = await pool.execute(
        'SELECT * FROM pedido_items WHERE pedido_id = ? order BY orden',
        [orderId]
      );
      
      // Obtener pagos relacionados
      const [pagos] = await pool.execute(
        `SELECT * FROM pagos
         WHERE paypal_pedido_id = ? OR referencia LIKE ?
         order BY created_at DESC`,
        [order.paypal_pedido_id, `%${order.numero_pedido}%`]
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

// 📋 Listar pedidos del usuario
router.get('/pedidos',
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
      
      const [pedidos] = await pool.execute(
        `SELECT p.*, 
                COUNT(pi.id) as total_items,
                SUM(CASE WHEN pi.estado = 'completado' THEN 1 ELSE 0 END) as items_completados
         FROM pedidos p 
         LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
         ${whereClause}
         GROUP BY p.id
         order BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );

      // Contar total de pedidos
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM pedidos p ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: {
          pedidos,
          pagination: {
            total: countResult[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            has_more: countResult[0].total > (parseInt(offset) + parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('❌ Error listing pedidos:', error);
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
          COUNT(*) as total_pedidos,
          SUM(CASE WHEN estado = 'confirmado' THEN 1 ELSE 0 END) as pedidos_confirmados,
          SUM(CASE WHEN estado = 'nuevo' THEN 1 ELSE 0 END) as pedidos_pendientes,
          SUM(CASE WHEN payment_method = 'paypal' THEN total ELSE 0 END) as ingresos_paypal,
          SUM(total) as ingresos_totales,
          COUNT(DISTINCT usuario_id) as clientes_unicos
        FROM pedidos 
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