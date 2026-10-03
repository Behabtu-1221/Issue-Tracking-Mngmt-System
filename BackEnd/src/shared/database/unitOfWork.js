import { pool } from '../../database/connection.js';
import logger from '../utils/logger.js';
import AppError from '../errors/AppError.js';

/**
 * Execute a unit of work inside a managed database transaction.
 * Automatically commits on success and rolls back on error.
 * Releases the connection back to the pool under all circumstances.
 *
 * @param {Function} work - async (tx) => Promise<any>
 * @param {Object} options - { isolationLevel: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE', tx: existingTx }
 * @returns {Promise<any>}
 */
export async function execute(work, options = {}) {
  // If an existing transaction is passed, reuse it (nested / sub-unit of work)
  if (options.tx && options.tx.isTransaction) {
    return work(options.tx);
  }

  const connection = options.connection || (await pool.getConnection());
  let startedTransaction = false;

  try {
    if (options.isolationLevel) {
      await connection.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
    } else {
      // Default to READ COMMITTED to prevent dirty reads and lock contention
      await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    }

    await connection.beginTransaction();
    startedTransaction = true;

    // Wrap the connection into an explicit tx object
    const tx = {
      isTransaction: true,
      rawConnection: connection,
      query: async (sql, params = []) => {
        try {
          const [results] = await connection.query(sql, params);
          return results;
        } catch (err) {
          logger.error(`Tx Query Error: ${err.message}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}`);
          throw err;
        }
      },
      execute: async (sql, params = []) => {
        try {
          const [results] = await connection.execute(sql, params);
          return results;
        } catch (err) {
          logger.error(`Tx Execute Error: ${err.message}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}`);
          throw err;
        }
      }
    };

    const result = await work(tx);
    await connection.commit();
    startedTransaction = false;
    return result;
  } catch (err) {
    if (startedTransaction) {
      try {
        await connection.rollback();
        logger.warn(`Transaction rolled back: ${err.message}`);
      } catch (rollbackErr) {
        logger.error(`Error during transaction rollback: ${rollbackErr.message}`);
      }
    }

    // Map MySQL concurrency & constraint errors
    if (err.code === 'ER_LOCK_DEADLOCK') {
      throw new AppError('Transaction deadlock detected. Please retry your request.', 409);
    }
    if (err.code === 'ER_LOCK_WAIT_TIMEOUT') {
      throw new AppError('Database lock wait timeout exceeded. Please retry your request.', 409);
    }
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(`Duplicate entry conflict: ${err.message}`, 409);
    }

    throw err;
  } finally {
    if (!options.connection) {
      connection.release();
    }
  }
}

export const unitOfWork = { execute };
export default unitOfWork;
