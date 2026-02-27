import {
  NotFoundError,
  AlreadyExistsError,
  ValidationError,
} from "../../../../../shared/domain/errors";

export class SourceNotFoundError extends NotFoundError {
  constructor(sourceId: string) {
    super("Source", sourceId);
  }
}

export class SourceAlreadyExistsError extends AlreadyExistsError {
  constructor(uri: string) {
    super("Source", uri, { field: "uri" });
  }
}

export class SourceNameRequiredError extends ValidationError {
  constructor() {
    super("Source", "name", "Name is required and cannot be empty");
  }
}

export class SourceUriRequiredError extends ValidationError {
  constructor() {
    super("Source", "uri", "URI is required and cannot be empty");
  }
}

export class SourceInvalidUriError extends ValidationError {
  constructor(uri: string) {
    super("Source", "uri", `Invalid URI format: ${uri}`);
  }
}

export class SourceInvalidTypeError extends ValidationError {
  constructor(type: string, validTypes: string[]) {
    super(
      "Source",
      "type",
      `Invalid source type: ${type}. Valid types: ${validTypes.join(", ")}`,
    );
  }
}

export type SourceError =
  | SourceNotFoundError
  | SourceAlreadyExistsError
  | SourceNameRequiredError
  | SourceUriRequiredError
  | SourceInvalidUriError
  | SourceInvalidTypeError;
