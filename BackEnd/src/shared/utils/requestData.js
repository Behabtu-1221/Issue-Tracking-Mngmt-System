export const getQuery = (req) => req.validated?.query ?? req.query;

export const getParams = (req) => req.validated?.params ?? req.params;
