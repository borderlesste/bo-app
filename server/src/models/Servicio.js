const { pool } = require('../config/db');

class Servicio {
    static async findById(id) {
        const [result] = await pool.execute('SELECT * FROM servicios WHERE id = ?', [id]);
        return result[0] || null;
    }

    static async findByCodigo(codigo) {
        const [result] = await pool.execute('SELECT * FROM servicios WHERE codigo = ?', [codigo]);
        return result[0] || null;
    }

    static async create(servicioData) {
        const {
            codigo, nombre, descripcion, categoria, precio_base = 0.00,
            unidad_medida = 'proyecto', estado = 'activo'
        } = servicioData;

        const [result] = await pool.execute(`
            INSERT INTO servicios (codigo, nombre, descripcion, categoria, precio_base, unidad_medida, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [codigo, nombre, descripcion, categoria, precio_base, unidad_medida, estado]
        );
        return result.insertId;
    }

    static async update(id, servicioData) {
        const fields = [];
        const values = [];
        
        Object.keys(servicioData).forEach(key => {
            if (servicioData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(servicioData[key]);
            }
        });
        
        if (fields.length === 0) return false;
        
        values.push(id);
        await pool.execute(`UPDATE servicios SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async delete(id) {
        await pool.execute('DELETE FROM servicios WHERE id = ?', [id]);
        return true;
    }

    static async findAll(filters = {}) {
        let sql = 'SELECT * FROM servicios WHERE 1=1';
        const values = [];

        if (filters.estado) {
            sql += ' AND estado = ?';
            values.push(filters.estado);
        }

        if (filters.categoria) {
            sql += ' AND categoria = ?';
            values.push(filters.categoria);
        }

        if (filters.search) {
            sql += ' AND (nombre LIKE ? OR descripcion LIKE ? OR codigo LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY categoria ASC, nombre ASC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [result] = await pool.execute(sql, values);
    }

    static async getActive() {
        const [result] = await pool.execute(`
            SELECT * FROM servicios 
            WHERE estado = 'activo' 
            ORDER BY categoria ASC, nombre ASC
        `);
    }

    static async getByCategory(categoria) {
        const [result] = await pool.execute(`
            SELECT * FROM servicios 
            WHERE categoria = ? AND estado = 'activo'
            ORDER BY nombre ASC
        `, [categoria]);
    }

    static async getCategories() {
        const [result] = await pool.execute(`
            SELECT DISTINCT categoria, COUNT(*) as total_servicios
            FROM servicios 
            WHERE estado = 'activo'
            GROUP BY categoria
            ORDER BY categoria ASC
        `);
    }

    static async updateStatus(id, estado) {
        await pool.execute('UPDATE servicios SET estado = ? WHERE id = ?', [estado, id]);
        return true;
    }

    static async getServiceUsage(servicioId) {
        const usage = await pool.execute(`
            SELECT 
                COUNT(DISTINCT ci.cotizacion_id) as cotizaciones_count,
                COUNT(DISTINCT pi.pedido_id) as pedidos_count,
                SUM(pi.cantidad * pi.precio_unitario) as revenue_total
            FROM servicios s
            LEFT JOIN cotizacion_items ci ON s.id = ci.servicio_id
            LEFT JOIN pedido_items pi ON s.id = pi.servicio_id
            WHERE s.id = ?
        `, [servicioId]);

        return usage[0] || { cotizaciones_count: 0, pedidos_count: 0, revenue_total: 0 };
    }

    static async getMostUsed(limit = 10) {
        const [result] = await pool.execute(`
            SELECT s.*, 
                   COUNT(DISTINCT pi.pedido_id) as pedidos_count,
                   SUM(pi.cantidad * pi.precio_unitario) as revenue_total
            FROM servicios s
            LEFT JOIN pedido_items pi ON s.id = pi.servicio_id
            WHERE s.estado = 'activo'
            GROUP BY s.id
            ORDER BY pedidos_count DESC, revenue_total DESC
            LIMIT ?
        `, [limit]);
    }
}

module.exports = Servicio;