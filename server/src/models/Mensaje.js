const { pool } = require('../config/db');

class Mensaje {
    static async findById(id) {
        const [result] = await pool.execute('SELECT * FROM mensajes WHERE id = ?', [id]);
        return result[0] || null;
    }

    static async create(mensajeData) {
        const {
            remitente_id, destinatario_id, remitente_email, destinatario_email,
            asunto, mensaje, tipo = 'consulta_general', prioridad = 'media',
            parent_message_id, pedido_id, cotizacion_id, adjuntos,
            ip_address, user_agent
        } = mensajeData;

        const [result] = await pool.execute(`
            INSERT INTO mensajes (
                remitente_id, destinatario_id, remitente_email, destinatario_email,
                asunto, mensaje, tipo, prioridad, parent_message_id,
                pedido_id, cotizacion_id, adjuntos, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [remitente_id, destinatario_id, remitente_email, destinatario_email,
             asunto, mensaje, tipo, prioridad, parent_message_id,
             pedido_id, cotizacion_id, JSON.stringify(adjuntos), ip_address, user_agent]
        );
        return result.insertId;
    }

    static async update(id, mensajeData) {
        const fields = [];
        const values = [];
        
        Object.keys(mensajeData).forEach(key => {
            if (mensajeData[key] !== undefined && key !== 'id') {
                if (key === 'adjuntos') {
                    fields.push(`${key} = ?`);
                    values.push(JSON.stringify(mensajeData[key]));
                } else {
                    fields.push(`${key} = ?`);
                    values.push(mensajeData[key]);
                }
            }
        });
        
        if (fields.length === 0) return false;
        
        values.push(id);
        await pool.execute(`UPDATE mensajes SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async delete(id) {
        await pool.execute('DELETE FROM mensajes WHERE id = ?', [id]);
        return true;
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT m.*, 
                   remitente.nombre as remitente_nombre,
                   destinatario.nombre as destinatario_nombre,
                   p.numero_pedido,
                   c.titulo as cotizacion_titulo
            FROM mensajes m
            LEFT JOIN usuarios remitente ON m.remitente_id = remitente.id
            LEFT JOIN usuarios destinatario ON m.destinatario_id = destinatario.id
            LEFT JOIN pedidos p ON m.pedido_id = p.id
            LEFT JOIN cotizaciones c ON m.cotizacion_id = c.id
            WHERE 1=1
        `;
        const values = [];

        if (filters.estado) {
            sql += ' AND m.estado = ?';
            values.push(filters.estado);
        }

        if (filters.tipo) {
            sql += ' AND m.tipo = ?';
            values.push(filters.tipo);
        }

        if (filters.prioridad) {
            sql += ' AND m.prioridad = ?';
            values.push(filters.prioridad);
        }

        if (filters.remitente_id) {
            sql += ' AND m.remitente_id = ?';
            values.push(filters.remitente_id);
        }

        if (filters.destinatario_id) {
            sql += ' AND m.destinatario_id = ?';
            values.push(filters.destinatario_id);
        }

        if (filters.pedido_id) {
            sql += ' AND m.pedido_id = ?';
            values.push(filters.pedido_id);
        }

        if (filters.search) {
            sql += ' AND (m.asunto LIKE ? OR m.mensaje LIKE ? OR remitente.nombre LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' order BY m.created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const messages = await pool.execute(sql, values);
        
        return messages.map(message => ({
            ...message,
            adjuntos: message.adjuntos ? JSON.parse(message.adjuntos) : null
        }));
    }

    static async markAsRead(id) {
        await pool.execute(`
            UPDATE mensajes 
            SET estado = 'leido', fecha_lectura = NOW() 
            WHERE id = ?
        `, [id]);
        return true;
    }

    static async markAsResponded(id) {
        await pool.execute(`
            UPDATE mensajes 
            SET estado = 'respondido' 
            WHERE id = ?
        `, [id]);
        return true;
    }

    static async getConversation(messageId) {
        const message = await this.findById(messageId);
        if (!message) return [];

        const rootId = message.parent_message_id || messageId;
        
        const [result] = await pool.execute(`
            SELECT m.*, 
                   remitente.nombre as remitente_nombre,
                   destinatario.nombre as destinatario_nombre
            FROM mensajes m
            LEFT JOIN usuarios remitente ON m.remitente_id = remitente.id
            LEFT JOIN usuarios destinatario ON m.destinatario_id = destinatario.id
            WHERE m.id = ? OR m.parent_message_id = ?
            order BY m.created_at ASC
        `, [rootId, rootId]);
    }

    static async getUnreadCount(userId = null) {
        let sql = `SELECT COUNT(*) as count FROM mensajes WHERE estado = 'no_leido'`;
        const values = [];

        if (userId) {
            sql += ' AND destinatario_id = ?';
            values.push(userId);
        }

        const [result] = await pool.execute(sql, values);
        return result[0].count;
    }

    static async getByUser(userId, filters = {}) {
        let sql = `
            SELECT m.*, 
                   remitente.nombre as remitente_nombre,
                   destinatario.nombre as destinatario_nombre
            FROM mensajes m
            LEFT JOIN usuarios remitente ON m.remitente_id = remitente.id
            LEFT JOIN usuarios destinatario ON m.destinatario_id = destinatario.id
            WHERE (m.remitente_id = ? OR m.destinatario_id = ?)
        `;
        const values = [userId, userId];

        if (filters.estado) {
            sql += ' AND m.estado = ?';
            values.push(filters.estado);
        }

        sql += ' order BY m.created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [result] = await pool.execute(sql, values);
    }

    static async archive(id) {
        await pool.execute('UPDATE mensajes SET estado = "archivado" WHERE id = ?', [id]);
        return true;
    }
}

module.exports = Mensaje;