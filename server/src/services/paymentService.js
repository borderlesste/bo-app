const { pool } = require('../config/db.js');

const paymentService = {
  async getPayments(userId, role) {
    let query = `
      SELECT 
        p.id, p.usuario_id, c.nombre as clientName, 
        p.concepto as concept, p.monto as amount, p.metodo_pago as method, p.estado as status, p.fecha_pago as paymentDate, p.referencia as transactionId
      FROM pagos p
      JOIN usuarios c ON p.usuario_id = c.id
    `;
    const params = [];

    if (role !== 'admin') {
      query += ' WHERE p.usuario_id = ?';
      params.push(userId);
    }
    
    query += ' order BY p.fecha_pago DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async getPaymentById(id) {
    const [rows] = await pool.execute(
      `SELECT 
        p.id, p.usuario_id, c.nombre as clientName, 
        p.concepto as concept, p.monto as amount, p.metodo_pago as method, p.estado as status, p.fecha_pago as paymentDate, p.referencia as transactionId
       FROM pagos p
       JOIN usuarios c ON p.usuario_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      throw new Error('Pago no encontrado');
    }
    return rows[0];
  },

  async createPayment(usuario_id, pedido_id, concepto, monto, metodo, estado, referencia, banco_origen, paypal_order_id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Determine payment type and corrected state
      let tipo = 'total'; // Default to total payment
      const estadoCorregido = estado ? estado.toLowerCase() : 'pendiente';
      
      // Map payment method to enum values
      const metodoPagoMapped = this.mapPaymentMethod(metodo);
      
      // Create payment record
      const [result] = await connection.execute(
        'INSERT INTO pagos (numero_pago, usuario_id, pedido_id, tipo, concepto, monto, metodo_pago, estado, referencia, banco_origen, paypal_order_id, fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [
          `PAY-${Date.now()}`, 
          usuario_id, 
          pedido_id, 
          tipo, 
          concepto, 
          monto, 
          metodoPagoMapped, 
          estadoCorregido, 
          referencia || null, 
          banco_origen || null,
          paypal_order_id || null
        ]
      );
      
      const paymentId = result.insertId;
      
      // If payment is completed/applied, update order status automatically
      if (estadoCorregido === 'aplicado' || estadoCorregido === 'completado' || estadoCorregido === 'pagado') {
        await this.updatepedidostatusOnPayment(connection, pedido_id, usuario_id, monto);
      }
      
      await connection.commit();
      
      // Get the created payment
      const [rows] = await pool.execute('SELECT * FROM pagos WHERE id = ?', [paymentId]);
      return rows[0];
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Helper method to map payment methods to enum values
  mapPaymentMethod(metodo) {
    const methodMap = {
      'paypal': 'paypal',
      'PayPal': 'paypal',
      'transferencia': 'transferencia',
      'Transferencia Bancaria': 'transferencia',
      'tarjeta': 'tarjeta',
      'efectivo': 'efectivo',
      'cheque': 'cheque',
      'otro': 'otro'
    };
    return methodMap[metodo] || 'otro';
  },

  async updatePayment(id, usuario_id, pedido_id, concepto, monto, metodo, estado, referencia, banco_origen) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const estadoCorregido = estado ? estado.toLowerCase() : 'pendiente';
      const metodoPagoMapped = this.mapPaymentMethod(metodo);
      
      // Get previous payment state
      const [previousPayment] = await connection.execute('SELECT estado, pedido_id, usuario_id FROM pagos WHERE id = ?', [id]);
      if (previousPayment.length === 0) {
        throw new Error('Pago no encontrado.');
      }
      
      const previousState = previousPayment[0].estado;
      const paymentorderId = pedido_id || previousPayment[0].pedido_id;
      const paymentUsuarioId = usuario_id || previousPayment[0].usuario_id;
      
      // Update payment
      const [result] = await connection.execute(
        'UPDATE pagos SET usuario_id = ?, pedido_id = ?, concepto = ?, monto = ?, metodo_pago = ?, estado = ?, referencia = ?, banco_origen = ?, updated_at = NOW() WHERE id = ?',
        [
          paymentUsuarioId, 
          paymentorderId, 
          concepto, 
          monto, 
          metodoPagoMapped, 
          estadoCorregido, 
          referencia || null, 
          banco_origen || null, 
          id
        ]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Pago no encontrado.');
      }
      
      // If payment status changed to completed/applied, update order status
      const wasNotCompleted = !['aplicado', 'completado', 'pagado'].includes(previousState);
      const isNowCompleted = ['aplicado', 'completado', 'pagado'].includes(estadoCorregido);
      
      if (wasNotCompleted && isNowCompleted && paymentorderId) {
        await this.updatepedidostatusOnPayment(connection, paymentorderId, paymentUsuarioId, monto);
      }
      
      await connection.commit();
      
      const [rows] = await pool.execute('SELECT * FROM pagos WHERE id = ?', [id]);
      return rows[0];
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Method to update order status when payment is completed
  async updatepedidostatusOnPayment(connection, pedido_id, usuario_id, monto) {
    if (!pedido_id) return;
    
    try {
      // Get current order information
      const [orderInfo] = await connection.execute(
        'SELECT estado, presupuesto_estimado, total, usuario_id FROM pedidos WHERE id = ?',
        [pedido_id]
      );
      
      if (orderInfo.length === 0) {
        console.log('⚠️ order no encontrado para actualizar estado:', pedido_id);
        return;
      }
      
      const order = orderInfo[0];
      
      // Verify the payment belongs to the correct user
      if (order.usuario_id !== usuario_id) {
        console.log('⚠️ El pago no pertenece al usuario del order');
        return;
      }
      
      // Calculate total paid amount for this order
      const [paymentSum] = await connection.execute(
        'SELECT SUM(monto) as total_pagado FROM pagos WHERE pedido_id = ? AND estado IN ("aplicado", "completado", "pagado")',
        [pedido_id]
      );
      
      const totalPagado = parseFloat(paymentSum[0].total_pagado || 0);
      const expectedAmount = parseFloat(order.presupuesto_estimado || order.total || 0);
      
      console.log(`💰 Pago procesado: $${monto}, Total pagado: $${totalPagado}, Esperado: $${expectedAmount}`);
      
      // Only update to 'completado' if:
      // 1. order is not already completed
      // 2. Payment covers the expected amount (with 1% tolerance for rounding)
      const tolerance = expectedAmount * 0.01; // 1% tolerance
      const isFullyPaid = totalPagado >= (expectedAmount - tolerance);
      
      if (order.estado !== 'completado' && isFullyPaid && expectedAmount > 0) {
        // Update order status to completed
        await connection.execute(
          'UPDATE pedidos SET estado = "completado", fecha_entrega_real = NOW(), updated_at = NOW() WHERE id = ?',
          [pedido_id]
        );
        
        console.log(`✅ order #${pedido_id} actualizado a estado "completado" tras pago completo`);
        
        // Log the activity (if logging service is available)
        try {
          await connection.execute(
            'INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [usuario_id, 'pago_completado', `order completado automáticamente tras recibir pago de $${monto}`, 'order', pedido_id]
          );
        } catch (logError) {
          console.log('⚠️ Error registrando actividad:', logError.message);
        }
      } else if (!isFullyPaid) {
        console.log(`⏳ Pago parcial registrado. Faltan $${(expectedAmount - totalPagado).toFixed(2)} para completar el order.`);
      } else if (order.estado === 'completado') {
        console.log('ℹ️ El order ya está completado.');
      }
      
    } catch (error) {
      console.error('❌ Error actualizando estado del order tras pago:', error.message);
      throw error;
    }
  },

  async deletePayment(id) {
    const [result] = await pool.execute('DELETE FROM pagos WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new Error('Pago no encontrado');
    }
    return { message: `Pago con id ${id} eliminado correctamente` };
  }
};

module.exports = { paymentService };
