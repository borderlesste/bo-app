const { pool } = require('../config/db');

class Pago {
    static async findById(id) {
        const [result] = await pool.execute('SELECT * FROM pagos WHERE id = ?', [id]);
        return result[0] || null;
    }

    static async create(pagoData) {
        const {
            numero_pago, usuario_id, tipo = 'total', monto, moneda = 'MXN',
            tipo_cambio = 1.0000, metodo_pago, referencia, banco_origen,
            cuenta_destino, fecha_pago, concepto, comprobante_path,
            notas, created_by
        } = pagoData;

        const [result] = await pool.execute(`
            INSERT INTO pagos (
                numero_pago, usuario_id, tipo, monto, moneda, tipo_cambio,
                metodo_pago, referencia, banco_origen, cuenta_destino,
                fecha_pago, concepto, comprobante_path, notas, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [numero_pago, usuario_id, tipo, monto, moneda, tipo_cambio,
             metodo_pago, referencia, banco_origen, cuenta_destino,
             fecha_pago, concepto, comprobante_path, notas, created_by]
        );
        return result.insertId;
    }

    static async update(id, pagoData) {
        const fields = [];
        const values = [];
        
        Object.keys(pagoData).forEach(key => {
            if (pagoData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(pagoData[key]);
            }
        });
        
        if (fields.length === 0) return false;
        
        values.push(id);
        await pool.execute(`UPDATE pagos SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async delete(id) {
        await pool.execute('DELETE FROM pagos WHERE id = ?', [id]);
        return true;
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email, u.empresa as cliente_empresa,
                   creator.nombre as created_by_name, verifier.nombre as verified_by_name
            FROM pagos p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN usuarios creator ON p.created_by = creator.id
            LEFT JOIN usuarios verifier ON p.verified_by = verifier.id
            WHERE 1=1
        `;
        const values = [];

        if (filters.estado) {
            sql += ' AND p.estado = ?';
            values.push(filters.estado);
        }

        if (filters.tipo) {
            sql += ' AND p.tipo = ?';
            values.push(filters.tipo);
        }

        if (filters.metodo_pago) {
            sql += ' AND p.metodo_pago = ?';
            values.push(filters.metodo_pago);
        }

        if (filters.usuario_id) {
            sql += ' AND p.usuario_id = ?';
            values.push(filters.usuario_id);
        }

        if (filters.fecha_desde) {
            sql += ' AND p.fecha_pago >= ?';
            values.push(filters.fecha_desde);
        }

        if (filters.fecha_hasta) {
            sql += ' AND p.fecha_pago <= ?';
            values.push(filters.fecha_hasta);
        }

        if (filters.search) {
            sql += ' AND (p.numero_pago LIKE ? OR p.referencia LIKE ? OR u.nombre LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' order BY p.fecha_pago DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [result] = await pool.execute(sql, values);
        return result;
    }

    static async updateStatus(id, estado, verifiedBy = null) {
        let sql = 'UPDATE pagos SET estado = ?';
        const values = [estado];

        if (estado === 'aplicado') {
            sql += ', fecha_aplicacion = NOW()';
            if (verifiedBy) {
                sql += ', verified_by = ?';
                values.push(verifiedBy);
            }
        }

        sql += ' WHERE id = ?';
        values.push(id);

        await pool.execute(sql, values);
        return true;
    }

    static async applyToInvoice(pagoId, facturaId, montoAplicado, appliedBy) {
        const [result] = await pool.execute(`
            INSERT INTO pago_aplicaciones (pago_id, factura_id, monto_aplicado, applied_by)
            VALUES (?, ?, ?, ?)
        `, [pagoId, facturaId, montoAplicado, appliedBy]);

        await pool.execute(`
            UPDATE facturas SET saldo_pendiente = saldo_pendiente - ?
            WHERE id = ?
        `, [montoAplicado, facturaId]);

        const [factura] = await pool.execute('SELECT saldo_pendiente FROM facturas WHERE id = ?', [facturaId]);
        if (factura[0] && factura[0].saldo_pendiente <= 0) {
            await pool.execute('UPDATE facturas SET estado = "pagada" WHERE id = ?', [facturaId]);
        }

        return result.insertId;
    }

    static async getApplications(pagoId) {
        const [result] = await pool.execute(`
            SELECT pa.*, f.numero_factura, f.total as factura_total,
                   u.nombre as applied_by_name
            FROM pago_aplicaciones pa
            LEFT JOIN facturas f ON pa.factura_id = f.id
            LEFT JOIN usuarios u ON pa.applied_by = u.id
            WHERE pa.pago_id = ?
            order BY pa.fecha_aplicacion DESC
        `, [pagoId]);
    }

    static async generatePaymentNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        const [lastPayment] = await pool.execute(`
            SELECT numero_pago FROM pagos 
            WHERE numero_pago LIKE ? 
            order BY numero_pago DESC LIMIT 1
        `, [`PAG-${year}${month}-%`]);

        let nextNumber = 1;
        if (lastPayment.length > 0) {
            const lastNumber = parseInt(lastPayment[0].numero_pago.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        return `PAG-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
    }

    static async getCashFlow(filters = {}) {
        let sql = 'SELECT * FROM v_flujo_efectivo WHERE 1=1';
        const values = [];

        if (filters.fecha_desde) {
            sql += ' AND fecha >= ?';
            values.push(filters.fecha_desde);
        }

        if (filters.fecha_hasta) {
            sql += ' AND fecha <= ?';
            values.push(filters.fecha_hasta);
        }

        sql += ' order BY fecha DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [result] = await pool.execute(sql, values);
        return result;
    }
}

module.exports = Pago;