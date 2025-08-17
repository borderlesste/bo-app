const { pool } = require('../config/db');

class Pedido {
    static async findById(id) {
        const [result] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [id]);
        return result[0] || null;
    }

    static async create(pedidoData) {
        const {
            numero_pedido, usuario_id, cotizacion_id, estado = 'nuevo',
            prioridad = 'normal', fecha_inicio, fecha_entrega_estimada,
            descripcion, notas_internas, created_by, assigned_to
        } = pedidoData;

        const [result] = await pool.execute(`
            INSERT INTO pedidos (
                numero_pedido, usuario_id, cotizacion_id, estado, prioridad,
                fecha_inicio, fecha_entrega_estimada, descripcion,
                notas_internas, created_by, assigned_to
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [numero_pedido, usuario_id, cotizacion_id, estado, prioridad,
             fecha_inicio, fecha_entrega_estimada, descripcion,
             notas_internas, created_by, assigned_to]
        );
        return result.insertId;
    }

    static async update(id, pedidoData) {
        const fields = [];
        const values = [];
        
        Object.keys(pedidoData).forEach(key => {
            if (pedidoData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(pedidoData[key]);
            }
        });
        
        if (fields.length === 0) return false;
        
        values.push(id);
        await pool.execute(`UPDATE pedidos SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async delete(id) {
        await pool.execute('DELETE FROM pedidos WHERE id = ?', [id]);
        return true;
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT p.*, u.nombre as cliente_nombre, u.empresa as cliente_empresa,
                   asignado.nombre as asignado_nombre
            FROM pedidos p
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
            sql += ' AND (p.numero_pedido LIKE ? OR p.descripcion LIKE ? OR u.nombre LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY p.created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [result] = await pool.execute(sql, values);
        return result;
    }

    static async getItems(pedidoId) {
        const [result] = await pool.execute(`
            SELECT pi.*, s.nombre as servicio_nombre
            FROM pedido_items pi
            LEFT JOIN servicios s ON pi.servicio_id = s.id
            WHERE pi.pedido_id = ?
            ORDER BY pi.orden ASC
        `, [pedidoId]);
        return result;
    }

    static async addItem(pedidoId, itemData) {
        const { servicio_id, descripcion, cantidad, precio_unitario, descuento = 0, orden = 0 } = itemData;
        const [result] = await pool.execute(`
            INSERT INTO pedido_items (pedido_id, servicio_id, descripcion, cantidad, precio_unitario, descuento, orden)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [pedidoId, servicio_id, descripcion, cantidad, precio_unitario, descuento, orden]);
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
        await pool.execute(`UPDATE pedido_items SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async deleteItem(itemId) {
        await pool.execute('DELETE FROM pedido_items WHERE id = ?', [itemId]);
        return true;
    }

    static async updateStatus(id, estado, changedBy, comentario = null) {
        const currentOrder = await this.findById(id);
        if (!currentOrder) return false;

        await pool.execute('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
        
        await pool.execute(`
            INSERT INTO historial_estado_pedidos (pedido_id, estado_anterior, estado_nuevo, comentario, changed_by)
            VALUES (?, ?, ?, ?, ?)
        `, [id, currentOrder.estado, estado, comentario, changedBy]);

        return true;
    }

    static async getStatusHistory(pedidoId) {
        const [result] = await pool.execute(`
            SELECT h.*, u.nombre as changed_by_name
            FROM historial_estado_pedidos h
            LEFT JOIN usuarios u ON h.changed_by = u.id
            WHERE h.pedido_id = ?
            ORDER BY h.created_at DESC
        `, [pedidoId]);
        return result;
    }

    static async getOrdersWithStatus() {
        const [result] = await pool.execute('SELECT * FROM v_estado_pedidos');
        return result;
    }

    static async generateOrderNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        const [lastOrder] = await pool.execute(`
            SELECT numero_pedido FROM pedidos 
            WHERE numero_pedido LIKE ? 
            ORDER BY numero_pedido DESC LIMIT 1
        `, [`PED-${year}${month}-%`]);

        let nextNumber = 1;
        if (lastOrder.length > 0) {
            const lastNumber = parseInt(lastOrder[0].numero_pedido.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        return `PED-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
    }
}

module.exports = Pedido;