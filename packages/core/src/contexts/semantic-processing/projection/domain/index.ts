export { SemanticProjection } from "./SemanticProjection.js";
export { ProjectionId } from "./ProjectionId.js";
export { ProjectionType } from "./ProjectionType.js";
export { ProjectionStatus } from "./ProjectionStatus.js";
export { ProjectionResult } from "./ProjectionResult.js";
export type { SemanticProjectionRepository } from "./SemanticProjectionRepository.js";

export type {
  EmbeddingStrategy,
  EmbeddingResult,
  ChunkingStrategy,
  Chunk,
  VectorWriteStore,
  VectorEntry,
} from "./ports/index.js";

export { ProjectionGenerated } from "./events/ProjectionGenerated.js";
export { ProjectionFailed } from "./events/ProjectionFailed.js";

// Domain Errors
export {
  ProjectionNotFoundError,
  ProjectionAlreadyExistsError,
  ProjectionSemanticUnitIdRequiredError,
  ProjectionContentRequiredError,
  ProjectionInvalidTypeError,
  ProjectionInvalidStateError,
  ProjectionCannotProcessError,
  ProjectionCannotCompleteError,
  ProjectionCannotFailError,
  ChunkingFailedError,
  EmbeddingFailedError,
  VectorStoreFailedError,
  ProjectionProcessingError,
  type ProjectionError,
} from "./errors/index.js";
