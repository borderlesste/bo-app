const { pool } = require('../config/db');

class Factura {
    static async findById(id) {
        const [result] = await pool.execute('SELECT * FROM facturas WHERE id = ?', [id]);
        return result[0] || null;
    }

    static async create(facturaData) {
        const {
            numero_factura, serie, folio, usuario_id, order_id,
            tipo = 'factura', estado = 'borrador', moneda = 'MXN',
            tipo_cambio = 1.0000, metodo_pago, forma_pago, uso_cfdi,
            fecha_vencimiento, notas, created_by
        } = facturaData;

        const [result] = await pool.execute(`
            INSERT INTO facturas (
                numero_factura, serie, folio, usuario_id, order_id, tipo,
                estado, moneda, tipo_cambio, metodo_pago, forma_pago,
                uso_cfdi, fecha_vencimiento, notas, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [numero_factura, serie, folio, usuario_id, order_id, tipo,
             estado, moneda, tipo_cambio, metodo_pago, forma_pago,
             uso_cfdi, fecha_vencimiento, notas, created_by]
        );
        return result.insertId;
    }

    static async update(id, facturaData) {
        const fields = [];
        const values = [];
        
        Object.keys(facturaData).forEach(key => {
            if (facturaData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(facturaData[key]);
            }
        });
        
        if (fields.length === 0) return false;
        
        values.push(id);
        await pool.execute(`UPDATE facturas SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async delete(id) {
        await pool.execute('DELETE FROM facturas WHERE id = ?', [id]);
        return true;
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT f.*, u.nombre as cliente_nombre, u.empresa as cliente_empresa,
                   p.numero_order, creator.nombre as created_by_name
            FROM facturas f
            LEFT JOIN usuarios u ON f.usuario_id = u.id
            LEFT JOIN orders p ON f.order_id = p.id
            LEFT JOIN usuarios creator ON f.created_by = creator.id
            WHERE 1=1
        `;
        const values = [];

        if (filters.estado) {
            sql += ' AND f.estado = ?';
            values.push(filters.estado);
        }

        if (filters.tipo) {
            sql += ' AND f.tipo = ?';
            values.push(filters.tipo);
        }

        if (filters.usuario_id) {
            sql += ' AND f.usuario_id = ?';
            values.push(filters.usuario_id);
        }

        if (filters.fecha_desde) {
            sql += ' AND f.fecha_emision >= ?';
            values.push(filters.fecha_desde);
        }

        if (filters.fecha_hasta) {
            sql += ' AND f.fecha_emision <= ?';
            values.push(filters.fecha_hasta);
        }

        if (filters.search) {
            sql += ' AND (f.numero_factura LIKE ? OR u.nombre LIKE ? OR u.empresa LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' order BY f.fecha_emision DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [result] = await pool.execute(sql, values);
    }

    static async getItems(facturaId) {
        const [result] = await pool.execute(`
            SELECT fi.*, pi.descripcion as order_item_descripcion
            FROM factura_items fi
            LEFT JOIN order_items pi ON fi.order_item_id = pi.id
            WHERE fi.factura_id = ?
            order BY fi.orden ASC
        `, [facturaId]);
    }

    static async addItem(facturaId, itemData) {
        const {
            order_item_id, clave_prod_serv, clave_unidad, descripcion,
            cantidad, precio_unitario, descuento = 0, orden = 0
        } = itemData;
        
        const [result] = await pool.execute(`
            INSERT INTO factura_items (
                factura_id, order_item_id, clave_prod_serv, clave_unidad,
                descripcion, cantidad, precio_unitario, descuento, orden
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [facturaId, order_item_id, clave_prod_serv, clave_unidad,
            descripcion, cantidad, precio_unitario, descuento, orden]);
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
        await pool.execute(`UPDATE factura_items SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async deleteItem(itemId) {
        await pool.execute('DELETE FROM factura_items WHERE id = ?', [itemId]);
        return true;
    }

    static async updateStatus(id, estado) {
        await pool.execute('UPDATE facturas SET estado = ? WHERE id = ?', [estado, id]);
        return true;
    }

    static async updateTotals(id, totals) {
        const { subtotal, descuento, iva, isr_retenido, iva_retenido, total } = totals;
        await pool.execute(`
            UPDATE facturas SET 
            subtotal = ?, descuento = ?, iva = ?, 
            isr_retenido = ?, iva_retenido = ?, total = ?, 
            saldo_pendiente = ?
            WHERE id = ?
        `, [subtotal, descuento, iva, isr_retenido, iva_retenido, total, total, id]);
        return true;
    }

    static async generateInvoiceNumber(serie = 'A') {
        const [lastInvoice] = await pool.execute(`
            SELECT folio FROM facturas 
            WHERE serie = ? 
            order BY folio DESC LIMIT 1
        `, [serie]);

        let nextFolio = 1;
        if (lastInvoice.length > 0) {
            nextFolio = lastInvoice[0].folio + 1;
        }

        return {
            serie,
            folio: nextFolio,
            numero_factura: `${serie}-${String(nextFolio).padStart(6, '0')}`
        };
    }

    static async getOverdueInvoices() {
        const [result] = await pool.execute(`
            SELECT f.*, u.nombre as cliente_nombre, u.empresa as cliente_empresa
            FROM facturas f
            LEFT JOIN usuarios u ON f.usuario_id = u.id
            WHERE f.estado IN ('emitida', 'timbrada') 
            AND f.saldo_pendiente > 0 
            AND f.fecha_vencimiento < CURDATE()
            order BY f.fecha_vencimiento ASC
        `);
    }
}

module.exports = Factura;