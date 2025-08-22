const { pool } = require('../config/db.js');
const { createSystemNotification, notifyAdmins } = require('./notificationsController.js');
const { Cotizacion, User, Servicio } = require('../models');

// Get all quotations with optional filters
const getAllQuotations = async (req, res) => {
  try {
    const filters = {
      estado: req.query.estado,
      usuario_id: req.query.usuario_id,
      search: req.query.search,
      limit: req.query.limit || 20
    };

    const quotations = await Cotizacion.findAll(filters);

    res.json({
      success: true,
      data: {
        quotations,
        pagination: {
          current_page: 1,
          per_page: parseInt(filters.limit),
          total: quotations.length,
          total_pages: 1,
          has_next: false,
          has_prev: false
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

// Get single quotation by ID with items
const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await Cotizacion.findById(id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    const items = await Cotizacion.getItems(id);

    res.json({
      success: true,
      data: {
        quotation,
        items
      }
    });
  } catch (error) {
    console.error('Error getting quotation by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Create new quotation
const createQuotation = async (req, res) => {
  try {
    const {
      usuario_id,
      nombre,
      email,
      titulo,
      descripcion,
      precio_estimado,
      items = [],
      moneda = 'MXN',
      tiempo_entrega_dias = 30,
      notas_internas,
      terminos_condiciones
    } = req.body;

    // Create quotation
    const quotationId = await Cotizacion.create({
      usuario_id,
      nombre,
      email,
      titulo,
      descripcion,
      precio_estimado,
      moneda,
      tiempo_entrega_dias,
      notas_internas,
      terminos_condiciones
    });

    // Add items
    for (const [index, item] of items.entries()) {
      await Cotizacion.addItem(quotationId, {
        ...item,
        orden: index + 1
      });
    }

    // Log activity
    await pool.execute(
      'INSERT INTO auditoria_logs (usuario_id, evento, descripcion, entidad_tipo, entidad_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'crear_cotizacion', `Nueva cotización creada: ${titulo}`, 'cotizacion', quotationId]
    );

    // Notify client if usuario_id is provided
    if (usuario_id) {
      await createSystemNotification(
        usuario_id,
        'nueva_cotizacion',
        'Nueva cotización disponible',
        `Se ha creado una nueva cotización para ti: ${titulo}`,
        'normal',
        'cotizacion',
        quotationId,
        `/cotizaciones/${quotationId}`
      );
    }

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: {
        id: quotationId
      }
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Update quotation
const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      items = [],
      impuestos = 16,
      moneda = 'MXN',
      validez_dias = 30,
      notas,
      template_id
    } = req.body;

    // Check if quotation exists and can be edited
    const [existingQuotation] = await pool.execute(
      'SELECT id, numero_cotizacion, estado, usuario_id FROM cotizaciones WHERE id = ?',
      [id]
    );

    if (existingQuotation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    const quotation = existingQuotation[0];

    if (['aprobada', 'convertida'].includes(quotation.estado)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una cotización aprobada o convertida'
      });
    }

    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
      subtotal += (item.cantidad || 0) * (item.precio_unitario || 0);
    });

    const impuestosAmount = subtotal * (impuestos / 100);
    const total = subtotal + impuestosAmount;

    // Calculate new expiration date
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + validez_dias);

    // Update quotation
    await pool.execute(
      `UPDATE cotizaciones 
       SET titulo = ?, descripcion = ?, subtotal = ?, impuestos = ?, total = ?, 
           moneda = ?, validez_dias = ?, fecha_expiracion = ?, notas = ?, 
           template_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [titulo, descripcion, subtotal, impuestosAmount, total, moneda, 
       validez_dias, fechaExpiracion, notas, template_id, id]
    );

    // Delete existing items and insert new ones
    await pool.execute('DELETE FROM cotizacion_items WHERE cotizacion_id = ?', [id]);

    if (items.length > 0) {
      const itemsQuery = `
        INSERT INTO cotizacion_items (
          cotizacion_id, descripcion, cantidad, precio_unitario, subtotal, orden
        ) VALUES ?
      `;
      
      const itemsValues = items.map((item, index) => [
        id,
        item.descripcion,
        item.cantidad || 1,
        item.precio_unitario || 0,
        (item.cantidad || 1) * (item.precio_unitario || 0),
        index + 1
      ]);

      await pool.execute(itemsQuery, [itemsValues]);
    }

    // Log activity
    await pool.execute(
      'INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'actualizar_cotizacion', `Cotización actualizada: ${quotation.numero_cotizacion}`, 'cotizacion', id]
    );

    res.json({
      success: true,
      message: 'Cotización actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Delete quotation (soft delete)
const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if quotation exists
    const [existingQuotation] = await pool.execute(
      'SELECT id, numero_cotizacion, estado FROM cotizaciones WHERE id = ?',
      [id]
    );

    if (existingQuotation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    const quotation = existingQuotation[0];

    if (['aprobada', 'convertida'].includes(quotation.estado)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una cotización aprobada o convertida'
      });
    }

    // Soft delete
    await pool.execute(
      'UPDATE cotizaciones SET estado = "cancelada", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'cancelar_cotizacion', `Cotización cancelada: ${quotation.numero_cotizacion}`, 'cotizacion', id]
    );

    res.json({
      success: true,
      message: 'Cotización cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Update quotation status
const updateQuotationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, comentarios } = req.body;

    const validStates = ['borrador', 'enviada', 'aprobada', 'rechazada', 'expirada', 'convertida', 'cancelada'];
    
    if (!validStates.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    // Check if quotation exists
    const [existingQuotation] = await pool.execute(
      'SELECT id, numero_cotizacion, estado, usuario_id FROM cotizaciones WHERE id = ?',
      [id]
    );

    if (existingQuotation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    const quotation = existingQuotation[0];

    // Update status
    await pool.execute(
      'UPDATE cotizaciones SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [estado, id]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'cambiar_estado_cotizacion', `Estado de cotización ${quotation.numero_cotizacion} cambiado a: ${estado}`, 'cotizacion', id]
    );

    // Notify client about status change
    const statusMessages = {
      enviada: 'Tu cotización ha sido enviada y está pendiente de revisión',
      aprobada: '¡Tu cotización ha sido aprobada! Pronto nos pondremos en contacto contigo',
      rechazada: 'Tu cotización ha sido rechazada. Te contactaremos para discutir alternativas',
      expirada: 'Tu cotización ha expirado. Contáctanos para renovarla'
    };

    if (statusMessages[estado]) {
      await createSystemNotification(
        quotation.usuario_id,
        'estado_cotizacion',
        `Actualización de cotización ${quotation.numero_cotizacion}`,
        statusMessages[estado] + (comentarios ? ` Comentarios: ${comentarios}` : ''),
        estado === 'aprobada' ? 'alta' : 'normal',
        'cotizacion',
        id,
        `/cotizaciones/${id}`
      );
    }

    res.json({
      success: true,
      message: 'Estado de cotización actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating quotation status:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Convert quotation to project
const convertQuotationToProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if quotation exists and is approved
    const [existingQuotation] = await pool.execute(
      `SELECT c.*, u.nombre as usuarios_nombre 
       FROM cotizaciones c 
       LEFT JOIN usuarios u ON c.usuario_id = u.id 
       WHERE c.id = ?`,
      [id]
    );

    if (existingQuotation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    const quotation = existingQuotation[0];

    if (quotation.estado !== 'aprobada') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden convertir cotizaciones aprobadas'
      });
    }

    // Generate project code
    const currentYear = new Date().getFullYear();
    const [lastProject] = await pool.execute(
      'SELECT codigo FROM proyectos WHERE codigo LIKE ? order BY id DESC LIMIT 1',
      [`PRY-${currentYear}-%`]
    );

    let projectCode;
    if (lastProject.length > 0) {
      const lastNumber = parseInt(lastProject[0].codigo.split('-')[2]);
      projectCode = `PRY-${currentYear}-${String(lastNumber + 1).padStart(4, '0')}`;
    } else {
      projectCode = `PRY-${currentYear}-0001`;
    }

    // Create project from quotation
    const [projectResult] = await pool.execute(
      `INSERT INTO proyectos (
        codigo, nombre, descripcion, usuario_id, categoria, estado, 
        es_publico, es_destacado, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        projectCode,
        quotation.titulo,
        quotation.descripcion,
        quotation.usuario_id,
        'web',
        'planificacion',
        0,
        0
      ]
    );

    const projectId = projectResult.insertId;

    // Update quotation status to converted
    await pool.execute(
      'UPDATE cotizaciones SET estado = "convertida", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Log activities
    await pool.execute(
      'INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'convertir_cotizacion', `Cotización ${quotation.numero_cotizacion} convertida a proyecto ${projectCode}`, 'cotizacion', id]
    );

    await pool.execute(
      'INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'crear_proyecto', `Proyecto ${projectCode} creado desde cotización ${quotation.numero_cotizacion}`, 'proyecto', projectId]
    );

    // Notify client
    await createSystemNotification(
      quotation.usuario_id,
      'proyecto_creado',
      '¡Tu proyecto ha sido creado!',
      `Tu cotización ${quotation.numero_cotizacion} ha sido convertida al proyecto ${projectCode}. ¡Comenzamos a trabajar!`,
      'alta',
      'proyecto',
      projectId,
      `/proyectos/${projectId}`
    );

    res.json({
      success: true,
      message: 'Cotización convertida a proyecto exitosamente',
      data: {
        project_id: projectId,
        project_code: projectCode
      }
    });
  } catch (error) {
    console.error('Error converting quotation to project:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get quotation statistics
const getQuotationStats = async (req, res) => {
  try {
    // Total quotations
    const [totalQuotations] = await pool.execute(
      'SELECT COUNT(*) as total FROM cotizaciones'
    );

    // Quotations by status
    const [statusBreakdown] = await pool.execute(
      `SELECT estado, COUNT(*) as count 
       FROM cotizaciones 
       GROUP BY estado`
    );

    // Quotations this month
    const [thisMonth] = await pool.execute(
      `SELECT COUNT(*) as total FROM cotizaciones 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`
    );

    // Total value of approved quotations
    const [approvedValue] = await pool.execute(
      `SELECT SUM(total) as value FROM cotizaciones 
       WHERE estado = 'aprobada'`
    );

    // Conversion rate (approved/total)
    const [conversionStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'aprobada' THEN 1 END) as approved,
        COUNT(CASE WHEN estado = 'convertida' THEN 1 END) as converted
       FROM cotizaciones
       WHERE estado != 'borrador'`
    );

    const conversionRate = conversionStats[0].total > 0 ? 
      (conversionStats[0].approved / conversionStats[0].total * 100).toFixed(1) : 0;

    // Top clients by quotations
    const [topClients] = await pool.execute(
      `SELECT 
        u.id, u.nombre, u.empresa,
        COUNT(c.id) as total_cotizaciones,
        SUM(CASE WHEN c.estado = 'aprobada' THEN c.total ELSE 0 END) as valor_aprobado
       FROM usuarios u
       INNER JOIN cotizaciones c ON u.id = c.usuario_id
       WHERE u.rol = 'usuarios'
       GROUP BY u.id
       order BY total_cotizaciones DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        summary: {
          total: totalQuotations[0].total,
          this_month: thisMonth[0].total,
          approved_value: approvedValue[0].value || 0,
          conversion_rate: parseFloat(conversionRate),
          converted: conversionStats[0].converted
        },
        status_breakdown: statusBreakdown,
        top_clients: topClients
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
  updateQuotationStatus,
  convertQuotationToProject,
  getQuotationStats
};