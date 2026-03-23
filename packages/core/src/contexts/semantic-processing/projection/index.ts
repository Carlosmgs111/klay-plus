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
export { ProjectionQueries } from "./application/use-cases/ProjectionQueries";
export type { ExistingProjectionInfo } from "./application/use-cases/ProjectionQueries";
export { CleanupProjections } from "./application/use-cases/CleanupProjections";
export type { CleanupProjectionsInput } from "./application/use-cases/CleanupProjections";
export { ProcessSourceAllProfiles } from "./application/use-cases/ProcessSourceAllProfiles";
export type { SourceIngestionPort } from "./application/ports/SourceIngestionPort";
