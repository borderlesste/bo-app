// server/src/config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Usar DATABASE_URL si está disponible, sino construir desde variables individuales
const databaseUrl = process.env.DATABASE_URL || 
  `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = mysql.createPool({
  uri: `${databaseUrl}?multipleStatements=true`,
  connectionLimit: 10,
  acquireTimeout: 60000,
  idleTimeout: 300000,
  queueLimit: 0
});

// Wrapper function with retry logic for database operations
const executeWithRetry = async (query, params = [], maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Database query attempt ${attempt}/${maxRetries}`);
      const result = await pool.execute(query, params);
      console.log(`✅ Database query successful on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Database query failed on attempt ${attempt}:`, error.code, error.message);
      
      // Only retry on network/timeout errors
      if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH' || error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // Progressive delay: 1s, 2s, 3s
          console.log(`🔄 Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // For non-retryable errors or max retries reached, throw immediately
      throw error;
    }
  }
  
  throw lastError;
};

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
  executeWithRetry,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
};
