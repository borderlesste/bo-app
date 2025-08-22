const { pool } = require('../config/db');

class EstadisticasMensuales {
    static async findByPeriod(anio, mes) {
        const [result] = await pool.execute('SELECT * FROM estadisticas_mensuales WHERE anio = ? AND mes = ?', [anio, mes]);
        return result[0] || null;
    }

    static async create(estadisticasData) {
        const {
            anio, mes, total_ingresos = 0, total_egresos = 0, nuevos_usuarios = 0,
            usuarios_activos = 0, cotizaciones_enviadas = 0, cotizaciones_aceptadas = 0,
            orders_nuevos = 0, orders_completados = 0, facturas_emitidas = 0,
            facturas_pagadas = 0, proyectos_iniciados = 0, proyectos_completados = 0,
            ticket_promedio = 0
        } = estadisticasData;

        const [result] = await pool.execute(`
            INSERT INTO estadisticas_mensuales (
                anio, mes, total_ingresos, total_egresos, nuevos_usuarios,
                usuarios_activos, cotizaciones_enviadas, cotizaciones_aceptadas,
                orders_nuevos, orders_completados, facturas_emitidas,
                facturas_pagadas, proyectos_iniciados, proyectos_completados, ticket_promedio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                total_ingresos = VALUES(total_ingresos),
                total_egresos = VALUES(total_egresos),
                nuevos_usuarios = VALUES(nuevos_usuarios),
                usuarios_activos = VALUES(usuarios_activos),
                cotizaciones_enviadas = VALUES(cotizaciones_enviadas),
                cotizaciones_aceptadas = VALUES(cotizaciones_aceptadas),
                orders_nuevos = VALUES(orders_nuevos),
                orders_completados = VALUES(orders_completados),
                facturas_emitidas = VALUES(facturas_emitidas),
                facturas_pagadas = VALUES(facturas_pagadas),
                proyectos_iniciados = VALUES(proyectos_iniciados),
                proyectos_completados = VALUES(proyectos_completados),
                ticket_promedio = VALUES(ticket_promedio)`,
            [anio, mes, total_ingresos, total_egresos, nuevos_usuarios,
             usuarios_activos, cotizaciones_enviadas, cotizaciones_aceptadas,
             orders_nuevos, orders_completados, facturas_emitidas,
             facturas_pagadas, proyectos_iniciados, proyectos_completados, ticket_promedio]
        );
        return result.insertId || true;
    }

    static async getByRange(anioInicio, mesInicio, anioFin, mesFin) {
        const [result] = await pool.execute(`
            SELECT * FROM estadisticas_mensuales
            WHERE (anio > ? OR (anio = ? AND mes >= ?))
            AND (anio < ? OR (anio = ? AND mes <= ?))
            order BY anio ASC, mes ASC
        `, [anioInicio, anioInicio, mesInicio, anioFin, anioFin, mesFin]);
    }

    static async getLastYear() {
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        
        const [result] = await pool.execute(`
            SELECT * FROM estadisticas_mensuales
            WHERE anio = ?
            order BY mes ASC
        `, [lastYear]);
    }

    static async getCurrentYear() {
        const currentYear = new Date().getFullYear();
        
        const [result] = await pool.execute(`
            SELECT * FROM estadisticas_mensuales
            WHERE anio = ?
            order BY mes ASC
        `, [currentYear]);
    }

    static async generateCurrentMonth() {
        const now = new Date();
        const anio = now.getFullYear();
        const mes = now.getMonth() + 1;

        const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
        const endDate = new Date(anio, mes, 0).toISOString().split('T')[0];

        const ingresos = await pool.execute(`
            SELECT COALESCE(SUM(monto), 0) as total
            FROM pagos 
            WHERE estado = 'aplicado' 
            AND tipo != 'devolucion'
            AND fecha_pago >= ? AND fecha_pago <= ?
        `, [startDate, endDate]);

        const egresos = await pool.execute(`
            SELECT COALESCE(SUM(monto), 0) as total
            FROM pagos 
            WHERE estado = 'aplicado' 
            AND tipo = 'devolucion'
            AND fecha_pago >= ? AND fecha_pago <= ?
        `, [startDate, endDate]);

        const nuevosUsuarios = await pool.execute(`
            SELECT COUNT(*) as total
            FROM usuarios 
            WHERE fecha_registro >= ? AND fecha_registro <= ?
        `, [startDate, endDate]);

        const usuariosActivos = await pool.execute(`
            SELECT COUNT(DISTINCT usuario_id) as total
            FROM orders 
            WHERE created_at >= ? AND created_at <= ?
        `, [startDate, endDate]);

        const cotizacionesEnviadas = await pool.execute(`
            SELECT COUNT(*) as total
            FROM cotizaciones 
            WHERE created_at >= ? AND created_at <= ?
        `, [startDate, endDate]);

        const cotizacionesAceptadas = await pool.execute(`
            SELECT COUNT(*) as total
            FROM cotizaciones 
            WHERE estado = 'Aprobada'
            AND updated_at >= ? AND updated_at <= ?
        `, [startDate, endDate]);

        const ordersNuevos = await pool.execute(`
            SELECT COUNT(*) as total
            FROM orders 
            WHERE created_at >= ? AND created_at <= ?
        `, [startDate, endDate]);

        const ordersCompletados = await pool.execute(`
            SELECT COUNT(*) as total
            FROM orders 
            WHERE estado = 'completado'
            AND updated_at >= ? AND updated_at <= ?
        `, [startDate, endDate]);

        const facturasEmitidas = await pool.execute(`
            SELECT COUNT(*) as total
            FROM facturas 
            WHERE fecha_emision >= ? AND fecha_emision <= ?
        `, [startDate, endDate]);

        const facturasPagadas = await pool.execute(`
            SELECT COUNT(*) as total
            FROM facturas 
            WHERE estado = 'pagada'
            AND fecha_pago >= ? AND fecha_pago <= ?
        `, [startDate, endDate]);

        const proyectosIniciados = await pool.execute(`
            SELECT COUNT(*) as total
            FROM proyectos 
            WHERE fecha_inicio >= ? AND fecha_inicio <= ?
        `, [startDate, endDate]);

        const proyectosCompletados = await pool.execute(`
            SELECT COUNT(*) as total
            FROM proyectos 
            WHERE estado = 'completado'
            AND fecha_fin >= ? AND fecha_fin <= ?
        `, [startDate, endDate]);

        const ticketPromedio = await pool.execute(`
            SELECT COALESCE(AVG(total), 0) as promedio
            FROM orders 
            WHERE created_at >= ? AND created_at <= ?
            AND total > 0
        `, [startDate, endDate]);

        const estadisticas = {
            anio,
            mes,
            semana,
            total_ingresos: ingresos[0].total,
            total_egresos: egresos[0].total,
            nuevos_usuarios: nuevosUsuarios[0].total,
            usuarios_activos: usuariosActivos[0].total,
            cotizaciones_enviadas: cotizacionesEnviadas[0].total,
            cotizaciones_aceptadas: cotizacionesAceptadas[0].total,
            pedidos_nuevos: ordersNuevos[0].total,
            pedidos_completados: ordersCompletados[0].total,
            facturas_emitidas: facturasEmitidas[0].total,
            facturas_pagadas: facturasPagadas[0].total,
            proyectos_iniciados: proyectosIniciados[0].total,
            proyectos_completados: proyectosCompletados[0].total,
            ticket_promedio: ticketPromedio[0].promedio
        };

        await this.create(estadisticas);
        return estadisticas;
    }

    static async getComparison(anio1, mes1, anio2, mes2) {
        const period1 = await this.findByPeriod(anio1, mes1);
        const period2 = await this.findByPeriod(anio2, mes2);

        if (!period1 || !period2) return null;

        const comparison = {};
        const fields = [
            'total_ingresos', 'total_egresos', 'nuevos_usuarios', 'usuarios_activos',
            'cotizaciones_enviadas', 'cotizaciones_aceptadas', 'orders_nuevos',
            'orders_completados', 'facturas_emitidas', 'facturas_pagadas',
            'proyectos_iniciados', 'proyectos_completados', 'ticket_promedio'
        ];

        fields.forEach(field => {
            const value1 = period1[field] || 0;
            const value2 = period2[field] || 0;
            const difference = value1 - value2;
            const percentage = value2 !== 0 ? ((difference / value2) * 100) : 0;

            comparison[field] = {
                current: value1,
                previous: value2,
                difference,
                percentage: Math.round(percentage * 100) / 100
            };
        });

        return comparison;
    }
}

module.exports = EstadisticasMensuales;