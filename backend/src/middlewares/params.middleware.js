import ApiError from '../utils/ApiError.js';

/** Validates one route param against a zod schema (404 when it doesn't match). */
export const validateParam = (name, schema) => (req, res, next) => {
  const result = schema.safeParse(req.params[name]);
  if (!result.success) {
    throw ApiError.notFound(result.error.issues[0]?.message || 'Not found');
  }
  next();
};
