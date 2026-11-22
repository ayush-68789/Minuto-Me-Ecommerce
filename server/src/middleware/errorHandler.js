// Owner: M1
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${err.name || 'Error'}: ${err.message}`);
  }

  // Duplicate key (MongoDB E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'record';
    return res.status(409).json({
      message: `A ${field} with this value already exists`,
      success: false,
    });
  }

  // Schema validation / cast error
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({
      message: err.message,
      success: false,
    });
  }

  // JWT / Auth errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Invalid or expired session',
      success: false,
    });
  }

  // Explicit HTTP status or fallback 500
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  return res.status(status).json({
    message: status < 500 ? err.message : 'An unexpected error occurred. Please try again.',
    success: false,
  });
};

export default errorHandler;
