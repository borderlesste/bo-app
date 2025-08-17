// server/src/controllers/configController.js
const { configService } = require('../services/configService.js');

exports.getConfig = async (req, res) => {
  try {
    const config = await configService.getConfig();
    // IMPORTANTE: Nunca enviar claves secretas al cliente.
    delete config.PAYPAL_SECRET_KEY; 
    res.json(config);
  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({ message: 'Error al obtener la configuración.' });
  }
};

// Endpoint específico para configuración de pagos (solo claves públicas)
exports.getPaymentConfig = async (req, res) => {
  try {
    const paymentConfig = {
      paypal: {
        usuarioId: process.env.PAYPAL_CLIENT_ID || null,
        environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
        enabled: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
      },
      stripe: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
        enabled: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY)
      },
      availableMethods: []
    };

    // Determinar métodos de pago disponibles
    if (paymentConfig.paypal.enabled) {
      paymentConfig.availableMethods.push('paypal');
    }
    if (paymentConfig.stripe.enabled) {
      paymentConfig.availableMethods.push('stripe');
    }
    
    // Siempre permitir transferencia bancaria
    paymentConfig.availableMethods.push('bank_transfer');

    res.json({
      success: true,
      data: paymentConfig
    });
  } catch (err) {
    console.error('Error fetching payment config:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener la configuración de pagos.' 
    });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    // List of allowed configuration keys
    const allowedKeys = [
      'PAYPAL_CLIENT_ID', 'PAYPAL_SECRET_KEY', 'PAYMENT_METHODS',
      'COMPANY_NAME', 'COMPANY_DESCRIPTION', 'COMPANY_EMAIL', 'COMPANY_PHONE',
      'COMPANY_ADDRESS', 'COMPANY_WEBSITE', 'COMPANY_TIMEZONE', 'COMPANY_LANGUAGE', 'COMPANY_CURRENCY',
      'THEME_MODE', 'THEME_PRIMARY_COLOR', 'THEME_SECONDARY_COLOR'
    ];

    // Filter only allowed keys and ensure they are strings
    const configData = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedKeys.includes(key) && typeof value === 'string') {
        configData[key] = value;
      }
    }

    if (Object.keys(configData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos de configuración válidos.' });
    }

    const result = await configService.updateConfig(configData);
    res.json(result);
  } catch (err) {
    console.error('Error updating config:', err);
    res.status(500).json({ message: 'Error al actualizar la configuración.' });
  }
};
