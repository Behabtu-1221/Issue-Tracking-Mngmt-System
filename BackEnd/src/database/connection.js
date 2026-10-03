import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../shared/utils/logger.js';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

const query = async (sql, params = []) => {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    logger.error(`Database Query Error: ${error.message}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}`);
    throw error;
  }
};

const getTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  return {
    connection,
    commit: async () => {
      await connection.commit();
      connection.release();
    },
    rollback: async () => {
      await connection.rollback();
      connection.release();
    },
    query: async (sql, params = []) => {
      try {
        const [results] = await connection.execute(sql, params);
        return results;
      } catch (error) {
        logger.error(`Transaction Query Error: ${error.message}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}`);
        throw error;
      }
    }
  };
};

export { query, getTransaction, pool };
export default { pool, query, getTransaction };
