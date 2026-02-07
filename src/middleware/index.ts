import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Bearer Token Authentication Middleware
 * Validates API_KEY for inbound requests from n8n
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health endpoint
  if (req.path === '/health') {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header',
        retry: false,
      },
    });
    return;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  if (token !== env.API_KEY) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid API key',
        retry: false,
      },
    });
    return;
  }

  next();
}

/**
 * JSON Logger Middleware
 * Standardized JSON output for EasyPanel capture
 */
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
    };
    console.log(JSON.stringify(log));
  });

  next();
}

/**
 * Error Handler Middleware
 * Catches unhandled errors and returns standardized response
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  }));

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
      retry: true,
    },
  });
}
