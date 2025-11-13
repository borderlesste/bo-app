const { pool } = require('../config/db.js');

// Get notifications for authenticated user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [notifications] = await pool.execute(
      'SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const [result] = await pool.execute(
      'UPDATE notificaciones SET leida = true WHERE id = ? AND usuario_id = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await pool.execute(
      'UPDATE notificaciones SET leida = true WHERE usuario_id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const [result] = await pool.execute(
      'DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Create new notification
const createNotification = async (req, res) => {
  try {
    const { usuario_id, tipo, titulo, mensaje, prioridad = 'normal', entidad_tipo, entidad_id, accion_url } = req.body;
    
    if (!usuario_id || !tipo || !titulo || !mensaje) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: usuario_id, tipo, titulo, mensaje'
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, prioridad, entidad_tipo, entidad_id, accion_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [usuario_id, tipo, titulo, mensaje, prioridad, entidad_tipo, entidad_id, accion_url]
    );
    
    res.status(201).json({
      success: true,
      message: 'Notificación creada exitosamente',
      data: {
        id: result.insertId,
        usuario_id,
        tipo,
        titulo,
        mensaje,
        prioridad,
        entidad_tipo,
        entidad_id,
        accion_url
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get unread count for user
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND leida = false',
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        unreadCount: result[0].count
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Utility function to create system notifications
const createSystemNotification = async (userId, type, title, message, priority = 'normal', entityType = null, entityId = null, actionUrl = null) => {
  try {
    await pool.execute(
      'INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, prioridad, entidad_tipo, entidad_id, accion_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, type, title, message, priority, entityType, entityId, actionUrl]
    );
  } catch (error) {
    console.error('Error creating system notification:', error);
  }
};

// Notify all admins
const notifyAdmins = async (type, title, message, priority = 'normal', entityType = null, entityId = null, actionUrl = null) => {
  try {
    const [admins] = await pool.execute(
      'SELECT id FROM usuarios WHERE rol = "admin" AND estado = "activo"'
    );
    
    for (const admin of admins) {
      await createSystemNotification(admin.id, type, title, message, priority, entityType, entityId, actionUrl);
    }
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount,
  createSystemNotification,
  notifyAdmins
};