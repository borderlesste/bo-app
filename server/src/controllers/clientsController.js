const { pool } = require('../config/db.js');
const { createSystemNotification, notifyAdmins } = require('./notificationsController.js');

// Get all clients with optional filters
const getAllClients = async (req, res) => {
  try {
    const { 
      search, 
      estado, 
      empresa, 
      page = 1, 
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        u.id,
        u.nombre,
        u.email,
        u.telefono,
        u.direccion,
        u.empresa,
        u.rfc,
        u.estado,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT p.id) as total_proyectos,
        COUNT(DISTINCT CASE WHEN p.estado = 'completado' THEN p.id END) as proyectos_completados
      FROM usuarios u
      LEFT JOIN proyectos p ON p.usuario_id = u.id
      WHERE u.rol = 'cliente'
    `;

    const params = [];

    // Apply filters
    if (search) {
      query += ` AND (u.nombre LIKE ? OR u.email LIKE ? OR u.empresa LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (estado) {
      query += ` AND u.estado = ?`;
      params.push(estado);
    }

    if (empresa) {
      query += ` AND u.empresa LIKE ?`;
      params.push(`%${empresa}%`);
    }

    query += ` GROUP BY u.id`;

    // Add sorting
    const allowedSortFields = ['nombre', 'email', 'empresa', 'estado', 'created_at', 'total_proyectos'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${order}`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [clients] = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM usuarios WHERE rol = "cliente"';
    const countParams = [];

    if (search) {
      countQuery += ` AND (nombre LIKE ? OR email LIKE ? OR empresa LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (estado) {
      countQuery += ` AND estado = ?`;
      countParams.push(estado);
    }

    if (empresa) {
      countQuery += ` AND empresa LIKE ?`;
      countParams.push(`%${empresa}%`);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        clients,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit),
          has_next: page * limit < total,
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get single client by ID with detailed information
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get client basic info
    const [clients] = await pool.execute(
      `SELECT id, nombre, email, telefono, direccion, empresa, rfc, estado, created_at, updated_at 
       FROM usuarios WHERE id = ? AND rol = 'cliente'`,
      [id]
    );

    if (clients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const client = clients[0];

    // Get client projects
    const [projects] = await pool.execute(
      `SELECT id, codigo, nombre, descripcion, estado, categoria, created_at, updated_at
       FROM proyectos WHERE usuario_id = ? ORDER BY created_at DESC`,
      [id]
    );

    // Get client activity history
    const [activities] = await pool.execute(
      `SELECT tipo, descripcion, entidad_tipo, entidad_id, created_at
       FROM actividades WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 20`,
      [id]
    );

    // Get client statistics
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_proyectos,
        COUNT(CASE WHEN estado = 'completado' THEN 1 END) as proyectos_completados,
        COUNT(CASE WHEN estado = 'en_desarrollo' THEN 1 END) as proyectos_en_desarrollo,
        COUNT(CASE WHEN estado = 'planificacion' THEN 1 END) as proyectos_planificacion
       FROM proyectos WHERE usuario_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        client,
        projects,
        activities,
        statistics: stats[0] || {
          total_proyectos: 0,
          proyectos_completados: 0,
          proyectos_en_desarrollo: 0,
          proyectos_planificacion: 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting client by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Create new client
const createClient = async (req, res) => {
  try {
    const {
      nombre,
      email,
      telefono,
      direccion,
      empresa,
      rfc,
      password = 'cliente123' // Default password for new clients
    } = req.body;

    // Check if client already exists
    const [existingClient] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingClient.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este email'
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create client
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre, email, password, telefono, direccion, empresa, rfc, rol, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'cliente', 'activo')`,
      [nombre, email, hashedPassword, telefono, direccion, empresa, rfc]
    );

    const usuarioId = result.insertId;

    // Log activity
    await pool.execute(
      'INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'crear_cliente', `Nuevo cliente creado: ${nombre}`, 'cliente', usuarioId]
    );

    // Notify admins
    await notifyAdmins(
      'nuevo_cliente',
      'Nuevo cliente registrado',
      `Se ha registrado un nuevo cliente: ${nombre} (${empresa})`,
      'normal',
      'cliente',
      usuarioId,
      `/admin/clients/${usuarioId}`
    );

    // Create welcome notification for the new client
    await createSystemNotification(
      usuarioId,
      'bienvenida',
      '¡Bienvenido a Borderless Techno!',
      'Tu cuenta ha sido creada exitosamente. Pronto nos pondremos en contacto contigo.',
      'alta'
    );

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: {
        id: usuarioId,
        nombre,
        email,
        empresa,
        default_password: password
      }
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Update client
const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      email,
      telefono,
      direccion,
      empresa,
      rfc,
      estado
    } = req.body;

    // Check if client exists
    const [existingClient] = await pool.execute(
      'SELECT id, nombre, email FROM usuarios WHERE id = ? AND rol = "cliente"',
      [id]
    );

    if (existingClient.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Check if new email is already taken (excluding current client)
    if (email !== existingClient[0].email) {
      const [emailCheck] = await pool.execute(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con este email'
        });
      }
    }

    // Update client
    await pool.execute(
      `UPDATE usuarios 
       SET nombre = ?, email = ?, telefono = ?, direccion = ?, empresa = ?, rfc = ?, estado = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nombre, email, telefono, direccion, empresa, rfc, estado, id]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'actualizar_cliente', `Cliente actualizado: ${nombre}`, 'cliente', id]
    );

    // Notify client if status changed to active
    if (estado === 'activo' && existingClient[0].estado !== 'activo') {
      await createSystemNotification(
        id,
        'cuenta_activada',
        'Cuenta activada',
        'Tu cuenta ha sido activada. Ya puedes acceder a todos los servicios.',
        'alta'
      );
    }

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Delete client (soft delete - change status to inactive)
const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if client exists and get info
    const [existingClient] = await pool.execute(
      'SELECT id, nombre, email FROM usuarios WHERE id = ? AND rol = "cliente"',
      [id]
    );

    if (existingClient.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Check if client has active projects
    const [activeProjects] = await pool.execute(
      'SELECT COUNT(*) as count FROM proyectos WHERE usuario_id = ? AND estado IN ("en_desarrollo", "planificacion")',
      [id]
    );

    if (activeProjects[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un cliente con proyectos activos'
      });
    }

    // Soft delete - change status to inactive
    await pool.execute(
      'UPDATE usuarios SET estado = "inactivo", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'desactivar_cliente', `Cliente desactivado: ${existingClient[0].nombre}`, 'cliente', id]
    );

    res.json({
      success: true,
      message: 'Cliente desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get client dashboard statistics
const getClientStats = async (req, res) => {
  try {
    // Total clients
    const [totalClients] = await pool.execute(
      'SELECT COUNT(*) as total FROM usuarios WHERE rol = "cliente"'
    );

    // Active clients
    const [activeClients] = await pool.execute(
      'SELECT COUNT(*) as total FROM usuarios WHERE rol = "cliente" AND estado = "activo"'
    );

    // New clients this month
    const [newThisMonth] = await pool.execute(
      `SELECT COUNT(*) as total FROM usuarios 
       WHERE rol = "cliente" AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`
    );

    // Clients by status
    const [statusBreakdown] = await pool.execute(
      `SELECT estado, COUNT(*) as count 
       FROM usuarios WHERE rol = "cliente" 
       GROUP BY estado`
    );

    // Top clients by project count
    const [topClients] = await pool.execute(
      `SELECT 
        u.id, u.nombre, u.empresa,
        COUNT(p.id) as total_proyectos
       FROM usuarios u
       LEFT JOIN proyectos p ON p.usuario_id = u.id
       WHERE u.rol = "cliente" AND u.estado = "activo"
       GROUP BY u.id
       ORDER BY total_proyectos DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        summary: {
          total: totalClients[0].total,
          active: activeClients[0].total,
          new_this_month: newThisMonth[0].total,
          inactive: totalClients[0].total - activeClients[0].total
        },
        status_breakdown: statusBreakdown,
        top_clients: topClients
      }
    });
  } catch (error) {
    console.error('Error getting client stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Send message to client
const sendMessageToClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, titulo, mensaje, prioridad = 'normal' } = req.body;

    // Verify client exists
    const [client] = await pool.execute(
      'SELECT id, nombre FROM usuarios WHERE id = ? AND rol = "cliente"',
      [id]
    );

    if (client.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Create notification for client
    await createSystemNotification(
      id,
      tipo,
      titulo,
      mensaje,
      prioridad,
      'mensaje_admin',
      req.user.id
    );

    // Log activity
    await pool.execute(
      'INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'mensaje_cliente', `Mensaje enviado a cliente: ${client[0].nombre}`, 'cliente', id]
    );

    res.json({
      success: true,
      message: 'Mensaje enviado exitosamente'
    });
  } catch (error) {
    console.error('Error sending message to client:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  sendMessageToClient
};