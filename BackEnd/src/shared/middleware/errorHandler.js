import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message || 'Something went wrong on the server';
  let isOperational = err.isOperational || false;

  // Map MySQL-specific database error codes to clean operational HTTP responses
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    status = 'fail';
    message = 'A resource with these unique attributes already exists.';
    isOperational = true;
  } else if (err.code === 'ER_LOCK_DEADLOCK') {
    statusCode = 409;
    status = 'fail';
    message = 'Transaction deadlock encountered due to concurrent modification. Please retry.';
    isOperational = true;
  } else if (err.code === 'ER_LOCK_WAIT_TIMEOUT') {
    statusCode = 409;
    status = 'fail';
    message = 'Database lock wait timeout exceeded. Please retry your request.';
    isOperational = true;
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    status = 'fail';
    message = 'Referenced entity does not exist.';
    isOperational = true;
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    statusCode = 409;
    status = 'fail';
    message = 'Cannot modify or delete resource because dependent records exist.';
    isOperational = true;
  } else if (err.name === 'OptimisticLockError') {
    statusCode = 409;
    status = 'fail';
    isOperational = true;
  }

  logger.error(`${req.method} ${req.originalUrl} — [${statusCode}] ${message} ${!isOperational && err.stack ? '\n' + err.stack : ''}`);

  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status,
      message,
      stack: err.stack,
      details: err.details || undefined
    });
  }

  if (isOperational) {
    return res.status(statusCode).json({
      status,
      message,
      details: err.details || undefined
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};

export default errorHandler;
