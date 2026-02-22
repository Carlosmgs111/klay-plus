import {
  DomainError,
  ValidationError,
  InvalidStateError,
  AlreadyExistsError,
  NotFoundError,
} from "../../../../../shared/domain/errors/DomainError.js";

export class ProfileNameRequiredError extends ValidationError {
  constructor() {
    super("ProcessingProfile", "name", "is required");
  }
}

export class ProfileChunkingStrategyRequiredError extends ValidationError {
  constructor() {
    super("ProcessingProfile", "chunkingStrategyId", "is required");
  }
}

export class ProfileEmbeddingStrategyRequiredError extends ValidationError {
  constructor() {
    super("ProcessingProfile", "embeddingStrategyId", "is required");
  }
}

export class ProfileAlreadyExistsError extends AlreadyExistsError {
  constructor(id: string) {
    super("ProcessingProfile", id);
  }
}

export class ProfileNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("ProcessingProfile", id);
  }
}

export class ProfileDeprecatedError extends InvalidStateError {
  constructor(id: string) {
    super("ProcessingProfile", "DEPRECATED", `modify profile ${id}`);
  }
}

export class ProfileAlreadyDeprecatedError extends InvalidStateError {
  constructor(id: string) {
    super("ProcessingProfile", "DEPRECATED", `deprecate profile ${id}`);
  }
}

export type ProfileError =
  | ProfileNameRequiredError
  | ProfileChunkingStrategyRequiredError
  | ProfileEmbeddingStrategyRequiredError
  | ProfileAlreadyExistsError
  | ProfileNotFoundError
  | ProfileDeprecatedError
  | ProfileAlreadyDeprecatedError;
