import { ApiError } from "../utils/apierror.js";

// Wraps a Zod schema: validates req.body and replaces it with the parsed value.
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return next(new ApiError(400, "Validation failed", errors));
  }
  req.body = result.data;
  next();
};

// Same contract for query strings. Express 5 exposes `req.query` as a
// getter-only property, so the parsed result lands on `req.filters` instead
// of overwriting it in place.
export const validateQuery = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return next(new ApiError(400, "Validation failed", errors));
  }
  req.filters = result.data;
  next();
};
