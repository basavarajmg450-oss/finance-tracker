const cleanData = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanData(item));
  }
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    // Drop keys starting with $ or containing . (NoSQL operator protection)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    clean[key] = cleanData(val);
  }
  return clean;
};

export const sanitizeNoSQL = (req, res, next) => {
  if (req.body) req.body = cleanData(req.body);
  if (req.query) req.query = cleanData(req.query);
  if (req.params) req.params = cleanData(req.params);
  next();
};
