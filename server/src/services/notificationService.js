const { pool } = require('../config/db.js');

class NotificationService {
  constructor() {
    console.log('=� Notification Service initialized');
  }

  // Crear notificación general
  async createNotification(usuarioId, tipo, titulo, mensaje, leida = false) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, leida, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [usuarioId, tipo, titulo, mensaje, leida]
      );

      console.log(`✅ Notificación creada: ${tipo} para usuario ${usuarioId}`);
      return { success: true, notificationId: result.insertId };
    } catch (error) {
      console.error('❌ Error creando notificación:', error);
      return { success: false, error: error.message };
    }
  }

  // Notificación para admin (usuario_id = 2)
  async createAdminNotification(tipo, titulo, mensaje) {
    return await this.createNotification(2, tipo, titulo, mensaje, false);
  }

  // Notificación para usuario específico
  async createUserNotification(usuarioId, tipo, titulo, mensaje) {
    return await this.createNotification(usuarioId, tipo, titulo, mensaje, false);
  }

  // Notificación para nueva cotización
  async notifyNewQuote(quoteData) {
    const titulo = 'Nueva Cotización';
    const mensaje = `Nueva cotización de ${quoteData.nombre} para ${quoteData.tipo_servicio}`;
    return await this.createAdminNotification('nueva_cotizacion', titulo, mensaje);
  }

  // Notificación para nuevo pago
  async notifyNewPayment(paymentData, userName) {
    const titulo = 'Nuevo Pago';
    const mensaje = `Nuevo pago recibido de ${userName} por $${paymentData.monto.toLocaleString('es-MX')}`;
    return await this.createAdminNotification('nuevo_pago', titulo, mensaje);
  }

  // Notificación para nuevo usuario registrado
  async notifyNewUser(userData) {
    const titulo = 'Nuevo Usuario';
    const mensaje = `Nuevo usuario registrado: ${userData.nombre} (${userData.email})`;
    return await this.createAdminNotification('nuevo_usuario', titulo, mensaje);
  }

  // Notificación para nuevo cliente registrado
  async notifyNewClient(userData) {
    const titulo = 'Nuevo Cliente';
    const mensaje = `Nuevo cliente registrado: ${userData.nombre} (${userData.email})`;
    return await this.createAdminNotification('nuevo_cliente', titulo, mensaje);
  }

  // Notificación para nuevo contacto
  async notifyNewContact(contactData) {
    const titulo = 'Nuevo Contacto';
    const mensaje = `Nuevo mensaje de contacto de ${contactData.nombre}`;
    return await this.createAdminNotification('nuevo_contacto', titulo, mensaje);
  }

  // Notificación para cambio de estado de pedido
  async notifyOrderStatusChange(pedidoData, newStatus, usuarioId) {
    const mensajeAdmin = `pedido #${pedidoData.id} cambió a estado: ${newStatus}`;
    const mensajeUsuario = `Tu pedido "${pedidoData.servicio}" ha cambiado a estado: ${newStatus}`;

    // Notificar al admin
    await this.createAdminNotification('cambio_estado_pedido', 'Cambio de Estado', mensajeAdmin);

    // Notificar al usuario
    if (usuarioId && usuarioId !== 1) {
      await this.createUserNotification(usuarioId, 'estado_pedido', 'Estado de pedido', mensajeUsuario);
    }

    return { success: true };
  }

  // Notificación para pago vencido
  async notifyOverduePayment(paymentData, userName) {
    const titulo = 'Pago Vencido';
    const mensaje = `Pago vencido de ${userName} por $${paymentData.monto.toLocaleString('es-MX')}`;
    return await this.createAdminNotification('pago_vencido', titulo, mensaje);
  }

  // Notificación para proyecto completado
  async notifyProjectCompleted(projectData, usuarioId) {
    const mensajeAdmin = `Proyecto "${projectData.servicio}" marcado como completado`;
    const mensajeUsuario = `Tu proyecto "${projectData.servicio}" ha sido completado`;

    // Notificar al admin
    await this.createAdminNotification('proyecto_completado', 'Proyecto Completado', mensajeAdmin);
    
    // Notificar al cliente
    if (usuarioId && usuarioId !== 1) {
      await this.createClientNotification(usuarioId, 'proyecto_completado', 'Proyecto Completado', mensajeUsuario);
    }

    return { success: true };
  }

  // Notificación para cotización convertida a pedido
  async notifyQuoteConverted(quoteData, pedido_id) {
    const titulo = 'Cotización Convertida';
    const mensaje = `Cotización de ${quoteData.nombre} convertida a pedido #${pedido_id}`;
    return await this.createAdminNotification('cotizacion_convertida', titulo, mensaje);
  }

  // Notificación para nueva factura
  async notifyNewInvoice(invoiceData, usuario_nombre) {
    const titulo = 'Nueva Factura';
    const mensaje = `Nueva factura ${invoiceData.numero_factura} generada para ${usuario_nombre} por $${invoiceData.total.toLocaleString('es-MX')}`;
    return await this.createAdminNotification('nueva_factura', titulo, mensaje);
  }

  // Obtener notificaciones para un usuario
  async getUserNotifications(userId, limit = 50) {
    try {
      const [notifications] = await pool.execute(
        'SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit]
      );

      return { success: true, data: notifications };
    } catch (error) {
      console.error('L Error obteniendo notificaciones:', error);
      return { success: false, error: error.message };
    }
  }

  // Marcar notificaci�n como le�da
  async markAsRead(notificationId, userId) {
    try {
      const [result] = await pool.execute(
        'UPDATE notificaciones SET leida = true WHERE id = ? AND usuario_id = ?',
        [notificationId, userId]
      );

      return { success: true, affectedRows: result.affectedRows };
    } catch (error) {
      console.error('L Error marcando notificaci�n como le�da:', error);
      return { success: false, error: error.message };
    }
  }

  // Marcar todas las notificaciones como le�das
  async markAllAsRead(userId) {
    try {
      const [result] = await pool.execute(
        'UPDATE notificaciones SET leida = true WHERE usuario_id = ?',
        [userId]
      );

      return { success: true, affectedRows: result.affectedRows };
    } catch (error) {
      console.error('L Error marcando todas las notificaciones como le�das:', error);
      return { success: false, error: error.message };
    }
  }

  // Eliminar notificaci�n
  async deleteNotification(notificationId, userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?',
        [notificationId, userId]
      );

      return { success: true, affectedRows: result.affectedRows };
    } catch (error) {
      console.error('L Error eliminando notificaci�n:', error);
      return { success: false, error: error.message };
    }
  }

  // Limpiar notificaciones antiguas (m�s de 30 d�as)
  async cleanupOldNotifications() {
    try {
      const [result] = await pool.execute(
        'DELETE FROM notificaciones WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );

      console.log(`>� Limpieza de notificaciones: ${result.affectedRows} eliminadas`);
      return { success: true, deletedCount: result.affectedRows };
    } catch (error) {
      console.error('L Error limpiando notificaciones antiguas:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener conteo de notificaciones no le�das
  async getUnreadCount(userId) {
    try {
      const [result] = await pool.execute(
        'SELECT COUNT(*) as unread_count FROM notificaciones WHERE usuario_id = ? AND leida = false',
        [userId]
      );

      return { success: true, count: result[0].unread_count };
    } catch (error) {
      console.error('L Error obteniendo conteo de no le�das:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();