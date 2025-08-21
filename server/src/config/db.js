// server/src/config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Validate required environment variables
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingVars = requiredVars.filter(varName => !process.env[varName] || process.env[varName].includes('your_'));

if (missingVars.length > 0) {
  console.warn(`Warning: Missing or placeholder database configuration: ${missingVars.join(', ')}`);
}

// Usar DATABASE_URL si está disponible, sino construir desde variables individuales
const databaseUrl = process.env.DATABASE_URL || 
  `mysql://${process.env.DB_USER || 'root'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'borderless_techno'}`;

const pool = mysql.createPool(`${databaseUrl}?multipleStatements=true`);

const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

const commitTransaction = async (connection) => {
  await connection.commit();
  connection.release();
};

const rollbackTransaction = async (connection) => {
  await connection.rollback();
  connection.release();
};

module.exports = {
  pool,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
};
