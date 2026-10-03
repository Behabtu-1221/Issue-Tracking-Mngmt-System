export const getPagination = (page, limit, maxLimit = 200) => {
  const safePage = Math.max(parseInt(page || '1', 10), 1);
  const safeLimit = Math.min(Math.max(parseInt(limit || '50', 10), 1), maxLimit);
  const offset = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    offset,
    clause: `LIMIT ${safeLimit} OFFSET ${offset}`
  };
};
