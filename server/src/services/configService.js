// server/src/services/configService.js
const { pool, beginTransaction, commitTransaction, rollbackTransaction } = require('../config/db.js');

const configService = {
  async getConfig() {
    const [rows] = await pool.execute('SELECT * FROM configuracion_general LIMIT 1');
    // Return the first row (there should be only one configuration record)
    return rows.length > 0 ? rows[0] : {};
  },

  async updateConfig(settings) {
    const connection = await beginTransaction();
    try {
      // Build dynamic UPDATE query based on provided settings
      const fields = Object.keys(settings);
      const values = Object.values(settings);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      await connection.execute(
        `UPDATE configuracion_general SET ${setClause} WHERE id = 1`,
        values
      );
      
      await commitTransaction(connection);
      return { message: 'Configuración actualizada correctamente.' };
    } catch (error) {
      await rollbackTransaction(connection);
      throw error;
    }
  },
};

module.exports = { configService };
