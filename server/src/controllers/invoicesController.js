const { pool } = require('../config/db.js');

const invoicesController = {
  // Get all invoices with pagination and filters
  getAllInvoices: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        estado = '',
        usuario_id = '',
        fecha_inicio = '',
        fecha_fin = '',
        sortBy = 'created_at',
        sortorder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build WHERE clause
      let whereConditions = [];
      let queryParams = [];

      if (search) {
        whereConditions.push('(f.numero_factura LIKE ? OR f.titulo LIKE ? OR u.nombre LIKE ? OR u.empresa LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (estado) {
        whereConditions.push('f.estado = ?');
        queryParams.push(estado);
      }

      if (usuario_id) {
        whereConditions.push('f.usuario_id = ?');
        queryParams.push(usuario_id);
      }

      if (fecha_inicio) {
        whereConditions.push('f.fecha_emision >= ?');
        queryParams.push(fecha_inicio);
      }

      if (fecha_fin) {
        whereConditions.push('f.fecha_emision <= ?');
        queryParams.push(fecha_fin);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // Main query with client information
      const query = `
        SELECT 
          f.*,
          u.nombre as cliente_nombre,
          u.empresa as cliente_empresa,
          u.email as cliente_email,
          u.telefono as cliente_telefono,
          CASE 
            WHEN f.estado = 'pagada' THEN 'pagada'
            WHEN f.fecha_vencimiento < CURDATE() AND f.estado NOT IN ('pagada', 'cancelada') THEN 'vencida'
            ELSE f.estado
          END as estado_calculado,
          DATEDIFF(CURDATE(), f.fecha_vencimiento) as dias_vencido
        FROM facturas f
        INNER JOIN usuarios u ON f.usuario_id = u.id
        ${whereClause}
        order BY f.${sortBy} ${sortorder}
        LIMIT ? OFFSET ?
      `;

      const [invoices] = await pool.execute(query, [...queryParams, parseInt(limit), offset]);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM facturas f
        INNER JOIN usuarios u ON f.usuario_id = u.id
        ${whereClause}
      `;

      const [countResult] = await pool.execute(countQuery, queryParams);
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          invoices,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: total,
            per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener facturas',
        error: error.message
      });
    }
  },

  // Get single invoice by ID
  getInvoiceById: async (req, res) => {
    try {
      const { id } = req.params;

      // Get invoice with client and related data
      const [invoices] = await pool.execute(`
        SELECT 
          f.*,
          u.nombre as cliente_nombre,
          u.empresa as cliente_empresa,
          u.email as cliente_email,
          u.telefono as cliente_telefono,
          u.direccion as cliente_direccion,
          u.rfc as cliente_rfc,
          c.titulo as cotizacion_titulo,
          p.nombre as proyecto_titulo,
          COALESCE(pagos_sum.total_pagado, 0) as total_pagado
        FROM facturas f
        INNER JOIN usuarios u ON f.usuario_id = u.id
        LEFT JOIN cotizaciones c ON f.cotizacion_id = c.id
        LEFT JOIN proyectos p ON f.proyecto_id = p.id
        LEFT JOIN (
          SELECT 
            pa.factura_id,
            SUM(pa.monto_aplicado) as total_pagado
          FROM pago_aplicaciones pa
          INNER JOIN pagos p ON pa.pago_id = p.id
          WHERE p.estado = 'aplicado'
          GROUP BY pa.factura_id
        ) pagos_sum ON f.id = pagos_sum.factura_id
        WHERE f.id = ?
      `, [id]);

      if (invoices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      // Get invoice items
      const [items] = await pool.execute(`
        SELECT * FROM factura_items 
        WHERE factura_id = ? 
        order BY orden ASC, id ASC
      `, [id]);

      // Get applied payments
      const [payments] = await pool.execute(`
        SELECT p.*, pa.monto_aplicado, pa.fecha_aplicacion
        FROM pagos p
        INNER JOIN pago_aplicaciones pa ON p.id = pa.pago_id
        WHERE pa.factura_id = ? 
        order BY pa.fecha_aplicacion DESC
      `, [id]);

      const invoice = {
        ...invoices[0],
        items,
        payments
      };

      res.json({
        success: true,
        data: invoice
      });

    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener factura',
        error: error.message
      });
    }
  },

  // Search users for invoice creation
  searchUsers: async (req, res) => {
    try {
      const { search = '', page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      if (!search || search.length < 2) {
        return res.json({
          success: true,
          data: {
            users: [],
            pagination: {
              current_page: parseInt(page),
              total_pages: 0,
              total_items: 0,
              per_page: parseInt(limit)
            }
          }
        });
      }

      const searchQuery = `
        SELECT 
          id, nombre, email, telefono, empresa, rfc
        FROM usuarios 
        WHERE rol = 'cliente' 
        AND estado = 'activo'
        AND (
          nombre LIKE ? OR 
          email LIKE ? OR 
          telefono LIKE ? OR 
          empresa LIKE ?
        )
        order BY nombre ASC
        LIMIT ? OFFSET ?
      `;

      const searchTerm = `%${search}%`;
      const [users] = await pool.execute(searchQuery, [
        searchTerm, searchTerm, searchTerm, searchTerm,
        parseInt(limit), offset
      ]);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM usuarios 
        WHERE rol = 'cliente' 
        AND estado = 'activo'
        AND (
          nombre LIKE ? OR 
          email LIKE ? OR 
          telefono LIKE ? OR 
          empresa LIKE ?
        )
      `;

      const [countResult] = await pool.execute(countQuery, [
        searchTerm, searchTerm, searchTerm, searchTerm
      ]);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: total,
            per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar usuarios',
        error: error.message
      });
    }
  },

  // Create new invoice
  createInvoice: async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        usuario_id,
        pedido_id,
        titulo,
        descripcion,
        items = [],
        moneda = 'MXN',
        dias_credito = 30,
        notas,
        metodo_pago = 'transferencia',
        forma_pago = '03'
      } = req.body;

      // Validate user exists and is active
      const [userCheck] = await connection.execute(
        'SELECT id, nombre, email FROM usuarios WHERE id = ? AND rol = "cliente" AND estado = "activo"',
        [usuario_id]
      );

      if (userCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no encontrado o no es un cliente activo'
        });
      }

      // Generate invoice number
      const currentYear = new Date().getFullYear();
      const [lastInvoice] = await connection.execute(
        'SELECT numero_factura FROM facturas WHERE numero_factura LIKE ? order BY id DESC LIMIT 1',
        [`FAC-${currentYear}-%`]
      );

      let invoiceNumber;
      if (lastInvoice.length > 0) {
        const lastNumber = parseInt(lastInvoice[0].numero_factura.split('-')[2]);
        const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
        invoiceNumber = `FAC-${currentYear}-${nextNumber}`;
      } else {
        invoiceNumber = `FAC-${currentYear}-0001`;
      }

      // Calculate totals
      let subtotal = 0;
      let totalDescuento = 0;
      let totalIva = 0;
      let total = 0;

      const processedItems = items.map((item, index) => {
        const cantidad = parseFloat(item.cantidad) || 1;
        const precioUnitario = parseFloat(item.precio_unitario) || 0;
        const descuento = parseFloat(item.descuento) || 0;

        const itemSubtotal = cantidad * precioUnitario;
        const descuentoMonto = descuento;
        const subtotalConDescuento = itemSubtotal - descuentoMonto;
        const ivaMonto = subtotalConDescuento * 0.16;
        const itemTotal = subtotalConDescuento + ivaMonto;

        subtotal += itemSubtotal;
        totalDescuento += descuentoMonto;
        totalIva += ivaMonto;
        total += itemTotal;

        return {
          descripcion: item.descripcion,
          cantidad: cantidad,
          precio_unitario: precioUnitario,
          descuento: descuentoMonto,
          subtotal: subtotalConDescuento,
          orden: index
        };
      });

      const fechaEmision = new Date();
      const fechaVencimiento = new Date(fechaEmision);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + parseInt(dias_credito));

      // Insert invoice
      const [invoiceResult] = await connection.execute(`
        INSERT INTO facturas (
          numero_factura, usuario_id, pedido_id, subtotal, descuento, iva, total, 
          moneda, fecha_emision, fecha_vencimiento, metodo_pago, forma_pago, 
          notas, saldo_pendiente, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceNumber, usuario_id, pedido_id || null, subtotal, totalDescuento, 
        totalIva, total, moneda, fechaEmision, fechaVencimiento, metodo_pago, 
        forma_pago, notas, total, req.user?.id || 1
      ]);

      const invoiceId = invoiceResult.insertId;

      // Insert invoice items
      for (const item of processedItems) {
        await connection.execute(`
          INSERT INTO factura_items (
            factura_id, descripcion, cantidad, precio_unitario, descuento, subtotal, orden
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          invoiceId, item.descripcion, item.cantidad, item.precio_unitario,
          item.descuento, item.subtotal, item.orden
        ]);
      }

      // Update pedido if linked
      if (pedido_id) {
        await connection.execute(
          'UPDATE pedidos SET factura_id = ? WHERE id = ?',
          [invoiceId, pedido_id]
        );
      }

      // Create notification for client
      await connection.execute(`
        INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, entidad_tipo, entidad_id)
        VALUES (?, 'info', 'Nueva Factura', ?, 'factura', ?)
      `, [usuario_id, `Se ha generado la factura ${invoiceNumber}`, invoiceId]);

      // Create notification for admins
      const [admins] = await connection.execute(
        'SELECT id FROM usuarios WHERE rol = "admin" AND estado = "activo"'
      );

      for (const admin of admins) {
        await connection.execute(`
          INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, entidad_tipo, entidad_id)
          VALUES (?, 'info', 'Factura Creada', ?, 'factura', ?)
        `, [admin.id, `Nueva factura ${invoiceNumber} creada para ${userCheck[0].nombre}`, invoiceId]);
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Factura creada exitosamente',
        data: {
          id: invoiceId,
          numero_factura: invoiceNumber,
          total: total
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error creating invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear factura',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  // Update invoice status
  updateInvoiceStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, notas } = req.body;

      // Validate status
      const validStatuses = ['borrador', 'emitida', 'timbrada', 'pagada', 'parcialmente_pagada', 'vencida', 'cancelada'];
      if (!validStatuses.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado de factura inválido'
        });
      }

      await pool.execute(
        'UPDATE facturas SET estado = ?, notas = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [estado, notas || null, id]
      );

      // Create activity log
      await pool.execute(`
        INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id)
        VALUES (?, 'factura_actualizada', ?, 'factura', ?)
      `, [req.user?.id || 1, `Estado de factura actualizado a: ${estado}`, id]);

      res.json({
        success: true,
        message: 'Estado de factura actualizado exitosamente'
      });

    } catch (error) {
      console.error('Error updating invoice status:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar estado de factura',
        error: error.message
      });
    }
  },

  // Generate invoice from quotation
  generateFromQuotation: async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const { cotizacion_id } = req.body;

      // Get quotation with items
      const [quotations] = await connection.execute(`
        SELECT c.*, u.nombre as cliente_nombre
        FROM cotizaciones c
        INNER JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.id = ? AND c.estado = 'aprobada'
      `, [cotizacion_id]);

      if (quotations.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada o no está aprobada'
        });
      }

      const quotation = quotations[0];

      // Check if quotation already has an invoice
      if (quotation.factura_id) {
        return res.status(400).json({
          success: false,
          message: 'Esta cotización ya tiene una factura asociada'
        });
      }

      // Get quotation items
      const [quotationItems] = await connection.execute(
        'SELECT * FROM cotizacion_items WHERE cotizacion_id = ? order BY orden ASC',
        [cotizacion_id]
      );

      // Transform quotation items to invoice items
      const invoiceItems = quotationItems.map(item => ({
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento: 0,
        impuesto_porcentaje: 16
      }));

      // Generate invoice number
      const currentYear = new Date().getFullYear();
      const [lastInvoice] = await connection.execute(
        'SELECT numero_factura FROM facturas WHERE numero_factura LIKE ? order BY id DESC LIMIT 1',
        [`FAC-${currentYear}-%`]
      );

      let invoiceNumber;
      if (lastInvoice.length > 0) {
        const lastNumber = parseInt(lastInvoice[0].numero_factura.split('-')[2]);
        const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
        invoiceNumber = `FAC-${currentYear}-${nextNumber}`;
      } else {
        invoiceNumber = `FAC-${currentYear}-0001`;
      }

      // Calculate totals
      let subtotal = quotation.subtotal;
      let totalImpuestos = subtotal * 0.16; // 16% IVA
      let total = subtotal + totalImpuestos;

      const fechaEmision = new Date();
      const fechaVencimiento = new Date(fechaEmision);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

      // Insert invoice
      const [invoiceResult] = await connection.execute(`
        INSERT INTO facturas (
          numero_factura, cotizacion_id, usuario_id, titulo, descripcion,
          subtotal, impuestos, total, moneda, fecha_emision, fecha_vencimiento,
          dias_credito, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceNumber, cotizacion_id, quotation.usuario_id, quotation.titulo, quotation.descripcion,
        subtotal, totalImpuestos, total, quotation.moneda, fechaEmision, fechaVencimiento,
        30, quotation.notas
      ]);

      const invoiceId = invoiceResult.insertId;

      // Insert invoice items
      for (let i = 0; i < invoiceItems.length; i++) {
        const item = invoiceItems[i];
        const itemSubtotal = item.cantidad * item.precio_unitario;
        const impuestoMonto = itemSubtotal * 0.16;
        const itemTotal = itemSubtotal + impuestoMonto;

        await connection.execute(`
          INSERT INTO factura_items (
            factura_id, descripcion, cantidad, precio_unitario, descuento,
            subtotal, impuesto_porcentaje, impuesto_monto, total, orden
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          invoiceId, item.descripcion, item.cantidad, item.precio_unitario,
          0, itemSubtotal, 16, impuestoMonto, itemTotal, i
        ]);
      }

      // Update quotation
      await connection.execute(
        'UPDATE cotizaciones SET factura_id = ?, estado = "convertida" WHERE id = ?',
        [invoiceId, cotizacion_id]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Factura generada exitosamente desde cotización',
        data: {
          id: invoiceId,
          numero_factura: invoiceNumber,
          cotizacion_numero: quotation.numero_cotizacion
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error generating invoice from quotation:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar factura desde cotización',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  // Get invoice statistics
  getInvoiceStats: async (req, res) => {
    try {
      // Summary statistics
      const [summaryResult] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN estado = 'enviada' THEN 1 END) as enviadas,
          COUNT(CASE WHEN estado = 'pagada' THEN 1 END) as pagadas,
          COUNT(CASE WHEN estado = 'vencida' OR (fecha_vencimiento < CURDATE() AND estado NOT IN ('pagada', 'cancelada')) THEN 1 END) as vencidas,
          COUNT(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 END) as this_month,
          SUM(CASE WHEN estado = 'pagada' THEN total ELSE 0 END) as total_pagado,
          SUM(CASE WHEN estado NOT IN ('pagada', 'cancelada') THEN total ELSE 0 END) as total_pendiente,
          AVG(total) as ticket_promedio
        FROM facturas
      `);

      // Overdue invoices
      const [overdueResult] = await pool.execute(`
        SELECT 
          f.id,
          f.numero_factura,
          f.total,
          f.fecha_vencimiento,
          DATEDIFF(CURDATE(), f.fecha_vencimiento) as dias_vencido,
          u.nombre as cliente_nombre
        FROM facturas f
        INNER JOIN usuarios u ON f.usuario_id = u.id
        WHERE f.fecha_vencimiento < CURDATE() 
        AND f.estado NOT IN ('pagada', 'cancelada')
        order BY f.fecha_vencimiento ASC
        LIMIT 10
      `);

      // Monthly revenue
      const [monthlyRevenue] = await pool.execute(`
        SELECT 
          DATE_FORMAT(fecha_emision, '%Y-%m') as mes,
          SUM(total) as ingresos,
          COUNT(*) as facturas
        FROM facturas
        WHERE fecha_emision >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        AND estado = 'pagada'
        GROUP BY DATE_FORMAT(fecha_emision, '%Y-%m')
        order BY mes DESC
      `);

      res.json({
        success: true,
        data: {
          summary: summaryResult[0],
          overdue_invoices: overdueResult,
          monthly_revenue: monthlyRevenue
        }
      });

    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de facturas',
        error: error.message
      });
    }
  }
};

module.exports = invoicesController;