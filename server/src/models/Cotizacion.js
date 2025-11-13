const { pool } = require('../config/db');

class Cotizacion {
    static async findById(id) {
        const [result] = await pool.execute(`
            SELECT c.*, 
                   u.nombre as cliente_nombre, 
                   u.email as cliente_email,
                   u.telefono as cliente_telefono,
                   u.empresa as cliente_empresa
            FROM cotizaciones c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.id = ?
        `, [id]);
        
        if (result[0]) {
            // Process the internal notes to extract service and company info
            let parsedNotes = {};
            try {
                if (result[0].notas_internas) {
                    parsedNotes = JSON.parse(result[0].notas_internas);
                }
            } catch (e) {
                console.log('Error parsing notas_internas JSON:', e);
            }
            
            // Enhance the result with extracted information
            result[0].servicio_nombre = parsedNotes.servicio_solicitado || 'No especificado';
            result[0].cliente_telefono = result[0].cliente_telefono || parsedNotes.telefono || 'No especificado';
            result[0].cliente_empresa = result[0].cliente_empresa || parsedNotes.empresa || 'No especificado';
            result[0].origen_solicitud = parsedNotes.origen || 'No especificado';
        }
        
        return result[0] || null;
    }

    static async create(cotizacionData) {
        const {
            usuario_id, nombre, email, titulo, descripcion, precio_estimado,
            moneda = 'MXN', prioridad = 'media', fecha_expiracion,
            notas_internas, terminos_condiciones, tiempo_entrega_dias
        } = cotizacionData;

        const [result] = await pool.execute(`
            INSERT INTO cotizaciones (
                usuario_id, nombre, email, titulo, descripcion, precio_estimado,
                moneda, prioridad, fecha_expiracion, notas_internas,
                terminos_condiciones, tiempo_entrega_dias
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [usuario_id, nombre, email, titulo, descripcion, precio_estimado,
             moneda, prioridad, fecha_expiracion, notas_internas,
             terminos_condiciones, tiempo_entrega_dias]
        );
        return result.insertId;
    }

    static async update(id, cotizacionData) {
        const fields = [];
        const values = [];
        
        Object.keys(cotizacionData).forEach(key => {
            if (cotizacionData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(cotizacionData[key]);
            }
        });
        
        if (fields.length === 0) return false;
        
        values.push(id);
        await pool.execute(`UPDATE cotizaciones SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async delete(id) {
        await pool.execute('DELETE FROM cotizaciones WHERE id = ?', [id]);
        return true;
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT c.*, 
                   u.nombre as cliente_nombre, 
                   u.email as cliente_email,
                   u.telefono as cliente_telefono,
                   u.empresa as cliente_empresa
            FROM cotizaciones c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE 1=1
        `;
        const values = [];

        if (filters.estado) {
            sql += ' AND c.estado = ?';
            values.push(filters.estado);
        }

        if (filters.prioridad) {
            sql += ' AND c.prioridad = ?';
            values.push(filters.prioridad);
        }

        if (filters.usuario_id) {
            sql += ' AND c.usuario_id = ?';
            values.push(filters.usuario_id);
        }

        if (filters.search) {
            sql += ' AND (c.titulo LIKE ? OR c.nombre LIKE ? OR c.email LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY c.created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [result] = await pool.execute(sql, values);
        
        // Process each result to extract service and company info from notas_internas
        return result.map(quotation => {
            let parsedNotes = {};
            try {
                if (quotation.notas_internas) {
                    parsedNotes = JSON.parse(quotation.notas_internas);
                }
            } catch (e) {
                console.log('Error parsing notas_internas JSON:', e);
            }
            
            return {
                ...quotation,
                servicio_nombre: parsedNotes.servicio_solicitado || 'No especificado',
                cliente_telefono: quotation.cliente_telefono || parsedNotes.telefono || 'No especificado',
                cliente_empresa: quotation.cliente_empresa || parsedNotes.empresa || 'No especificado',
                origen_solicitud: parsedNotes.origen || 'No especificado'
            };
        });
    }

    static async getItems(cotizacionId) {
        const [result] = await pool.execute(`
            SELECT ci.*, s.nombre as servicio_nombre
            FROM cotizacion_items ci
            LEFT JOIN servicios s ON ci.servicio_id = s.id
            WHERE ci.cotizacion_id = ?
            ORDER BY ci.orden ASC
        `, [cotizacionId]);
        return result;
    }

    static async addItem(cotizacionId, itemData) {
        const { servicio_id, descripcion, cantidad, precio_unitario, descuento = 0, orden = 0 } = itemData;
        const [result] = await pool.execute(`
            INSERT INTO cotizacion_items (cotizacion_id, servicio_id, descripcion, cantidad, precio_unitario, descuento, orden)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [cotizacionId, servicio_id, descripcion, cantidad, precio_unitario, descuento, orden]);
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
        await pool.execute(`UPDATE cotizacion_items SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async deleteItem(itemId) {
        await pool.execute('DELETE FROM cotizacion_items WHERE id = ?', [itemId]);
        return true;
    }

    static async updateStatus(id, estado) {
        await pool.execute('UPDATE cotizaciones SET estado = ? WHERE id = ?', [estado, id]);
        return true;
    }
}

module.exports = Cotizacion;