import ApiError from '../utils/ApiError.js';

export const notFound = (req, _res, next) => {
  next(new ApiError(`Route not found: ${req.originalUrl}`, 404));
};

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong.';

  if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path || 'identifier'}.`;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(' ');
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'A record with that value already exists.';
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
};
