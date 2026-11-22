// Owner: M1
const errorHandler =  (err, req, res, next) => {
  console.error(err.message);
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({
      message: err.message,
      success: false
    });
  }
  return res.status(err.status || 500).json({
    message: err.status ? err.message : 'Server error',
    success: false
  });
};

export default errorHandler;
