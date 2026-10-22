/**
 * Request logger middleware — logs sanitized request info.
 * Avoids logging sensitive fields like Authorization headers.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const path = req.path;
    const status = res.statusCode;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${method} ${path} ${status} (${duration}ms)`);
    }
  });
  next();
}
