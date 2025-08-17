const { validationResult } = require('express-validator');
const { orderService } = require('../services/orderService.js');
const notificationService = require('../services/notificationService.js');

// Obtener todos los pedidos (admin) o los pedidos de un usuario (cliente)
exports.getOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrders(req.user.id, req.user.rol);
    res.json({
      success: true,
      data: orders
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los pedidos.' 
    });
  }
};

// Obtener resumen de pedidos para admin (con información completa)
exports.getOrdersSummaryForAdmin = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden acceder a este endpoint.'
      });
    }

    const orders = await orderService.getOrdersSummaryForAdmin();
    res.json({
      success: true,
      data: orders
    });
  } catch (err) {
    console.error('Error fetching orders summary for admin:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el resumen de pedidos.' 
    });
  }
};

// Obtener un pedido por ID
exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await orderService.getOrderById(id);
    res.json(order);
  } catch (error) {
    console.error(`Error fetching order with id ${id}:`, error);
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo pedido
exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const orderData = req.body;
  const usuario_id = req.user.id; // Obtener el ID del usuario autenticado

  try {
    const newOrder = await orderService.createOrder(usuario_id, orderData);
    res.status(201).json({ 
      success: true, 
      message: 'Solicitud enviada correctamente',
      data: newOrder 
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear el pedido.' 
    });
  }
};

// Actualizar un pedido
exports.updateOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  
  try {
    // Obtener el pedido antes de actualizarlo para comparar estados
    const originalOrder = await orderService.getOrderById(id);
    
    // Solo pasar los campos que fueron enviados en el request
    const updateData = {};
    if (req.body.descripcion !== undefined) updateData.descripcion = req.body.descripcion;
    if (req.body.estado !== undefined) updateData.estado = req.body.estado;
    if (req.body.prioridad !== undefined) updateData.prioridad = req.body.prioridad;
    if (req.body.total !== undefined) updateData.total = req.body.total;
    if (req.body.fecha_entrega_estimada !== undefined) updateData.fecha_entrega_estimada = req.body.fecha_entrega_estimada;
    
    const updatedOrder = await orderService.updateOrderPartial(id, updateData);

    // Si cambió el estado, crear notificación
    if (updateData.estado && updateData.estado !== originalOrder.estado) {
      try {
        await notificationService.notifyOrderStatusChange(
          { id, servicio: originalOrder.servicio },
          updateData.estado,
          originalOrder.usuario_id
        );

        // Si el pedido se completó, crear notificación especial
        if (updateData.estado === 'completado') {
          await notificationService.notifyProjectCompleted(
            { servicio: originalOrder.servicio },
            originalOrder.usuario_id
          );
        }
      } catch (notificationError) {
        console.log('⚠️ Error creando notificación de cambio de estado:', notificationError);
      }
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error(`Error updating order with id ${id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// Cancelar un pedido (cliente)
exports.cancelOrderClient = async (req, res) => {
  const { id } = req.params;
  try {
    const canceledOrder = await orderService.cancelOrderClient(id, req.user.id);
    res.json(canceledOrder);
  } catch (err) {
    console.error(`Error canceling order with id ${id} by client ${req.user.id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// Reanudar un pedido (cliente)
exports.resumeOrderClient = async (req, res) => {
  const { id } = req.params;
  try {
    const resumedOrder = await orderService.resumeOrderClient(id, req.user.id);
    res.json(resumedOrder);
  } catch (err) {
    console.error(`Error resuming order with id ${id} by client ${req.user.id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// Eliminar un pedido
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await orderService.deleteOrder(id);
    res.status(200).json(result);
  } catch (err) {
    console.error(`Error deleting order with id ${id}:`, err);
    res.status(500).json({ message: err.message });
  }
};
