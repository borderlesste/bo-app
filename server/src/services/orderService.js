const { pool, beginTransaction, commitTransaction, rollbackTransaction } = require('../config/db.js');

const orderService = {
  async getOrders(userId, role) {
    let query = `
      SELECT p.id, p.numero_pedido, p.usuario_id, c.nombre as cliente_nombre, c.email as cliente_email,
             p.descripcion, p.servicio, p.estado, p.prioridad, 
             p.subtotal, p.descuento, p.iva, p.total, p.anticipo, p.saldo_pendiente,
             p.presupuesto_estimado, p.fecha_entrega_deseada,
             p.fecha_inicio, p.fecha_entrega_estimada, p.fecha_entrega_real,
             p.notas_internas, p.notas_adicionales, p.created_by, p.assigned_to, 
             p.created_at, p.updated_at
      FROM pedidos p
      JOIN usuarios c ON p.usuario_id = c.id
    `;
    const params = [];

    if (role !== 'admin') {
      query += ' WHERE p.usuario_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.execute(query, params);
    
    // Procesar los resultados para mostrar mejor información al admin
    const processedOrders = rows.map(order => ({
      ...order,
      // Calcular el valor a mostrar: presupuesto estimado > total > 0
      valor_mostrar: order.presupuesto_estimado > 0 ? order.presupuesto_estimado : 
                     order.total > 0 ? order.total : 0,
      tipo_valor: order.presupuesto_estimado > 0 && order.total === 0 ? 'estimado' :
                  order.total > 0 ? 'final' : 'sin_definir',
      // Formatear información del cliente
      cliente_info: {
        nombre: order.cliente_nombre,
        email: order.cliente_email,
        id: order.usuario_id
      },
      // Información de fechas más clara
      fecha_info: {
        creado: order.created_at,
        inicio: order.fecha_inicio,
        entrega_estimada: order.fecha_entrega_estimada,
        entrega_deseada: order.fecha_entrega_deseada,
        entrega_real: order.fecha_entrega_real
      },
      // Información del servicio
      servicio_info: {
        tipo: order.servicio,
        descripcion: order.descripcion
      }
    }));
    
    return processedOrders;
  },

  async getOrderById(id) {
    const [rows] = await pool.execute(
      `SELECT p.id, p.numero_pedido, p.usuario_id, c.nombre as cliente_nombre, c.email as cliente_email,
              p.descripcion, p.servicio, p.estado, p.prioridad,
              p.subtotal, p.descuento, p.iva, p.total, p.anticipo, p.saldo_pendiente,
              p.presupuesto_estimado, p.fecha_entrega_deseada,
              p.fecha_inicio, p.fecha_entrega_estimada, p.fecha_entrega_real,
              p.notas_internas, p.notas_adicionales, p.created_by, p.assigned_to, 
              p.created_at, p.updated_at
       FROM pedidos p
       JOIN usuarios c ON p.usuario_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      throw new Error('Pedido no encontrado');
    }
    return rows[0];
  },

  // Método específico para dashboard del admin con información completa
  async getOrdersSummaryForAdmin() {
    const query = `
      SELECT p.id, p.numero_pedido, p.usuario_id, p.cotizacion_id,
             c.nombre as cliente_nombre, c.email as cliente_email,
             c.telefono as cliente_telefono, c.empresa as cliente_empresa,
             p.descripcion, p.servicio, p.estado, p.prioridad,
             COALESCE(p.presupuesto_estimado, p.total, 0) as valor_display,
             p.presupuesto_estimado, p.total, p.subtotal, p.descuento, p.iva,
             p.anticipo, p.saldo_pendiente,
             p.fecha_inicio, p.fecha_entrega_estimada, p.fecha_entrega_deseada, p.fecha_entrega_real,
             p.notas_adicionales, p.notas_internas,
             p.created_by, p.assigned_to,
             p.created_at, p.updated_at,
             CASE 
               WHEN p.presupuesto_estimado > 0 AND p.total = 0 THEN 'estimado'
               WHEN p.total > 0 THEN 'final' 
               ELSE 'sin_definir'
             END as tipo_presupuesto,
             -- Información adicional calculada
             DATEDIFF(COALESCE(p.fecha_entrega_deseada, DATE_ADD(NOW(), INTERVAL 30 DAY)), NOW()) as dias_hasta_entrega,
             CASE 
               WHEN p.estado = 'nuevo' THEN 'Recién creado'
               WHEN p.estado = 'confirmado' THEN 'Confirmado por cliente'
               WHEN p.estado = 'en_proceso' THEN 'En desarrollo'
               WHEN p.estado = 'completado' THEN 'Proyecto completado'
               WHEN p.estado = 'cancelado' THEN 'Cancelado'
               WHEN p.estado = 'en_pausa' THEN 'En pausa'
               ELSE p.estado
             END as estado_descripcion,
             CASE 
               WHEN p.prioridad = 'baja' THEN 'Prioridad Baja'
               WHEN p.prioridad = 'normal' THEN 'Prioridad Normal'
               WHEN p.prioridad = 'alta' THEN 'Prioridad Alta'
               WHEN p.prioridad = 'urgente' THEN 'Prioridad Urgente'
               ELSE p.prioridad
             END as prioridad_descripcion
      FROM pedidos p
      JOIN usuarios c ON p.usuario_id = c.id
      ORDER BY p.created_at DESC
    `;
    
    const [rows] = await pool.execute(query);
    
    // Enhance each row with additional computed fields
    return rows.map(order => ({
      ...order,
      // Formatear fechas para mejor legibilidad
      fecha_creacion_formateada: new Date(order.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      fecha_actualizacion_formateada: new Date(order.updated_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      // Información de progreso y estado
      progreso_estimado: this.calculateOrderProgress(order.estado),
      urgencia_nivel: this.calculateUrgencyLevel(order.prioridad, order.dias_hasta_entrega),
      // Información financiera formateada
      valor_formateado: `$${parseFloat(order.valor_display || 0).toFixed(2)}`,
      anticipo_formateado: order.anticipo ? `$${parseFloat(order.anticipo).toFixed(2)}` : 'Sin anticipo',
      saldo_formateado: order.saldo_pendiente ? `$${parseFloat(order.saldo_pendiente).toFixed(2)}` : 'Sin saldo pendiente'
    }));
  },

  // Método auxiliar para calcular progreso estimado
  calculateOrderProgress(estado) {
    const progressMap = {
      'nuevo': 0,
      'confirmado': 20,
      'en_proceso': 60,
      'completado': 100,
      'cancelado': 0,
      'en_pausa': 30
    };
    return progressMap[estado] || 0;
  },

  // Método auxiliar para calcular nivel de urgencia
  calculateUrgencyLevel(prioridad, diasHastaEntrega) {
    if (prioridad === 'urgente') return 'critica';
    if (prioridad === 'alta' && diasHastaEntrega <= 7) return 'alta';
    if (diasHastaEntrega <= 3) return 'alta';
    if (diasHastaEntrega <= 7) return 'media';
    return 'baja';
  },

  async updateOrderPartial(id, updateData) {
    const connection = await pool.getConnection();
    try {
      // Construir query dinámico basado en los campos a actualizar
      const fields = [];
      const values = [];
      
      if (updateData.descripcion !== undefined) {
        fields.push('descripcion = ?');
        values.push(updateData.descripcion);
      }
      if (updateData.estado !== undefined) {
        fields.push('estado = ?');
        values.push(updateData.estado);
      }
      if (updateData.prioridad !== undefined) {
        fields.push('prioridad = ?');
        values.push(updateData.prioridad);
      }
      if (updateData.total !== undefined) {
        fields.push('total = ?');
        values.push(updateData.total);
      }
      if (updateData.fecha_entrega_estimada !== undefined) {
        fields.push('fecha_entrega_estimada = ?');
        values.push(updateData.fecha_entrega_estimada);
      }
      
      // Siempre actualizar updated_at
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id); // Para el WHERE
      
      if (fields.length === 1) { // Solo updated_at
        throw new Error('No hay campos para actualizar');
      }
      
      const query = `UPDATE pedidos SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await connection.execute(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('Pedido no encontrado');
      }
      
      // Devolver el pedido actualizado
      return await this.getOrderById(id);
      
    } finally {
      connection.release();
    }
  },

  async createOrder(usuario_id, orderData) {
    // Generar número de pedido único
    const numero_pedido = `PED-${Date.now()}`;
    
    const {
      servicio,
      descripcion,
      presupuesto_estimado,
      fecha_entrega_deseada,
      prioridad = 'normal',
      notas_adicionales
    } = orderData;

    const [result] = await pool.execute(
      `INSERT INTO pedidos (
        numero_pedido, usuario_id, servicio, descripcion, 
        presupuesto_estimado, fecha_entrega_deseada, 
        prioridad, notas_adicionales, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'nuevo')`,
      [
        numero_pedido, usuario_id, servicio, descripcion,
        presupuesto_estimado, fecha_entrega_deseada,
        prioridad, notas_adicionales
      ]
    );
    
    const [rows] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [result.insertId]);
    return rows[0];
  },

  async updateOrder(id, descripcion, estado, prioridad, total, fecha_entrega_estimada) {
    let connection;
    try {
      if (estado === 'Completado') {
        connection = await beginTransaction();

        // 1. Actualizar el pedido
        const [orderUpdateResult] = await connection.execute(
          'UPDATE pedidos SET descripcion = ?, estado = ?, prioridad = ?, total = ?, fecha_entrega_estimada = ? WHERE id = ?',
          [descripcion, estado, prioridad, total, fecha_entrega_estimada, id]
        );
        if (orderUpdateResult.affectedRows === 0) {
          throw new Error('Pedido no encontrado.');
        }
        
        const [updatedOrderRows] = await connection.execute('SELECT * FROM pedidos WHERE id = ?', [id]);
        const updatedOrder = updatedOrderRows[0];

        // 2. Buscar pagos asociados al pedido
        const [paymentsResult] = await connection.execute(
          'SELECT * FROM pagos WHERE pedido_id = ?',
          [id]
        );

        // 3. Actualizar el estado de los pagos a 'Pendiente' si no están ya en un estado final
        for (const payment of paymentsResult) {
          if (!['Pagado', 'Vencido', 'Rechazado'].includes(payment.estado)) {
            await connection.execute(
              "UPDATE pagos SET estado = 'Pendiente' WHERE id = ?",
              [payment.id]
            );
          }
        }

        await commitTransaction(connection);
        return updatedOrder;
      } else {
        // Lógica de actualización normal si el estado no es 'Completado'
        const [result] = await pool.execute(
          'UPDATE pedidos SET descripcion = ?, estado = ?, prioridad = ?, total = ?, fecha_entrega_estimada = ? WHERE id = ?',
          [descripcion, estado, prioridad, total, fecha_entrega_estimada, id]
        );
        if (result.affectedRows === 0) {
          throw new Error('Pedido no encontrado.');
        }
        const [rows] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [id]);
        return rows[0];
      }
    } catch (err) {
      if (connection) {
        await rollbackTransaction(connection);
      }
      throw err;
    }
  },

  async deleteOrder(id) {
    const [result] = await pool.execute('DELETE FROM pedidos WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new Error('Pedido no encontrado');
    }
    return { message: `Pedido con id ${id} eliminado correctamente` };
  },

  async cancelOrderClient(id, usuario_id) {
    const [orderResult] = await pool.execute('SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?', [id, usuario_id]);

    if (orderResult.length === 0) {
      throw new Error('Pedido no encontrado o no autorizado.');
    }

    await pool.execute(
      "UPDATE pedidos SET estado = 'Cancelado' WHERE id = ?",
      [id]
    );
    const [rows] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [id]);
    return rows[0];
  },

  async resumeOrderClient(id, usuario_id) {
    const [orderResult] = await pool.execute('SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?', [id, usuario_id]);

    if (orderResult.length === 0) {
      throw new Error('Pedido no encontrado o no autorizado.');
    }

    if (orderResult[0].estado !== 'Cancelado') {
      throw new Error('Solo se pueden reanudar pedidos cancelados.');
    }

    await pool.execute(
      "UPDATE pedidos SET estado = 'Pendiente' WHERE id = ?",
      [id]
    );
    const [rows] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [id]);
    return rows[0];
  }
};

module.exports = { orderService };
