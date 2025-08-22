const { pool } = require('../config/db');

class Proyecto {
    static async findById(id) {
        const [result] = await pool.execute('SELECT * FROM proyectos WHERE id = ?', [id]);
        return result[0] || null;
    }

    static async create(proyectoData) {
        const {
            codigo, nombre, descripcion, usuario_id, order_id,
            categoria = 'web', tecnologias, imagen_principal,
            url_demo, url_produccion, repositorio, fecha_inicio,
            fecha_fin, estado = 'planificacion', es_destacado = 0,
            es_publico = 1, orden_portfolio = 0, created_by
        } = proyectoData;

        const [result] = await pool.execute(`
            INSERT INTO proyectos (
                codigo, nombre, descripcion, usuario_id, order_id,
                categoria, tecnologias, imagen_principal, url_demo,
                url_produccion, repositorio, fecha_inicio, fecha_fin,
                estado, es_destacado, es_publico, orden_portfolio, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [codigo, nombre, descripcion, usuario_id, order_id,
             categoria, tecnologias, imagen_principal, url_demo,
             url_produccion, repositorio, fecha_inicio, fecha_fin,
             estado, es_destacado, es_publico, orden_portfolio, created_by]
        );
        return result.insertId;
    }

    static async update(id, proyectoData) {
        const fields = [];
        const values = [];
        
        Object.keys(proyectoData).forEach(key => {
            if (proyectoData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(proyectoData[key]);
            }
        });
        
        if (fields.length === 0) return false;
        
        values.push(id);
        await pool.execute(`UPDATE proyectos SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async delete(id) {
        await pool.execute('DELETE FROM proyectos WHERE id = ?', [id]);
        return true;
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT p.*, u.nombre as cliente_nombre, u.empresa as cliente_empresa,
                   pe.numero_order, creator.nombre as created_by_name
            FROM proyectos p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN orders pe ON p.order_id = pe.id
            LEFT JOIN usuarios creator ON p.created_by = creator.id
            WHERE 1=1
        `;
        const values = [];

        if (filters.estado) {
            sql += ' AND p.estado = ?';
            values.push(filters.estado);
        }

        if (filters.categoria) {
            sql += ' AND p.categoria = ?';
            values.push(filters.categoria);
        }

        if (filters.usuario_id) {
            sql += ' AND p.usuario_id = ?';
            values.push(filters.usuario_id);
        }

        if (filters.es_publico !== undefined) {
            sql += ' AND p.es_publico = ?';
            values.push(filters.es_publico);
        }

        if (filters.es_destacado !== undefined) {
            sql += ' AND p.es_destacado = ?';
            values.push(filters.es_destacado);
        }

        if (filters.search) {
            sql += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR p.tecnologias LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        if (filters.portfolio) {
            sql += ' AND p.es_publico = 1 order BY p.orden_portfolio ASC, p.created_at DESC';
        } else {
            sql += ' order BY p.created_at DESC';
        }

        if (filters.limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [result] = await pool.execute(sql, values);
    }

    static async getImages(proyectoId) {
        const [result] = await pool.execute(`
            SELECT * FROM proyecto_imagenes
            WHERE proyecto_id = ?
            order BY orden ASC, created_at ASC
        `, [proyectoId]);
    }

    static async addImage(proyectoId, imageData) {
        const { titulo, descripcion, url, tipo = 'screenshot', orden = 0 } = imageData;
        const [result] = await pool.execute(`
            INSERT INTO proyecto_imagenes (proyecto_id, titulo, descripcion, url, tipo, orden)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [proyectoId, titulo, descripcion, url, tipo, orden]);
        return result.insertId;
    }

    static async updateImage(imageId, imageData) {
        const fields = [];
        const values = [];
        
        Object.keys(imageData).forEach(key => {
            if (imageData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(imageData[key]);
            }
        });
        
        if (fields.length === 0) return false;
        
        values.push(imageId);
        await pool.execute(`UPDATE proyecto_imagenes SET ${fields.join(', ')} WHERE id = ?`, values);
        return true;
    }

    static async deleteImage(imageId) {
        await pool.execute('DELETE FROM proyecto_imagenes WHERE id = ?', [imageId]);
        return true;
    }

    static async updateStatus(id, estado) {
        await pool.execute('UPDATE proyectos SET estado = ? WHERE id = ?', [estado, id]);
        return true;
    }

    static async generateProjectCode(categoria = 'WEB') {
        const today = new Date();
        const year = today.getFullYear().toString().substr(-2);
        
        const lastProject = await pool.execute(`
            SELECT codigo FROM proyectos 
            WHERE codigo LIKE ? 
            order BY codigo DESC LIMIT 1
        `, [`${categoria}-${year}-%`]);

        let nextNumber = 1;
        if (lastProject.length > 0) {
            const lastNumber = parseInt(lastProject[0].codigo.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        return `${categoria}-${year}-${String(nextNumber).padStart(3, '0')}`;
    }

    static async getPortfolio(limit = null) {
        let sql = `
            SELECT p.*, 
                   (SELECT url FROM proyecto_imagenes pi 
                    WHERE pi.proyecto_id = p.id 
                    order BY pi.orden ASC LIMIT 1) as imagen_principal_url
            FROM proyectos p
            WHERE p.es_publico = 1
            order BY p.es_destacado DESC, p.orden_portfolio ASC, p.fecha_fin DESC
        `;
        
        const values = [];
        if (limit) {
            sql += ' LIMIT ?';
            values.push(parseInt(limit));
        }

        const [result] = await pool.execute(sql, values);
    }

    static async getFeatured() {
        const [result] = await pool.execute(`
            SELECT p.*, 
                   (SELECT url FROM proyecto_imagenes pi 
                    WHERE pi.proyecto_id = p.id 
                    order BY pi.orden ASC LIMIT 1) as imagen_principal_url
            FROM proyectos p
            WHERE p.es_publico = 1 AND p.es_destacado = 1
            order BY p.orden_portfolio ASC, p.fecha_fin DESC
        `);
    }
}

module.exports = Proyecto;