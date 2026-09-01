import { ApiError } from "../utils/apierror.js";

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

const CODE_BY_STATUS = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
  502: "BAD_GATEWAY",
  503: "SERVICE_UNAVAILABLE",
};

// Matches the frontend's expected error envelope (client/src/api/client.js
// reads `json.error.{code,message,details}`), not a generic {message,errors} shape.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = err.message || "Internal server error";
  const code = CODE_BY_STATUS[statusCode] || "INTERNAL_ERROR";

  if (!isApiError) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: isApiError ? err.errors : [],
    },
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};
