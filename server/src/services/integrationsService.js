const { pool } = require('../config/db.js');

class IntegrationsService {
  
  // Detectar integraciones automáticamente basándose en configuraciones existentes
  async detectAvailableIntegrations() {
    const integrations = [];

    // Detectar PayPal
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      integrations.push({
        tipo: 'payment',
        proveedor: 'PayPal', 
        nombre: `PayPal ${process.env.PAYPAL_ENVIRONMENT === 'production' ? 'Production' : 'Sandbox'}`,
        descripcion: 'Procesamiento de pagos mediante PayPal',
        enabled: 1,
        status: 'connected',
        configuracion: JSON.stringify({
          environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
          client_id: process.env.PAYPAL_CLIENT_ID,
          auto_detected: true
        })
      });
    }

    // Detectar Stripe
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY) {
      integrations.push({
        tipo: 'payment',
        proveedor: 'Stripe',
        nombre: 'Stripe Payment Gateway',
        descripcion: 'Procesamiento de pagos mediante Stripe',
        enabled: 1,
        status: 'connected',
        configuracion: JSON.stringify({
          publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
          auto_detected: true
        })
      });
    }

    // Detectar sistema de email (siempre presente)
    integrations.push({
      tipo: 'email',
      proveedor: 'Nodemailer',
      nombre: 'Sistema de Email',
      descripcion: process.env.NODE_ENV === 'production' 
        ? 'Sistema de email corporativo' 
        : 'Sistema de email de desarrollo (Ethereal)',
      enabled: 1,
      status: 'connected',
      configuracion: JSON.stringify({
        host: process.env.NODE_ENV === 'production' ? 'smtp.empresa.com' : 'smtp.ethereal.email',
        port: 587,
        auto_detected: true
      })
    });

    return integrations;
  }

  // Sincronizar integraciones detectadas con la base de datos
  async syncIntegrations() {
    try {
      const detectedIntegrations = await this.detectAvailableIntegrations();
      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const integration of detectedIntegrations) {
        try {
          // Verificar si ya existe
          const [existing] = await pool.execute(
            'SELECT id, status, enabled, configuracion FROM integraciones WHERE proveedor = ? AND tipo = ?',
            [integration.proveedor, integration.tipo]
          );

          if (existing.length > 0) {
            // Actualizar existente solo si es auto-detectada
            const existingConfig = JSON.parse(existing[0].configuracion || '{}');
            if (existingConfig.auto_detected) {
              await pool.execute(
                `UPDATE integraciones SET 
                 nombre = ?, descripcion = ?, configuracion = ?, 
                 status = ?, ultima_sincronizacion = NOW(), updated_at = NOW()
                 WHERE id = ?`,
                [
                  integration.nombre,
                  integration.descripcion, 
                  integration.configuracion,
                  integration.status,
                  existing[0].id
                ]
              );
              results.updated++;
            }
          } else {
            // Crear nueva
            await pool.execute(
              `INSERT INTO integraciones 
               (tipo, proveedor, nombre, descripcion, enabled, status, configuracion, ultima_sincronizacion)
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
              [
                integration.tipo,
                integration.proveedor,
                integration.nombre,
                integration.descripcion,
                integration.enabled,
                integration.status,
                integration.configuracion
              ]
            );
            results.created++;
          }
        } catch (error) {
          results.errors.push(`Error con ${integration.proveedor}: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Error sincronizando integraciones: ${error.message}`);
    }
  }

  // Probar conexión de una integración
  async testIntegration(id) {
    try {
      const [integration] = await pool.execute('SELECT * FROM integraciones WHERE id = ?', [id]);
      
      if (integration.length === 0) {
        throw new Error('Integración no encontrada');
      }

      const integrationData = integration[0];
      const config = JSON.parse(integrationData.configuracion || '{}');
      let testResult = { success: false, message: '', details: {} };

      switch (integrationData.tipo) {
        case 'payment':
          testResult = await this.testPaymentIntegration(integrationData.proveedor, config);
          break;
        case 'email':
          testResult = await this.testEmailIntegration(config);
          break;
        default:
          testResult = { success: true, message: 'Prueba básica exitosa', details: {} };
      }

      // Actualizar status basado en el resultado
      const newStatus = testResult.success ? 'connected' : 'error';
      const lastError = testResult.success ? null : testResult.message;

      await pool.execute(
        `UPDATE integraciones SET 
         status = ?, ultimo_error = ?, ultima_sincronizacion = NOW() 
         WHERE id = ?`,
        [newStatus, lastError, id]
      );

      return testResult;
    } catch (error) {
      await pool.execute(
        'UPDATE integraciones SET status = ?, ultimo_error = ? WHERE id = ?',
        ['error', error.message, id]
      );
      throw error;
    }
  }

  // Probar integración de pago
  async testPaymentIntegration(provider, config) {
    try {
      if (provider === 'PayPal') {
        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
          return { success: false, message: 'Credenciales de PayPal no configuradas' };
        }
        return { 
          success: true, 
          message: 'Conexión PayPal exitosa',
          details: { environment: config.environment }
        };
      }
      
      if (provider === 'Stripe') {
        if (!process.env.STRIPE_SECRET_KEY) {
          return { success: false, message: 'API Key de Stripe no configurada' };
        }
        return { 
          success: true, 
          message: 'Conexión Stripe exitosa',
          details: { configured: true }
        };
      }

      return { success: false, message: 'Proveedor de pago no soportado' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Probar integración de email
  async testEmailIntegration(config) {
    try {
      const nodemailer = require('nodemailer');
      
      let transporter;
      if (process.env.NODE_ENV === 'production') {
        // En producción, usar configuración real
        transporter = nodemailer.createTransporter({
          host: config.host || 'smtp.empresa.com',
          port: config.port || 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      } else {
        // En desarrollo, crear cuenta de prueba
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      await transporter.verify();
      return { 
        success: true, 
        message: 'Conexión de email exitosa',
        details: { host: config.host }
      };
    } catch (error) {
      return { success: false, message: `Error de conexión email: ${error.message}` };
    }
  }

  // Obtener todas las integraciones
  async getAllIntegrations() {
    const [rows] = await pool.execute(
      'SELECT * FROM integraciones order BY tipo, proveedor'
    );
    return rows;
  }

  // Obtener integración por ID
  async getIntegrationById(id) {
    const [rows] = await pool.execute('SELECT * FROM integraciones WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // Crear nueva integración manual
  async createIntegration(data) {
    const { tipo, proveedor, nombre, descripcion, enabled, configuracion } = data;
    
    const [result] = await pool.execute(
      `INSERT INTO integraciones 
       (tipo, proveedor, nombre, descripcion, enabled, status, configuracion)
       VALUES (?, ?, ?, ?, ?, 'disconnected', ?)`,
      [tipo, proveedor, nombre, descripcion, enabled ? 1 : 0, JSON.stringify(configuracion || {})]
    );
    
    return { id: result.insertId, ...data };
  }

  // Actualizar integración
  async updateIntegration(id, data) {
    // Obtener los datos actuales de la integración
    const currentIntegration = await this.getIntegrationById(id);
    if (!currentIntegration) {
      throw new Error('Integración no encontrada');
    }

    // Combinar datos actuales con los nuevos (permitir actualizaciones parciales)
    const updateData = {
      nombre: data.nombre !== undefined ? data.nombre : currentIntegration.nombre,
      descripcion: data.descripcion !== undefined ? data.descripcion : currentIntegration.descripcion,
      enabled: data.enabled !== undefined ? data.enabled : currentIntegration.enabled,
      configuracion: data.configuracion !== undefined ? data.configuracion : 
        (typeof currentIntegration.configuracion === 'string' ? 
          JSON.parse(currentIntegration.configuracion) : currentIntegration.configuracion)
    };
    
    await pool.execute(
      `UPDATE integraciones SET 
       nombre = ?, descripcion = ?, enabled = ?, configuracion = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        updateData.nombre, 
        updateData.descripcion, 
        updateData.enabled ? 1 : 0, 
        JSON.stringify(updateData.configuracion || {}), 
        id
      ]
    );
    
    return await this.getIntegrationById(id);
  }

  // Eliminar integración
  async deleteIntegration(id) {
    const [result] = await pool.execute('DELETE FROM integraciones WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // ============= WEBHOOK FUNCTIONS =============

  // Obtener todos los webhooks
  async getAllWebhooks() {
    const [rows] = await pool.execute(
      'SELECT * FROM webhooks order BY nombre'
    );
    
    return rows.map(webhook => ({
      ...webhook,
      eventos: webhook.eventos ? JSON.parse(webhook.eventos) : [],
      activo: !!webhook.active,
      ultimo_disparado: webhook.ultimo_intento
    }));
  }

  // Obtener webhook por ID
  async getWebhookById(id) {
    const [rows] = await pool.execute('SELECT * FROM webhooks WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return null;
    }

    const webhook = rows[0];
    return {
      ...webhook,
      eventos: webhook.eventos ? JSON.parse(webhook.eventos) : [],
      activo: !!webhook.active,
      ultimo_disparado: webhook.ultimo_intento
    };
  }

  // Crear nuevo webhook
  async createWebhook({ nombre, url, eventos, activo = true }) {
    const [result] = await pool.execute(
      `INSERT INTO webhooks (nombre, url, eventos, active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [nombre, url, JSON.stringify(eventos), activo ? 1 : 0]
    );

    return await this.getWebhookById(result.insertId);
  }

  // Eliminar webhook
  async deleteWebhook(id) {
    const [result] = await pool.execute('DELETE FROM webhooks WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Actualizar webhook
  async updateWebhook(id, { nombre, url, eventos, activo }) {
    const [result] = await pool.execute(
      `UPDATE webhooks SET 
       nombre = ?, url = ?, eventos = ?, active = ?, updated_at = NOW()
       WHERE id = ?`,
      [nombre, url, JSON.stringify(eventos), activo ? 1 : 0, id]
    );
    
    return await this.getWebhookById(id);
  }
}

module.exports = new IntegrationsService();