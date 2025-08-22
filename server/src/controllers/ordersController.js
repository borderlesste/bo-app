const { validationResult } = require('express-validator');
const { pedidoservice } = require('../services/pedidoService.js');
const notificationService = require('../services/notificationService.js');

// Obtener todos los pedidos (admin) o los pedidos de un usuario (cliente)
exports.getpedidos = async (req, res) => {
  try {
    const pedidos = await pedidoservice.getpedidos(req.user.id, req.user.rol);
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

// Obtener un order por ID
exports.getpedidoById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await pedidoservice.getorderById(id);
    res.json(order);
  } catch (error) {
    console.error(`Error fetching order with id ${id}:`, error);
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo order
exports.createpedido = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const orderData = req.body;
  const usuario_id = req.user.id; // Obtener el ID del usuario autenticado

  try {
    const neworder = await pedidoservice.createorder(usuario_id, orderData);
    res.status(201).json({ 
      success: true, 
      message: 'Solicitud enviada correctamente',
      data: neworder 
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear el order.' 
    });
  }
};

// Actualizar un order
exports.updatepedido = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  
  try {
    // Obtener el order antes de actualizarlo para comparar estados
    const originalorder = await pedidoservice.getorderById(id);
    
    // Solo pasar los campos que fueron enviados en el request
    const updateData = {};
    if (req.body.descripcion !== undefined) updateData.descripcion = req.body.descripcion;
    if (req.body.estado !== undefined) updateData.estado = req.body.estado;
    if (req.body.prioridad !== undefined) updateData.prioridad = req.body.prioridad;
    if (req.body.total !== undefined) updateData.total = req.body.total;
    if (req.body.fecha_entrega_estimada !== undefined) updateData.fecha_entrega_estimada = req.body.fecha_entrega_estimada;
    
    const updatedorder = await pedidoservice.updateorderPartial(id, updateData);

    // Si cambió el estado, crear notificación
    if (updateData.estado && updateData.estado !== originalorder.estado) {
      try {
        await notificationService.notifypedidostatusChange(
          { id, servicio: originalorder.servicio },
          updateData.estado,
          originalorder.usuario_id
        );

        // Si el order se completó, crear notificación especial
        if (updateData.estado === 'completado') {
          await notificationService.notifyProjectCompleted(
            { servicio: originalorder.servicio },
            originalorder.usuario_id
          );
        }
      } catch (notificationError) {
        console.log('⚠️ Error creando notificación de cambio de estado:', notificationError);
      }
    }

    res.json(updatedorder);
  } catch (err) {
    console.error(`Error updating order with id ${id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// Cancelar un order (cliente)
exports.cancelpedidoUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const canceledorder = await pedidoservice.cancelorderClient(id, req.user.id);
    res.json(canceledorder);
  } catch (err) {
    console.error(`Error canceling order with id ${id} by client ${req.user.id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// Reanudar un order (cliente)
exports.resumepedidoUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const resumedorder = await pedidoservice.resumeorderClient(id, req.user.id);
    res.json(resumedorder);
  } catch (err) {
    console.error(`Error resuming order with id ${id} by client ${req.user.id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// Eliminar un order
exports.deletepedido = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pedidoservice.deleteorder(id);
    res.status(200).json(result);
  } catch (err) {
    console.error(`Error deleting order with id ${id}:`, err);
    res.status(500).json({ message: err.message });
  }
};
