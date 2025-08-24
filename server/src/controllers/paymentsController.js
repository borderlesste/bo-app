const { validationResult } = require('express-validator');
const { paymentService } = require('../services/paymentService.js');
const paymentGatewayService = require('../services/paymentGatewayService');
const { logActivity } = require('./dashboardController.js');
const { pool } = require('../config/db.js');
const emailService = require('../services/emailService.js');
const notificationService = require('../services/notificationService.js');
const { Pago } = require('../models');

// Estados de pago estandarizados
const PAYMENT_STATUS = {
  PENDING: 'pendiente',
  APPLIED: 'aplicado',
  COMPLETED: 'completado',
  CANCELLED: 'cancelado',
  REFUNDED: 'reembolsado'
};

// Helper function para obtener el nombre del usuario
const getClienteName = async (usuarioId) => {
  try {
    const [rows] = await pool.execute('SELECT nombre FROM usuarios WHERE id = ?', [usuarioId]);
    return rows.length > 0 ? rows[0].nombre : 'Cliente desconocido';
  } catch (error) {
    return 'Cliente desconocido';
  }
};

// Obtener todos los pagos (admin) o los pagos de un usuario (usuario)
exports.getPayments = async (req, res) => {
  try {
    const filters = {
      ...(req.query.estado && { estado: req.query.estado }),
      ...(req.query.tipo && { tipo: req.query.tipo }),
      ...(req.query.metodo_pago && { metodo_pago: req.query.metodo_pago }),
      ...(req.query.fecha_desde && { fecha_desde: req.query.fecha_desde }),
      ...(req.query.fecha_hasta && { fecha_hasta: req.query.fecha_hasta }),
      ...(req.query.search && { search: req.query.search }),
    };

    // Si es usuario, solo mostrar sus pagos
    if (req.user.rol === 'usuario') {
      filters.usuario_id = req.user.id;
    }

    const payments = await Pago.findAll({ where: filters });
    res.json({ success: true, data: payments });
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ success: false, message: 'Error al obtener los pagos.' });
  }
};

// Obtener un pago por ID
exports.getPaymentById = async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await Pago.findByPk(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Pago no encontrado' });
    }

    // Verificar permisos: solo admins o el dueño del pago
    if (req.user.rol === 'usuario' && payment.usuario_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para ver este pago' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    console.error(`Error fetching payment with id ${id}:`, error);
    res.status(500).json({ success: false, message: 'Error al obtener el pago' });
  }
};

// Crear un nuevo pago
exports.createPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { usuario_id, pedido_id, concepto, monto, metodo_pago, estado, referencia, banco_origen, paypal_order_id } = req.body;
  try {
    const newPayment = await paymentService.createPayment(
      usuario_id, pedido_id, concepto, monto, metodo_pago, estado, referencia, banco_origen, paypal_order_id
    );

    const usuarioName = await getClienteName(usuario_id);
    await logActivity(
      'new_payment',
      `${usuarioName} realizó un pago de $${monto.toLocaleString('es-MX')}${pedido_id ? ` para pedido #${pedido_id}` : ''}`,
      'normal',
      usuario_id,
      newPayment.id,
      'pago'
    );

    // Email + Notificación (no bloqueantes)
    try {
      const [usuarioData] = await pool.execute('SELECT email FROM usuarios WHERE id = ?', [usuario_id]);
      if (usuarioData.length > 0) {
        emailService.sendPaymentReceived({
          client_email: usuarioData[0].email, 
          client_name: usuarioName,
          amount: monto, 
          metodo_pago, 
          referencia,
          payment_number: newPayment.id,
          fecha_pago: new Date()
        }).catch(err => console.log('⚠️ Error enviando email:', err.message));
      }
    } catch (emailError) {
      console.log('⚠️ Error obteniendo datos de usuario para email:', emailError);
    }

    try {
      await notificationService.notifyNewPayment({ monto, metodo_pago, concepto, pedido_id }, usuarioName);
    } catch (notificationError) {
      console.log('⚠️ Error creando notificación:', notificationError);
    }
    
    res.status(201).json({ success: true, message: 'Pago creado exitosamente', data: newPayment });
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ success: false, message: 'Error al crear el pago.' });
  }
};

// Actualizar un pago
exports.updatePayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const { usuario_id, pedido_id, concepto, monto, metodo_pago, estado, referencia, banco_origen } = req.body;
  try {
    const updatedPayment = await paymentService.updatePayment(
      id, { usuario_id, pedido_id, concepto, monto, metodo_pago, estado, referencia, banco_origen }
    );
    res.json({ success: true, message: 'Pago actualizado exitosamente', data: updatedPayment });
  } catch (err) {
    console.error(`Error updating payment with id ${id}:`, err);
    res.status(500).json({ success: false, message: 'Error al actualizar el pago.' });
  }
};

// Eliminar un pago
exports.deletePayment = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await paymentService.deletePayment(id);
    res.status(200).json(result);
  } catch (err) {
    console.error(`Error deleting payment with id ${id}:`, err);
    res.status(500).json({ message: 'Error al eliminar el pago.' });
  }
};

// Crear un nuevo pago por un usuario
exports.createClientPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const usuario_id = req.user.id;
  const { pedido_id, concepto, monto, metodo_pago, banco_origen, referencia_transferencia } = req.body;

  let estado = PAYMENT_STATUS.PENDING;
  if (['paypal', 'PayPal', 'tarjeta', 'Tarjeta de Crédito'].includes(metodo_pago)) {
    estado = PAYMENT_STATUS.APPLIED;
  }

  try {
    const newPayment = await paymentService.createPayment(
      usuario_id,
      pedido_id,
      concepto || 'Pago de servicios',
      monto,
      metodo_pago,
      estado,
      referencia_transferencia || null,
      banco_origen || null,
      null
    );

    if (estado === PAYMENT_STATUS.APPLIED && pedido_id) {
      try {
        const invoiceService = require('../services/invoiceService.js');
        await invoiceService.generateInvoiceForPayment(newPayment.id, pedido_id, usuario_id);
      } catch (invoiceError) {
        console.error('Error generando factura automática:', invoiceError);
      }
    }
    
    res.status(201).json({ success: true, message: 'Pago procesado exitosamente', data: newPayment, order_updated: estado === PAYMENT_STATUS.APPLIED });
  } catch (err) {
    console.error('Error creating client payment:', err);
    res.status(500).json({ success: false, message: 'Error al procesar el pago.' });
  }
};

// ⚠️ Lo mismo aplica para updateClientPayment y pasarelas (te ajusto si quieres también).
exports.updateClientPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const usuario_id = req.user.id;
  const { pedido_id, concepto, monto, metodo_pago, estado, referencia_transferencia, banco_origen } = req.body;

  try {
    const payment = await Pago.findByPk(id);
    if (!payment) return res.status(404).json({ success: false, message: 'Pago no encontrado' });
    if (payment.usuario_id !== usuario_id) return res.status(403).json({ success: false, message: 'No tienes permisos para actualizar este pago' });

    const updatedPayment = await paymentService.updatePayment(
      id, { usuario_id, pedido_id, concepto, monto, metodo_pago, estado, referencia: referencia_transferencia, banco_origen }
    );
    res.json({ success: true, message: 'Pago actualizado exitosamente', data: updatedPayment });
  } catch (err) {
    console.error(`Error updating client payment with id ${id}:`, err);
    res.status(500).json({ success: false, message: 'Error al actualizar el pago.' });
  }
};

// ============ FUNCIONES PARA PASARELAS DE PAGO ============

// Crear Payment Intent de Stripe
exports.createStripePayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { amount, currency = 'mxn', pedido_id, client_email } = req.body;

  try {
    const result = await paymentGatewayService.createStripePayment(
      amount, 
      currency, 
      { 
        pedido_id, 
        client_email,
        user_id: req.user?.id 
      }
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error creating Stripe payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Confirmar pago de Stripe
exports.confirmStripePayment = async (req, res) => {
  const { payment_intent_id, client_email } = req.body;

  try {
    const result = await paymentGatewayService.processPayment(
      { 
        payment_id: payment_intent_id, 
        client_email 
      }, 
      'stripe'
    );

    if (result.success) {
      // Guardar el pago en la base de datos
      try {
        await paymentService.createPayment(
          req.user?.id || null,
          req.body.pedido_id || null,
          'Pago por servicios de desarrollo',
          result.data.amount,
          'Stripe',
          PAYMENT_STATUS.COMPLETED,
          result.data.id,
          null,
          null
        );
      } catch (dbError) {
        console.error('Error saving payment to database:', dbError);
      }

      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error confirming Stripe payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear orden de PayPal
exports.createPayPalorder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { amount, currency = 'USD', service, reference_id } = req.body;

  try {
    const result = await paymentGatewayService.createPayPalorder(
      amount, 
      currency, 
      { 
        service, 
        reference_id: reference_id || `pedido_${Date.now()}`,
        user_id: req.user?.id 
      }
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Capturar pago de PayPal
exports.capturePayPalPayment = async (req, res) => {
  const { pedido_id, client_email } = req.body;

  try {
    const result = await paymentGatewayService.processPayment(
      { 
        payment_id: pedido_id, 
        client_email 
      }, 
      'paypal'
    );

    if (result.success) {
      // Guardar el pago en la base de datos
      try {
        await paymentService.createPayment(
          req.user?.id || null,
          req.body.pedido_ref || null,
          'Pago por servicios de desarrollo',
          result.data.amount,
          'PayPal',
          PAYMENT_STATUS.COMPLETED,
          result.data.id,
          null,
          pedido_id
        );
      } catch (dbError) {
        console.error('Error saving PayPal payment to database:', dbError);
      }

      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener información de pago
exports.getPaymentInfo = async (req, res) => {
  const { payment_id } = req.params;
  const { method = 'stripe' } = req.query;

  try {
    const result = await paymentGatewayService.getPaymentInfo(payment_id, method);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error getting payment info:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear reembolso
exports.createRefund = async (req, res) => {
  const { payment_id, amount, method = 'stripe', reason } = req.body;

  try {
    const result = await paymentGatewayService.createRefund(payment_id, amount, method);

    if (result.success) {
      // Actualizar el estado en la base de datos
      try {
        console.log(`Refund created: ${result.data.id}`);
      } catch (dbError) {
        console.error('Error updating refund in database:', dbError);
      }

      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};