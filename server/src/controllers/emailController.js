const emailService = require('../services/emailService');
const { pool } = require('../config/db');

class EmailController {
  // Enviar recordatorio de factura pendiente
  static async sendInvoiceReminder(req, res) {
    try {
      const { invoice_id } = req.params;
      
      // Obtener datos de la factura con información del cliente
      const [invoiceRows] = await pool.execute(`
        SELECT 
          f.id,
          f.numero_factura,
          f.total,
          f.fecha_emision,
          f.fecha_vencimiento,
          f.estado,
          u.email as client_email,
          u.nombre as client_name
        FROM facturas f
        JOIN usuarios u ON f.usuario_id = u.id
        WHERE f.id = ? AND f.estado != 'pagada'
      `, [invoice_id]);

      if (invoiceRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada o ya está pagada'
        });
      }

      const invoice = invoiceRows[0];
      
      // Enviar recordatorio
      const result = await emailService.sendInvoiceReminder({
        id: invoice.id,
        numero_factura: invoice.numero_factura,
        total: invoice.total,
        fecha_emision: invoice.fecha_emision,
        fecha_vencimiento: invoice.fecha_vencimiento,
        client_email: invoice.client_email,
        clientName: invoice.client_name
      });

      if (result.success) {
        res.json({
          success: true,
          message: 'Recordatorio de factura enviado exitosamente',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error enviando recordatorio de factura',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error sending invoice reminder:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Enviar recordatorios masivos de facturas vencidas
  static async sendOverdueInvoiceReminders(req, res) {
    try {
      // Obtener todas las facturas vencidas
      const [invoiceRows] = await pool.execute(`
        SELECT 
          f.id,
          f.numero_factura,
          f.total,
          f.fecha_emision,
          f.fecha_vencimiento,
          f.estado,
          u.email as client_email,
          u.nombre as client_name,
          DATEDIFF(NOW(), f.fecha_vencimiento) as days_overdue
        FROM facturas f
        JOIN usuarios u ON f.usuario_id = u.id
        WHERE f.estado IN ('pendiente', 'enviada') 
          AND f.fecha_vencimiento < NOW()
          AND DATEDIFF(NOW(), f.fecha_vencimiento) <= 30
      `);

      if (invoiceRows.length === 0) {
        return res.json({
          success: true,
          message: 'No hay facturas vencidas para recordar',
          count: 0
        });
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      // Enviar recordatorios de manera secuencial para evitar límites de email
      for (const invoice of invoiceRows) {
        try {
          const result = await emailService.sendInvoiceReminder({
            id: invoice.id,
            numero_factura: invoice.numero_factura,
            total: invoice.total,
            fecha_emision: invoice.fecha_emision,
            fecha_vencimiento: invoice.fecha_vencimiento,
            client_email: invoice.client_email,
            clientName: invoice.client_name
          });

          if (result.success) {
            successCount++;
            results.push({
              invoice_id: invoice.id,
              numero_factura: invoice.numero_factura,
              client_email: invoice.client_email,
              status: 'sent',
              messageId: result.messageId
            });
          } else {
            errorCount++;
            results.push({
              invoice_id: invoice.id,
              numero_factura: invoice.numero_factura,
              client_email: invoice.client_email,
              status: 'error',
              error: result.error
            });
          }

          // Pausa pequeña entre emails para evitar límites
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          errorCount++;
          results.push({
            invoice_id: invoice.id,
            numero_factura: invoice.numero_factura,
            client_email: invoice.client_email,
            status: 'error',
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `Recordatorios procesados: ${successCount} enviados, ${errorCount} errores`,
        summary: {
          total: invoiceRows.length,
          sent: successCount,
          errors: errorCount
        },
        details: results
      });

    } catch (error) {
      console.error('Error sending bulk invoice reminders:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Test de envío de email con template
  static async testEmailTemplate(req, res) {
    try {
      const { template, test_data } = req.body;

      if (!template || !test_data) {
        return res.status(400).json({
          success: false,
          message: 'Template y test_data son requeridos'
        });
      }

      let result;

      switch (template) {
        case 'payment_received':
          result = await emailService.sendPaymentReceived({
            client_email: 'test@borderlesstechno.com',
            client_name: 'Cliente de Prueba',
            amount: 1000,
            currency: 'MXN',
            metodo_pago: 'credit_card',
            payment_number: 'TEST-001',
            fecha_pago: new Date(),
            referencia: 'REF-TEST-123',
            ...test_data
          });
          break;

        case 'invoice_reminder':
          result = await emailService.sendInvoiceReminder({
            id: 1,
            numero_factura: 'INV-TEST-001',
            total: 2500,
            fecha_emision: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            fecha_vencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            client_email: 'test@borderlesstechno.com',
            clientName: 'Cliente de Prueba',
            ...test_data
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Template no soportado. Usa: payment_received, invoice_reminder'
          });
      }

      if (result.success) {
        res.json({
          success: true,
          message: 'Email de prueba enviado exitosamente',
          messageId: result.messageId,
          template: template
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error enviando email de prueba',
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error testing email template:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener configuración de email
  static async getEmailConfig(req, res) {
    try {
      const testResult = await emailService.testConnection();
      
      res.json({
        success: true,
        config: {
          service: 'Ethereal (Development)',
          status: testResult.success ? 'connected' : 'error',
          templates: {
            payment_received: '/templates/email/paymentReceived.html',
            invoice_reminder: '/templates/email/invoiceReminder.html'
          }
        },
        test_connection: testResult
      });
    } catch (error) {
      console.error('Error getting email config:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo configuración de email'
      });
    }
  }
}

module.exports = EmailController;