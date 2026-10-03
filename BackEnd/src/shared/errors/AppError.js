class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request', details = null) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', details = null) {
    super(message, 403, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict detected', details = null) {
    super(message, 409, details);
  }
}

export class OptimisticLockError extends AppError {
  constructor(
    message = 'The record has been updated by another user or concurrent transaction. Please refresh and try again.',
    details = null
  ) {
    super(message, 409, details);
    this.name = 'OptimisticLockError';
  }
}

export default AppError;
