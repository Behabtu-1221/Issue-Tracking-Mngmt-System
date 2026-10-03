import AppError from '../errors/AppError.js';

const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map((item) => ({
      field: item.path.join('.'),
      message: item.message.replace(/"/g, '')
    }));
    const detailMsg = details.map((d) => d.message).join('; ');
    const validationError = new AppError(`Validation failed: ${detailMsg}`, 400);
    validationError.details = details;
    return next(validationError);
  }

  if (source === 'body') {
    req.body = value;
  } else {
    req.validated = req.validated || {};
    req.validated[source] = value;
  }

  return next();
};

export default validate;
