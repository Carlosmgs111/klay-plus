import {
  NotFoundError,
  AlreadyExistsError,
  ValidationError,
  InvalidStateError,
  OperationError,
} from "../../../../../shared/domain/errors";
import type { ProjectionStatus } from "../ProjectionStatus";

export class ProjectionNotFoundError extends NotFoundError {
  constructor(projectionId: string) {
    super("SemanticProjection", projectionId);
  }
}

export class ProjectionAlreadyExistsError extends AlreadyExistsError {
  constructor(projectionId: string) {
    super("SemanticProjection", projectionId);
  }
}

export class ProjectionSemanticUnitIdRequiredError extends ValidationError {
  constructor() {
    super("SemanticProjection", "semanticUnitId", "Semantic unit ID is required");
  }
}

export class ProjectionContentRequiredError extends ValidationError {
  constructor() {
    super("SemanticProjection", "content", "Content is required for projection");
  }
}

export class ProjectionInvalidTypeError extends ValidationError {
  constructor(type: string, validTypes: string[]) {
    super(
      "SemanticProjection",
      "type",
      `Invalid projection type: ${type}. Valid types: ${validTypes.join(", ")}`,
    );
  }
}

export class ProjectionInvalidStateError extends InvalidStateError {
  constructor(currentStatus: ProjectionStatus, attemptedAction: string) {
    super("SemanticProjection", currentStatus, attemptedAction);
  }
}

export class ProjectionCannotProcessError extends ProjectionInvalidStateError {
  constructor(currentStatus: ProjectionStatus) {
    super(currentStatus, "process");
  }
}

export class ProjectionCannotCompleteError extends ProjectionInvalidStateError {
  constructor(currentStatus: ProjectionStatus) {
    super(currentStatus, "complete");
  }
}

export class ProjectionCannotFailError extends ProjectionInvalidStateError {
  constructor(currentStatus: ProjectionStatus) {
    super(currentStatus, "fail");
  }
}

export class ChunkingFailedError extends OperationError {
  constructor(reason: string, public readonly originalError?: Error) {
    super("Chunking", reason, { phase: "chunking" });
  }
}

export class EmbeddingFailedError extends OperationError {
  constructor(reason: string, public readonly originalError?: Error) {
    super("Embedding generation", reason, { phase: "embedding" });
  }
}

export class VectorStoreFailedError extends OperationError {
  constructor(
    operation: "upsert" | "delete" | "search",
    reason: string,
    public readonly originalError?: Error,
  ) {
    super(`Vector store ${operation}`, reason, { phase: "vector-store", operation });
  }
}

export class ProjectionProcessingError extends OperationError {
  constructor(
    semanticUnitId: string,
    reason: string,
    public readonly phase: "chunking" | "embedding" | "storage",
    public readonly originalError?: Error,
  ) {
    super("Projection processing", reason, { semanticUnitId, phase });
  }
}

export type ProjectionError =
  | ProjectionNotFoundError
  | ProjectionAlreadyExistsError
  | ProjectionSemanticUnitIdRequiredError
  | ProjectionContentRequiredError
  | ProjectionInvalidTypeError
  | ProjectionInvalidStateError
  | ProjectionCannotProcessError
  | ProjectionCannotCompleteError
  | ProjectionCannotFailError
  | ChunkingFailedError
  | EmbeddingFailedError
  | VectorStoreFailedError
  | ProjectionProcessingError;
