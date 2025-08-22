const { pool } = require('../config/db.js');

const emailCampaignsController = {
  // Get all email campaigns
  getAllCampaigns: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        estado = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build WHERE clause
      let whereConditions = [];
      let queryParams = [];

      if (search) {
        whereConditions.push('(nombre LIKE ? OR asunto LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (estado) {
        whereConditions.push('estado = ?');
        queryParams.push(estado);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // Main query
      const query = `
        SELECT 
          ec.*,
          COUNT(ecr.id) as total_recipients,
          COUNT(CASE WHEN ecr.estado = 'enviado' THEN 1 END) as enviados,
          COUNT(CASE WHEN ecr.estado = 'abierto' THEN 1 END) as abiertos
        FROM email_campaigns ec
        LEFT JOIN email_campaign_recipients ecr ON ec.id = ecr.campaign_id
        ${whereClause}
        GROUP BY ec.id
        ORDER BY ec.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;

      const [campaigns] = await pool.execute(query, [...queryParams, parseInt(limit), offset]);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT ec.id) as total
        FROM email_campaigns ec
        ${whereClause}
      `;

      const [countResult] = await pool.execute(countQuery, queryParams);
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          campaigns,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: total,
            per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener campañas de email',
        error: error.message
      });
    }
  },

  // Get single campaign by ID
  getCampaignById: async (req, res) => {
    try {
      const { id } = req.params;

      const [campaigns] = await pool.execute(`
        SELECT ec.*, 
               COUNT(ecr.id) as total_recipients,
               COUNT(CASE WHEN ecr.estado = 'enviado' THEN 1 END) as enviados,
               COUNT(CASE WHEN ecr.estado = 'abierto' THEN 1 END) as abiertos,
               COUNT(CASE WHEN ecr.estado = 'clickeado' THEN 1 END) as clickeados
        FROM email_campaigns ec
        LEFT JOIN email_campaign_recipients ecr ON ec.id = ecr.campaign_id
        WHERE ec.id = ?
        GROUP BY ec.id
      `, [id]);

      if (campaigns.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Campaña no encontrada'
        });
      }

      res.json({
        success: true,
        data: campaigns[0]
      });

    } catch (error) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener campaña',
        error: error.message
      });
    }
  },

  // Create new campaign
  createCampaign: async (req, res) => {
    try {
      const {
        nombre,
        asunto,
        contenido,
        tipo = 'marketing',
        segmento_audiencia = 'todos',
        fecha_programada
      } = req.body;

      const [result] = await pool.execute(`
        INSERT INTO email_campaigns (
          nombre, asunto, contenido, tipo, segmento_audiencia, 
          fecha_programada, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        nombre, asunto, contenido, tipo, segmento_audiencia,
        fecha_programada || null, req.user?.id || 1
      ]);

      res.status(201).json({
        success: true,
        message: 'Campaña creada exitosamente',
        data: {
          id: result.insertId,
          nombre
        }
      });

    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear campaña',
        error: error.message
      });
    }
  },

  // Update campaign
  updateCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nombre,
        asunto,
        contenido,
        tipo,
        segmento_audiencia,
        fecha_programada
      } = req.body;

      await pool.execute(`
        UPDATE email_campaigns 
        SET nombre = ?, asunto = ?, contenido = ?, tipo = ?, 
            segmento_audiencia = ?, fecha_programada = ?, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        nombre, asunto, contenido, tipo, segmento_audiencia,
        fecha_programada || null, id
      ]);

      res.json({
        success: true,
        message: 'Campaña actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar campaña',
        error: error.message
      });
    }
  },

  // Delete campaign
  deleteCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      await pool.execute('DELETE FROM email_campaigns WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Campaña eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar campaña',
        error: error.message
      });
    }
  },

  // Send campaign
  sendCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      // Update campaign status to 'enviando'
      await pool.execute(
        'UPDATE email_campaigns SET estado = "enviando", fecha_envio = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      // TODO: Implement actual email sending logic here
      // This would typically integrate with an email service like SendGrid, Mailgun, etc.

      // For now, just mark as sent
      await pool.execute(
        'UPDATE email_campaigns SET estado = "enviada" WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Campaña enviada exitosamente'
      });

    } catch (error) {
      console.error('Error sending campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Error al enviar campaña',
        error: error.message
      });
    }
  }
};

module.exports = emailCampaignsController;