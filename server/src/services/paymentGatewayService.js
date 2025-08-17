require('dotenv').config();

// Para desarrollo: solo cargar Stripe si hay API key
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Solo cargar PayPal si hay configuración
let paypalClient = null;
let OrdersController = null;
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  try {
    const checkoutSDK = require('@paypal/checkout-server-sdk');
    
    // Create PayPal client
    const environment = process.env.PAYPAL_ENVIRONMENT === 'production' 
      ? new checkoutSDK.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
      : new checkoutSDK.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
    
    paypalClient = new checkoutSDK.core.PayPalHttpClient(environment);
    OrdersController = checkoutSDK.orders;
  } catch (error) {
    console.error('Error initializing PayPal SDK:', error);
  }
}
const emailService = require('./emailService');

class PaymentGatewayService {
  constructor() {
    this.stripe = stripe;
    this.paypalClient = paypalClient;
    this.ordersController = OrdersController;
    
    console.log('💳 Payment Gateway Service initialized for development');
    console.log('📝 Stripe:', this.stripe ? 'Configured' : 'Not configured');
    console.log('📝 PayPal:', this.paypalClient ? 'Configured' : 'Not configured');
    console.log('📝 PayPal OrdersController:', this.ordersController ? 'Available' : 'Not available');
    
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

  // Crear orden de PayPal
  async createPayPalOrder(amount, currency = 'USD', orderData = {}) {
    // For development, always simulate PayPal orders if real credentials fail
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Simulating PayPal order creation');
      return {
        success: true,
        data: {
          order_id: 'DEMO_ORDER_' + Date.now(),
          approve_url: 'https://www.sandbox.paypal.com/checkoutnow?token=DEMO_TOKEN_' + Date.now(),
          amount,
          currency,
          simulated: true
        }
      };
    }

    if (!this.paypalClient) {
      return {
        success: false,
        message: 'PayPal no está configurado para desarrollo'
      };
    }

    try {
      const request = {
        body: {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toString()
            },
            description: `Servicio de Borderless Techno - ${orderData.service || 'Desarrollo de Software'}`,
            reference_id: orderData.reference_id || 'DEFAULT'
          }],
          application_context: {
            return_url: process.env.PAYPAL_RETURN_URL || 'http://localhost:4001/payment/success',
            cancel_url: process.env.PAYPAL_CANCEL_URL || 'http://localhost:4001/payment/cancel',
            brand_name: 'Borderless Techno Company',
            locale: 'es-MX',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW'
          }
        }
      };

      if (!this.ordersController) {
        throw new Error('PayPal OrdersController not available');
      }
      
      console.log('🔄 Creating PayPal order with request:', JSON.stringify(request, null, 2));
      
      const orderRequest = new this.ordersController.OrdersCreateRequest();
      orderRequest.requestBody(request.body);
      const response = await this.paypalClient.execute(orderRequest);
      
      console.log('📦 PayPal response received:', JSON.stringify(response, null, 2));
      
      if (response.body && response.body.id) {
        return {
          success: true,
          data: {
            order_id: response.body.id,
            approve_url: response.body.links.find(link => link.rel === 'approve')?.href,
            amount,
            currency
          }
        };
      } else {
        throw new Error('No se pudo crear la orden de PayPal - respuesta inválida');
      }
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode,
        details: error.details
      });
      
      // If it's an authentication error, provide helpful message
      if (error.message?.includes('authentication') || error.statusCode === 401) {
        return {
          success: false,
          message: 'Error de autenticación con PayPal. Verifique las credenciales de sandbox.',
          error: error.message
        };
      }
      
      return {
        success: false,
        message: 'Error al crear la orden de PayPal',
        error: error.message
      };
    }
  }

  // Capturar pago de PayPal
  async capturePayPalPayment(orderId) {
    // For development, simulate PayPal capture if order ID is demo
    if (process.env.NODE_ENV === 'development' && orderId.startsWith('DEMO_ORDER_')) {
      console.log('🔧 Development mode: Simulating PayPal payment capture');
      return {
        success: true,
        data: {
          id: orderId,
          status: 'COMPLETED',
          amount: '100.00', // Default demo amount
          currency: 'USD',
          capture_id: 'DEMO_CAPTURE_' + Date.now(),
          payer_email: 'demo@example.com',
          created: new Date().toISOString(),
          simulated: true
        }
      };
    }

    try {
      const request = {
        id: orderId
      };

      if (!this.ordersController) {
        throw new Error('PayPal OrdersController not available');
      }
      
      const ordersController = new this.ordersController(this.paypalClient);
      const response = await ordersController.ordersCapture(request);
      
      if (response.body && response.body.status === 'COMPLETED') {
        const capture = response.body.purchase_units[0].payments.captures[0];
        
        return {
          success: true,
          data: {
            id: response.body.id,
            status: response.body.status,
            amount: capture.amount.value,
            currency: capture.amount.currency_code,
            capture_id: capture.id,
            payer_email: response.body.payer?.email_address,
            created: capture.create_time
          }
        };
      } else {
        throw new Error('El pago no se completó correctamente');
      }
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      return {
        success: false,
        message: 'Error al capturar el pago de PayPal',
        error: error.message
      };
    }
  }

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
        // Para PayPal, necesitaríamos el capture_id en lugar del order_id
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
        const response = await this.paypalClient.orders.ordersGet({ id: paymentId });
        const orderData = response.body;
        
        paymentInfo = {
          id: orderData.id,
          status: orderData.status,
          amount: orderData.purchase_units[0].amount.value,
          currency: orderData.purchase_units[0].amount.currency_code,
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
}

module.exports = new PaymentGatewayService();