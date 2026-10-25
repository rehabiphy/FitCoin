import ApiError from '../utils/ApiError.js';

/** Validates and replaces `req.body` with the parsed result of a zod schema. Unknown keys are stripped. */
export const validate = schema => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw ApiError.badRequest(details[0]?.message || 'Invalid input', 'VALIDATION_ERROR', details);
  }
  req.body = result.data;
  next();
};
