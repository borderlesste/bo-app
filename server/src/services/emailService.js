const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

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

  async sendPaymentReceived(paymentData) {
    if (!this.transporter) await this.initTransporter();
    
    try {
      // Leer el template HTML
      const templatePath = path.join(__dirname, '../templates/email/paymentReceived.html');
      let htmlTemplate = await fs.readFile(templatePath, 'utf8');
      
      // Reemplazar variables del template
      const variables = {
        clientName: paymentData.clientName || paymentData.client_name || 'Cliente',
        paymentNumber: paymentData.payment_number || paymentData.id || 'N/A',
        amount: paymentData.amount || paymentData.monto || '0.00',
        currency: paymentData.currency || 'MXN',
        paymentMethod: this.formatPaymentMethod(paymentData.metodo_pago || paymentData.payment_method),
        paymentDate: new Date(paymentData.fecha_pago || paymentData.created_at || new Date()).toLocaleDateString('es-ES'),
        reference: paymentData.referencia || paymentData.reference || '',
        invoiceGenerated: paymentData.invoiceGenerated || false,
        invoiceNumber: paymentData.invoiceNumber || '',
        invoiceUrl: paymentData.invoiceUrl || '',
        clientAreaUrl: process.env.CLIENT_AREA_URL || 'https://bo-app-n4uj.vercel.app/client',
        loginUrl: process.env.LOGIN_URL || 'https://bo-app-n4uj.vercel.app/login',
        clientEmail: paymentData.client_email || paymentData.email || '',
        websiteUrl: process.env.WEBSITE_URL || 'https://bo-app-n4uj.vercel.app',
        supportUrl: process.env.SUPPORT_URL || 'https://bo-app-n4uj.vercel.app/contact'
      };
      
      // Reemplazar todas las variables en el template
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlTemplate = htmlTemplate.replace(regex, value);
      }
      
      // Manejar condicionales Handlebars básicos
      if (variables.reference) {
        htmlTemplate = htmlTemplate.replace(/\{\{#if reference\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      } else {
        htmlTemplate = htmlTemplate.replace(/\{\{#if reference\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      }
      
      if (variables.invoiceGenerated) {
        htmlTemplate = htmlTemplate.replace(/\{\{#if invoiceGenerated\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      } else {
        htmlTemplate = htmlTemplate.replace(/\{\{#if invoiceGenerated\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      }
      
      if (variables.invoiceUrl) {
        htmlTemplate = htmlTemplate.replace(/\{\{#if invoiceUrl\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      } else {
        htmlTemplate = htmlTemplate.replace(/\{\{#if invoiceUrl\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      }
    
      const mailOptions = {
        from: '"Borderless Techno" <payments@borderlesstechno.com>',
        to: paymentData.client_email || paymentData.email,
        subject: '✅ Pago Confirmado - Borderless Techno',
        html: htmlTemplate
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de pago recibido enviado:', info.messageId);
      
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando email de pago recibido:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPaymentConfirmation(paymentData) {
    // Mantener compatibilidad con código existente
    return await this.sendPaymentReceived(paymentData);
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

  async sendInvoiceReminder(invoiceData) {
    if (!this.transporter) await this.initTransporter();
    
    try {
      // Leer el template HTML
      const templatePath = path.join(__dirname, '../templates/email/invoiceReminder.html');
      let htmlTemplate = await fs.readFile(templatePath, 'utf8');
      
      const dueDate = new Date(invoiceData.fecha_vencimiento);
      const today = new Date();
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      const isOverdue = daysOverdue > 0;
      
      // Reemplazar variables del template
      const variables = {
        clientName: invoiceData.clientName || invoiceData.client_name || 'Cliente',
        invoiceNumber: invoiceData.numero_factura || invoiceData.invoice_number || 'N/A',
        issueDate: new Date(invoiceData.fecha_emision || invoiceData.created_at || new Date()).toLocaleDateString('es-ES'),
        dueDate: dueDate.toLocaleDateString('es-ES'),
        amount: invoiceData.total || invoiceData.amount || '0.00',
        currency: invoiceData.currency || 'MXN',
        daysOverdue: isOverdue ? daysOverdue : '',
        isOverdue: isOverdue,
        paymentUrl: `${process.env.CLIENT_AREA_URL || 'https://bo-app-n4uj.vercel.app/client'}/invoices/${invoiceData.id}`,
        invoiceUrl: `${process.env.CLIENT_AREA_URL || 'https://bo-app-n4uj.vercel.app/client'}/invoices/${invoiceData.id}`,
        clientAreaUrl: process.env.CLIENT_AREA_URL || 'https://bo-app-n4uj.vercel.app/client',
        loginUrl: process.env.LOGIN_URL || 'https://bo-app-n4uj.vercel.app/login',
        clientEmail: invoiceData.client_email || invoiceData.email || '',
        websiteUrl: process.env.WEBSITE_URL || 'https://bo-app-n4uj.vercel.app',
        supportUrl: process.env.SUPPORT_URL || 'https://bo-app-n4uj.vercel.app/contact'
      };
      
      // Reemplazar todas las variables en el template
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlTemplate = htmlTemplate.replace(regex, value);
      }
      
      // Manejar condicionales Handlebars
      if (variables.daysOverdue) {
        htmlTemplate = htmlTemplate.replace(/\{\{#if daysOverdue\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      } else {
        htmlTemplate = htmlTemplate.replace(/\{\{#if daysOverdue\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      }
      
      if (variables.isOverdue) {
        htmlTemplate = htmlTemplate.replace(/\{\{#if isOverdue\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      } else {
        htmlTemplate = htmlTemplate.replace(/\{\{#if isOverdue\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      }
    
      const subject = isOverdue ? 
        `🚨 URGENTE: Factura Vencida ${variables.invoiceNumber}` : 
        `⏰ Recordatorio: Factura ${variables.invoiceNumber} Pendiente`;
      
      const mailOptions = {
        from: '"Borderless Techno" <invoices@borderlesstechno.com>',
        to: invoiceData.client_email || invoiceData.email,
        subject: subject,
        html: htmlTemplate
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Recordatorio de factura enviado:', info.messageId);
      
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando recordatorio de factura:', error);
      return { success: false, error: error.message };
    }
  }

  async sendOverdueInvoiceNotification(invoiceData) {
    // Mantener compatibilidad con código existente
    return await this.sendInvoiceReminder(invoiceData);
  }

  // Método helper para formatear métodos de pago
  formatPaymentMethod(method) {
    const methods = {
      'credit_card': 'Tarjeta de Crédito',
      'debit_card': 'Tarjeta de Débito', 
      'paypal': 'PayPal',
      'bank_transfer': 'Transferencia Bancaria',
      'cash': 'Efectivo',
      'check': 'Cheque',
      'other': 'Otro'
    };
    return methods[method] || method || 'No especificado';
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