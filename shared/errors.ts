// Error type definitions for structured error responses
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface StructuredError {
  error: string;
  details?: ValidationError[];
  statusCode?: number;
}

export class WorkflowValidationError extends Error {
  public readonly errors: ValidationError[];
  public readonly statusCode: number;

  constructor(errors: ValidationError[], message = 'Workflow validation failed') {
    super(message);
    this.name = 'WorkflowValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

export class AuthenticationError extends Error {
  public readonly statusCode: number;

  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

export class AuthorizationError extends Error {
  public readonly statusCode: number;

  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

export class NotFoundError extends Error {
  public readonly statusCode: number;

  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class RateLimitError extends Error {
  public readonly statusCode: number;
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
    this.retryAfter = retryAfter;
  }
}
