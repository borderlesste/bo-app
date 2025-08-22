const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class PayPalWebhookSetup {
  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
    this.baseURL = this.environment === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
    this.accessToken = null;
  }

  async setup() {
    console.log('🔧 Configurando webhook PayPal...');
    console.log(`📝 Ambiente: ${this.environment}`);
    console.log(`🌐 Base URL: ${this.baseURL}`);
    
    try {
      // 1. Obtener token de acceso
      await this.getAccessToken();
      
      // 2. Crear webhook
      const webhook = await this.createWebhook();
      
      // 3. Mostrar instrucciones
      this.showInstructions(webhook);
      
    } catch (error) {
      console.error('❌ Error configurando webhook:', error.response?.data || error.message);
      process.exit(1);
    }
  }

  async getAccessToken() {
    console.log('🔑 Obteniendo token de acceso...');
    
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await axios.post(`${this.baseURL}/v1/oauth2/token`, 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      this.accessToken = response.data.access_token;
      console.log('✅ Token obtenido exitosamente');
      
    } catch (error) {
      console.error('❌ Error obteniendo token:', error.response?.data);
      throw error;
    }
  }

  async createWebhook() {
    console.log('🎣 Creando webhook...');
    
    const webhookData = {
      url: `https://borderlesstechno.com/api/paypal/webhook/paypal`,
      event_types: [
        { name: 'PAYMENT.CAPTURE.COMPLETED' },
        { name: 'PAYMENT.CAPTURE.DENIED' },
        { name: 'PAYMENT.CAPTURE.DECLINED' },
        { name: 'CHECKOUT.order.APPROVED' },
        { name: 'CHECKOUT.order.CANCELLED' }
      ]
    };
    
    try {
      const response = await axios.post(`${this.baseURL}/v1/notifications/webhooks`,
        webhookData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Webhook creado exitosamente');
      return response.data;
      
    } catch (error) {
      if (error.response?.status === 400 && 
          error.response?.data?.name === 'WEBHOOK_URL_ALREADY_EXISTS') {
        console.log('⚠️  Webhook ya existe, obteniendo información...');
        return await this.getExistingWebhook();
      }
      console.error('❌ Error creando webhook:', error.response?.data);
      throw error;
    }
  }

  async getExistingWebhook() {
    try {
      const response = await axios.get(`${this.baseURL}/v1/notifications/webhooks`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const existingWebhook = response.data.webhooks.find(wh => 
        wh.url.includes('borderlesstechno.com')
      );
      
      if (existingWebhook) {
        console.log('✅ Webhook existente encontrado');
        return existingWebhook;
      } else {
        throw new Error('No se encontró webhook existente');
      }
      
    } catch (error) {
      console.error('❌ Error obteniendo webhooks existentes:', error.response?.data);
      throw error;
    }
  }

  showInstructions(webhook) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 CONFIGURACIÓN COMPLETADA');
    console.log('='.repeat(60));
    
    console.log('\n📋 INFORMACIÓN DEL WEBHOOK:');
    console.log(`🆔 Webhook ID: ${webhook.id}`);
    console.log(`🔗 URL: ${webhook.url}`);
    console.log(`📅 Creado: ${webhook.create_time}`);
    
    console.log('\n🔧 SIGUIENTES PASOS:');
    console.log('1. Agrega esta línea a tu archivo .env de producción:');
    console.log(`   PAYPAL_WEBHOOK_ID=${webhook.id}`);
    
    console.log('\n2. Verifica que tu servidor esté accesible en:');
    console.log(`   ${webhook.url}`);
    
    console.log('\n3. Eventos configurados:');
    webhook.event_types.forEach(event => {
      console.log(`   ✅ ${event.name}`);
    });
    
    console.log('\n🧪 PARA PROBAR EL WEBHOOK:');
    console.log('1. Haz una transacción de prueba');
    console.log('2. Verifica los logs del servidor');
    console.log('3. Revisa la tabla webhooks_paypal en la base de datos');
    
    console.log('\n✅ ¡Webhook configurado exitosamente!');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const setup = new PayPalWebhookSetup();
  setup.setup();
}

module.exports = PayPalWebhookSetup;