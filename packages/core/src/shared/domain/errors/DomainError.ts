/**
 * Base Domain Error
 *
 * All domain errors should extend this class to ensure
 * consistent error handling across the application.
 */
export abstract class DomainError extends Error {
  public readonly timestamp: Date;

  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a serializable representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}

/**
 * Error for when a required entity is not found
 */
export abstract class NotFoundError extends DomainError {
  constructor(
    entityName: string,
    identifier: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `${entityName} not found: ${identifier}`,
      `${entityName.toUpperCase()}_NOT_FOUND`,
      { entityName, identifier, ...context },
    );
  }
}

/**
 * Error for when an entity already exists
 */
export abstract class AlreadyExistsError extends DomainError {
  constructor(
    entityName: string,
    identifier: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `${entityName} already exists: ${identifier}`,
      `${entityName.toUpperCase()}_ALREADY_EXISTS`,
      { entityName, identifier, ...context },
    );
  }
}

/**
 * Error for validation failures
 */
export abstract class ValidationError extends DomainError {
  constructor(
    entityName: string,
    field: string,
    reason: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `Invalid ${entityName}.${field}: ${reason}`,
      `${entityName.toUpperCase()}_VALIDATION_ERROR`,
      { entityName, field, reason, ...context },
    );
  }
}

/**
 * Error for invalid state transitions
 */
export abstract class InvalidStateError extends DomainError {
  constructor(
    entityName: string,
    currentState: string,
    attemptedAction: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `Cannot ${attemptedAction} ${entityName} in state: ${currentState}`,
      `${entityName.toUpperCase()}_INVALID_STATE`,
      { entityName, currentState, attemptedAction, ...context },
    );
  }
}

/**
 * Error for operation failures
 */
export abstract class OperationError extends DomainError {
  constructor(
    operation: string,
    reason: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `Operation failed: ${operation}. Reason: ${reason}`,
      "OPERATION_FAILED",
      { operation, reason, ...context },
    );
  }
}
