const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_BASE = process.env.API_BASE || 'http://localhost:4001';
const TEST_USER = {
  email: 'test@borderlesstechno.com',
  password: 'TestPassword123!'
};

class PayPalIntegrationTest {
  constructor() {
    this.authToken = null;
    this.testorderId = null;
    this.paypalorderId = null;
  }

  async runTests() {
    console.log('🧪 Iniciando pruebas de integración PayPal + MySQL');
    console.log('🌐 API Base:', API_BASE);
    console.log('═'.repeat(60));
    
    try {
      await this.test1_Authentication();
      await this.test2_Createorder();
      await this.test3_CheckorderStatus();
      await this.test4_SimulateorderCapture();
      await this.test5_VerifyorderCompletion();
      await this.test6_TestWebhookProcessing();
      await this.test7_CheckAdminSummary();
      
      console.log('═'.repeat(60));
      console.log('🎉 Todas las pruebas completadas exitosamente');
      
    } catch (error) {
      console.error('❌ Error en las pruebas:', error.message);
      if (error.response?.data) {
        console.error('📝 Detalles del error:', error.response.data);
      }
      process.exit(1);
    }
  }

  // Test 1: Autenticación
  async test1_Authentication() {
    console.log('📝 Test 1: Autenticación de usuario');
    
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, TEST_USER);
      
      // Check for successful login (could have 'message' or 'success' field)
      if (response.data.message === 'Login exitoso' || response.data.success) {
        console.log('✅ Login exitoso');
        this.authToken = response.headers['set-cookie']?.[0] || null;
        
        if (!this.authToken) {
          throw new Error('No se recibió token de autenticación');
        }
        
        console.log(`📝 Usuario: ${response.data.user?.nombre} (${response.data.user?.rol})`);
      } else {
        throw new Error('Login falló: ' + (response.data.message || 'Error desconocido'));
      }
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        console.log('📝 Usuario no existe o credenciales incorrectas, creando cuenta de prueba...');
        await this.createTestUser();
        await this.test1_Authentication(); // Reintentar login
      } else {
        throw error;
      }
    }
  }

  async createTestUser() {
    const userData = {
      ...TEST_USER,
      nombre: 'Usuario de Prueba PayPal',
      telefono: '+1234567890',
      direccion: 'Calle de Prueba 123, Ciudad Test'
    };
    
    const response = await axios.post(`${API_BASE}/api/auth/register`, userData);
    
    if (response.data.success) {
      console.log('✅ Usuario de prueba creado');
    } else {
      throw new Error('Error creando usuario: ' + response.data.message);
    }
  }

  // Test 2: Crear order con PayPal
  async test2_Createorder() {
    console.log('📝 Test 2: Crear order con orden PayPal');
    
    const orderData = {
      items: [
        {
          descripcion: 'Desarrollo de sitio web responsive',
          precio_unitario: 1500.00,
          cantidad: 1
        },
        {
          descripcion: 'SEO y optimización',
          precio_unitario: 500.00,
          cantidad: 1
        }
      ],
      currency: 'USD',
      descripcion: 'Proyecto web completo para cliente de prueba'
    };
    
    const response = await axios.post(
      `${API_BASE}/api/paypal/create-orders`,
      orderData,
      {
        headers: {
          'Cookie': this.authToken,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      this.testorderId = response.data.data.order_id;
      this.paypalorderId = response.data.data.paypal_order_id;
      
      console.log('✅ order creado exitosamente');
      console.log(`📝 order ID: ${this.testorderId}`);
      console.log(`📝 PayPal order ID: ${this.paypalorderId}`);
      console.log(`📝 Total: $${response.data.data.total} ${response.data.data.currency}`);
      console.log(`📝 URL de aprobación: ${response.data.data.approve_url}`);
    } else {
      throw new Error('Error creando order: ' + response.data.message);
    }
  }

  // Test 3: Verificar estado del order
  async test3_CheckorderStatus() {
    console.log('📝 Test 3: Verificar estado del order');
    
    const response = await axios.get(
      `${API_BASE}/api/paypal/orders/${this.testorderId}/status`,
      {
        headers: {
          'Cookie': this.authToken
        }
      }
    );
    
    if (response.data.success) {
      const order = response.data.data;
      console.log('✅ Estado del order obtenido');
      console.log(`📝 Estado: ${order.estado}`);
      console.log(`📝 PayPal order ID: ${order.paypal_order_id}`);
      console.log(`📝 Total items: ${order.total_items}`);
      console.log(`📝 Método de pago: ${order.payment_method}`);
    } else {
      throw new Error('Error obteniendo estado: ' + response.data.message);
    }
  }

  // Test 4: Simular captura de pago
  async test4_SimulateorderCapture() {
    console.log('📝 Test 4: Simular captura de pago PayPal');
    
    const captureData = {
      paypal_order_id: this.paypalorderId,
      order_id: this.testorderId
    };
    
    try {
      const response = await axios.post(
        `${API_BASE}/api/paypal/capture-orders`,
        captureData,
        {
          headers: {
            'Cookie': this.authToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        console.log('✅ Pago capturado exitosamente');
        console.log(`📝 Capture ID: ${response.data.data.paypal_capture_id}`);
        console.log(`📝 Estado del order: ${response.data.data.status}`);
        console.log(`📝 Email del pagador: ${response.data.data.payer_email || 'N/A'}`);
      } else {
        console.log('⚠️  Captura falló (esperado en sandbox sin pago real)');
        console.log(`📝 Mensaje: ${response.data.message}`);
      }
    } catch (error) {
      console.log('⚠️  Error en captura (esperado sin credenciales PayPal válidas)');
      console.log(`📝 Error: ${error.response?.data?.message || error.message}`);
    }
  }

  // Test 5: Verificar finalización del order
  async test5_VerifyorderCompletion() {
    console.log('📝 Test 5: Verificar estado final del order');
    
    const response = await axios.get(
      `${API_BASE}/api/paypal/orders/${this.testorderId}/status`,
      {
        headers: {
          'Cookie': this.authToken
        }
      }
    );
    
    if (response.data.success) {
      const order = response.data.data;
      console.log('✅ Estado final verificado');
      console.log(`📝 Estado: ${order.estado}`);
      console.log(`📝 Saldo pendiente: $${order.saldo_pendiente}`);
      console.log(`📝 Pagos registrados: ${order.pagos.length}`);
      
      if (order.pagos.length > 0) {
        console.log(`📝 Último pago: ${order.pagos[0].estado} - $${order.pagos[0].monto}`);
      }
    } else {
      throw new Error('Error verificando estado final: ' + response.data.message);
    }
  }

  // Test 6: Simular procesamiento de webhook
  async test6_TestWebhookProcessing() {
    console.log('📝 Test 6: Simular webhook de PayPal');
    
    const mockWebhook = {
      id: 'WH-TEST-' + Date.now(),
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: 'CAPTURE-TEST-' + Date.now(),
        amount: {
          value: '2320.00',
          currency_code: 'USD'
        },
        supplementary_data: {
          related_ids: {
            order_id: this.paypalorderId
          }
        },
        payee: {
          email_address: 'test@borderlesstechno.com'
        }
      }
    };
    
    try {
      const response = await axios.post(
        `${API_BASE}/api/paypal/webhook/paypal`,
        mockWebhook,
        {
          headers: {
            'Content-Type': 'application/json',
            'paypal-transmission-id': 'test-transmission-' + Date.now()
          }
        }
      );
      
      if (response.data.success) {
        console.log('✅ Webhook procesado exitosamente');
        console.log(`📝 Event ID: ${mockWebhook.id}`);
        console.log(`📝 Event Type: ${mockWebhook.event_type}`);
      } else {
        console.log('⚠️  Webhook falló (puede ser esperado)');
        console.log(`📝 Mensaje: ${response.data.message}`);
      }
    } catch (error) {
      console.log('⚠️  Error en webhook (puede ser esperado)');
      console.log(`📝 Error: ${error.response?.data?.message || error.message}`);
    }
  }

  // Test 7: Verificar resumen de admin
  async test7_CheckAdminSummary() {
    console.log('📝 Test 7: Verificar resumen de pagos (admin)');
    
    try {
      const response = await axios.get(
        `${API_BASE}/api/paypal/admin/payment-summary`,
        {
          headers: {
            'Cookie': this.authToken
          }
        }
      );
      
      if (response.data.success) {
        const summary = response.data.data.summary;
        console.log('✅ Resumen de admin obtenido');
        console.log(`📝 Total orders (30 días): ${summary.total_orders}`);
        console.log(`📝 orders confirmados: ${summary.orders_confirmados}`);
        console.log(`📝 orders pendientes: ${summary.orders_pendientes}`);
        console.log(`📝 Ingresos PayPal: $${summary.ingresos_paypal || 0}`);
        console.log(`📝 Clientes únicos: ${summary.clientes_unicos}`);
      } else {
        console.log('⚠️  Resumen de admin no disponible (usuario no admin)');
      }
    } catch (error) {
      console.log('⚠️  Error obteniendo resumen (puede ser esperado si no es admin)');
      console.log(`📝 Error: ${error.response?.data?.message || error.message}`);
    }
  }

  // Test adicional: Listar orders
  async testListorders() {
    console.log('📝 Test adicional: Listar orders del usuario');
    
    const response = await axios.get(
      `${API_BASE}/api/paypal/orders?limit=5`,
      {
        headers: {
          'Cookie': this.authToken
        }
      }
    );
    
    if (response.data.success) {
      const { orders, pagination } = response.data.data;
      console.log('✅ Lista de orders obtenida');
      console.log(`📝 Total encontrados: ${pagination.total}`);
      console.log(`📝 orders en respuesta: ${orders.length}`);
      
      orders.forEach((order, index) => {
        console.log(`📝 ${index + 1}. ${order.numero_order} - ${order.estado} - $${order.total}`);
      });
    } else {
      throw new Error('Error listando orders: ' + response.data.message);
    }
  }
}

// Ejecutar pruebas
if (require.main === module) {
  const tester = new PayPalIntegrationTest();
  tester.runTests()
    .then(() => {
      console.log('🎯 Todas las pruebas de integración completadas');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fallo en las pruebas:', error);
      process.exit(1);
    });
}

module.exports = PayPalIntegrationTest;