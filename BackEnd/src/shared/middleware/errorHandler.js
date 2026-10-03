import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`);

  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status,
      message: err.message,
      stack: err.stack,
      details: err.details || undefined
    });
  }

  if (err.isOperational) {
    return res.status(statusCode).json({
      status,
      message: err.message,
      details: err.details || undefined
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server'
  });
};

export default errorHandler;
