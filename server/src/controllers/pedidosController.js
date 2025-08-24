const { validationResult } = require('express-validator');
const { pedidoService } = require('../services/pedidoService.js');
const notificationService = require('../services/notificationService.js');

// Obtener todos los pedidos (admin) o los pedidos de un usuario (cliente)
exports.getPedidos = async (req, res) => {
  console.log('📋 Starting getPedidos request for user:', req.user.id, 'role:', req.user.rol);
  
  try {
    console.log('📋 Calling pedidoService.getPedidos...');
    const startTime = Date.now();
    
    const pedidos = await pedidoService.getPedidos(req.user.id, req.user.rol);
    
    const endTime = Date.now();
    console.log(`📋 getPedidos completed in ${endTime - startTime}ms, found ${pedidos.length} pedidos`);
    
    res.json({
      success: true,
      data: pedidos
    });
  } catch (err) {
    console.error('❌ Error fetching pedidos:', err);
    
    // Handle specific database timeout errors
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('🔄 Database connection timeout detected');
      return res.status(503).json({ 
        success: false,
        message: 'Servicio temporalmente no disponible. Reintentando conexión...'
      });
    }
    
    // Handle network unreachable errors
    if (err.code === 'ENETUNREACH') {
      console.error('🌐 Network unreachable to database server');
      return res.status(503).json({ 
        success: false,
        message: 'Servidor de base de datos temporalmente no accesible. Intente nuevamente en unos momentos.'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los pedidos.' 
    });
  }
};

// Obtener resumen de pedidos para admin (con información completa)
exports.getPedidosSummaryForAdmin = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden acceder a este endpoint.'
      });
    }

    const pedidos = await pedidoService.getPedidosSummaryForAdmin();
    res.json({
      success: true,
      data: pedidos
    });
  } catch (err) {
    console.error('Error fetching pedidos summary for admin:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el resumen de pedidos.' 
    });
  }
};

// Obtener un pedido por ID
exports.getPedidoById = async (req, res) => {
  const { id } = req.params;
  try {
    const pedido = await pedidoService.getPedidoById(id);
    res.json(pedido);
  } catch (error) {
    console.error(`Error fetching pedido with id ${id}:`, error);
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo pedido
exports.createPedido = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const pedidoData = req.body;
  const usuario_id = req.user.id; // Obtener el ID del usuario autenticado

  try {
    const newpedido = await pedidoService.createPedido(usuario_id, pedidoData);
    res.status(201).json({ 
      success: true, 
      message: 'Solicitud enviada correctamente',
      data: newpedido 
    });
  } catch (err) {
    console.error('Error creating pedido:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear el pedido.' 
    });
  }
};

// Actualizar un pedido
exports.updatePedido = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  
  try {
    // Obtener el pedido antes de actualizarlo para comparar estados
    const originalpedido = await pedidoService.getPedidoById(id);
    
    // Solo pasar los campos que fueron enviados en el request
    const updateData = {};
    if (req.body.descripcion !== undefined) updateData.descripcion = req.body.descripcion;
    if (req.body.estado !== undefined) updateData.estado = req.body.estado;
    if (req.body.prioridad !== undefined) updateData.prioridad = req.body.prioridad;
    if (req.body.total !== undefined) updateData.total = req.body.total;
    if (req.body.fecha_entrega_estimada !== undefined) updateData.fecha_entrega_estimada = req.body.fecha_entrega_estimada;
    
    const updatedpedido = await pedidoService.updatePedidoPartial(id, updateData);

    // Si cambió el estado, crear notificación
    if (updateData.estado && updateData.estado !== originalpedido.estado) {
      try {
        await notificationService.notifypedidostatusChange(
          { id, servicio: originalpedido.servicio },
          updateData.estado,
          originalpedido.usuario_id
        );

        // Si el pedido se completó, crear notificación especial
        if (updateData.estado === 'completado') {
          await notificationService.notifyProjectCompleted(
            { servicio: originalpedido.servicio },
            originalpedido.usuario_id
          );
        }
      } catch (notificationError) {
        console.log('⚠️ Error creando notificación de cambio de estado:', notificationError);
      }
    }

    res.json(updatedpedido);
  } catch (err) {
    console.error(`Error updating pedido with id ${id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// Aceptar un pedido por admin
exports.acceptPedido = async (req, res) => {
  const { id } = req.params;
  const { total, fecha_entrega_estimada, notas_internas } = req.body;

  try {
    // Verificar que es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden aceptar pedidos'
      });
    }

    // Obtener el pedido
    const pedido = await pedidoService.getPedidoById(id);
    
    if (pedido.estado !== 'nuevo') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden aceptar pedidos en estado "nuevo"'
      });
    }

    // Actualizar pedido con información del admin
    const updateData = {
      estado: 'confirmado',
      total: total,
      fecha_entrega_estimada: fecha_entrega_estimada
    };

    if (notas_internas) {
      updateData.notas_internas = notas_internas;
    }

    const updatedPedido = await pedidoService.updatePedidoPartial(id, updateData);

    // Enviar notificación al cliente
    try {
      await notificationService.notifypedidostatusChange(
        { id, servicio: pedido.servicio },
        'confirmado',
        pedido.usuario_id
      );
    } catch (notificationError) {
      console.log('⚠️ Error enviando notificación de aceptación:', notificationError);
    }

    res.json({
      success: true,
      message: 'Pedido aceptado exitosamente',
      data: updatedPedido
    });
  } catch (err) {
    console.error(`Error accepting pedido with id ${id}:`, err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Cancelar un pedido (cliente)
exports.cancelPedidoClient = async (req, res) => {
  const { id } = req.params;
  try {
    const canceledpedido = await pedidoService.cancelPedidoClient(id, req.user.id);
    res.json(canceledpedido);
  } catch (err) {
    console.error(`Error canceling pedido with id ${id} by client ${req.user.id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// Reanudar un pedido (cliente)
exports.resumePedidoClient = async (req, res) => {
  const { id } = req.params;
  try {
    const resumedpedido = await pedidoService.resumePedidoClient(id, req.user.id);
    res.json(resumedpedido);
  } catch (err) {
    console.error(`Error resuming pedido with id ${id} by client ${req.user.id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// Obtener el status de un pedido específico
exports.getPedidoStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const pedido = await pedidoService.getPedidoById(id);
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: pedido.id,
        numero_pedido: pedido.numero_pedido,
        estado: pedido.estado,
        prioridad: pedido.prioridad,
        fecha_inicio: pedido.fecha_inicio,
        fecha_entrega_estimada: pedido.fecha_entrega_estimada,
        fecha_entrega_real: pedido.fecha_entrega_real,
        updated_at: pedido.updated_at
      }
    });
  } catch (err) {
    console.error(`Error getting status for pedido with id ${id}:`, err);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el estado del pedido',
      error: err.message 
    });
  }
};

// Eliminar un pedido
exports.deletePedido = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pedidoService.deletePedido(id);
    res.status(200).json(result);
  } catch (err) {
    console.error(`Error deleting pedido with id ${id}:`, err);
    res.status(500).json({ message: err.message });
  }
};
