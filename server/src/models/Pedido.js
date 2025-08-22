const { pool } = require('../config/db');

class order {
    static async findById(id) {
        const [result] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
        return result[0] || null;
    }

    static async create(orderData) {
        const {
            numero_order, usuario_id, cotizacion_id, estado = 'nuevo',
            prioridad = 'normal', fecha_inicio, fecha_entrega_estimada,
            descripcion, notas_internas, created_by, assigned_to
        } = orderData;

        const [result] = await pool.execute(`
            INSERT INTO orders (
                numero_order, usuario_id, cotizacion_id, estado, prioridad,
                fecha_inicio, fecha_entrega_estimada, descripcion,
                notas_internas, created_by, assigned_to
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [numero_order, usuario_id, cotizacion_id, estado, prioridad,
             fecha_inicio, fecha_entrega_estimada, descripcion,
             notas_internas, created_by, assigned_to]
        );
        return result.insertId;
    }

    static async update(id, orderData) {
        const fields = [];
        const values = [];
        
        Object.keys(orderData).forEach(key => {
            if (orderData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(orderData[key]);
            }
        });
        
        if (fields.length === 0) return false;
        
        values.push(id);
        await pool.execute(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async delete(id) {
        await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
        return true;
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT p.*, u.nombre as cliente_nombre, u.empresa as cliente_empresa,
                   asignado.nombre as asignado_nombre
            FROM orders p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN usuarios asignado ON p.assigned_to = asignado.id
            WHERE 1=1
        `;
        const values = [];

        if (filters.estado) {
            sql += ' AND p.estado = ?';
            values.push(filters.estado);
        }

        if (filters.prioridad) {
            sql += ' AND p.prioridad = ?';
            values.push(filters.prioridad);
        }

        if (filters.usuario_id) {
            sql += ' AND p.usuario_id = ?';
            values.push(filters.usuario_id);
        }

        if (filters.assigned_to) {
            sql += ' AND p.assigned_to = ?';
            values.push(filters.assigned_to);
        }

        if (filters.search) {
            sql += ' AND (p.numero_order LIKE ? OR p.descripcion LIKE ? OR u.nombre LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' order BY p.created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [result] = await pool.execute(sql, values);
        return result;
    }

    static async getItems(orderId) {
        const [result] = await pool.execute(`
            SELECT pi.*, s.nombre as servicio_nombre
            FROM order_items pi
            LEFT JOIN servicios s ON pi.servicio_id = s.id
            WHERE pi.order_id = ?
            order BY pi.orden ASC
        `, [orderId]);
        return result;
    }

    static async addItem(orderId, itemData) {
        const { servicio_id, descripcion, cantidad, precio_unitario, descuento = 0, orden = 0 } = itemData;
        const [result] = await pool.execute(`
            INSERT INTO order_items (order_id, servicio_id, descripcion, cantidad, precio_unitario, descuento, orden)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [orderId, servicio_id, descripcion, cantidad, precio_unitario, descuento, orden]);
        return result.insertId;
    }

    static async updateItem(itemId, itemData) {
        const fields = [];
        const values = [];
        
        Object.keys(itemData).forEach(key => {
            if (itemData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(itemData[key]);
            }
        });
        
        if (fields.length === 0) return false;
        
        values.push(itemId);
        await pool.execute(`UPDATE order_items SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async deleteItem(itemId) {
        await pool.execute('DELETE FROM order_items WHERE id = ?', [itemId]);
        return true;
    }

    static async updateStatus(id, estado, changedBy, comentario = null) {
        const currentorder = await this.findById(id);
        if (!currentorder) return false;

        await pool.execute('UPDATE orders SET estado = ? WHERE id = ?', [estado, id]);
        
        await pool.execute(`
            INSERT INTO historial_estado_orders (order_id, estado_anterior, estado_nuevo, comentario, changed_by)
            VALUES (?, ?, ?, ?, ?)
        `, [id, currentorder.estado, estado, comentario, changedBy]);

        return true;
    }

    static async getStatusHistory(orderId) {
        const [result] = await pool.execute(`
            SELECT h.*, u.nombre as changed_by_name
            FROM historial_estado_orders h
            LEFT JOIN usuarios u ON h.changed_by = u.id
            WHERE h.order_id = ?
            order BY h.created_at DESC
        `, [orderId]);
        return result;
    }

    static async getordersWithStatus() {
        const [result] = await pool.execute('SELECT * FROM v_estado_orders');
        return result;
    }

    static async generateorderNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        const [lastorder] = await pool.execute(`
            SELECT numero_order FROM orders 
            WHERE numero_order LIKE ? 
            order BY numero_order DESC LIMIT 1
        `, [`PED-${year}${month}-%`]);

        let nextNumber = 1;
        if (lastorder.length > 0) {
            const lastNumber = parseInt(lastorder[0].numero_order.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        return `PED-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
    }
}

module.exports = order;