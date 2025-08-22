const { pool } = require('../config/db.js');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');

/**
 * UNIFIED QUOTATIONS CONTROLLER
 * Consolidates quotes.js and quotations.js functionality
 * Eliminates code duplication and provides consistent API
 */

// Get all quotations with advanced filtering (Admin)
const getAllQuotations = async (req, res) => {
  try {
    const {
      estado,
      usuario_id,
      search,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    let whereClause = '1=1';
    let params = [];

    // Build dynamic WHERE clause
    if (estado) {
      whereClause += ' AND q.estado = ?';
      params.push(estado);
    }

    if (usuario_id) {
      whereClause += ' AND q.usuario_id = ?';
      params.push(usuario_id);
    }

    if (search) {
      whereClause += ' AND (q.nombre LIKE ? OR q.email LIKE ? OR q.descripcion LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM cotizaciones q 
      LEFT JOIN usuarios u ON q.usuario_id = u.id 
      WHERE ${whereClause}
    `, params);

    // Get quotations with pagination
    const [quotations] = await pool.execute(`
      SELECT 
        q.id, q.usuario_id, q.nombre, q.email, q.titulo, q.descripcion,
        q.precio_estimado, q.moneda, q.estado, q.prioridad, 
        q.fecha_expiracion, q.notas_internas, q.terminos_condiciones,
        q.tiempo_entrega_dias, q.created_at, q.updated_at,
        u.nombre as cliente_nombre, u.empresa as cliente_empresa
      FROM cotizaciones q 
      LEFT JOIN usuarios u ON q.usuario_id = u.id 
      WHERE ${whereClause}
      order BY q.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get items for each quotation
    for (let quotation of quotations) {
      const [items] = await pool.execute(
        'SELECT * FROM cotizacion_items WHERE cotizacion_id = ? order BY orden',
        [quotation.id]
      );
      quotation.items = items;
    }

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        quotations,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: totalPages,
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get single quotation by ID with full details
const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [quotations] = await pool.execute(`
      SELECT 
        q.*, u.nombre as cliente_nombre, u.email as cliente_email,
        u.telefono as cliente_telefono, u.empresa as cliente_empresa
      FROM cotizaciones q 
      LEFT JOIN usuarios u ON q.usuario_id = u.id 
      WHERE q.id = ?
    `, [id]);

    if (quotations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    const quotation = quotations[0];

    // Get quotation items
    const [items] = await pool.execute(
      'SELECT * FROM cotizacion_items WHERE cotizacion_id = ? order BY orden',
      [id]
    );

    quotation.items = items;

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error getting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Create new quotation (Public endpoint for contact form)
const createQuotation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      nombre,
      email,
      telefono,
      empresa,
      titulo,
      descripcion,
      tipo_servicio,
      items = [],
      usuario_id = null
    } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Calculate totals if items provided
      let subtotal = 0;
      if (items.length > 0) {
        subtotal = items.reduce((sum, item) => 
          sum + (item.cantidad * item.precio_unitario - (item.descuento || 0)), 0
        );
      }

      // Insert quotation
      const [result] = await connection.execute(`
        INSERT INTO cotizaciones 
        (usuario_id, nombre, email, titulo, descripcion, precio_estimado, 
         estado, prioridad, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, 'Pendiente', 'media', NOW(), NOW())
      `, [usuario_id, nombre, email, titulo || `Cotización de ${tipo_servicio}`, descripcion, subtotal]);

      const quotationId = result.insertId;

      // Insert items if provided
      if (items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          await connection.execute(`
            INSERT INTO cotizacion_items 
            (cotizacion_id, descripcion, cantidad, precio_unitario, descuento, orden) 
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            quotationId,
            item.descripcion,
            item.cantidad || 1,
            item.precio_unitario || 0,
            item.descuento || 0,
            i
          ]);
        }
      }

      await connection.commit();

      // Send notification to admins
      try {
        await notificationService.createNotification({
          titulo: 'Nueva Cotización Recibida',
          mensaje: `Nueva solicitud de cotización de ${nombre} (${email})`,
          tipo: 'nueva_cotizacion',
          entidad_tipo: 'cotizacion',
          entidad_id: quotationId,
          for_admins: true
        });

        // Send email notification
        await emailService.sendQuotationReceived({
          cliente_nombre: nombre,
          cliente_email: email,
          cotizacion_id: quotationId,
          descripcion: descripcion
        });
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the request for notification errors
      }

      res.status(201).json({
        success: true,
        message: 'Cotización creada exitosamente',
        data: { id: quotationId }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Update quotation (Admin only)
const updateQuotation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      titulo,
      descripcion,
      precio_estimado,
      estado,
      prioridad,
      fecha_expiracion,
      notas_internas,
      terminos_condiciones,
      tiempo_entrega_dias,
      items = []
    } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update quotation
      await connection.execute(`
        UPDATE cotizaciones 
        SET titulo = ?, descripcion = ?, precio_estimado = ?, estado = ?, 
            prioridad = ?, fecha_expiracion = ?, notas_internas = ?, 
            terminos_condiciones = ?, tiempo_entrega_dias = ?, updated_at = NOW()
        WHERE id = ?
      `, [
        titulo, descripcion, precio_estimado, estado, prioridad,
        fecha_expiracion, notas_internas, terminos_condiciones,
        tiempo_entrega_dias, id
      ]);

      // Update items if provided
      if (items.length > 0) {
        // Delete existing items
        await connection.execute('DELETE FROM cotizacion_items WHERE cotizacion_id = ?', [id]);

        // Insert new items
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          await connection.execute(`
            INSERT INTO cotizacion_items 
            (cotizacion_id, servicio_id, descripcion, cantidad, precio_unitario, descuento, orden) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            id,
            item.servicio_id || null,
            item.descripcion,
            item.cantidad || 1,
            item.precio_unitario || 0,
            item.descuento || 0,
            i
          ]);
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Cotización actualizada exitosamente'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Delete quotation (Admin only)
const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete items first (foreign key constraint)
      await connection.execute('DELETE FROM cotizacion_items WHERE cotizacion_id = ?', [id]);
      
      // Delete quotation
      const [result] = await connection.execute('DELETE FROM cotizaciones WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Cotización eliminada exitosamente'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Convert quotation to order/project
const convertQuotationToorder = async (req, res) => {
  try {
    const { id } = req.params;
    const { convert_to = 'order' } = req.body; // 'order' or 'project'

    // Get quotation details
    const [quotations] = await pool.execute(`
      SELECT q.*, u.id as usuario_id 
      FROM cotizaciones q 
      LEFT JOIN usuarios u ON q.usuario_id = u.id 
      WHERE q.id = ?
    `, [id]);

    if (quotations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    const quotation = quotations[0];

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      if (convert_to === 'order') {
        // Convert to order (order)
        const numeroorder = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const [orderResult] = await connection.execute(`
          INSERT INTO orders 
          (numero_order, usuario_id, cotizacion_id, estado, subtotal, total, 
           descripcion, created_at, updated_at) 
          VALUES (?, ?, ?, 'nuevo', ?, ?, ?, NOW(), NOW())
        `, [
          numeroorder,
          quotation.usuario_id,
          id,
          quotation.precio_estimado || 0,
          quotation.precio_estimado || 0,
          quotation.descripcion
        ]);

        // Copy quotation items to order items
        const [quotationItems] = await connection.execute(
          'SELECT * FROM cotizacion_items WHERE cotizacion_id = ?', [id]
        );

        for (const item of quotationItems) {
          await connection.execute(`
            INSERT INTO order_items 
            (order_id, servicio_id, descripcion, cantidad, precio_unitario, descuento, orden) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            orderResult.insertId,
            item.servicio_id,
            item.descripcion,
            item.cantidad,
            item.precio_unitario,
            item.descuento,
            item.orden
          ]);
        }

        // Update quotation status
        await connection.execute(
          'UPDATE cotizaciones SET estado = "Aprobada", updated_at = NOW() WHERE id = ?',
          [id]
        );

        await connection.commit();

        res.json({
          success: true,
          message: 'Cotización convertida a order exitosamente',
          data: { order_id: orderResult.insertId, numero_order: numeroorder }
        });

      } else if (convert_to === 'project') {
        // Convert to project
        const projectCode = `PROJ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        const [projectResult] = await connection.execute(`
          INSERT INTO proyectos 
          (codigo, nombre, descripcion, usuario_id, estado, created_at, updated_at) 
          VALUES (?, ?, ?, ?, 'planificacion', NOW(), NOW())
        `, [
          projectCode,
          quotation.titulo || 'Proyecto desde cotización',
          quotation.descripcion,
          quotation.usuario_id
        ]);

        // Update quotation status
        await connection.execute(
          'UPDATE cotizaciones SET estado = "Aprobada", updated_at = NOW() WHERE id = ?',
          [id]
        );

        await connection.commit();

        res.json({
          success: true,
          message: 'Cotización convertida a proyecto exitosamente',
          data: { project_id: projectResult.insertId, codigo: projectCode }
        });
      }

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error converting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get quotation statistics for dashboard
const getQuotationStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'Aprobada' THEN 1 ELSE 0 END) as aprobadas,
        SUM(CASE WHEN estado = 'Rechazada' THEN 1 ELSE 0 END) as rechazadas,
        SUM(CASE WHEN estado = 'Expirada' THEN 1 ELSE 0 END) as expiradas,
        AVG(precio_estimado) as promedio_precio,
        SUM(precio_estimado) as valor_total,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as ultimos_30_dias
      FROM cotizaciones
    `);

    const [monthlyStats] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as mes,
        COUNT(*) as total,
        SUM(precio_estimado) as valor
      FROM cotizaciones 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      order BY mes DESC
    `);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        monthly: monthlyStats
      }
    });
  } catch (error) {
    console.error('Error getting quotation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  convertQuotationToorder,
  getQuotationStats
};