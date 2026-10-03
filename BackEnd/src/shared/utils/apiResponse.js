export const sendSuccess = (res, data, statusCode = 200, meta = null) => {
  const payload = { status: 'success', data };
  if (meta) {
    payload.meta = meta;
  }
  res.status(statusCode).json(payload);
};

export const sendCreated = (res, data) => sendSuccess(res, data, 201);

export const sendNoContent = (res) => {
  res.status(204).send();
};
