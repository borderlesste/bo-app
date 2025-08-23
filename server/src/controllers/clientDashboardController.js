const { pool } = require('../config/db.js');

// Obtener estadísticas del cliente específico
const getClientStats = async (req, res) => {
  try {
    const usuarioId = req.user.id; // Obtenido del middleware de autenticación
    
    // Obtener estadísticas del cliente
    const statsQueries = await Promise.all([
      // Información personal del cliente
      pool.execute('SELECT nombre, email, created_at as fecha_registro, estado FROM usuarios WHERE id = ?', [usuarioId]),
      
      // Proyectos del cliente
      pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado IN ('en_proceso', 'confirmado') THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN estado IN ('nuevo', 'en_pausa') THEN 1 ELSE 0 END) as pending,
          COALESCE(AVG(CASE WHEN presupuesto_estimado > 0 THEN presupuesto_estimado END), 0) as averageValue,
          COALESCE(SUM(CASE WHEN presupuesto_estimado > 0 THEN presupuesto_estimado END), 0) as totalValue
        FROM pedidos 
        WHERE usuario_id = ?
      `, [usuarioId]),
      
      // Pagos del cliente
      pool.execute(`
        SELECT 
          SUM(CASE WHEN estado = 'aplicado' THEN monto ELSE 0 END) as paid,
          SUM(CASE WHEN estado = 'pendiente' THEN monto ELSE 0 END) as pending,
          SUM(CASE WHEN estado = 'rechazado' THEN monto ELSE 0 END) as overdue,
          COUNT(*) as totalPayments
        FROM pagos 
        WHERE usuario_id = ?
      `, [usuarioId]),
      
      // Cotizaciones del cliente
      pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN estado = 'Aprobada' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN estado = 'Rechazada' THEN 1 ELSE 0 END) as rejected
        FROM cotizaciones 
        WHERE email = (SELECT email FROM usuarios WHERE id = ?)
      `, [usuarioId]),
      
      // Notificaciones del cliente
      pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN leida = 0 THEN 1 ELSE 0 END) as unread,
          SUM(CASE WHEN prioridad = 'alta' THEN 1 ELSE 0 END) as urgent
        FROM notificaciones 
        WHERE usuario_id = ?
      `, [usuarioId])
    ]);

    const [
      [personalInfo],
      [projectStats],
      [paymentStats], 
      [quoteStats],
      [notificationStats]
    ] = statsQueries;

    // Procesar información personal
    const clientInfo = personalInfo[0] || {
      nombre: 'Cliente',
      email: 'cliente@ejemplo.com',
      fecha_registro: new Date().toISOString(),
      estado: 'active'
    };

    // Procesar estadísticas
    const projects = projectStats[0] || { total: 0, active: 0, completed: 0, pending: 0, averageValue: 0, totalValue: 0 };
    const payments = paymentStats[0] || { paid: 0, pending: 0, overdue: 0, totalPayments: 0 };
    const quotes = quoteStats[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };
    const notifications = notificationStats[0] || { total: 0, unread: 0, urgent: 0 };

    const clientData = {
      personalInfo: {
        name: clientInfo.nombre,
        email: clientInfo.email,
        joinDate: clientInfo.fecha_registro,
        status: clientInfo.estado
      },
      // Frontend expects these specific field names
      totalProyectos: parseInt(projects.total) || 0,
      proyectosEnProgreso: parseInt(projects.active) || 0,
      proyectosCompletados: parseInt(projects.completed) || 0,
      proyectosPendientes: parseInt(projects.pending) || 0,
      inversionTotal: parseFloat(projects.totalValue) || 0,
      valorPromedio: parseFloat(projects.averageValue) || 0,
      // Keep original structure for compatibility
      projects: {
        active: parseInt(projects.active) || 0,
        completed: parseInt(projects.completed) || 0,
        pending: parseInt(projects.pending) || 0,
        total: parseInt(projects.total) || 0,
        averageValue: parseFloat(projects.averageValue) || 0,
        totalValue: parseFloat(projects.totalValue) || 0
      },
      payments: {
        paid: parseFloat(payments.paid) || 0,
        pending: parseFloat(payments.pending) || 0,
        overdue: parseFloat(payments.overdue) || 0,
        totalPayments: parseInt(payments.totalPayments) || 0,
        nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Mock: 30 días desde ahora
      },
      quotes: {
        pending: parseInt(quotes.pending) || 0,
        approved: parseInt(quotes.approved) || 0,
        rejected: parseInt(quotes.rejected) || 0,
        total: parseInt(quotes.total) || 0
      },
      notifications: {
        unread: parseInt(notifications.unread) || 0,
        total: parseInt(notifications.total) || 0,
        urgent: parseInt(notifications.urgent) || 0
      }
    };

    res.json(clientData);
  } catch (error) {
    console.error('Error al obtener estadísticas del cliente:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas del cliente',
      error: error.message 
    });
  }
};

// Obtener proyectos detallados del cliente
const getClientProjects = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    const [projects] = await pool.execute(`
      SELECT 
        id,
        numero_pedido as numero_order,
        descripcion as name,
        descripcion,
        servicio,
        COALESCE(presupuesto_estimado, total, 0) as value,
        presupuesto_estimado,
        total,
        estado as status,
        prioridad as priority,
        fecha_inicio,
        fecha_entrega_estimada,
        fecha_entrega_deseada,
        created_at as date,
        updated_at as deliveryDate,
        notas_adicionales
      FROM pedidos 
      WHERE usuario_id = ?
      order BY created_at DESC
      LIMIT 20
    `, [usuarioId]);

    // Formatear proyectos
    const formattedProjects = projects.map(project => ({
      id: project.id,
      numero_order: project.numero_order,
      name: project.name || 'Proyecto sin nombre',
      description: project.descripcion || '',
      servicio: project.servicio,
      value: parseFloat(project.value) || 0,
      presupuesto_estimado: parseFloat(project.presupuesto_estimado) || 0,
      total: parseFloat(project.total) || 0,
      status: project.status || 'nuevo',
      priority: project.priority || 'normal',
      date: project.date,
      fecha_inicio: project.fecha_inicio,
      fecha_entrega_estimada: project.fecha_entrega_estimada,
      fecha_entrega_deseada: project.fecha_entrega_deseada,
      deliveryDate: project.deliveryDate,
      notas_adicionales: project.notas_adicionales,
      progress: 0 // Calcular basado en estado si es necesario
    }));

    res.json(formattedProjects);
  } catch (error) {
    console.error('Error al obtener proyectos del cliente:', error);
    res.status(500).json({ 
      message: 'Error al obtener proyectos del cliente',
      error: error.message 
    });
  }
};

// Obtener historial de pagos del cliente
const getClientPayments = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    const [payments] = await pool.execute(`
      SELECT 
        p.id,
        p.numero_pago,
        p.pedido_id,
        p.concepto,
        p.monto,
        p.moneda,
        p.tipo,
        p.estado,
        p.metodo_pago,
        p.referencia,
        p.banco_origen,
        p.fecha_pago,
        p.fecha_aplicacion,
        p.notas,
        p.created_at,
        p.updated_at,
        ped.numero_pedido as numero_order,
        ped.descripcion as order_descripcion
      FROM pagos p
      LEFT JOIN pedidos ped ON p.pedido_id = ped.id
      WHERE p.usuario_id = ?
      order BY p.created_at DESC
      LIMIT 50
    `, [usuarioId]);

    // Formatear pagos
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      numero_pago: payment.numero_pago,
      pedido_id: payment.pedido_id,
      concepto: payment.concepto || 'Pago sin concepto',
      monto: parseFloat(payment.monto) || 0,
      moneda: payment.moneda || 'USD',
      tipo: payment.tipo || 'total',
      estado: payment.estado || 'pendiente',
      metodo_pago: payment.metodo_pago || 'transferencia',
      referencia: payment.referencia,
      banco_origen: payment.banco_origen,
      fecha_pago: payment.fecha_pago,
      fecha_aplicacion: payment.fecha_aplicacion,
      notas: payment.notas,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      // order info
      numero_order: payment.numero_order,
      order_descripcion: payment.order_descripcion
    }));

    res.json(formattedPayments);
  } catch (error) {
    console.error('Error al obtener pagos del cliente:', error);
    res.status(500).json({ 
      message: 'Error al obtener pagos del cliente',
      error: error.message 
    });
  }
};

// Obtener actividad reciente del cliente
const getClientActivity = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    // Actividades del dashboard relacionadas con el cliente
    const [dashboardActivities] = await pool.execute(`
      SELECT 
        'activity' as type,
        descripcion as message,
        created_at as time,
        'normal' as priority
      FROM actividades 
      WHERE usuario_id = ?
      order BY created_at DESC
      LIMIT 10
    `, [usuarioId]);

    // Actividades de proyectos
    const [projectActivities] = await pool.execute(`
      SELECT 
        'project' as type,
        CONCAT('Proyecto "', descripcion, '" cambió a estado: ', estado) as message,
        created_at as time,
        'normal' as priority
      FROM pedidos 
      WHERE usuario_id = ?
      order BY created_at DESC
      LIMIT 5
    `, [usuarioId]);

    // Actividades de pagos
    const [paymentActivities] = await pool.execute(`
      SELECT 
        'payment' as type,
        CONCAT('Pago de , FORMAT(monto, 2), ' - ', concepto, ' (', estado, ')') as message,
        created_at as time,
        CASE 
          WHEN estado = 'Pagado' THEN 'normal'
          WHEN estado = 'Vencido' THEN 'alta'
          ELSE 'baja'
        END as priority
      FROM pagos 
      WHERE usuario_id = ?
      order BY created_at DESC
      LIMIT 5
    `, [usuarioId]);

    // Combinar todas las actividades
    const allActivities = [
      ...dashboardActivities,
      ...projectActivities,
      ...paymentActivities
    ];

    // Ordenar por fecha y tomar las más recientes
    const sortedActivities = allActivities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 15);

    res.json(sortedActivities);
  } catch (error) {
    console.error('Error al obtener actividad del cliente:', error);
    res.status(500).json({ 
      message: 'Error al obtener actividad del cliente',
      error: error.message 
    });
  }
};

// Obtener cotizaciones del cliente
const getClientQuotes = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Obtener email del cliente para buscar cotizaciones
    const [userInfo] = await pool.execute('SELECT email FROM usuarios WHERE id = ?', [usuarioId]);
    
    if (userInfo.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    const clientEmail = userInfo[0].email;
    
    // Construir query con filtros opcionales
    let query = `
      SELECT 
        id,
        titulo as numero_cotizacion,
        nombre as nombre_prospecto,
        email as email_prospecto,
        NULL as telefono_prospecto,
        NULL as empresa_prospecto,
        NULL as tipo_servicio,
        descripcion,
        estado,
        precio_estimado as subtotal,
        0 as descuento,
        0 as iva,
        precio_estimado as total,
        created_at as fecha_emision,
        fecha_expiracion as fecha_vencimiento,
        terminos_condiciones as condiciones_pago,
        notas_internas as notas,
        created_at,
        updated_at
      FROM cotizaciones 
      WHERE email = ?
    `;
    
    const queryParams = [clientEmail];
    
    // Filtrar por estado si se proporciona
    if (status) {
      query += ' AND estado = ?';
      queryParams.push(status);
    }
    
    // Ordenar por fecha de creación descendente
    query += ' order BY created_at DESC';
    
    // Agregar límite y offset para paginación
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const [quotes] = await pool.execute(query, queryParams);
    
    // Obtener total de cotizaciones para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM cotizaciones WHERE email = ?';
    const countParams = [clientEmail];
    
    if (status) {
      countQuery += ' AND estado = ?';
      countParams.push(status);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const totalQuotes = countResult[0].total;
    
    // Formatear cotizaciones
    const formattedQuotes = quotes.map(quote => ({
      id: quote.id,
      numeroConsecutivo: quote.numero_cotizacion,
      tipoServicio: quote.tipo_servicio,
      descripcion: quote.descripcion,
      estado: quote.estado,
      subtotal: parseFloat(quote.subtotal) || 0,
      descuento: parseFloat(quote.descuento) || 0,
      iva: parseFloat(quote.iva) || 0,
      total: parseFloat(quote.total) || 0,
      fechaEmision: quote.fecha_emision,
      fechaVencimiento: quote.fecha_vencimiento,
      condicionesPago: quote.condiciones_pago,
      notas: quote.notas,
      createdAt: quote.created_at,
      updatedAt: quote.updated_at,
      // Campos de cliente
      nombreProspecto: quote.nombre_prospecto,
      emailProspecto: quote.email_prospecto,
      telefonoProspecto: quote.telefono_prospecto,
      empresaProspecto: quote.empresa_prospecto
    }));
    
    res.json({
      success: true,
      data: formattedQuotes,
      pagination: {
        total: totalQuotes,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(totalQuotes / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener cotizaciones del cliente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener cotizaciones del cliente',
      error: error.message 
    });
  }
};

// Actualizar estado de cotización por parte del cliente
const updateClientQuoteStatus = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const quoteId = req.params.id;
    const { status, notas } = req.body;
    
    // Validar estados permitidos para clientes
    const allowedStatuses = ['aceptada', 'rechazada'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido. Los clientes solo pueden aceptar o rechazar cotizaciones.'
      });
    }
    
    // Obtener email del cliente
    const [userInfo] = await pool.execute('SELECT email FROM usuarios WHERE id = ?', [usuarioId]);
    
    if (userInfo.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Cliente no encontrado' 
      });
    }
    
    const clientEmail = userInfo[0].email;
    
    // Verificar que la cotización pertenece al cliente y está en estado válido para cambio
    const [quote] = await pool.execute(
      'SELECT id, estado, email_prospecto FROM cotizaciones WHERE id = ? AND email_prospecto = ?',
      [quoteId, clientEmail]
    );
    
    if (quote.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada o no pertenece al cliente'
      });
    }
    
    const currentQuote = quote[0];
    
    // Verificar que la cotización esté en estado "enviada" para poder ser modificada
    if (currentQuote.estado !== 'enviada') {
      return res.status(400).json({
        success: false,
        message: `No se puede modificar una cotización en estado "${currentQuote.estado}"`
      });
    }
    
    // Actualizar la cotización
    const updateQuery = `
      UPDATE cotizaciones 
      SET estado = ?, notas = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND email_prospecto = ?
    `;
    
    const updateParams = [status, notas || null, quoteId, clientEmail];
    
    const [result] = await pool.execute(updateQuery, updateParams);
    
    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo actualizar la cotización'
      });
    }
    
    // Si la cotización fue aceptada, crear notificación para el admin
    if (status === 'aceptada') {
      try {
        const notificationService = require('../services/notificationService');
        await notificationService.createAdminNotification(
          'cotizacion_aceptada',
          'Cotización Aceptada',
          `El cliente ha aceptado la cotización #${quoteId}`
        );
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // No fallar la operación principal por error de notificación
      }
    }
    
    res.json({
      success: true,
      message: `Cotización ${status === 'aceptada' ? 'aceptada' : 'rechazada'} exitosamente`,
      data: {
        id: quoteId,
        estado: status,
        notas: notas
      }
    });
  } catch (error) {
    console.error('Error al actualizar estado de cotización:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar estado de cotización',
      error: error.message 
    });
  }
};

// Obtener perfil del cliente
const getClientProfile = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    const [user] = await pool.execute(
      'SELECT id, nombre, email, telefono, empresa, direccion, created_at, updated_at FROM usuarios WHERE id = ?',
      [usuarioId]
    );
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    const clientProfile = user[0];
    
    res.json({
      success: true,
      data: {
        id: clientProfile.id,
        nombre: clientProfile.nombre,
        email: clientProfile.email,
        telefono: clientProfile.telefono,
        empresa: clientProfile.empresa,
        direccion: clientProfile.direccion,
        fechaRegistro: clientProfile.created_at,
        ultimaActualizacion: clientProfile.updated_at
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil del cliente',
      error: error.message
    });
  }
};

// Actualizar perfil del cliente
const updateClientProfile = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { nombre, telefono, empresa, direccion } = req.body;
    
    // Validaciones básicas
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      });
    }
    
    // Actualizar perfil (sin email por seguridad)
    const [result] = await pool.execute(
      'UPDATE usuarios SET nombre = ?, telefono = ?, empresa = ?, direccion = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nombre.trim(), telefono || null, empresa || null, direccion || null, usuarioId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    // Obtener datos actualizados
    const [updatedUser] = await pool.execute(
      'SELECT id, nombre, email, telefono, empresa, direccion, updated_at FROM usuarios WHERE id = ?',
      [usuarioId]
    );
    
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        id: updatedUser[0].id,
        nombre: updatedUser[0].nombre,
        email: updatedUser[0].email,
        telefono: updatedUser[0].telefono,
        empresa: updatedUser[0].empresa,
        direccion: updatedUser[0].direccion,
        ultimaActualizacion: updatedUser[0].updated_at
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil del cliente',
      error: error.message
    });
  }
};

// Cambiar contraseña del cliente
const changeClientPassword = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // Obtener contraseña actual del usuario
    const [user] = await pool.execute(
      'SELECT password FROM usuarios WHERE id = ?',
      [usuarioId]
    );
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    // Verificar contraseña actual
    const bcrypt = require('bcrypt');
    const isValidPassword = await bcrypt.compare(currentPassword, user[0].password);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    }
    
    // Hashear nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    const [result] = await pool.execute(
      'UPDATE usuarios SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, usuarioId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar la contraseña'
      });
    }
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña del cliente',
      error: error.message
    });
  }
};

// Obtener pedidos del cliente
const getClientpedidos = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Construir query con filtros opcionales
    let query = `
      SELECT 
        id,
        descripcion,
        estado,
        total,
        created_at as fecha_order,
        updated_at as fecha_entrega,
        'media' as prioridad,
        created_at,
        updated_at
      FROM pedidos 
      WHERE usuario_id = ?
    `;
    
    const queryParams = [usuarioId];
    
    // Filtrar por estado si se proporciona
    if (status) {
      query += ' AND estado = ?';
      queryParams.push(status);
    }
    
    // Ordenar por fecha de creación descendente
    query += ' order BY created_at DESC';
    
    // Agregar límite y offset para paginación
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const [pedidos] = await pool.execute(query, queryParams);
    
    // Obtener total de pedidos para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM pedidos WHERE usuario_id = ?';
    const countParams = [usuarioId];
    
    if (status) {
      countQuery += ' AND estado = ?';
      countParams.push(status);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const totalpedidos = countResult[0].total;
    
    // Formatear pedidos
    const formattedpedidos = pedidos.map(order => ({
      id: order.id,
      descripcion: order.descripcion,
      estado: order.estado,
      total: parseFloat(order.total) || 0,
      fechaorder: order.fecha_order,
      fechaEntrega: order.fecha_entrega,
      prioridad: order.prioridad || 'media',
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));
    
    res.json({
      success: true,
      data: formattedpedidos,
      pagination: {
        total: totalpedidos,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(totalpedidos / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener pedidos del cliente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener pedidos del cliente',
      error: error.message 
    });
  }
};

// Actualizar estado de order por parte del cliente (solo cancelar)
const updateClientpedidostatus = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const orderId = req.params.id;
    const { status, notas } = req.body;
    
    // Validar estados permitidos para clientes
    const allowedStatuses = ['cancelado', 'pausado', 'activo'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido. Los clientes solo pueden cancelar, pausar o reactivar pedidos.'
      });
    }
    
    // Verificar que el order pertenece al cliente
    const [order] = await pool.execute(
      'SELECT id, estado, usuario_id FROM pedidos WHERE id = ? AND usuario_id = ?',
      [orderId, usuarioId]
    );
    
    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'order no encontrado o no pertenece al cliente'
      });
    }
    
    const currentorder = order[0];
    
    // Verificar que el order esté en estado válido para ser modificado
    const validStatesForChange = ['pendiente', 'en progreso', 'pausado', 'activo'];
    if (!validStatesForChange.includes(currentorder.estado.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `No se puede modificar un order en estado "${currentorder.estado}"`
      });
    }
    
    // Actualizar el order
    const updateQuery = `
      UPDATE pedidos 
      SET estado = ?, notas = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND usuario_id = ?
    `;
    
    const updateParams = [status, notas || null, orderId, usuarioId];
    
    const [result] = await pool.execute(updateQuery, updateParams);
    
    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo actualizar el order'
      });
    }
    
    // Crear notificación para el admin si el order fue cancelado
    if (status === 'cancelado') {
      try {
        const notificationService = require('../services/notificationService');
        await notificationService.createAdminNotification(
          'order_cancelado',
          'order Cancelado',
          `El cliente ha cancelado el order #${orderId}`
        );
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // No fallar la operación principal por error de notificación
      }
    }
    
    res.json({
      success: true,
      message: `order ${status} exitosamente`,
      data: {
        id: orderId,
        estado: status,
        notas: notas
      }
    });
  } catch (error) {
    console.error('Error al actualizar estado de order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar estado de order',
      error: error.message 
    });
  }
};

// Obtener conversaciones del cliente
const getClientConversations = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    // Check if mensajes table exists, if not return empty array
    const [conversations] = await pool.execute(`
      SELECT
        m.id,
        m.asunto,
        m.contenido as ultimo_mensaje_contenido,
        m.created_at,
        m.updated_at,
        m.estado,
        u.nombre as remitente
      FROM mensajes m
      LEFT JOIN usuarios u ON u.id = m.remitente_id
      WHERE m.destinatario_id = ? OR m.remitente_id = ?
      order BY m.updated_at DESC
      LIMIT 20
    `, [usuarioId, usuarioId]);

    const formattedConversations = conversations.map(conv => ({
      id: conv.id || null,
      asunto: conv.asunto || 'Sin asunto',
      ultimo_mensaje: {
        contenido: conv.ultimo_mensaje_contenido || 'Sin mensajes'
      },
      created_at: conv.created_at,
      updated_at: conv.updated_at || conv.created_at,
      estado: conv.estado || 'activo',
      remitente: conv.remitente || 'Sistema'
    }));

    res.json({
      success: true,
      data: formattedConversations
    });
  } catch (error) {
    console.error('Error al obtener conversaciones del cliente:', error);
    
    // If table doesn't exist, return empty data instead of error
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
};

// Obtener facturas del cliente
const getClientInvoices = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { estado, search, fecha_desde, fecha_hasta, limit = 50, offset = 0 } = req.query;
    
    // Construir query con filtros opcionales
    let query = `
      SELECT 
        f.id,
        f.numero_factura,
        f.usuario_id,
        f.pedido_id,
        f.pago_id,
        f.concepto,
        f.subtotal,
        f.iva,
        f.total,
        f.estado,
        f.fecha_emision,
        f.fecha_vencimiento,
        f.metodo_pago,
        f.moneda,
        f.notas,
        f.referencia_transferencia,
        f.created_at,
        f.updated_at,
        ped.numero_pedido,
        ped.descripcion as pedido_descripcion
      FROM facturas f
      LEFT JOIN pedidos ped ON f.pedido_id = ped.id
      WHERE f.usuario_id = ?
    `;
    
    const queryParams = [usuarioId];
    
    // Filtrar por estado si se proporciona
    if (estado) {
      query += ' AND f.estado = ?';
      queryParams.push(estado);
    }

    // Filtrar por búsqueda si se proporciona
    if (search) {
      query += ' AND (f.numero_factura LIKE ? OR f.concepto LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // Filtrar por fechas si se proporciona
    if (fecha_desde) {
      query += ' AND f.fecha_emision >= ?';
      queryParams.push(fecha_desde);
    }

    if (fecha_hasta) {
      query += ' AND f.fecha_emision <= ?';
      queryParams.push(fecha_hasta);
    }
    
    // Ordenar por fecha de emisión descendente
    query += ' ORDER BY f.fecha_emision DESC';
    
    // Agregar límite y offset para paginación
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const [facturas] = await pool.execute(query, queryParams);
    
    // Obtener total de facturas para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM facturas WHERE usuario_id = ?';
    const countParams = [usuarioId];
    
    if (estado) {
      countQuery += ' AND estado = ?';
      countParams.push(estado);
    }

    if (search) {
      countQuery += ' AND (numero_factura LIKE ? OR concepto LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (fecha_desde) {
      countQuery += ' AND fecha_emision >= ?';
      countParams.push(fecha_desde);
    }

    if (fecha_hasta) {
      countQuery += ' AND fecha_emision <= ?';
      countParams.push(fecha_hasta);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const totalFacturas = countResult[0].total;
    
    // Formatear facturas
    const formattedFacturas = facturas.map(factura => ({
      id: factura.id,
      numero_factura: factura.numero_factura,
      usuario_id: factura.usuario_id,
      pedido_id: factura.pedido_id,
      pago_id: factura.pago_id,
      concepto: factura.concepto,
      subtotal: parseFloat(factura.subtotal) || 0,
      iva: parseFloat(factura.iva) || 0,
      total: parseFloat(factura.total) || 0,
      estado: factura.estado,
      fecha_emision: factura.fecha_emision,
      fecha_vencimiento: factura.fecha_vencimiento,
      metodo_pago: factura.metodo_pago,
      moneda: factura.moneda,
      notas: factura.notas,
      referencia_transferencia: factura.referencia_transferencia,
      created_at: factura.created_at,
      updated_at: factura.updated_at,
      // Información del pedido relacionado
      numero_pedido: factura.numero_pedido,
      pedido_descripcion: factura.pedido_descripcion,
      // Información adicional calculada
      dias_vencimiento: factura.fecha_vencimiento ? 
        Math.ceil((new Date(factura.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)) : null,
      esta_vencida: factura.fecha_vencimiento ? 
        new Date() > new Date(factura.fecha_vencimiento) && factura.estado !== 'pagada' : false
    }));
    
    res.json({
      success: true,
      data: formattedFacturas,
      pagination: {
        total: totalFacturas,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(totalFacturas / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener facturas del cliente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener facturas del cliente',
      error: error.message 
    });
  }
};

module.exports = {
  getClientStats,
  getClientProjects,
  getClientPayments,
  getClientActivity,
  getClientQuotes,
  updateClientQuoteStatus,
  getClientProfile,
  updateClientProfile,
  changeClientPassword,
  getClientpedidos,
  updateClientpedidostatus,
  getClientConversations,
  getClientInvoices
};