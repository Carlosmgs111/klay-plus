import {
  NotFoundError,
  AlreadyExistsError,
  ValidationError,
  OperationError,
} from "../../../../../shared/domain/errors";

// ─── Not Found Errors ────────────────────────────────────────────────────────

export class ResourceNotFoundError extends NotFoundError {
  constructor(resourceId: string) {
    super("Resource", resourceId);
  }
}

// ─── Already Exists Errors ───────────────────────────────────────────────────

export class ResourceAlreadyExistsError extends AlreadyExistsError {
  constructor(resourceId: string) {
    super("Resource", resourceId);
  }
}

// ─── Validation Errors ───────────────────────────────────────────────────────

export class ResourceInvalidNameError extends ValidationError {
  constructor() {
    super("Resource", "originalName", "Original name is required and cannot be empty");
  }
}

export class ResourceInvalidMimeTypeError extends ValidationError {
  constructor() {
    super("Resource", "mimeType", "MIME type is required and cannot be empty");
  }
}

// ─── Operation Errors ────────────────────────────────────────────────────────

export class ResourceStorageFailedError extends OperationError {
  constructor(reason: string) {
    super("Resource", "upload", reason);
  }
}

// ─── Type Alias for Union ────────────────────────────────────────────────────

export type ResourceError =
  | ResourceNotFoundError
  | ResourceAlreadyExistsError
  | ResourceInvalidNameError
  | ResourceInvalidMimeTypeError
  | ResourceStorageFailedError;
