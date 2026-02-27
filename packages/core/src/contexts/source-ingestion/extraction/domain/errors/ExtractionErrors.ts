import {
  NotFoundError,
  ValidationError,
  InvalidStateError,
  OperationError,
} from "../../../../../shared/domain/errors";
import type { ExtractionStatus } from "../ExtractionStatus";

export class ExtractionJobNotFoundError extends NotFoundError {
  constructor(jobId: string) {
    super("ExtractionJob", jobId);
  }
}

export class ExtractionSourceIdRequiredError extends ValidationError {
  constructor() {
    super("ExtractionJob", "sourceId", "Source ID is required");
  }
}

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
