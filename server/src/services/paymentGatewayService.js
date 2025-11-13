require('dotenv').config();

// Para desarrollo: solo cargar Stripe si hay API key
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// PayPal SDK Configuration
let paypalClient = null;
let pedidosController = null;
let PaymentsController = null;

if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  try {
    const checkoutSDK = require('@paypal/checkout-server-sdk');
    
    // Create PayPal environment
    const environment = (process.env.PAYPAL_ENVIRONMENT === 'production' || process.env.PAYPAL_ENVIRONMENT === 'live')
      ? new checkoutSDK.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
      : new checkoutSDK.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
    
    // Create PayPal client
    paypalClient = new checkoutSDK.core.PayPalHttpClient(environment);
    pedidosController = checkoutSDK.orders;
    PaymentsController = checkoutSDK.payments;
    
    console.log('✅ PayPal SDK initialized successfully');
    console.log(`📝 Environment: ${process.env.PAYPAL_ENVIRONMENT || 'sandbox'}`);
  } catch (error) {
    console.error('❌ Error initializing PayPal SDK:', error);
  }
}

const emailService = require('./emailService');
const { pool } = require('../config/db');

class PaymentGatewayService {
  constructor() {
    this.stripe = stripe;
    this.paypalClient = paypalClient;
    this.pedidosController = pedidosController;
    
    console.log('💳 Payment Gateway Service initialized for development');
    console.log('📝 Stripe:', this.stripe ? 'Configured' : 'Not configured');
    console.log('📝 PayPal:', this.paypalClient ? 'Configured' : 'Not configured');
    console.log('📝 PayPal pedidosController:', this.pedidosController ? 'Available' : 'Not available');
    
    // Test PayPal client configuration
    if (this.paypalClient) {
      console.log('📝 PayPal Environment:', process.env.PAYPAL_ENVIRONMENT || 'sandbox');
      console.log('📝 PayPal Client ID configured:', !!process.env.PAYPAL_CLIENT_ID);
    }
  }

  // Stripe Payment Intent
  async createStripePayment(amount, currency = 'mxn', metadata = {}) {
    if (!this.stripe) {
      return {
        success: false,
        message: 'Stripe no está configurado para desarrollo'
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir a centavos
        currency: currency.toLowerCase(),
        metadata: {
          service: 'borderless-techno',
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        data: {
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          amount: amount,
          currency
        }
      };
    } catch (error) {
      console.error('Error creating Stripe payment:', error);
      return {
        success: false,
        message: 'Error al crear el pago con Stripe',
        error: error.message
      };
    }
  }

  // Confirmar pago de Stripe
  async confirmStripePayment(paymentIntentId) {
    if (!this.stripe) {
      return {
        success: false,
        message: 'Stripe no está configurado para desarrollo'
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: true,
        data: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          payment_method: paymentIntent.payment_method,
          created: paymentIntent.created
        }
      };
    } catch (error) {
      console.error('Error confirming Stripe payment:', error);
      return {
        success: false,
        message: 'Error al confirmar el pago',
        error: error.message
      };
    }
  }

  /* ----------------------------- PAYPAL: High-level orchestration ----------------------------- */
  // Crear order en base de datos y orden de PayPal (Paso 1 y 2 del flujo)
  async createOrderAndPayPalOrder(userId, orderItems, orderData = {}) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. Calcular total en el servidor (nunca confiar en el frontend)
      let subtotal = 0;
      const items = [];
      
      for (const item of orderItems) {
        const itemSubtotal = (item.cantidad || 1) * (item.precio_unitario || 0);
        subtotal += itemSubtotal;
        items.push({
          ...item,
          subtotal: itemSubtotal
        });
      }
      
      const iva = subtotal * 0.16; // 16% IVA
      const total = subtotal + iva;
      
      // Generar número de order único
      const numeroorder = `PED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 2. Insertar pedido en MySQL con status PENDING
      const [pedidoResult] = await connection.execute(
        `INSERT INTO pedidos 
         (numero_pedido, usuario_id, estado, subtotal, iva, total, saldo_pendiente, 
          descripcion, payment_method, created_at, updated_at) 
         VALUES (?, ?, 'nuevo', ?, ?, ?, ?, ?, 'paypal', NOW(), NOW())`,
        [numeroorder, userId, subtotal, iva, total, total, orderData.descripcion || 'pedido PayPal']
      );

      const pedidoId = pedidoResult.insertId;

      // 3. Insertar items del pedido
      for (const item of items) {
        await connection.execute(
          `INSERT INTO pedido_items 
           (pedido_id, descripcion, cantidad, precio_unitario, subtotal, orden) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [pedidoId, item.descripcion, item.cantidad || 1, item.precio_unitario, item.subtotal, item.orden || 0]
        );
      }
      
      // 4. Crear orden en PayPal (método SDK remoto renombrado)
      const paypalorder = await this.createPayPalOrderRemote(total, orderData.currency || 'USD', {
        ...orderData,
        reference_id: numeroorder,
        pedido_id: pedidoId
      });
      
      if (!paypalorder.success) {
        await connection.rollback();
        return paypalorder;
      }
      
      // 5. Actualizar pedido con PayPal order ID
      await connection.execute(
        'UPDATE pedidos SET paypal_pedido_id = ? WHERE id = ?',
        [paypalorder.data.pedido_id, pedidoId]
      );
      
      await connection.commit();
      
      return {
        success: true,
        data: {
          pedido_id: pedidoId,
          numero_pedido: numeroorder,
          paypal_pedido_id: paypalorder.data.pedido_id,
          approve_url: paypalorder.data.approve_url,
          total,
          currency: orderData.currency || 'USD'
        }
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('Error creating PayPal order (createOrderAndPayPalOrder):', error);
      return {
        success: false,
        message: 'Error al crear el order',
        error: error.message
      };
    } finally {
      connection.release();
    }
  }

  /* ----------------------------- PAYPAL: SDK-level helpers ----------------------------- */
  // Crear orden remota en PayPal
  async createPayPalOrderRemote(amount, currency = 'USD', orderData = {}) {
    // Solo simular si NO hay credenciales configuradas (no por estar en development)
    if (!paypalClient || !pedidosController) {
      console.log('🔧 No PayPal credentials: Simulating PayPal order creation');
      console.log('⚠️ Configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env to use real PayPal');
      // Usar URL correcta según el environment
      const checkoutUrl = (process.env.PAYPAL_ENVIRONMENT === 'live' || process.env.PAYPAL_ENVIRONMENT === 'production')
        ? 'https://www.paypal.com/checkoutnow'
        : 'https://www.sandbox.paypal.com/checkoutnow';
      
      return {
        success: true,
        data: {
          pedido_id: 'DEMO_order_' + Date.now(),
          approve_url: `${checkoutUrl}?token=DEMO_TOKEN_${Date.now()}`,
          amount,
          currency,
          status: 'CREATED',
          simulated: true
        }
      };
    }

    try {
      const request = {
        body: {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2)
            },
            description: `Borderless Techno - ${orderData.descripcion || 'Servicio de desarrollo'}`,
            reference_id: orderData.reference_id || 'DEFAULT',
            invoice_id: orderData.pedido_id ? `INV-${orderData.pedido_id}` : undefined
          }],
          application_context: {
            return_url: process.env.PAYPAL_RETURN_URL || 'http://localhost:4001/payment/success',
            cancel_url: process.env.PAYPAL_CANCEL_URL || 'http://localhost:4001/payment/cancel',
            brand_name: 'Borderless Techno',
            locale: 'es-MX',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING'
          }
        }
      };

      console.log('🔄 Creating PayPal order (remote):', JSON.stringify(request.body, null, 2));

      const orderRequest = new pedidosController.OrdersCreateRequest();
      orderRequest.requestBody(request.body);
      const response = await paypalClient.execute(orderRequest);

      console.log('✅ PayPal order created (remote):', response.body?.id);

      if (response.body && response.body.id) {
        const approveLink = (response.body.links || []).find(link => link.rel === 'approve');

        return {
          success: true,
          data: {
            pedido_id: response.body.id,
            approve_url: approveLink?.href,
            amount,
            currency,
            status: response.body.status
          }
        };
      } else {
        throw new Error('Invalid PayPal response - missing order ID');
      }
    } catch (error) {
      console.error('❌ Error creating PayPal order (remote):', error);
      return {
        success: false,
        message: 'Error al crear la orden de PayPal',
        error: error.message
      };
    }
  }

  /* ----------------------------- PAYPAL: Capture helpers ----------------------------- */
  // Alto nivel: capturar en PayPal y actualizar BD
  async capturePayPalOrderAndUpdateDb(paypalorderId, additionalData = {}) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. Buscar el pedido en MySQL
      const [pedidos] = await connection.execute(
        'SELECT * FROM pedidos WHERE paypal_pedido_id = ?',
        [paypalorderId]
      );

      if (pedidos.length === 0) {
        await connection.rollback();
        return {
          success: false,
          message: 'order no encontrado en la base de datos'
        };
      }

      const pedido = pedidos[0];

      // 2. Capturar pago en PayPal (método SDK remoto)
      const captureResult = await this.capturePayPalOrderRemote(paypalorderId);
      
      if (!captureResult.success) {
        await connection.rollback();
        return captureResult;
      }
      
      const capture = captureResult.data;
      
      // 3. Insertar registro en tabla pagos
      const [pagoResult] = await connection.execute(
        `INSERT INTO pagos
         (numero_pago, usuario_id, tipo, estado, monto, moneda, metodo_pago,
          referencia, paypal_pedido_id, paypal_capture_id, paypal_payer_email,
          payment_gateway, fecha_pago, fecha_aplicacion, concepto, created_at, updated_at)
         VALUES (?, ?, 'total', 'aplicado', ?, ?, 'paypal', ?, ?, ?, ?, 'paypal', NOW(), NOW(), ?, NOW(), NOW())`,
        [
          `PAY-${Date.now()}`,
          pedido.usuario_id,
          capture.amount,
          capture.currency,
          `Pago PayPal para pedido ${pedido.numero_pedido}`, // referencia
          paypalorderId,                                      // paypal_pedido_id
          capture.capture_id,                                 // paypal_capture_id
          capture.payer_email,                                // paypal_payer_email
          `Pago PayPal para pedido ${pedido.numero_pedido}`   // concepto
        ]
      );

      // 4. Actualizar estado del pedido
      await connection.execute(
        `UPDATE pedidos
         SET estado = 'confirmado', paypal_capture_id = ?, saldo_pendiente = 0, updated_at = NOW()
         WHERE id = ?`,
        [capture.capture_id, pedido.id]
      );
      
      // 5. Registrar en historial de estados
      await connection.execute(
        `INSERT INTO historial_estado_pedidos
         (pedido_id, estado_anterior, estado_nuevo, comentario, created_at)
         VALUES (?, ?, 'confirmado', 'Pago completado via PayPal', NOW())`,
        [pedido.id, pedido.estado]
      );
      
      // 6. GENERAR FACTURA Y PAGO_APLICACIONES AUTOMÁTICAMENTE
      try {
        const invoiceService = require('./invoiceService.js');
        const invoice = await invoiceService.generateInvoiceFromPayment(pagoResult.insertId);
        console.log(`✓ Factura generada automáticamente: ${invoice.numero_factura} para pago ${pagoResult.insertId}`);
      } catch (invoiceError) {
        console.error('❌ Error generando factura automática:', invoiceError);
        console.log('⚠️ El pago se registrará sin factura automática. Deberá generarse manualmente.');
        // No crear pago_aplicaciones sin factura para mantener integridad referencial
      }
      
      await connection.commit();
      
      return {
        success: true,
        data: {
          pedido_id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          pago_id: pagoResult.insertId,
          paypal_pedido_id: paypalorderId,
          paypal_capture_id: capture.capture_id,
          amount: capture.amount,
          currency: capture.currency,
          status: 'PAID',
          payer_email: capture.payer_email
        }
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('Error capturing PayPal order (capturePayPalOrderAndUpdateDb):', error);
      return {
        success: false,
        message: 'Error al capturar el pago',
        error: error.message
      };
    } finally {
      connection.release();
    }
  }

  // SDK: captura remota
  async capturePayPalOrderRemote(orderId) {
    // Para desarrollo, simular captura de órdenes demo
    if ((orderId || '').startsWith('DEMO_order_') || process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Simulating PayPal payment capture (remote)');
      const randomAmount = (Math.random() * 1000 + 100).toFixed(2);
      return {
        success: true,
        data: {
          id: orderId,
          status: 'COMPLETED',
          amount: parseFloat(randomAmount),
          currency: 'USD',
          capture_id: 'DEMO_CAPTURE_' + Date.now(),
          payer_email: 'test@sandbox.paypal.com',
          payer_id: 'DEMO_PAYER_' + Date.now(),
          created: new Date().toISOString(),
          transaction_fee: '3.50',
          simulated: true
        }
      };
    }

    if (!paypalClient || !pedidosController) {
      return {
        success: false,
        message: 'PayPal no está configurado correctamente'
      };
    }

    try {
      console.log('🔄 Capturing PayPal order (remote):', orderId);

      const request = new pedidosController.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const response = await paypalClient.execute(request);
      
      console.log('📦 PayPal capture response (remote):', JSON.stringify(response.body, null, 2));

      if (response.body && response.body.status === 'COMPLETED') {
        // Validar estructura de respuesta
        const captures = response.body.purchase_units?.[0]?.payments?.captures;
        if (!captures || captures.length === 0) {
          throw new Error('No capture data in PayPal response');
        }

        const capture = captures[0];

        return {
          success: true,
          data: {
            id: response.body.id,
            status: response.body.status,
            amount: parseFloat(capture.amount?.value || '0'),
            currency: capture.amount?.currency_code || 'USD',
            capture_id: capture.id,
            payer_email: response.body.payer?.email_address,
            payer_id: response.body.payer?.payer_id,
            created: capture.create_time,
            transaction_fee: capture.seller_receivable_breakdown?.paypal_fee?.value || '0.00'
          }
        };
      } else {
        throw new Error(`Payment not completed. Status: ${response.body?.status}`);
      }
    } catch (error) {
      console.error('❌ Error capturing PayPal order (remote):', error);
      return {
        success: false,
        message: 'Error al capturar el pago de PayPal',
        error: error.message
      };
    }
  }

  /* ----------------------------- Utilities / Backwards compatibility ----------------------------- */
  // Mantener wrappers con los nombres antiguos para no romper llamadas existentes
  async createPayPalorder(userId, orderItems, orderData = {}) {
    return this.createOrderAndPayPalOrder(userId, orderItems, orderData);
  }

  async capturePayPalorder(paypalorderId, additionalData = {}) {
    return this.capturePayPalOrderAndUpdateDb(paypalorderId, additionalData);
  }

  // Compat alias para processPayment (que antes llamaba a capturePayPalPayment)
  async capturePayPalPayment(paypalorderId) {
    return this.capturePayPalOrderAndUpdateDb(paypalorderId);
  }

  /* ----------------------------- Remaining methods (refunds, getPaymentInfo, webhook) ----------------------------- */
  // Procesar pago completo (incluyendo notificaciones)
  async processPayment(paymentData, paymentMethod = 'stripe') {
    try {
      let paymentResult;

      if (paymentMethod === 'stripe') {
        paymentResult = await this.confirmStripePayment(paymentData.payment_id);
      } else if (paymentMethod === 'paypal') {
        paymentResult = await this.capturePayPalPayment(paymentData.payment_id);
      } else {
        throw new Error('Método de pago no soportado');
      }

      if (!paymentResult.success) {
        return paymentResult;
      }

      // Preparar datos para notificación por email
      const emailData = {
        client_email: paymentData.client_email,
        monto: paymentResult.data.amount,
        metodo_pago: paymentMethod.toUpperCase(),
        estado: 'Completado',
        fecha: new Date(),
        transaction_id: paymentResult.data.id
      };

      // Enviar confirmación por email
      try {
        await emailService.sendPaymentConfirmation(emailData);
      } catch (emailError) {
        console.error('Error sending payment confirmation email:', emailError);
      }

      return {
        success: true,
        data: {
          ...paymentResult.data,
          method: paymentMethod,
          email_sent: true
        }
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        message: 'Error al procesar el pago',
        error: error.message
      };
    }
  }

  // Crear reembolso
  async createRefund(paymentId, amount = null, paymentMethod = 'stripe') {
    try {
      let refundResult;

      if (paymentMethod === 'stripe') {
        const refundData = { payment_intent: paymentId };
        if (amount) {
          refundData.amount = Math.round(amount * 100); // Convertir a centavos
        }
        
        const refund = await stripe.refunds.create(refundData);
        
        refundResult = {
          success: true,
          data: {
            id: refund.id,
            amount: refund.amount / 100,
            currency: refund.currency,
            status: refund.status,
            reason: refund.reason
          }
        };
      } else if (paymentMethod === 'paypal') {
        // Para PayPal, necesitaríamos el capture_id en lugar del pedido_id
        // Esta es una implementación simplificada
        refundResult = {
          success: false,
          message: 'Reembolsos de PayPal requieren implementación específica con capture_id'
        };
      } else {
        throw new Error('Método de pago no soportado para reembolsos');
      }

      return refundResult;
    } catch (error) {
      console.error('Error creating refund:', error);
      return {
        success: false,
        message: 'Error al crear el reembolso',
        error: error.message
      };
    }
  }

  // Obtener información de pago
  async getPaymentInfo(paymentId, paymentMethod = 'stripe') {
    try {
      let paymentInfo;

      if (paymentMethod === 'stripe') {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        paymentInfo = {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          created: paymentIntent.created,
          payment_method: paymentIntent.payment_method
        };
      } else if (paymentMethod === 'paypal') {
        if (!this.paypalClient || !this.pedidosController) {
          throw new Error('PayPal no está configurado correctamente');
        }

        const ordersGetRequest = new this.pedidosController.OrdersGetRequest(paymentId);
        const response = await this.paypalClient.execute(ordersGetRequest);
        const orderData = response.result;

        paymentInfo = {
          id: orderData.id,
          status: orderData.status,
          amount: orderData.purchase_units?.[0]?.amount?.value || '0.00',
          currency: orderData.purchase_units?.[0]?.amount?.currency_code || 'USD',
          created: orderData.create_time
        };
      } else {
        throw new Error('Método de pago no soportado');
      }

      return {
        success: true,
        data: paymentInfo
      };
    } catch (error) {
      console.error('Error getting payment info:', error);
      return {
        success: false,
        message: 'Error al obtener información del pago',
        error: error.message
      };
    }
  }

  // Procesar webhook de PayPal (Paso 5 del flujo)
  async processPayPalWebhook(webhookPayload, headers) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { event_type, resource, id: eventId } = webhookPayload;
      
      // 1. Verificar si ya procesamos este evento (idempotencia)
      const [existingEvents] = await connection.execute(
        'SELECT * FROM webhooks_paypal WHERE event_id = ?',
        [eventId]
      );
      
      if (existingEvents.length > 0) {
        await connection.rollback();
        return {
          success: true,
          message: 'Evento ya procesado',
          data: { event_id: eventId, status: 'duplicate' }
        };
      }
      
      // 2. Registrar el webhook
      await connection.execute(
        `INSERT INTO webhooks_paypal 
         (webhook_id, event_type, event_id, resource_type, resource_id, 
          raw_payload, verification_status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          headers['paypal-transmission-id'] || 'unknown',
          event_type,
          eventId,
          resource?.resource_type || 'unknown',
          resource?.id || 'unknown',
          JSON.stringify(webhookPayload)
        ]
      );
      
      // 3. Procesar según el tipo de evento
      let processingResult = { success: true, message: 'Event logged' };
      
      switch (event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          processingResult = await this.handlePaymentCaptureCompleted(resource, connection);
          break;
          
        case 'PAYMENT.CAPTURE.DENIED':
        case 'PAYMENT.CAPTURE.DECLINED':
          processingResult = await this.handlePaymentCaptureFailed(resource, connection);
          break;
          
        case 'CHECKOUT.order.APPROVED':
          processingResult = await this.handleorderApproved(resource, connection);
          break;
          
        default:
          console.log(`📝 Unhandled webhook event: ${event_type}`);
          processingResult = { success: true, message: 'Event type not handled' };
      }
      
      // 4. Actualizar estado del webhook
      const webhookStatus = processingResult.success ? 'processed' : 'failed';
      await connection.execute(
        `UPDATE webhooks_paypal 
         SET status = ?, processing_error = ?, processed_at = NOW() 
         WHERE event_id = ?`,
        [webhookStatus, processingResult.error || null, eventId]
      );
      
      await connection.commit();
      
      return {
        success: true,
        data: {
          event_id: eventId,
          event_type,
          processing_result: processingResult
        }
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error processing PayPal webhook:', error);
      return {
        success: false,
        message: 'Error al procesar webhook',
        error: error.message
      };
    } finally {
      connection.release();
    }
  }

  // Manejar captura de pago completada
  async handlePaymentCaptureCompleted(resource, connection) {
    try {
      const captureId = resource.id;
      // Intentar obtener order id desde campos comunes
      const orderId =
        resource.supplementary_data?.related_ids?.order_id ||
        resource.supplementary_data?.related_ids?.pedido_id ||
        resource.invoice_id ||
        resource.custom_id ||
        resource.reference_id ||
        resource.purchase_units?.[0]?.reference_id;

      const amount = parseFloat(resource.amount?.value || 0);
      const currency = resource.amount?.currency_code || 'USD';
      const payerEmail = resource.payer?.email_address || resource.payee?.email_address;
      
      if (!orderId) {
        return { success: false, error: 'order ID not found in webhook' };
      }
      
      // Buscar pedido y verificar estado
      const [pedidos] = await connection.execute(
        'SELECT * FROM pedidos WHERE paypal_pedido_id = ?',
        [orderId]
      );

      if (pedidos.length === 0) {
        return { success: false, error: 'pedido no encontrado' };
      }
      
      const pedido = pedidos[0];
      
      // Si ya está confirmado, no hacer nada (reconciliación)
      if (pedido.estado === 'confirmado' && pedido.paypal_capture_id) {
        return { success: true, message: 'Payment already processed' };
      }

      // Actualizar pedido a confirmado
      await connection.execute(
        `UPDATE pedidos
         SET estado = 'confirmado', paypal_capture_id = ?, saldo_pendiente = 0
         WHERE paypal_pedido_id = ?`,
        [captureId, orderId]
      );
      
      // Verificar si ya existe el pago
      const [existingpagos] = await connection.execute(
        'SELECT * FROM pagos WHERE paypal_capture_id = ?',
        [captureId]
      );

      if (existingpagos.length === 0) {
        // Crear registro de pago
        await connection.execute(
          `INSERT INTO pagos 
           (numero_pago, usuario_id, tipo, estado, monto, moneda, metodo_pago, 
            referencia, paypal_pedido_id, paypal_capture_id, paypal_payer_email, 
            payment_gateway, fecha_pago, fecha_aplicacion, concepto) 
           VALUES (?, ?, 'total', 'aplicado', ?, ?, 'paypal', ?, ?, ?, ?, 'paypal', NOW(), NOW(), ?)`,
          [
            `PAY-WH-${Date.now()}`,
            pedido.usuario_id,
            amount,
            currency,
            `Pago webhook PayPal para pedido ${pedido.numero_pedido}`,
            orderId,
            captureId,
            payerEmail
          ]
        );
      }
      
      return { success: true, message: 'Payment capture completed via webhook' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Manejar captura de pago fallida
  async handlePaymentCaptureFailed(resource, connection) {
    try {
      const orderId =
        resource.supplementary_data?.related_ids?.order_id ||
        resource.supplementary_data?.related_ids?.pedido_id;
      
      if (orderId) {
        await connection.execute(
          'UPDATE pedidos SET estado = ? WHERE paypal_pedido_id = ?',
          ['cancelado', orderId]
        );
      }
      
      return { success: true, message: 'Payment marked as failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Manejar orden aprobada (solo logging)
  async handleorderApproved(resource, connection) {
    try {
      const orderId = resource.id;
      
      await connection.execute(
        `UPDATE webhooks_paypal 
         SET pedido_id = ? 
         WHERE resource_id = ?`,
        [orderId, orderId]
      );
      
      return { success: true, message: 'order approval logged' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Verificar firma del webhook (implementar según documentación de PayPal)
  async verifyWebhookSignature(payload, headers) {
    // ⚠️ CRITICAL SECURITY WARNING ⚠️
    // TODO: Implementar verificación de firma usando PayPal SDK
    // NUNCA USAR EN PRODUCCIÓN SIN VERIFICACIÓN
    //
    // Para implementar verificación correcta:
    // 1. Crear webhook en PayPal Dashboard y obtener WEBHOOK_ID
    // 2. Agregar PAYPAL_WEBHOOK_ID a variables de entorno
    // 3. Usar PayPal SDK para verificar firma con:
    //    - PAYPAL-TRANSMISSION-ID
    //    - PAYPAL-TRANSMISSION-TIME
    //    - PAYPAL-TRANSMISSION-SIG
    //    - PAYPAL-CERT-URL
    //    - PAYPAL-AUTH-ALGO
    //
    // Sin verificación, cualquiera puede enviar webhooks falsos y manipular pagos

    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 CRITICAL: Webhook signature verification not implemented in PRODUCTION!');
      console.error('🚨 This is a SECURITY VULNERABILITY - webhooks can be forged!');
    } else {
      console.warn('⚠️ Development mode: Accepting webhook without signature verification');
    }

    return true;
  }
}

module.exports = new PaymentGatewayService();