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

export { GenerateProjection, ProjectionUseCases } from "./application";
export type {
  GenerateProjectionCommand,
  GenerateProjectionResult,
} from "./application";

export {
  BaseChunker,
  FixedSizeChunker,
  SentenceChunker,
  RecursiveChunker,
  ChunkerFactory,
  HashEmbeddingStrategy,
  WebLLMEmbeddingStrategy,
  AISdkEmbeddingStrategy,
} from "./infrastructure/strategies";

export { InMemoryVectorWriteStore } from "../../../platform/vector/InMemoryVectorWriteStore";

export {
  projectionFactory,
  ProcessingProfileMaterializer,
} from "./composition";
export type {
  ProjectionInfrastructurePolicy,
  ResolvedProjectionInfra,
  ProjectionFactoryResult,
  MaterializedStrategies,
} from "./composition";
