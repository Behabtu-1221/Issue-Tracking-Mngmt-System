import mysql from 'mysql2/promise';
import env from '../config/env.js';
import logger from '../shared/utils/logger.js';

const pool = mysql.createPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  port: env.db.port,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
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
