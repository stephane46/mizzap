import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config';

/**
 * Standard error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * Catches all errors and returns structured JSON responses
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error response
  let statusCode = 500;
  let errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse.error = {
      code: err.code,
      message: err.message,
      details: err.details,
    };
  }
  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    errorResponse.error = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: err.errors,
    };
  }
  // Handle generic errors
  else {
    errorResponse.error.message = config.isDevelopment
      ? err.message
      : 'An unexpected error occurred';
  }

  // Log error in development
  if (config.isDevelopment) {
    console.error('❌ Error:', err);
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
};