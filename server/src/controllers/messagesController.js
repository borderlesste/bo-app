const { pool } = require('../config/db.js');

const messagesController = {
  // Obtener conversaciones del cliente (agrupadas por asunto para simular conversaciones)
  getClientConversations: async (req, res) => {
    try {
      const usuarioId = req.user.id;
      
      // Buscar mensajes donde el cliente es remitente o destinatario
      // Agrupamos por asunto para simular conversaciones
      const [conversations] = await pool.execute(`
        SELECT 
          MIN(m.id) as conversation_id,
          m.asunto,
          MAX(m.created_at) as ultima_actividad,
          COUNT(CASE WHEN m.estado = 'no_leido' AND m.destinatario_id = ? THEN 1 END) as mensajes_no_leidos,
          (SELECT m2.mensaje FROM mensajes m2 
           WHERE m2.asunto = m.asunto 
           AND (m2.remitente_id = ? OR m2.destinatario_id = ? OR m2.remitente_id IN (SELECT id FROM usuarios WHERE rol = 'admin') OR m2.destinatario_id IN (SELECT id FROM usuarios WHERE rol = 'admin'))
           ORDER BY m2.created_at DESC LIMIT 1) as ultimo_mensaje,
          u.nombre as admin_nombre
        FROM mensajes m
        LEFT JOIN usuarios u ON u.rol = 'admin' AND u.id = (
          SELECT id FROM usuarios WHERE rol = 'admin' ORDER BY id ASC LIMIT 1
        )
        WHERE (m.remitente_id = ? OR m.destinatario_id = ?)
        GROUP BY m.asunto, u.nombre
        ORDER BY ultima_actividad DESC
        LIMIT 20
      `, [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId]);

      const formattedConversations = conversations.map(conv => ({
        id: conv.conversation_id,
        asunto: conv.asunto || 'Conversación con soporte',
        ultimo_mensaje: conv.ultimo_mensaje || 'Sin mensajes',
        created_at: conv.ultima_actividad,
        updated_at: conv.ultima_actividad,
        mensajes_no_leidos: conv.mensajes_no_leidos || 0,
        admin_nombre: conv.admin_nombre || 'Administrador'
      }));

      res.json({
        success: true,
        data: formattedConversations
      });
    } catch (error) {
      console.error('Error al obtener conversaciones del cliente:', error);
      
      // Si la tabla no existe, devolver array vacío
      if (error.message.includes("doesn't exist")) {
        return res.json({
          success: true,
          data: []
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener conversaciones del cliente',
        error: error.message
      });
    }
  },

  // Obtener mensajes de una conversación específica (basado en el primer mensaje de esa conversación)
  getConversationMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const usuarioId = req.user.id;
      
      // Primero obtener el asunto de la conversación inicial
      const [initialMessage] = await pool.execute(`
        SELECT asunto
        FROM mensajes 
        WHERE id = ? AND (remitente_id = ? OR destinatario_id = ?)
      `, [conversationId, usuarioId, usuarioId]);
      
      if (initialMessage.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta conversación'
        });
      }

      const asunto = initialMessage[0].asunto;

      // Obtener todos los mensajes con el mismo asunto (simulando una conversación)
      const [messages] = await pool.execute(`
        SELECT 
          m.*,
          u.nombre as remitente_nombre,
          u.rol as remitente_rol
        FROM mensajes m
        LEFT JOIN usuarios u ON m.remitente_id = u.id
        WHERE m.asunto = ? 
        AND (m.remitente_id = ? OR m.destinatario_id = ? 
             OR m.remitente_id IN (SELECT id FROM usuarios WHERE rol = 'admin') 
             OR m.destinatario_id IN (SELECT id FROM usuarios WHERE rol = 'admin'))
        ORDER BY m.created_at ASC
      `, [asunto, usuarioId, usuarioId]);

      // Marcar mensajes como leídos para el cliente
      await pool.execute(`
        UPDATE mensajes 
        SET estado = 'leido' 
        WHERE asunto = ? AND destinatario_id = ? AND estado = 'no_leido'
      `, [asunto, usuarioId]);

      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        contenido: msg.mensaje,
        user_id: msg.remitente_id,
        remitente_nombre: msg.remitente_nombre,
        remitente_rol: msg.remitente_rol,
        created_at: msg.created_at,
        leido: msg.estado === 'leido' || msg.estado === 'respondido' ? 1 : 0
      }));

      res.json({
        success: true,
        data: formattedMessages
      });
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener mensajes',
        error: error.message
      });
    }
  },

  // Crear nueva conversación (cliente iniciando conversación con admin)
  startClientConversation: async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const usuarioId = req.user.id;
      const { asunto, contenido } = req.body;
      const mensaje = contenido; // Convert to database field name
      
      // Obtener ID del admin (primer usuario con rol admin)
      const [adminUser] = await connection.execute(
        'SELECT id FROM usuarios WHERE rol = "admin" ORDER BY id ASC LIMIT 1'
      );
      
      if (adminUser.length === 0) {
        await connection.rollback();
        return res.status(500).json({
          success: false,
          message: 'No se encontró un administrador disponible'
        });
      }
      
      const adminId = adminUser[0].id;
      
      // Crear el primer mensaje de la conversación
      const [messageResult] = await connection.execute(`
        INSERT INTO mensajes (
          remitente_id, destinatario_id, asunto, mensaje, tipo, estado, prioridad
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [usuarioId, adminId, asunto, mensaje, 'consulta_general', 'no_leido', 'media']);

      // Crear notificación para el admin
      await connection.execute(`
        INSERT INTO notificaciones (
          usuario_id, tipo, titulo, mensaje, entidad_tipo, entidad_id, leida
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        adminId, 
        'mensaje', 
        'Nuevo mensaje de cliente', 
        `${req.user.nombre || 'Cliente'} ha iniciado una nueva conversación: ${asunto}`,
        'mensaje',
        messageResult.insertId,
        0
      ]);

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Conversación iniciada exitosamente',
        data: {
          id: messageResult.insertId,
          asunto: asunto,
          mensaje_id: messageResult.insertId
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error al iniciar conversación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar conversación',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  // Enviar mensaje en conversación existente
  sendMessage: async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { conversationId } = req.params;
      const usuarioId = req.user.id;
      const { contenido } = req.body;
      const mensaje = contenido; // Convert to database field name
      
      // Obtener el asunto de la conversación original
      const [conversationCheck] = await connection.execute(`
        SELECT 
          asunto,
          CASE 
            WHEN remitente_id = ? OR destinatario_id = ? THEN 1 
            ELSE 0 
          END as tiene_acceso
        FROM mensajes 
        WHERE id = ?
        LIMIT 1
      `, [usuarioId, usuarioId, conversationId]);
      
      if (conversationCheck.length === 0 || !conversationCheck[0].tiene_acceso) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta conversación'
        });
      }

      // Obtener ID del admin
      const [adminUser] = await connection.execute(
        'SELECT id FROM usuarios WHERE rol = "admin" ORDER BY id ASC LIMIT 1'
      );
      
      const adminId = adminUser[0]?.id || 1;
      const asunto = conversationCheck[0].asunto;

      // Insertar nuevo mensaje con el mismo asunto
      const [messageResult] = await connection.execute(`
        INSERT INTO mensajes (
          remitente_id, destinatario_id, asunto, mensaje, tipo, estado, prioridad, parent_message_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [usuarioId, adminId, asunto, mensaje, 'consulta_general', 'no_leido', 'media', conversationId]);

      // Crear notificación para el admin
      await connection.execute(`
        INSERT INTO notificaciones (
          usuario_id, tipo, titulo, mensaje, entidad_tipo, entidad_id, leida
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        adminId,
        'mensaje',
        'Nuevo mensaje de cliente',
        `${req.user.nombre || 'Cliente'} respondió en: ${asunto}`,
        'mensaje',
        messageResult.insertId,
        0
      ]);

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Mensaje enviado exitosamente',
        data: {
          id: messageResult.insertId,
          contenido: contenido,
          user_id: usuarioId,
          created_at: new Date().toISOString()
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error al enviar mensaje:', error);
      res.status(500).json({
        success: false,
        message: 'Error al enviar mensaje',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  // ADMIN ENDPOINTS
  
  // Obtener todas las conversaciones para el admin
  getAdminConversations: async (req, res) => {
    try {
      const { status = 'all', limit = 20, offset = 0 } = req.query;
      
      let whereClause = '';
      let queryParams = [];
      
      // Obtener ID del admin
      const [adminUser] = await pool.execute(
        'SELECT id FROM usuarios WHERE rol = "admin" ORDER BY id ASC LIMIT 1'
      );
      const adminId = adminUser[0]?.id || 1;
      
      if (status === 'unread') {
        whereClause = 'HAVING mensajes_no_leidos > 0';
      }

      const [conversations] = await pool.execute(`
        SELECT 
          MIN(m.id) as conversation_id,
          m.asunto,
          MAX(m.created_at) as ultima_actividad,
          COUNT(CASE WHEN m.estado = 'no_leido' AND m.destinatario_id = ? THEN 1 END) as mensajes_no_leidos,
          (SELECT m2.mensaje FROM mensajes m2 
           WHERE m2.asunto = m.asunto 
           ORDER BY m2.created_at DESC LIMIT 1) as ultimo_mensaje,
          (SELECT u.nombre FROM mensajes m3 
           JOIN usuarios u ON m3.remitente_id = u.id
           WHERE m3.asunto = m.asunto 
           AND u.rol = 'cliente'
           ORDER BY m3.created_at ASC LIMIT 1) as cliente_nombre,
          (SELECT u.email FROM mensajes m4 
           JOIN usuarios u ON m4.remitente_id = u.id
           WHERE m4.asunto = m.asunto 
           AND u.rol = 'cliente'
           ORDER BY m4.created_at ASC LIMIT 1) as cliente_email
        FROM mensajes m
        WHERE EXISTS (
          SELECT 1 FROM mensajes m_check 
          WHERE m_check.asunto = m.asunto 
          AND (m_check.remitente_id = ? OR m_check.destinatario_id = ?)
        )
        GROUP BY m.asunto
        ${whereClause}
        ORDER BY ultima_actividad DESC
        LIMIT ? OFFSET ?
      `, [adminId, adminId, adminId, parseInt(limit), parseInt(offset)]);

      const formattedConversations = conversations.map(conv => ({
        id: conv.conversation_id,
        asunto: conv.asunto,
        cliente_nombre: conv.cliente_nombre,
        cliente_email: conv.cliente_email,
        ultimo_mensaje: conv.ultimo_mensaje,
        ultima_actividad: conv.ultima_actividad,
        mensajes_no_leidos: conv.mensajes_no_leidos || 0
      }));

      res.json({
        success: true,
        data: formattedConversations
      });
    } catch (error) {
      console.error('Error al obtener conversaciones del admin:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener conversaciones',
        error: error.message
      });
    }
  },

  // Admin responder a mensaje
  adminReplyMessage: async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { conversationId } = req.params;
      const adminId = req.user.id;
      const { contenido } = req.body;

      // Obtener información de la conversación inicial y cliente
      const [conversationInfo] = await connection.execute(`
        SELECT 
          m.asunto,
          u.id as usuario_id,
          u.nombre as cliente_nombre
        FROM mensajes m
        JOIN usuarios u ON (m.remitente_id = u.id OR m.destinatario_id = u.id)
        WHERE m.id = ? AND u.rol = 'cliente'
        LIMIT 1
      `, [conversationId]);

      if (conversationInfo.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
      }

      const { asunto, usuario_id, cliente_nombre } = conversationInfo[0];

      // Insertar respuesta del admin
      const [messageResult] = await connection.execute(`
        INSERT INTO mensajes (
          remitente_id, destinatario_id, asunto, mensaje, tipo, estado, prioridad, parent_message_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [adminId, usuario_id, asunto, contenido, 'consulta_general', 'no_leido', 'media', conversationId]);

      // Marcar la conversación original como respondida
      await connection.execute(`
        UPDATE mensajes 
        SET estado = 'respondido' 
        WHERE asunto = ? AND remitente_id = ? AND destinatario_id = ?
      `, [asunto, usuario_id, adminId]);

      // Crear notificación para el cliente
      await connection.execute(`
        INSERT INTO notificaciones (
          usuario_id, tipo, titulo, mensaje, entidad_tipo, entidad_id, leida
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        usuario_id,
        'mensaje',
        'Respuesta del administrador',
        `El administrador ha respondido a tu consulta: ${asunto}`,
        'mensaje',
        messageResult.insertId,
        0
      ]);

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Respuesta enviada exitosamente',
        data: {
          id: messageResult.insertId,
          contenido: contenido,
          destinatario: cliente_nombre
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error al enviar respuesta del admin:', error);
      res.status(500).json({
        success: false,
        message: 'Error al enviar respuesta',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }
};

module.exports = messagesController;