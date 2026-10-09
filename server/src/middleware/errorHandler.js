export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at: ${req.method} ${req.originalUrl}`
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? (err.status || 500) : res.statusCode;

  // Handle Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'record';
    return res.status(409).json({
      success: false,
      message: `A duplicate entry already exists for ${duplicateField}.`
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for ${err.path}: ${err.value}`
    });
  }

  // Handle Zod Error
  if (err.name === 'ZodError' || err.errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  const response = {
    success: false,
    message: err.message || 'Internal Server Error'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
