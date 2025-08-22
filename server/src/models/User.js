const { pool } = require('../config/db');

class User {
    static async findById(id) {
        const [result] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
        return result[0] || null;
    }

    static async findByEmail(email) {
        const [result] = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        return result[0] || null;
    }

    static async create(userData) {
        const { nombre, email, password, rol = 'cliente', telefono, direccion, empresa, rfc } = userData;
        const [result] = await pool.execute(
            `INSERT INTO usuarios (nombre, email, password, rol, telefono, direccion, empresa, rfc) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, email, password, rol, telefono, direccion, empresa, rfc]
        );
        return result.insertId;
    }

    static async update(id, userData) {
        const fields = [];
        const values = [];
        
        Object.keys(userData).forEach(key => {
            if (userData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(userData[key]);
            }
        });
        
        if (fields.length === 0) return false;
        
        values.push(id);
        await pool.execute(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async delete(id) {
        await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);
        return true;
    }

    static async findAll(filters = {}) {
        let sql = 'SELECT * FROM usuarios WHERE 1=1';
        const values = [];

        if (filters.rol) {
            sql += ' AND rol = ?';
            values.push(filters.rol);
        }

        if (filters.estado) {
            sql += ' AND estado = ?';
            values.push(filters.estado);
        }

        if (filters.search) {
            sql += ' AND (nombre LIKE ? OR email LIKE ? OR empresa LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' order BY created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [rows] = await pool.execute(sql, values);
        return rows;
    }

    static async updateLoginAttempts(id, attempts) {
        await pool.execute('UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?', [attempts, id]);
    }

    static async lockUser(id, lockUntil) {
        await pool.execute('UPDATE usuarios SET bloqueado_hasta = ? WHERE id = ?', [lockUntil, id]);
    }

    static async updateLastAccess(id) {
        await pool.execute('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [id]);
    }

    static async getClientSummary(id) {
        const [rows] = await pool.execute('SELECT * FROM v_resumen_cliente WHERE id = ?', [id]);
        return rows;
    }
}

module.exports = User;