const { pool } = require('../config/db');
const { logger } = require('../middleware/errorHandling');

// Get client dashboard statistics
const getClientStats = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    // Get total projects for client
    const [projectsCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM proyectos WHERE usuario_id = ?',
      [usuarioId]
    );

    // Get projects by status
    const [projectsByStatus] = await pool.execute(`
      SELECT 
        estado,
        COUNT(*) as count
      FROM proyectos 
      WHERE usuario_id = ?
      GROUP BY estado
    `, [usuarioId]);

    // Get total investment (sum of project budgets)
    const [investment] = await pool.execute(
      'SELECT COALESCE(SUM(presupuesto), 0) as total FROM proyectos WHERE usuario_id = ?',
      [usuarioId]
    );

    // Process status counts
    const statusCounts = {
      totalProyectos: projectsCount[0].total,
      proyectosEnProgreso: 0,
      proyectosCompletados: 0,
      proyectosPlanificados: 0,
      inversionTotal: investment[0].total
    };

    projectsByStatus.forEach(status => {
      switch (status.estado) {
        case 'en_progreso':
          statusCounts.proyectosEnProgreso = status.count;
          break;
        case 'completado':
          statusCounts.proyectosCompletados = status.count;
          break;
        case 'planificado':
          statusCounts.proyectosPlanificados = status.count;
          break;
      }
    });

    res.json({
      success: true,
      data: statusCounts
    });

  } catch (error) {
    logger.error('Error getting client stats:', { error: error.message, usuarioId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas del cliente'
    });
  }
};

// Get client projects
const getClientProjects = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { page = 1, limit = 10, estado, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*,
        u.nombre as cliente_nombre
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.usuario_id = ?
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM pedidos WHERE usuario_id = ?';
    let params = [usuarioId];
    let countParams = [usuarioId];

    // Add filters
    if (estado) {
      query += ' AND p.estado = ?';
      countQuery += ' AND estado = ?';
      params.push(estado);
      countParams.push(estado);
    }

    if (search) {
      query += ' AND (p.numero_order LIKE ? OR p.descripcion LIKE ?)';
      countQuery += ' AND (numero_order LIKE ? OR descripcion LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }

    query += ' order BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [projects] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages
      }
    });

  } catch (error) {
    logger.error('Error getting client projects:', { error: error.message, usuarioId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Error al obtener proyectos del cliente'
    });
  }
};

// Get client quotations
const getClientQuotations = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { page = 1, limit = 10, estado, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        c.*
      FROM cotizaciones c
      WHERE c.usuario_id = ?
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM cotizaciones WHERE usuario_id = ?';
    let params = [usuarioId];
    let countParams = [usuarioId];

    // Add filters
    if (estado) {
      query += ' AND c.estado = ?';
      countQuery += ' AND estado = ?';
      params.push(estado);
      countParams.push(estado);
    }

    if (search) {
      query += ' AND (c.titulo LIKE ? OR c.descripcion LIKE ?)';
      countQuery += ' AND (titulo LIKE ? OR descripcion LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }

    query += ' order BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [quotations] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: quotations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages
      }
    });

  } catch (error) {
    logger.error('Error getting client quotations:', { error: error.message, usuarioId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Error al obtener cotizaciones del cliente'
    });
  }
};

// Update quotation status (approve/reject)
const updateQuotationStatus = async (req, res) => {
  try {
    const { quotationId, action } = req.params;
    const usuarioId = req.user.id;

    // Verify quotation belongs to client
    const [quotation] = await pool.execute(
      'SELECT * FROM cotizaciones WHERE id = ? AND usuario_id = ?',
      [quotationId, usuarioId]
    );

    if (quotation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cotización no encontrada'
      });
    }

    // Check if quotation can be updated
    if (quotation[0].estado !== 'enviada') {
      return res.status(400).json({
        success: false,
        error: 'Esta cotización no puede ser modificada'
      });
    }

    const newStatus = action === 'approve' ? 'aprobada' : 'rechazada';
    
    await pool.execute(
      'UPDATE cotizaciones SET estado = ?, fecha_respuesta = NOW() WHERE id = ?',
      [newStatus, quotationId]
    );

    // Log activity
    await pool.execute(`
      INSERT INTO actividades (usuario_id, tipo, descripcion, fecha_actividad) 
      VALUES (?, ?, ?, NOW())
    `, [
      usuarioId,
      'quotation_response',
      `Cliente ${action === 'approve' ? 'aprobó' : 'rechazó'} cotización ${quotation[0].numero_cotizacion}`
    ]);

    res.json({
      success: true,
      message: `Cotización ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`
    });

  } catch (error) {
    logger.error('Error updating quotation status:', { error: error.message, quotationId: req.params.quotationId });
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado de la cotización'
    });
  }
};

// Get client invoices
const getClientInvoices = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { page = 1, limit = 10, estado, search, fechaDesde, fechaHasta } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        f.*,
        ped.numero_order,
        ped.descripcion as order_descripcion,
        u.nombre as cliente_nombre,
        u.empresa as cliente_empresa,
        u.email as cliente_email
      FROM facturas f
      LEFT JOIN pedidos ped ON f.pedido_id = ped.id
      LEFT JOIN usuarios u ON f.usuario_id = u.id
      WHERE f.usuario_id = ?
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM facturas WHERE usuario_id = ?';
    let params = [usuarioId];
    let countParams = [usuarioId];

    // Add filters
    if (estado) {
      query += ' AND f.estado = ?';
      countQuery += ' AND estado = ?';
      params.push(estado);
      countParams.push(estado);
    }

    if (search) {
      query += ' AND f.numero_factura LIKE ?';
      countQuery += ' AND numero_factura LIKE ?';
      const searchParam = `%${search}%`;
      params.push(searchParam);
      countParams.push(searchParam);
    }

    if (fechaDesde) {
      query += ' AND f.fecha_emision >= ?';
      countQuery += ' AND fecha_emision >= ?';
      params.push(fechaDesde);
      countParams.push(fechaDesde);
    }

    if (fechaHasta) {
      query += ' AND f.fecha_emision <= ?';
      countQuery += ' AND fecha_emision <= ?';
      params.push(fechaHasta);
      countParams.push(fechaHasta);
    }

    query += ' order BY f.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [invoices] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Error getting client invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener facturas del cliente'
    });
  }
};

// Get client profile
const getClientProfile = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const [user] = await pool.execute(
      'SELECT id, nombre, email, telefono, empresa, direccion, ciudad, pais, sitio_web, created_at FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user[0]
    });

  } catch (error) {
    logger.error('Error getting client profile:', { error: error.message, usuarioId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Error al obtener perfil del cliente'
    });
  }
};

// Update client profile
const updateClientProfile = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { nombre, email, telefono, empresa, direccion, ciudad, pais, sitio_web } = req.body;

    // Check if email is already taken by another user
    const [existingUser] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      [email, usuarioId]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está en uso por otro usuario'
      });
    }

    await pool.execute(`
      UPDATE usuarios 
      SET nombre = ?, email = ?, telefono = ?, empresa = ?, direccion = ?, ciudad = ?, pais = ?, sitio_web = ?
      WHERE id = ?
    `, [nombre, email, telefono, empresa, direccion, ciudad, pais, sitio_web, usuarioId]);

    // Get updated user data
    const [updatedUser] = await pool.execute(
      'SELECT id, nombre, email, telefono, empresa, direccion, ciudad, pais, sitio_web, rol FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: updatedUser[0]
    });

  } catch (error) {
    logger.error('Error updating client profile:', { error: error.message, usuarioId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el perfil'
    });
  }
};

// Update client password
const updateClientPassword = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const bcrypt = require('bcrypt');

    // Get current password hash
    const [user] = await pool.execute(
      'SELECT password FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user[0].password);
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, usuarioId]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    logger.error('Error updating client password:', { error: error.message, usuarioId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la contraseña'
    });
  }
};

module.exports = {
  getClientStats,
  getClientProjects,
  getClientQuotations,
  updateQuotationStatus,
  getClientInvoices,
  getClientProfile,
  updateClientProfile,
  updateClientPassword
};