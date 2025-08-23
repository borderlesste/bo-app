const { pool } = require('../config/db.js');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');

// Get all cotizaciones (Admin only)
const getQuotes = async (req, res) => {
  try {
    const [cotizaciones] = await pool.execute(
      `SELECT q.id, q.usuario_id, q.nombre, q.email, 
              q.titulo, q.descripcion, q.precio_estimado,
              q.estado, q.prioridad, q.fecha_expiracion,
              q.created_at, u.nombre as usuarios_nombre 
       FROM cotizaciones q 
       LEFT JOIN usuarios u ON q.usuario_id = u.id 
       order BY q.created_at DESC`
    );
    
    res.json({
      success: true,
      data: cotizaciones
    });
  } catch (error) {
    console.error('Error getting cotizaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get quote by ID
const getQuoteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [cotizaciones] = await pool.execute(
      `SELECT q.id, q.numero_cotizacion, q.nombre_prospecto, q.email_prospecto,
              q.telefono_prospecto, q.empresa_prospecto, q.tipo_servicio, q.descripcion,
              q.estado, q.subtotal, q.total, q.fecha_emision, q.fecha_vencimiento,
              q.notas, q.created_at, u.nombre as usuarios_nombre, u.email as usuarios_email
       FROM cotizaciones q 
       LEFT JOIN usuarios u ON q.usuario_id = u.id 
       WHERE q.id = ?`,
      [id]
    );
    
    if (cotizaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: cotizaciones[0]
    });
  } catch (error) {
    console.error('Error getting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Create new quote (Public endpoint)
const createQuote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }
    
    const { nombre, email, telefono, empresa, tipo_servicio, descripcion } = req.body;
    
    // Insertar cotización usando la estructura real de init.sql
    const [result] = await pool.execute(
      `INSERT INTO cotizaciones (nombre, email, titulo, descripcion, fecha_expiracion) 
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      [nombre, email, `Cotización para ${tipo_servicio}`, `${descripcion}\n\nEmpresa: ${empresa || 'N/A'}\nTeléfono: ${telefono || 'N/A'}`]
    );
    
    // Si se especifica un servicio, agregarlo como item
    if (tipo_servicio && descripcion) {
      await pool.execute(
        `INSERT INTO cotizacion_items (cotizacion_id, descripcion, cantidad, precio_unitario, subtotal) 
         VALUES (?, ?, 1, 0, 0)`,
        [result.insertId, `${tipo_servicio}: ${descripcion}`]
      );
    }
    
    // Enviar notificación por email
    try {
      await emailService.sendQuoteNotification({
        nombre,
        email,
        telefono,
        tipo_servicio,
        descripcion
      });
      
      // Enviar email de bienvenida al usuarios
      await emailService.sendWelcomeEmail({
        nombre,
        email
      });
    } catch (emailError) {
      console.error('Error sending email notifications:', emailError);
      // No fallamos la creación de cotización por error de email
    }

    // Crear notificación para admin
    try {
      await notificationService.notifyNewQuote({
        nombre,
        tipo_servicio,
        descripcion
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // No fallamos la creación de cotización por error de notificación
    }
    
    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Update quote status
const updateQuote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { estado, usuario_id } = req.body;
    
    // Build dynamic query based on provided fields
    let updateFields = [];
    let updateValues = [];
    
    if (estado !== undefined) {
      updateFields.push('estado = ?');
      updateValues.push(estado);
    }
    
    if (usuario_id !== undefined) {
      updateFields.push('usuario_id = ?');
      updateValues.push(usuario_id || null); // Convert undefined to null for MySQL
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id); // for WHERE clause
    
    if (updateFields.length === 1) { // Only updated_at was added
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }
    
    const query = `UPDATE cotizaciones SET ${updateFields.join(', ')} WHERE id = ?`;
    
    const [result] = await pool.execute(query, updateValues);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Cotización actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Delete quote
const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM cotizaciones WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Cotización eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Convert quote to order
const convertQuoteToorder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get quote details
    const [cotizaciones] = await pool.execute(
      'SELECT * FROM cotizaciones WHERE id = ?',
      [id]
    );
    
    if (cotizaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }
    
    const quote = cotizaciones[0];
    
    // Check if quote has a client_id, if not, we need to create or find a client
    let usuariosId = quote.usuario_id;
    
    if (!usuariosId) {
      // Try to find existing client by email
      const [existingClient] = await pool.execute(
        'SELECT id FROM usuarios WHERE email = ?',
        [quote.email_prospecto]
      );
      
      if (existingClient.length > 0) {
        usuariosId = existingClient[0].id;
      } else {
        // Create new client from quote data
        const [newClient] = await pool.execute(
          `INSERT INTO usuarios (nombre, email, telefono, empresa, direccion, password, rol) 
           VALUES (?, ?, ?, ?, 'Dirección pendiente', '$2b$10$defaulthash', 'usuarios')`,
          [quote.nombre_prospecto, quote.email_prospecto, quote.telefono_prospecto || '', quote.empresa_prospecto || null]
        );
        usuariosId = newClient.insertId;
      }
      
      // Update quote with client_id
      await pool.execute(
        'UPDATE cotizaciones SET usuario_id = ? WHERE id = ?',
        [usuariosId, id]
      );
    }
    
    // Generate order number
    const now = new Date();
    const numeroorder = `PED-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    
    // Create order from quote
    const [orderResult] = await pool.execute(
      `INSERT INTO pedidos (numero_pedido, usuario_id, cotizacion_id, descripcion, estado, prioridad, created_by) 
       VALUES (?, ?, ?, ?, 'nuevo', 'normal', ?)`,
      [numeroorder, usuariosId, id, `${quote.tipo_servicio}: ${quote.descripcion}`, req.user.id]
    );
    
    // Update quote status
    await pool.execute(
      'UPDATE cotizaciones SET estado = ? WHERE id = ?',
      ['Convertido a order', id]
    );

    // Crear notificación de conversión
    try {
      await notificationService.notifyQuoteConverted({
        nombre: quote.nombre,
        tipo_servicio: quote.tipo_servicio
      }, orderResult.insertId);
    } catch (notificationError) {
      console.error('Error creating conversion notification:', notificationError);
    }
    
    res.json({
      success: true,
      message: 'Cotización convertida a order exitosamente',
      data: { 
        orderId: orderResult.insertId,
        usuariosId: usuariosId
      }
    });
  } catch (error) {
    console.error('Error converting quote to order:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  convertQuoteToorder
};