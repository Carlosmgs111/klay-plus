import {
  NotFoundError,
  ValidationError,
  InvalidStateError,
  OperationError,
} from "../../../../../shared/domain/errors";
import type { ExtractionStatus } from "../ExtractionStatus.js";

// ─── Not Found Errors ────────────────────────────────────────────────────────

export class ExtractionJobNotFoundError extends NotFoundError {
  constructor(jobId: string) {
    super("ExtractionJob", jobId);
  }
}

// ─── Validation Errors ───────────────────────────────────────────────────────

export class ExtractionSourceIdRequiredError extends ValidationError {
  constructor() {
    super("ExtractionJob", "sourceId", "Source ID is required");
  }
}

// ─── Invalid State Errors ────────────────────────────────────────────────────

export class ExtractionInvalidStateError extends InvalidStateError {
  constructor(currentStatus: ExtractionStatus, attemptedAction: string) {
    super("ExtractionJob", currentStatus, attemptedAction);
  }
}

export class ExtractionCannotStartError extends ExtractionInvalidStateError {
  constructor(currentStatus: ExtractionStatus) {
    super(currentStatus, "start");
  }
}

export class ExtractionCannotCompleteError extends ExtractionInvalidStateError {
  constructor(currentStatus: ExtractionStatus) {
    super(currentStatus, "complete");
  }
}

export class ExtractionCannotFailError extends ExtractionInvalidStateError {
  constructor(currentStatus: ExtractionStatus) {
    super(currentStatus, "fail");
  }
}

// ─── Operation Errors ────────────────────────────────────────────────────────

export class ExtractionFailedError extends OperationError {
  constructor(
    sourceId: string,
    reason: string,
    public readonly originalError?: Error,
  ) {
    super("Content extraction", reason, { sourceId });
  }
}

export class UnsupportedMimeTypeError extends OperationError {
  constructor(
    public readonly mimeType: string,
    public readonly supportedTypes: string[],
  ) {
    super(
      "Content extraction",
      `No extractor available for MIME type: ${mimeType}. Supported types: ${supportedTypes.join(", ")}`,
      { mimeType, supportedTypes },
    );
  }
}

export class ContentHashingError extends OperationError {
  constructor(reason: string) {
    super("Content hashing", reason);
  }
}

// ─── Type Alias for Union ────────────────────────────────────────────────────

export type ExtractionError =
  | ExtractionJobNotFoundError
  | ExtractionSourceIdRequiredError
  | ExtractionInvalidStateError
  | ExtractionCannotStartError
  | ExtractionCannotCompleteError
  | ExtractionCannotFailError
  | ExtractionFailedError
  | UnsupportedMimeTypeError
  | ContentHashingError;
