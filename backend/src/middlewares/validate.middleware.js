import ApiError from '../utils/ApiError.js';

function parse(schema, input) {
  const result = schema.safeParse(input ?? {});
  if (!result.success) {
    const details = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw ApiError.badRequest(details[0]?.message || 'Invalid input', 'VALIDATION_ERROR', details);
  }
  return result.data;
}

/** Validates and replaces `req.body` with the parsed result of a zod schema. Unknown keys are stripped. */
export const validate = schema => (req, res, next) => {
  req.body = parse(schema, req.body);
  next();
};

/** Validates the query string. Express 5's `req.query` is read-only, so the result goes on `req.validatedQuery`. */
export const validateQuery = schema => (req, res, next) => {
  req.validatedQuery = parse(schema, req.query);
  next();
};
