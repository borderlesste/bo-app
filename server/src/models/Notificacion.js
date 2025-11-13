const { pool } = require('../config/db');

class Notificacion {
    static async findById(id) {
        const [result] = await pool.execute('SELECT * FROM notificaciones WHERE id = ?', [id]);
        return result[0] || null;
    }

    static async create(notificacionData) {
        const {
            usuario_id, tipo, titulo, mensaje, prioridad = 'normal',
            entidad_tipo, entidad_id, accion_url, enviada_email = 0, enviada_sms = 0
        } = notificacionData;

        const [result] = await pool.execute(`
            INSERT INTO notificaciones (
                usuario_id, tipo, titulo, mensaje, prioridad,
                entidad_tipo, entidad_id, accion_url, enviada_email, enviada_sms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [usuario_id, tipo, titulo, mensaje, prioridad,
             entidad_tipo, entidad_id, accion_url, enviada_email, enviada_sms]
        );
        return result.insertId;
    }

    static async markAsRead(id, userId) {
        await pool.execute(`
            UPDATE notificaciones 
            SET leida = 1, fecha_lectura = NOW() 
            WHERE id = ? AND usuario_id = ?
        `, [id, userId]);
        return true;
    }

    static async markAllAsRead(userId) {
        await pool.execute(`
            UPDATE notificaciones 
            SET leida = 1, fecha_lectura = NOW() 
            WHERE usuario_id = ? AND leida = 0
        `, [userId]);
        return true;
    }

    static async delete(id) {
        await pool.execute('DELETE FROM notificaciones WHERE id = ?', [id]);
        return true;
    }

    static async findByUser(userId, filters = {}) {
        let sql = `
            SELECT * FROM notificaciones 
            WHERE usuario_id = ?
        `;
        const values = [userId];

        if (filters.leida !== undefined) {
            sql += ' AND leida = ?';
            values.push(filters.leida);
        }

        if (filters.tipo) {
            sql += ' AND tipo = ?';
            values.push(filters.tipo);
        }

        if (filters.prioridad) {
            sql += ' AND prioridad = ?';
            values.push(filters.prioridad);
        }

        sql += ' ORDER BY created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [result] = await pool.execute(sql, values);
    }

    static async getUnreadCount(userId) {
        const [result] = await pool.execute(`
            SELECT COUNT(*) as count FROM notificaciones 
            WHERE usuario_id = ? AND leida = 0
        `, [userId]);
        return result[0].count;
    }

    static async getByPriority(userId, prioridad) {
        const [result] = await pool.execute(`
            SELECT * FROM notificaciones 
            WHERE usuario_id = ? AND prioridad = ? AND leida = 0
            ORDER BY created_at DESC
        `, [userId, prioridad]);
    }

    static async createForMultipleUsers(userIds, notificacionData) {
        const {
            tipo, titulo, mensaje, prioridad = 'normal',
            entidad_tipo, entidad_id, accion_url, enviada_email = 0, enviada_sms = 0
        } = notificacionData;

        const promises = userIds.map(userId => 
            this.create({
                usuario_id: userId, tipo, titulo, mensaje, prioridad,
                entidad_tipo, entidad_id, accion_url, enviada_email, enviada_sms
            })
        );

        return await Promise.all(promises);
    }

    static async cleanup(daysOld = 30) {
        await pool.execute(`
            DELETE FROM notificaciones 
            WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            AND leida = 1
        `, [daysOld]);
        return true;
    }

    static async getRecent(userId, limit = 10) {
        const [result] = await pool.execute(`
            SELECT * FROM notificaciones 
            WHERE usuario_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `, [userId, limit]);
    }
}

module.exports = Notificacion;