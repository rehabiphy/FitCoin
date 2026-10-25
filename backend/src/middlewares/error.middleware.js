import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let error = err;

  if (err?.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Malformed JSON body', 'INVALID_JSON');
  } else if (err?.type === 'entity.too.large') {
    error = new ApiError(413, 'Request body too large', 'PAYLOAD_TOO_LARGE');
  } else if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`An account with this ${field} already exists`, 'DUPLICATE');
  } else if (err?.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    error = ApiError.badRequest(first?.message || 'Invalid input', 'VALIDATION_ERROR');
  } else if (err?.name === 'CastError') {
    error = ApiError.badRequest('Invalid id', 'INVALID_ID');
  } else if (!(err instanceof ApiError)) {
    console.error(err);
    error = new ApiError(500, 'Something went wrong', 'INTERNAL_ERROR');
  }

  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      ...(!env.isProd && error.statusCode >= 500 && err?.stack ? { stack: err.stack } : {}),
    },
  });
}
