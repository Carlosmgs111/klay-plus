import {
  DomainError,
  ValidationError,
  InvalidStateError,
  AlreadyExistsError,
  NotFoundError,
} from "../../../../../shared/domain/errors/DomainError";

export class ProfileNameRequiredError extends ValidationError {
  constructor() {
    super("ProcessingProfile", "name", "is required");
  }
}

export class PreparationStrategyRequiredError extends ValidationError {
  constructor() {
    super("ProcessingProfile", "preparation", "Preparation layer is required");
  }
}

export class FragmentationStrategyRequiredError extends ValidationError {
  constructor() {
    super("ProcessingProfile", "fragmentation", "Fragmentation layer is required");
  }
}

export class ProjectionStrategyRequiredError extends ValidationError {
  constructor() {
    super("ProcessingProfile", "projection", "Projection layer is required");
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
  | PreparationStrategyRequiredError
  | FragmentationStrategyRequiredError
  | ProjectionStrategyRequiredError
  | ProfileAlreadyExistsError
  | ProfileNotFoundError
  | ProfileDeprecatedError
  | ProfileAlreadyDeprecatedError;
