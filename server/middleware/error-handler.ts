import type { Request, Response, NextFunction } from 'express';
import {
  WorkflowValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  type StructuredError,
} from '@shared/errors';
import { ZodError } from 'zod';

/**
 * Advanced error handling middleware with structured error responses
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log error with stack trace for debugging
  console.error(`[Error] ${req.method} ${req.path}:`, err);
  if (err.stack && process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
  }

  // Handle specific error types
  if (err instanceof WorkflowValidationError) {
    const response: StructuredError = {
      error: err.message,
      details: err.errors,
      statusCode: err.statusCode,
    };
    return res.status(err.statusCode).json(response);
  }

  if (err instanceof AuthenticationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  if (err instanceof AuthorizationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  if (err instanceof RateLimitError) {
    if (err.retryAfter) {
      res.setHeader('Retry-After', err.retryAfter.toString());
    }
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      retryAfter: err.retryAfter,
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: StructuredError = {
      error: 'Validation failed',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
      statusCode: 400,
    };
    return res.status(400).json(response);
  }

  // Handle known HTTP errors with status codes
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Don't expose internal error details in production
  const response: any = {
    error: message,
    statusCode,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.details;
  }

  res.status(statusCode).json(response);
}

/**
 * Async error wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
}
