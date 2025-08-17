const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    try {
      // Para desarrollo: crear cuenta de prueba en Ethereal
      let testAccount = await nodemailer.createTestAccount();

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      console.log('📧 Servicio de email configurado para desarrollo');
      console.log('🔑 Usuario de prueba:', testAccount.user);
    } catch (error) {
      console.error('❌ Error configurando email de desarrollo:', error);
      // Fallback: configurar transporter básico
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false
      });
    }
  }

  async sendContactNotification(contactData) {
    if (!this.transporter) await this.initTransporter();
    
    const { nombre, email, mensaje } = contactData;
    
    const mailOptions = {
      from: '"Borderless Techno" <noreply@borderlesstechno.com>',
      to: 'admin@borderlesstechno.com',
      subject: `Nuevo mensaje de contacto de ${nombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Nuevo Mensaje de Contacto</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #374151; margin-top: 0;">Mensaje:</h3>
            <p style="line-height: 1.6; color: #4b5563;">${mensaje}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #1e40af; border-radius: 8px;">
            <p style="color: #ffffff; margin: 0;">
              Responder a: 
              <a href="mailto:${email}" style="color: #fbbf24; text-decoration: none;">${email}</a>
            </p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de contacto enviado:', info.messageId);
      
      // Para desarrollo: mostrar preview URL de Ethereal
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando email de contacto:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(clientData) {
    if (!this.transporter) await this.initTransporter();
    
    const { nombre, email } = clientData;
    
    const mailOptions = {
      from: '"Borderless Techno" <welcome@borderlesstechno.com>',
      to: email,
      subject: `¡Bienvenido a Borderless Techno, ${nombre}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">¡Bienvenido a Borderless Techno!</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Tu socio tecnológico de confianza</p>
          </div>
          
          <div style="padding: 40px 20px; background-color: #ffffff;">
            <h2 style="color: #374151;">Hola ${nombre},</h2>
            
            <p style="line-height: 1.6; color: #4b5563;">
              Gracias por unirte a nuestra comunidad. En Borderless Techno estamos comprometidos a 
              brindarte soluciones tecnológicas innovadoras que impulsen tu negocio al siguiente nivel.
            </p>
            
            <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">¿Qué sigue?</h3>
              <ul style="color: #4b5563; padding-left: 20px;">
                <li>Explora nuestros servicios de desarrollo web y móvil</li>
                <li>Solicita una cotización personalizada</li>
                <li>Mantente al día con nuestras últimas novedades</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="mailto:info@borderlesstechno.com" 
                 style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Contactar Equipo
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              © 2025 Borderless Techno Company. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de bienvenida enviado:', info.messageId);
      
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando email de bienvenida:', error);
      return { success: false, error: error.message };
    }
  }

  async sendQuoteNotification(quoteData) {
    if (!this.transporter) await this.initTransporter();
    
    const { nombre, email, tipo_servicio, descripcion } = quoteData;
    
    const adminMailOptions = {
      from: '"Borderless Techno" <quotes@borderlesstechno.com>',
      to: 'admin@borderlesstechno.com',
      subject: `Nueva Cotización: ${tipo_servicio}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Nueva Solicitud de Cotización</h2>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #059669;">
            <p><strong>Cliente:</strong> ${nombre}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Servicio:</strong> ${tipo_servicio}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          
          <div style="margin: 20px 0; padding: 20px; background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 8px;">
            <h3 style="color: #374151; margin-top: 0;">Descripción del Proyecto:</h3>
            <p style="line-height: 1.6; color: #4b5563;">${descripcion}</p>
          </div>
        </div>
      `
    };

    const clientMailOptions = {
      from: '"Borderless Techno" <quotes@borderlesstechno.com>',
      to: email,
      subject: 'Cotización Recibida - Te Contactaremos Pronto',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 40px 20px; background-color: #059669; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Cotización Recibida</h1>
          </div>
          
          <div style="padding: 40px 20px; background-color: #ffffff;">
            <h2 style="color: #374151;">Hola ${nombre},</h2>
            
            <p style="line-height: 1.6; color: #4b5563;">
              Hemos recibido tu solicitud de cotización para <strong>${tipo_servicio}</strong>. 
              Nuestro equipo está revisando los detalles y te contactaremos en las próximas 24 horas 
              con una propuesta personalizada.
            </p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #059669;">
              <h3 style="color: #059669; margin-top: 0;">Siguiente Paso</h3>
              <p style="color: #374151; margin-bottom: 0;">
                Mientras tanto, puedes explorar nuestro portafolio y casos de éxito en nuestro sitio web.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Si tienes alguna pregunta urgente, no dudes en contactarnos directamente.
            </p>
          </div>
        </div>
      `
    };

    try {
      // Enviar ambos emails
      const [adminResult, clientResult] = await Promise.all([
        this.transporter.sendMail(adminMailOptions),
        this.transporter.sendMail(clientMailOptions)
      ]);

      console.log('✅ Emails de cotización enviados');
      
      if (nodemailer.getTestMessageUrl(adminResult)) {
        console.log('🔗 Admin Preview:', nodemailer.getTestMessageUrl(adminResult));
      }
      if (nodemailer.getTestMessageUrl(clientResult)) {
        console.log('🔗 Client Preview:', nodemailer.getTestMessageUrl(clientResult));
      }
      
      return { 
        success: true, 
        adminMessageId: adminResult.messageId,
        clientMessageId: clientResult.messageId
      };
    } catch (error) {
      console.error('❌ Error enviando emails de cotización:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPaymentConfirmation(paymentData) {
    if (!this.transporter) await this.initTransporter();
    
    const mailOptions = {
      from: '"Borderless Techno" <payments@borderlesstechno.com>',
      to: paymentData.client_email,
      subject: 'Confirmación de Pago Recibido',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">¡Pago Confirmado!</h2>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p>Hola,</p>
            <p>Hemos recibido tu pago correctamente. Aquí están los detalles:</p>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p><strong>Monto:</strong> $${paymentData.monto}</p>
              <p><strong>Método:</strong> ${paymentData.metodo_pago || 'No especificado'}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
              <p><strong>Estado:</strong> <span style="color: #10b981; font-weight: bold;">Pagado</span></p>
            </div>
            <p>Procesaremos tu pedido y te mantendremos informado sobre el progreso.</p>
            <p>Gracias por confiar en nosotros.</p>
            <p>Saludos,<br><strong>El equipo de Borderless Techno</strong></p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Confirmación de pago enviada:', info.messageId);
      
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando confirmación de pago:', error);
      return { success: false, error: error.message };
    }
  }

  async sendInvoiceNotification(invoiceData) {
    if (!this.transporter) await this.initTransporter();
    
    const { client_email, numero_factura, total, fecha_vencimiento, concepto } = invoiceData;
    
    const mailOptions = {
      from: '"Borderless Techno" <invoices@borderlesstechno.com>',
      to: client_email,
      subject: `Nueva Factura ${numero_factura} - Borderless Techno`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Nueva Factura</h2>
            <p style="margin: 10px 0 0; opacity: 0.9;">Borderless Techno</p>
          </div>
          
          <div style="padding: 30px; background-color: #ffffff;">
            <p>Estimado cliente,</p>
            <p>Se ha generado una nueva factura para su cuenta. A continuación los detalles:</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <p><strong>Número de Factura:</strong> ${numero_factura}</p>
              <p><strong>Concepto:</strong> ${concepto}</p>
              <p><strong>Total:</strong> <span style="font-size: 18px; color: #2563eb; font-weight: bold;">$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></p>
              <p><strong>Fecha de Vencimiento:</strong> ${new Date(fecha_vencimiento).toLocaleDateString('es-ES')}</p>
            </div>
            
            <p>Para realizar el pago o consultar más detalles, puede acceder a su portal de cliente.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="background-color: #fef3c7; color: #92400e; padding: 15px; border-radius: 8px; margin: 20px 0;">
                ⚠️ <strong>Importante:</strong> Esta factura debe pagarse antes de la fecha de vencimiento para evitar cargos adicionales.
              </p>
            </div>
            
            <p>Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.</p>
            <p>Saludos cordiales,<br><strong>El equipo de Borderless Techno</strong></p>
          </div>
          
          <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              © 2025 Borderless Techno Company. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Notificación de factura enviada:', info.messageId);
      
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando notificación de factura:', error);
      return { success: false, error: error.message };
    }
  }

  async sendOverdueInvoiceNotification(invoiceData) {
    if (!this.transporter) await this.initTransporter();
    
    const { client_email, numero_factura, total, fecha_vencimiento } = invoiceData;
    
    const mailOptions = {
      from: '"Borderless Techno" <invoices@borderlesstechno.com>',
      to: client_email,
      subject: `🚨 URGENTE: Factura Vencida ${numero_factura}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🚨 Factura Vencida</h2>
            <p style="margin: 10px 0 0; opacity: 0.9;">Acción Requerida</p>
          </div>
          
          <div style="padding: 30px; background-color: #ffffff;">
            <p>Estimado cliente,</p>
            <p>Le informamos que la siguiente factura ha vencido y requiere atención inmediata:</p>
            
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p><strong>Número de Factura:</strong> <span style="color: #dc2626;">${numero_factura}</span></p>
              <p><strong>Total Adeudado:</strong> <span style="font-size: 20px; color: #dc2626; font-weight: bold;">$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></p>
              <p><strong>Fecha de Vencimiento:</strong> <span style="color: #dc2626;">${new Date(fecha_vencimiento).toLocaleDateString('es-ES')}</span></p>
              <p><strong>Días de Retraso:</strong> <span style="color: #dc2626; font-weight: bold;">${Math.floor((new Date() - new Date(fecha_vencimiento)) / (1000 * 60 * 60 * 24))} días</span></p>
            </div>
            
            <div style="background-color: #fbbf24; color: #92400e; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-weight: bold;">⚠️ IMPORTANTE: Proceda con el pago lo antes posible para evitar la suspensión de servicios.</p>
            </div>
            
            <p><strong>Para realizar el pago:</strong></p>
            <ul style="color: #4b5563;">
              <li>Acceda a su portal de cliente</li>
              <li>Contacte a nuestro equipo de cuentas por cobrar</li>
              <li>Realice una transferencia bancaria directa</li>
            </ul>
            
            <p>Si ya realizó el pago, por favor ignore este mensaje y envíenos el comprobante.</p>
            <p>Para cualquier consulta, comuníquese con nosotros inmediatamente.</p>
            
            <p>Departamento de Cuentas por Cobrar,<br><strong>Borderless Techno</strong></p>
          </div>
          
          <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              Este es un mensaje automático. Por favor, no responda a este email.
            </p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Notificación de factura vencida enviada:', info.messageId);
      
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando notificación de factura vencida:', error);
      return { success: false, error: error.message };
    }
  }

  // Método para probar la conexión del email
  async testConnection() {
    try {
      if (!this.transporter) await this.initTransporter();
      await this.transporter.verify();
      return { success: true, message: 'Conexión de email establecida correctamente' };
    } catch (error) {
      console.error('❌ Error en conexión de email:', error);
      return { success: false, message: 'Error en conexión de email', error };
    }
  }
}

module.exports = new EmailService();