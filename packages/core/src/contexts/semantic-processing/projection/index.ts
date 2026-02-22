/**
 * Projection Module - Public API
 *
 * This module manages semantic projections (chunking, embedding, vector storage).
 * It transforms content into searchable vector representations.
 */

// ─── Domain ─────────────────────────────────────────────────────────────────
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
} from "./domain/index.js";

export type {
  SemanticProjectionRepository,
  EmbeddingStrategy,
  EmbeddingResult,
  ChunkingStrategy,
  Chunk,
  VectorWriteStore,
  VectorEntry,
  ProjectionError,
} from "./domain/index.js";

// ─── Application ────────────────────────────────────────────────────────────
export { GenerateProjection, ProjectionUseCases } from "./application/index.js";
export type {
  GenerateProjectionCommand,
  GenerateProjectionResult,
} from "./application/index.js";

// ─── Infrastructure (strategies & adapters) ─────────────────────────────────
export {
  BaseChunker,
  FixedSizeChunker,
  SentenceChunker,
  RecursiveChunker,
  ChunkerFactory,
  HashEmbeddingStrategy,
  WebLLMEmbeddingStrategy,
  AISdkEmbeddingStrategy,
} from "./infrastructure/strategies/index.js";

export { InMemoryVectorWriteStore } from "../../../platform/vector/InMemoryVectorWriteStore";

// ─── Composition & Factory ──────────────────────────────────────────────────
export {
  ProjectionComposer,
  projectionFactory,
  ProcessingProfileMaterializer,
} from "./composition/index.js";
export type {
  ProjectionInfrastructurePolicy,
  ResolvedProjectionInfra,
  ProjectionFactoryResult,
  MaterializedStrategies,
} from "./composition/index.js";
