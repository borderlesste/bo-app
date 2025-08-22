const { validationResult } = require('express-validator');
const { pedidoService } = require('../services/pedidoService.js');
const notificationService = require('../services/notificationService.js');

// Obtener todos los pedidos (admin) o los pedidos de un usuario (cliente)
exports.getPedidos = async (req, res) => {
  try {
    const pedidos = await pedidoService.getPedidos(req.user.id, req.user.rol);
    res.json({
      success: true,
      data: pedidos
    });
  } catch (err) {
    console.error('Error fetching pedidos:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los pedidos.' 
    });
  }
};

// Obtener resumen de pedidos para admin (con información completa)
exports.getpedidosSummaryForAdmin = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden acceder a este endpoint.'
      });
    }

    const pedidos = await pedidoservice.getpedidosSummaryForAdmin();
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
exports.getpedidoById = async (req, res) => {
  const { id } = req.params;
  try {
    const pedido = await pedidoservice.getpedidoById(id);
    res.json(pedido);
  } catch (error) {
    console.error(`Error fetching pedido with id ${id}:`, error);
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo pedido
exports.createpedido = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const pedidoData = req.body;
  const usuario_id = req.user.id; // Obtener el ID del usuario autenticado

  try {
    const newpedido = await pedidoservice.createpedido(usuario_id, pedidoData);
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
exports.updatepedido = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  
  try {
    // Obtener el pedido antes de actualizarlo para comparar estados
    const originalpedido = await pedidoservice.getpedidoById(id);
    
    // Solo pasar los campos que fueron enviados en el request
    const updateData = {};
    if (req.body.descripcion !== undefined) updateData.descripcion = req.body.descripcion;
    if (req.body.estado !== undefined) updateData.estado = req.body.estado;
    if (req.body.prioridad !== undefined) updateData.prioridad = req.body.prioridad;
    if (req.body.total !== undefined) updateData.total = req.body.total;
    if (req.body.fecha_entrega_estimada !== undefined) updateData.fecha_entrega_estimada = req.body.fecha_entrega_estimada;
    
    const updatedpedido = await pedidoservice.updatepedidoPartial(id, updateData);

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

// Cancelar un pedido (cliente)
exports.cancelpedidoClient = async (req, res) => {
  const { id } = req.params;
  try {
    const canceledpedido = await pedidoservice.cancelpedidoClient(id, req.user.id);
    res.json(canceledpedido);
  } catch (err) {
    console.error(`Error canceling pedido with id ${id} by client ${req.user.id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// Reanudar un pedido (cliente)
exports.resumepedidoClient = async (req, res) => {
  const { id } = req.params;
  try {
    const resumedpedido = await pedidoservice.resumepedidoClient(id, req.user.id);
    res.json(resumedpedido);
  } catch (err) {
    console.error(`Error resuming pedido with id ${id} by client ${req.user.id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// Eliminar un pedido
exports.deletepedido = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pedidoservice.deletepedido(id);
    res.status(200).json(result);
  } catch (err) {
    console.error(`Error deleting pedido with id ${id}:`, err);
    res.status(500).json({ message: err.message });
  }
};
