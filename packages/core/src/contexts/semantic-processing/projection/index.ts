/**
 * Projection Module - Public API
 *
 * This module manages semantic projections (chunking, embedding, vector storage).
 * It transforms content into searchable vector representations.
 */

export {
  SemanticProjection,
  ProjectionId,
  ProjectionType,
  ProjectionStatus,
  ProjectionResult,
  ProjectionGenerated,
  ProjectionFailed,
  // Domain Errors
  ProjectionNotFoundError,
  ProjectionAlreadyExistsError,
  ProjectionSourceIdRequiredError,
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
} from "./domain";

export type {
  SemanticProjectionRepository,
  EmbeddingStrategy,
  EmbeddingResult,
  ChunkingStrategy,
  Chunk,
  VectorWriteStore,
  VectorEntry,
  ProjectionError,
} from "./domain";

export {
  projectionFactory,
} from "./composition";
export type {
  ProjectionInfrastructurePolicy,
  ResolvedProjectionInfra,
  ProjectionFactoryResult,
  MaterializedStrategies,
} from "./composition";

// Application use cases
export { GenerateProjection } from "./application/use-cases/GenerateProjection";
export type {
  GenerateProjectionCommand,
  GenerateProjectionResult,
} from "./application/use-cases/GenerateProjection";
export { ProcessContent } from "./application/use-cases/ProcessContent";
export type { ProcessContentInput, ProcessContentSuccess } from "./application/use-cases/ProcessContent";
export { BatchProcessContent } from "./application/use-cases/BatchProcessContent";
export type { BatchProcessContentItem, BatchProcessContentResult } from "./application/use-cases/BatchProcessContent";
export { FindExistingProjection } from "./application/use-cases/FindExistingProjection";
export type { ExistingProjectionInfo } from "./application/use-cases/FindExistingProjection";
export { GetProjectionsForSources } from "./application/use-cases/GetProjectionsForSources";
export { GetAllProjectionsForSources } from "./application/use-cases/GetAllProjectionsForSources";
export { CleanupSourceProjections } from "./application/use-cases/CleanupSourceProjections";
export { CleanupSourceProjectionForProfile } from "./application/use-cases/CleanupSourceProjectionForProfile";
export { ProcessSourceAllProfiles } from "./application/use-cases/ProcessSourceAllProfiles";
export type { SourceIngestionPort } from "./application/ports/SourceIngestionPort";
