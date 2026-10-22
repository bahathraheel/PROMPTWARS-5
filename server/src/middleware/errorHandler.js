/**
 * Global error handler middleware.
 * Converts any thrown error to a consistent API response shape.
 */
export function errorHandler(err, req, res, next) {
  const isOperational = err.isOperational || false;
  // Don't forward upstream API error codes (e.g. Gemini 404 = wrong model name)
  // Operational errors keep their code; unexpected errors become 500
  let statusCode = err.statusCode || err.status || 500;
  if (!isOperational && (statusCode === 404 || statusCode < 400)) statusCode = 500;

  if (!isOperational) {
    console.error('[ERROR]', {
      method: req.method,
      path: req.path,
      statusCode,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ success: false, error: err.message });
  }

  // Return helpful AI error messages in development
  const userMessage = isOperational
    ? err.message
    : process.env.NODE_ENV === 'development'
      ? `Server error: ${err.message}`
      : 'An internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    error: userMessage,
  });
}

/**
 * Creates an operational (known, expected) error.
 * @param {string} message - Human-readable error message.
 * @param {number} statusCode - HTTP status code.
 */
export function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}
